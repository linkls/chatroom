var express = require('express')
var md5 = require('blueimp-md5')
var url = require('url')
    //上传图片的模板
var multer = require('multer');
var mysql = require('mysql')
var formidable = require('formidable'),
    fs = require('fs'),
    TITLE = '文件上传示例',
    AVATAR_UPLOAD_FOLDER = '/img/';

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ywz19988393',
    database: 'chatroom'
});

connection.connect();

var router = express.Router()


router.get('/', function(req, res) {

    res.render('chatRoom.html', {
        name: req.session.user[0].nickname,
        email: req.session.user[0].email,
        img: req.session.user[0].img
    })
})

// router.post('/', function(req, res) {
//     var body = req.body
//     req.session.email = body.email
// })

router.get('/login', function(req, res, next) {
    res.render('login.html')
})

router.post('/login', function(req, res, next) {
    // 1. 获取表单数据
    // 2. 查询数据库用户名密码是否正确
    // 3. 发送响应数据
    var body = req.body
    var sql = 'SELECT * FROM user WHERE email = ? and password = ?'
    var sqlparams = [body.email, md5(md5(body.password))]
    connection.query(sql, sqlparams, function(err, result) {
        if (err) {
            return next(err)
        }
        if (result === []) {
            return res.status(200).json({
                err_code: 1,
                message: 'Email or password is invalid.'
            })
        }
        // console.log(result)
        // 用户存在， 登陆成功， 通过 Session 记录登陆状态
        req.session.user = result

        res.status(200).json({
            err_code: 0,
            message: 'OK'
        })
    })
})

router.get('/register', function(req, res, next) {
    res.render('register.html')
})

router.post('/register', function(req, res, next) {
    var body = req.body
    var sql = 'SELECT * FROM user WHERE email = ? and nickname = ?';
    var sqlparams = [body.email, body.nickname]
    connection.query(sql, sqlparams, function(err, result) {
        console.log(result)
        if (err) {
            return next(err)
        }
        if (result !== []) {
            return res.status(200).json({
                err_code: 1,
                message: '昵称或邮箱已存在'
            })
            return res.send(`邮箱或密码已存在,请重试`)
        }
        // 对密码进行加密
        body.password = md5(md5(body.password))
        var addsql = 'INSERT INTO user(nickname,email,password,img) VALUES(?,?,?,"/public/img/1.jpg")'
        var addSqlParams = [body.nickname, body.email, body.password]
        connection.query(addsql, addSqlParams, function(err, result) {
            if (err) {
                return next(err)
            }
            req.session.user = result
            res.status(200).json({
                err_code: 0,
                message: 'ok'
            })
        })
    })

})

/* GET home page. */
router.get('/index', function(req, res) {
    res.render('index', {
        title: TITLE,
        // email: req.session.email
    });
});

router.post('/index', function(req, res) {
    var body = url.parse(req.url, true).query
    console.log(body.email)
        // var avatarName = ''
        //创建上传表单
    var form = new formidable.IncomingForm();

    //设置编辑
    form.encoding = 'utf-8';

    //设置上传目录
    form.uploadDir = 'public' + AVATAR_UPLOAD_FOLDER;

    //保留后缀
    form.keepExtensions = true;

    //文件大小 2M
    form.maxFieldsSize = 2 * 1024 * 1024;

    // 上传文件的入口文件
    form.parse(req, function(err, fields, files) {

        if (err) {
            res.locals.error = err;
            res.render('index', { title: TITLE });
            return;
        }

        var extName = ''; //后缀名
        switch (files.fulAvatar.type) {
            case 'image/pjpeg':
                extName = 'jpg';
                break;
            case 'image/jpeg':
                extName = 'jpg';
                break;
            case 'image/png':
                extName = 'png';
                break;
            case 'image/x-png':
                extName = 'png';
                break;
        }

        if (extName.length == 0) {
            res.locals.error = '只支持png和jpg格式图片';
            res.render('index', { title: TITLE });
            return;
        }

        var avatarName = Math.round(Math.random() * 100000) + '.' + extName;
        console.log(avatarName)
        var newPath = form.uploadDir + avatarName;
        fs.renameSync(files.fulAvatar.path, newPath); //重命名

        var modSql = 'UPDATE user SET img = ? WHERE email = ?';
        var modSqlParams = ['/public/img/' + avatarName, body.email];
        connection.query(modSql, modSqlParams, function(err, result) {
            if (err) {
                console.log('[UPDATE ERROR] - ', err.message);
                return;
            }
            // console.log(result)
            // connection.end()
        });
        var sql = 'SELECT * FROM user WHERE email = ? ';
        var sqlparams = [body.email]
        connection.query(sql, sqlparams, function(err, result) {
            if (err) {
                return next(err)
            }
            console.log(result)
                // req.session.user = result
            res.render('chatRoom.html', {
                name: result[0].nickname,
                email: result[0].email,
                img: result[0].img
            })

            // connection.end()
        });
    });
    // res.render('chatRoom.html', {
    //     name: req.session.user[0].nickname,
    //     email: req.session.user[0].email,
    //     img: req.session.user[0].img
    // })

    // res.render('login.html')
});


module.exports = router