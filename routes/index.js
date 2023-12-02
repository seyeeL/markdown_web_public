const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { eachYearDay } = require('../config/index')
const { homePath } = require('../config/env')

let allFolder = []
// #config 配置 obsidian 根目录中需要展示在页面上的子文件夹，比如我的 obsidian 里有十几个文件夹，但是只想搜这两个文件夹就这样配置，搜索范围只会包含该文件夹下的一级文件，目前没有做嵌套二级以上文件夹的搜索
const mdFolder = ['journals', '我的笔记']  


const { marked } = require('marked')
const tagRegex = /(\s|^|[\r\n])#[\u4e00-\u9fa5a-zA-Z]+/g // 标签名的正则表达式
const secondsTimestamp = /^\d{4}-\d{2}-\d{2} \d{2}.\d{2}.\d{2}$/ // 正则表达式匹配 YYYY-MM-DD HH:mm:ss 格式的文本

// 用于存储标签名和数量的对象
let tagData = {}
// 将标签名和数量写入 JSON 文件
const jsonFolderPath = path.join(path.dirname(__dirname), 'data')
const jsonFilePath = path.join(path.dirname(__dirname), 'data', 'tags.json')
let hasKeyword = false

marked.use({
  breaks: true
})

function getFolders() {
  fs.readdir(homePath, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error('无法读取目录:', err)
      return
    }

    files.forEach(file => {
      if (file.isDirectory()) {
        allFolder.push(file.name)
      }
    })

    // console.log('子文件夹名称:', allFolder)
  })
}

// 获取文件内容列表
router.get('/memos/contentList', async function (req, res, next) {
  tagData = {}
  allFolder = []
  const keyword = req.query.keyword // 获取查询参数中的关键字
  hasKeyword = Boolean(keyword)
  const isOnlyTitle = req.query.onlyTitle === '1' // 是否只搜索标题
  const hasMemos = req.query.hasMemos === '1' // 是否搜索memos

  let memos = []
  getFolders()
  const promises = mdFolder.map(async folderName => {
    const folderPath = path.join(homePath, folderName)
    // const fileNames = fs.readdirSync(fullPath)
    const fileNames = await fs.promises.readdir(folderPath)

    const filePromises = fileNames.map(async fileName => {
      // console.log('memos', fileName, secondsTimestamp.test(fileName.replace('.md','')))

      if (fileName.endsWith('.md')) {
        const filePath = path.join(folderPath, fileName)
        const content = await fs.promises.readFile(filePath, 'utf-8')
        const obUrl = `obsidian://open?vault=MyObsidian&file=${folderName}/${fileName}`
        return readMarkdownFile({ content, fileName, keyword, obUrl, isOnlyTitle })
      }
    })
    let folderFilesContent = await Promise.all(filePromises)
    folderFilesContent = folderFilesContent
      .filter(item => {
        if (hasMemos) {
          return Boolean(item)
        } else {
          return Boolean(item) && (item.hasTag || !secondsTimestamp.test(item.fileName))
        }
      })
      .sort((a, b) => b.fileName.localeCompare(a.fileName))

    memos.push(...folderFilesContent)
  })
  await Promise.all(promises)
  // console.log('memos', memos)
  if (keyword) {
    memos = memos.filter(result => {
      if (isOnlyTitle) {
        return result && result.fileName.includes(keyword)
      } else {
        return result && (result.fileName.includes(keyword) || result.content.includes(keyword))
      }
    })
  }
  const tags = handleTags(tagData)
  memos = memos.sort(customSort)
  res.json({
    memos,
    tags,
    folders: allFolder
      .filter(item => !item.includes('.'))
      .sort((a, b) => {
        return a.localeCompare(b, 'zh-CN')
      })
  })
})

// 自定义排序函数
function customSort(a, b) {
  // 提取日期和时间
  const [aDate, aTime] = extractDateAndTime(a.fileName)
  const [bDate, bTime] = extractDateAndTime(b.fileName)

  if (hasKeyword && !isDate(aDate) && !isDate(bDate)) {
    // 搜索时日期格式在后面
    return a.fileName.localeCompare(b.fileName)
  } else if (hasKeyword && !isDate(aDate) && isDate(bDate)) {
    return -1
  }
  if (a.fileName === 'Inbox' && b.fileName !== 'Inbox') {
    return -1 // a 排在 b 之前
  } else if (b.fileName === 'Inbox' && a.fileName !== 'Inbox') {
    return 1 // b 排在 a 之前
  } else if (aDate === bDate && aTime && bTime) {
    // 日期相同时按时间排序
    return bTime.localeCompare(aTime)
  } else if (aDate === bDate && !aTime) {
    // 日期相同时,纯日期在前
    return -1
  } else if (aDate === bDate) {
    // 日期相同时按时间升序
    return bTime.localeCompare(aTime)
  } else if (isDate(aDate) && isDate(bDate)) {
    // 都为日期格式时按日期倒序
    return bDate.localeCompare(aDate)
  } else if (isDate(aDate)) {
    // 如果 a 是日期格式，将其放在前面
    return -1
  } else if (isDate(bDate)) {
    // 如果 b 是日期格式，将其放在前面
    return 1
  } else {
    // 都不是日期格式，按 fileName 字母顺序排序
    return a.fileName.localeCompare(b.fileName)
  }

  function extractDateAndTime(name) {
    // 使用正则匹配日期和时间部分
    const matches = name.match(/^(\d{4}-\d{2}-\d{2})(.*)/)

    if (matches) {
      // 只有匹配成功且包含时间部分才返回时间
      if (matches[2]) {
        return [matches[1], matches[2]]
      } else {
        return [matches[1], '']
      }
    }

    return [name, '']
  }

  function isDate(str) {
    // 只匹配开头是日期的格式
    return /^\d{4}-\d{2}-\d{2}/.test(str)
  }
}

function handleTags(tagData) {
  // 将结果转化为可排序的数组
  const sortedData = Object.entries(tagData).sort((a, b) => b[1] - a[1])

  // 生成一级对象
  const sortedObject = sortedData.reduce((obj, [key, value]) => {
    obj.push({ tagName: key, number: value })
    return obj
  }, [])

  return sortedObject
}

// 获取标签列表
router.get('/memos/getTags', async (req, res) => {
  try {
    const data = await fs.promises.readFile(jsonFilePath, 'utf8')
    const memos = JSON.parse(data)
    res.json(memos)
  } catch (err) {
    console.error('Error reading or parsing tags file:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

function removeTime(fileName, content) {
  const matchedTimestamps = fileName.match(secondsTimestamp)
  if (!matchedTimestamps) {
    return content
  }
  // console.error('matchedTimestamps', fileName, content)
  const formattedTimestamp = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
  return content.replace(formattedTimestamp, '')
}

// 处理 Markdown 文件的内容
function readMarkdownFile(info) {
  let { content, fileName, keyword, obUrl, isOnlyTitle } = info
  let hasTag
  fileName = fileName.replace('.md', '')
  content = content.replace(eachYearDay, '') // 去掉每年今日
  // 过滤掉 YYYY-MM-DD HH.mm.ss 里的时间戳
  content = removeTime(fileName, content)
  let htmlContent = marked(content)
  // htmlContent = htmlContent.replace(/disabled\s*=\s*"[^"]*"/, '') // 去掉 input 的禁用

  // ================> 开始处理标签
  const matches = content.match(tagRegex)

  // 排查某个文件用
  // if (fileName === '2023-07-14') {
  //   console.log('2023-07-14', content, matches)
  // }

  if (matches) {
    hasTag = true
    matches.forEach(match => {
      const tagName = match.replace('\n', '').trim() // 去掉 "#" 符号
      // const tagName = match.slice(1) // 去掉 "#" 符号
      tagData[tagName] = (tagData[tagName] || 0) + 1
      htmlContent = htmlContent.replace(tagName, `<span class="tag">${tagName}</span>`)
    })
  }

  const jsonData = JSON.stringify(handleTags(tagData), null, 2)

  // 创建缺少的文件夹
  if (!fs.existsSync(jsonFolderPath)) {
    fs.mkdirSync(jsonFolderPath, { recursive: true })
  }

  fs.writeFile(jsonFilePath, jsonData, err => {
    if (err) {
      console.error('Error writing JSON file:', err)
      return
    }
  })
  // ================> 结束处理标签

  // 将关键字加上 <mark> 标签，如果关键词只是标签
  if (keyword && !keyword.match(tagRegex)) {
    const regex = new RegExp(keyword, 'gi')
    fileName = fileName.replace(regex, match => `<mark>${match}</mark>`)
    if (!isOnlyTitle) {
      // 仅搜索标题，就不用加了。
      htmlContent = htmlContent.replace(regex, match => `<mark>${match}</mark>`)
    }
  }
  let res = {
    fileName,
    content: htmlContent,
    obUrl
  }
  if (hasTag) {
    res.hasTag = '1'
  }
  return res
}
module.exports = router
