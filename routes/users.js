var express = require('express');
var router = express.Router();
var eventproxy = require('eventproxy');
var User = require('../proxy').User;
var validator = require('validator');
var tools = require('../common/tools');
var authMiddleWare = require('../middlewares/auth');
var config = require('../config');

/* 进入登陆页面. */
router.get('/newuser', function(req, res, next) {
    res.send('success');
    var user = {
        name: "",
        pass: ""
    }
    console.info("user.pass = ",user.pass)
    tools.bhash(user.pass, function(err, passhash) {
        console.info("passhash = ",passhash)
        User.newAndSave(user.name, passhash);
    });
});
/* 进入登陆页面. */
router.get('/login', function(req, res, next) {
    //创建用户代码：
    res.render('login');
});

router.post('/login', function(req, res, next) {
    var name = validator.trim(req.body.name).toLowerCase();
    var pass = validator.trim(req.body.pass);
    var ep   = new eventproxy();
    console.info("req.secret = ",req.secret);
    ep.fail(next);

    if (!name || !pass) {
        res.status(422);
        return res.send({ code : 111, error: '信息不完整。' });
    }

    ep.on('login_error', function (login_error) {
        // res.status(403);
        res.send({ code : 111, error: '用户名或密码错误' });
    });

    User.getUserByName(name, function (err, user) {
        if (err) {
          return next(err);
        }
        if (!user) {
          return ep.emit('login_error');
        }

        var passhash = user.pass;
        tools.bcompare(pass, passhash, ep.done(function (bool) {
            if (!bool) {
                return ep.emit('login_error');
            }

            // store session cookie
            authMiddleWare.gen_session(user, res);
            //check at some page just jump to home page
            // var refer = req.session._loginReferer || '/';
            // for (var i = 0, len = notJump.length; i !== len; ++i) {
            //     if (refer.indexOf(notJump[i]) >= 0) {
            //         refer = '/';
            //         break;
            //     }
            // }
            res.redirect('/');
        }));
    });
});

// sign out
router.get('/logout', function (req, res, next) {
    req.session.destroy();
    res.clearCookie(config.auth_cookie_name, { path: '/' });
    res.redirect('/');
});

module.exports = router;
