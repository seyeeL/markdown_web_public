# markdown-web

将 markdown 文件展示在网页上，作为 obsidian 用户不太满意自带搜索做的小玩意

### 目前版本的适用场景

适用于搜索一些日记，零散的东西，如果是长文直接在 obsidian 里面看就好了，有点像是一个以 obsidian 数据运行的网页版 flomo/脱离 obsidian 本体的 memos 插件

### 使用

目前还没有做到对小白用户开箱即用，需要一点编程能力。可以搜索 #config 做一些配置

```
// 启动后端
cd markdown_web_public
npm i
npm run server

// 启动前端
cd react
npm i
npm run dev 
```
根路径的登陆页面是个假的，还没做，笔记主页在 /xxxxxx 路径 打开 localhost:5173/xxxxxx

### 一些示例图

![](https://seyee.oss-cn-beijing.aliyuncs.com/assets/202312021926555.png)


### 如果觉得对你有帮助的话，可以支持一下我，会更有动力更新~

![](https://seyee.oss-cn-beijing.aliyuncs.com/assets/202312021924135.JPEG)