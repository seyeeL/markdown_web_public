import './App.css'
import './assets/base.less'
// 引入路由
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/home/index';
import LoginPage from './pages/login/index';
function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/xxxxxx" element={<Home />} />
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
