import { useEffect, useState, useRef } from 'react'
import { contentList, getTags } from '@/api/index'
import { useNavigate, useLocation } from 'react-router-dom'
import './index.less'
import { marked } from 'marked'
import { debounce } from 'lodash-es'
import { Input, Empty, Dropdown, Switch, Popover, Tooltip, Drawer, Select, Space } from 'antd'
// antd 图标
import {
  DownOutlined,
  FolderOpenOutlined, // 文件夹
  LinkOutlined,
  ReloadOutlined,
  SwapOutlined,
  VerticalAlignTopOutlined,
  MenuOutlined,
  EllipsisOutlined
} from '@ant-design/icons'
// import type { MenuProps } from 'antd'
const { Search } = Input
const items = [
  {
    label: '列表',
    key: '列表'
  },
  {
    label: '卡片',
    key: '卡片'
  }
]
marked.use({
  breaks: true
})

const Home = () => {
  const [memos, setMemos] = useState([])
  const [tags, setTags] = useState([])
  const [folders, setFolders] = useState([])
  const [keyword, setKeyword] = useState('')
  const [onlyTitle, setOnlyTitle] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [viewType, setViewType] = useState('卡片')
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth) // 浏览器视口宽度
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    console.log('URL changed:', location)
    const hash = location.hash
    const urlParams = new URLSearchParams(hash.slice(1))
    const qValue = urlParams.get('q')
    setViewportWidth(window.innerWidth)
    setKeyword(qValue)
    fetchContentList(qValue)
  }, [location])

  // 判断浏览器视口宽度
  const checkViewportWidth = viewportWidth < 500

  // 获取memos数据
  const fetchContentList = async (keyword, newKeyword) => {
    setMemos([])
    console.log('fetchContentList', onlyTitle)

    let params = { keyword }
    if (newKeyword) {
      params.onlyTitle = newKeyword
    } else {
      params.onlyTitle = onlyTitle ? '1' : '0'
    }
    try {
      let { memos, tags, folders } = await contentList(params)
      console.log('response', memos, tags)

      setMemos(memos.filter(item => item && item.content))
      setTags(tags)
      setFolders(
        folders.map(item => {
          return { label: item, value: item }
        })
      )
      // setTimeout(() => {
      // const inputElement = document.querySelectorAll('input')

      // if (inputElement) {
      //   console.log('Input clicked!', inputElement)
      //   const inputArray = Array.from(inputElement)
      //   // 注册点击事件处理程序
      //   inputArray.forEach(item => {
      //     item.onclick = () => {
      //       console.log(111)
      //     }
      //   })
      // }
      // }, 1000)
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    }
  }

  // 切换视图
  const changeView = ({ key }) => {
    console.log(`Click on item ${key}`)
    setViewType(key)
    goTop()
  }
  const changeFolder = ({ key }) => {
    console.log(`Click on item ${key}`)
  }
  const clickBox = (e, item) => {
    console.log(`clickBox`, e, item)
  }

  // 跳转到 obsidian
  const goObsidian = obUrl => {
    console.log(`Click on item ${obUrl}`)
    window.open(obUrl)
  }

  // 列表排序
  const sort = () => {
    const sortedMemos = [...memos].sort((a, b) => {
      if (a.fileName && b.fileName) {
        return b.fileName.localeCompare(a.fileName)
      }
      // 处理可能的 undefined 值
      return 0
    })

    setMemos(sortedMemos)
  }

  // 滚动到顶部
  const goTop = () => {
    console.log(`goTop`)
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
  const changeKeyword = value => {
    setKeyword(value)
    if (!value) {
      handleSearch()
    }
  }
  const changeOnlyTitle = value => {
    // console.log(`onlyTitle`, value)
    setOnlyTitle(value)
    if (!keyword) {
      return
    }
    fetchContentList(keyword, value ? '1' : '0')
  }

  const handleSearch = value => {
    console.log(`handleSearch`, value)
    if (checkViewportWidth) {
      setShowDrawer(false)
    }
    // fetchContentList(keyword)
    const encodedValue = encodeURIComponent(value)
    const url = value ? `/xxxxxx#?q=${encodedValue}` : '/xxxxxx'
    navigate(url)
  }

  // 不同视图的列表
  const itemType = (item, index) => {
    switch (viewType) {
      case '卡片':
        return (
          <div key={index} className="card-item bg-hover pointer">
            <h3 className="card-title mb20">
              <span dangerouslySetInnerHTML={{ __html: item.fileName }}></span>
              <LinkOutlined className="ml5" onClick={() => goObsidian(item.obUrl)} />
            </h3>
            <div
              className="card-content"
              onClick={e => clickBox(e, item)}
              dangerouslySetInnerHTML={{ __html: item.content }}
            ></div>
          </div>
        )
      case '列表':
        return (
          <div key={index} className="card-title mb20">
            <span dangerouslySetInnerHTML={{ __html: item.fileName }}></span>
            <LinkOutlined className="ml5" onClick={() => goObsidian(item.obUrl)} />
          </div>
        )
    }
  }

  //  tag 盒子
  const createTagBox = () => {
    const tagEle = (
      <div className="tag-box">
        {tags.map((item, index) => {
          return (
            <div key={index} onClick={() => handleSearch(item.tagName)} className="tag-item bg-hover pointer">
              {item.tagName}
            </div>
          )
        })}
      </div>
    )
    if (checkViewportWidth) {
      return (
        <Drawer closable={false} width="50vw" placement="left" open={showDrawer} onClose={() => setShowDrawer(false)}>
          {tagEle}
        </Drawer>
      )
    }
    return tagEle
  }
  return (
    <div className="home">
      <div className="search-box ">
        {checkViewportWidth ? (
          <MenuOutlined className="mr10" style={{ color: '#bfbfbf' }} onClick={() => setShowDrawer(true)} />
        ) : null}
        <Search
          className="search-input"
          value={keyword}
          onChange={e => changeKeyword(e.target.value)}
          placeholder="搜索"
          onSearch={() => handleSearch(keyword)}
          allowClear
        />
        <Tooltip title="仅搜索标题">
          <Switch className="ml20 " size="small" checked={onlyTitle} onChange={e => changeOnlyTitle(e)} />
        </Tooltip>
        {/* 视图切换 */}
        <Dropdown className="blue pointer ml20" menu={{ items, onClick: changeView }} trigger={['click']}>
          <div className="viewBtn " onClick={e => e.preventDefault()}>
            {viewType}
            <DownOutlined />
          </div>
        </Dropdown>
        {/* 目录切换 */}
        {checkViewportWidth ? null : (
          <Select
            mode="multiple"
            className="pointer"
            style={{ width: '200px' }}
            defaultValue={['我的笔记', 'journals']}
            maxTagCount={1}
            onChange={changeFolder}
            optionLabelProp="label"
            placeholder="选择文件夹"
            bordered={false}
            options={folders}
          />
        )}

        {/* <Popover
          placement="bottom"
          content={() => (
            <div>
              <span>仅搜索标题</span>
              <Switch className="ml10" size="small" checked={onlyTitle} onChange={e => setOnlyTitle(e)} />
            </div>
          )}
        >
          <EllipsisOutlined className="blue pointer ml20" />
        </Popover> */}
        {/* 排序 */}
        {/* <SwapOutlined className="blue pointer" onClick={() => sort()} /> */}
        {/* 回到顶部 */}
        <VerticalAlignTopOutlined className="blue pointer ml20" onClick={() => goTop()} />
        {/* 刷新 */}
        {/* <ReloadOutlined className="blue pointer" onClick={() => fetchContentList(keyword)} /> */}
      </div>
      <div className="content">
        {/* 标签列表 */}
        {createTagBox()}

        {/* 内容盒子 */}
        <div className={checkViewportWidth ? 'full-card' : 'card-box'}>
          {memos.map((item, index) => {
            return itemType(item, index)
          })}
          {memos.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}
        </div>
      </div>
    </div>
  )
}

export default Home
