const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { eachYearDay } = require('../config/index')
const { homePath } = require('../config/env')

let allFolder = []
const mdFolder = ['journals', '我的笔记']
// const mdFolder = ['journals', '我的笔记', 'wucai']
const { marked } = require('marked')
const tagRegex = /(\s|^|[\r\n])#[\u4e00-\u9fa5a-zA-Z]+/g // 标签名的正则表达式
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

    console.log('子文件夹名称:', allFolder)
  })
}

// 获取文件内容列表
router.get('/memos/contentList', async function (req, res, next) {
  tagData = {}
  allFolder = []
  const keyword = req.query.keyword // 获取查询参数中的关键字
  hasKeyword = Boolean(keyword)
  const isOnlyTitle = req.query.onlyTitle === '1' // 是否只搜索标题

  let memos = []
  getFolders()
  const promises = mdFolder.map(async folderName => {
    const folderPath = path.join(homePath, folderName)
    // const fileNames = fs.readdirSync(fullPath)
    const fileNames = await fs.promises.readdir(folderPath)

    const filePromises = fileNames.map(async fileName => {
      if (fileName.endsWith('.md')) {
        const filePath = path.join(folderPath, fileName)
        const content = await fs.promises.readFile(filePath, 'utf-8')
        const obUrl = `obsidian://open?vault=MyObsidian&file=${folderName}/${fileName}`
        return readMarkdownFile({ content, fileName, keyword, obUrl, isOnlyTitle })
      }
    })
    let folderFilesContent = await Promise.all(filePromises)
    folderFilesContent = folderFilesContent.sort((a, b) => b.fileName.localeCompare(a.fileName))

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
    folders: allFolder.filter(item => !item.includes('.')).sort((a, b) => {
      return a.localeCompare(b, 'zh-CN');
    })
  })
})

// 自定义排序函数
function customSort(a, b) {
  if (hasKeyword) {
    // 搜索时日期格式在后面
    return b.fileName.localeCompare(a.fileName)
  }
  // 提取日期和时间
  const [aDate, aTime] = extractDateAndTime(a.fileName)
  const [bDate, bTime] = extractDateAndTime(b.fileName)

  if (a.fileName === 'Inbox' && b.fileName !== 'Inbox') {
    console.log('customSort')
    return -1 // a 排在 b 之前
  } else if (b.fileName === 'Inbox' && a.fileName !== 'Inbox') {
    return 1 // b 排在 a 之前
  } else if (aDate === bDate && !aTime) {
    // 日期相同时,纯日期在前
    return -1
  } else if (aDate === bDate) {
    // 日期相同时按时间升序
    return bTime.localeCompare(aTime)
  }

  if (isDate(aDate) && isDate(bDate)) {
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
    // 使用正则表达式匹配日期和时间部分
    const matches = name.match(/(\d{4}-\d{2}-\d{2}) (.*)/)

    if (matches) {
      // 匹配成功返回数组第一个元素为日期,第二个为时间
      return [matches[1], matches[2]]
    }

    // 匹配失败直接返回原文件名
    return [name, '']
  }

  function isDate(str) {
    // 使用正则判断是否匹配日期格式
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
  // 使用正则表达式匹配 YYYY-MM-DD HH:mm:ss 格式的文本
  const regexPattern = /\d{4}-\d{2}-\d{2} \d{2}.\d{2}.\d{2}/g

  const matchedTimestamps = fileName.match(regexPattern)
  if (!matchedTimestamps) {
    return content
  }
  // console.error('matchedTimestamps', fileName, content)
  const formattedTimestamp = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g
  return content.replace(formattedTimestamp, '')
}

// 处理 Markdown 文件的内容
function readMarkdownFile(info) {
  let { content, fileName, keyword, obUrl, isOnlyTitle } = info

  content = content.replace(eachYearDay, '') // 去掉每年今日
  // 过滤掉 YYYY-MM-DD HH.mm.ss 里的时间戳
  content = removeTime(fileName, content)
  let htmlContent = marked(content)
  // htmlContent = htmlContent.replace(/disabled\s*=\s*"[^"]*"/, '') // 去掉 input 的禁用

  fileName = fileName.replace('.md', '')

  // ================> 开始处理标签
  const matches = content.match(tagRegex)

  // 排查某个文件用
  // if (fileName === '2023-07-14') {
  //   console.log('2023-07-14', content, matches)
  // }

  if (matches) {
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
  return {
    fileName,
    content: htmlContent,
    obUrl
  }
}
module.exports = router
