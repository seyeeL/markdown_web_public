import axios from 'axios'

const http = axios.create()

http.interceptors.response.use(
  response => {
    // console.log('http', response)
    // 成功则直接返回数据
    return response.data
  },
  error => {
    console.log('error', error)
    return Promise.reject(error)
  }
)
export default http
