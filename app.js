var express = require('express')
const http = require('http')
var session = require('express-session')
var path = require('path')
var app = express()
var bodyParser = require('body-parser')
var server = http.createServer(app)
const ws = require('socket.io').listen(server)
var router = require('./router')

app.use('/node_modules/', express.static(path.join(__dirname, './node_modules/')))
app.use('/public/', express.static(path.join(__dirname, './public/')))


app.engine('html', require('express-art-template'))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './views/'))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//使用express-session 来解决
//npm install express-session
app.use(session({
    secret: 'itcast', //配置加密字符串，增加安全性
    resave: false,
    saveUninitialized: true //无论是否使用session，都给一个cookie
}))

// 当前在线人数
let count = 0

// 总访客人数
let totalCount = 0

// 创建一个web服务器
// const server = http.createServer(function(request, response) {
//     response.writeHead(200, {
//         "Content-Type": "text/html;charset=UTF-8"
//     });
//     const html = fs.readFileSync("views/chatRoom.html");
//     response.end(html);

// });



// 基于当前web服务器开启socket实例
const io = ws

// 检测连接事件
io.on('connection', function(socket) {
    console.log('当前有用户连接')
    count++
    totalCount++
    console.log('count:' + count)

    let name = ''

    //加入群聊
    socket.on("join", function(message) {
        console.log(message)
        name = message.name
        console.log(name + "加入了群聊")

        // 给公众发信息
        socket.broadcast.emit('joinNoticeOther', {
            name: name,
            action: "加入了群聊",
            count: count
        })

        // 给自己发消息
        socket.emit("joinNoticeSelf", {
            count: count,
            id: totalCount
        })
    })

    // 接收客户端所发送的信息
    socket.on('message', function(message) {
        console.log(message)
            // 向所有客户端广播发布的消息
        io.emit('message', message)
    })

    //  监听到链接断开
    socket.on('disconnect', function() {
        count--
        console.log(name + "离开了群聊")
        io.emit('disconnection', {
            count: count,
            name: name
        })
    })
})


app.use(router)

// app.use(function(req, res) {
//     res.render('404.html')
// })

// app.use(function(err, req, res, next) {
//     res.status(500).json({
//         err_code: 500,
//         message: err.message
//     })
// })


server.listen(3000, function() {
    console.log('running...')
})