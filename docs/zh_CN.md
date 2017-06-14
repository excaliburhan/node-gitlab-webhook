# node-gitlab-webhook
基于Node.js的Gitlab Webhooks工具, 支持设置多个仓库。

## 介绍

这个库是专门为Gitlab设置，Github的版本：[node-github-webhook](https://github.com/excaliburhan/node-github-webhook)。

如果你想要查看Gitlab Webhooks的设置，请看：[gitlab webhooks](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html)。

## 安装

`npm install node-gitlab-webhook --save`

## 使用

```js
var http = require('http')
var createHandler = require('node-gitlab-webhook')
var handler = createHandler([ // 多个仓库
  { path: '/webhook1', secret: 'secret1' },
  { path: '/webhook2', secret: 'secret2' }
])
// var handler = createHandler({ path: '/webhook1', secret: 'secret1' }) // 单个仓库

http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(7777)

handler.on('error', function (err) {
  console.error('Error:', err.message)
})

handler.on('push', function (event) {
  console.log(
    'Received a push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref
  )
  switch (event.path) {
    case '/webhook1':
      // 处理webhook1
      break
    case '/webhook2':
      // 处理webhook2
      break
    default:
      // 处理其他
      break
  }
})
```
