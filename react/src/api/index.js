import http from './axios'

// 获取素有的memos
export function contentList(params) {
  return http.get('/memos/contentList', {
    params
  })
}
// 获取 tags 
export function getTags(params) {
  return http.get('/memos/getTags', {
    params
  })
}
