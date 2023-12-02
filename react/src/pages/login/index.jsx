import { useState } from 'react'
import { Form, Input, Button, Card } from 'antd'

const LoginPage = () => {
  const [loading, setLoading] = useState(false)

  const onFinish = values => {
    setLoading(true)
    // 在这里执行登录逻辑，比如向服务器发送登录请求
    setTimeout(() => {
      setLoading(false)
      console.log('登录成功', values)
    }, 2000)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card title="登录" style={{ width: 400 }}>
        <Form name="login" onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="用户名" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage
