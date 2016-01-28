var validator = require('validator');
var express = require('express');
var router = express.Router();
var article = require('../proxy').Article;
var follow = require('../proxy').Follow;
var store        = require('../common/store');
var auth = require('../middlewares/auth');
var eventproxy = require('eventproxy');
var config = require('../config');
var paginator = require('../common/paginator');
var navData = config.site_navs;

/* GET home page. */
router.get('/', collection);
router.get('/page/:page', collection);

function collection(req, res, next) {
try{
    console.info("req.query.page = ",req.params.page)
    var page = parseInt(req.params.page, 10) || 1;
    page = page > 0 ? page : 1;

    var query = {};

    var proxy = new eventproxy();
    proxy.fail(next);

    var limit = config.list_topic_count;
    var options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at'};

    article.getArticleByQuery(query, options, proxy.done('arts', function (topics) {
        return topics;
    }));

    article.getCountByQuery(query, proxy.done(function (all_topics_count) {
        var pages = {
            total: Math.ceil(all_topics_count / limit),
            current :page
        }, paginatoHtml = "";
        if(pages.total > 1){
            paginatoHtml = paginator(pages)
        }
        proxy.emit('pages', paginatoHtml, all_topics_count);
        proxy.emit('count', all_topics_count);
    }));

    proxy.all('arts', 'pages', 'count',
        function(arts, pages, count){
            console.info("navData = ",navData)
            console.info("count = ",count)
            try{
            navData.curIndex = 0;
            res.render('index.html', {
                articles : arts,
                pages    : pages,
                navData  : navData,
                allArtNum: count
            });
            }catch(e){
        console.info(e)
    }
        }
    );
    }catch(e){
        console.info(e)
    }
}

router.get('/archives/:page', function(req, res, next){
    try{
    console.info("req.query.page = ",req.params.page)
    var page = parseInt(req.params.page, 10) || 1;
    page = page > 0 ? page : 1;

    var query = {};

    var proxy = new eventproxy();
    proxy.fail(next);

    var limit = config.list_topic_count;
    var options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at'};

    article.getArticleByQuery(query, options, proxy.done('arts', function (topics) {
        return topics;
    }));

    article.getCountByQuery(query, proxy.done(function (all_topics_count) {
        var pages = {
            total: Math.ceil(all_topics_count / limit),
            current :page
        }, paginatoHtml = "";
        if(pages.total > 1){
            paginatoHtml = paginator(pages)
        }
        proxy.emit('pages', paginatoHtml);
        proxy.emit('count', all_topics_count);
    }));

    proxy.all('arts', 'pages', 'count',
        function(arts, pages, count){
            console.info("1111")
            try{
            navData.curIndex = 1;
            res.render('list.html', {
                articles : arts,
                pages    : pages,
                navData  : navData,
                allArtNum: count
            });
            }catch(e){
        console.info(e)
    }
        }
    );
    }catch(e){
        console.info(e)
    }
});

//标签
router.get('/tags/:page', function(req, res, next){
    navData.curIndex = 2;
    res.render('tags.html', {
        pages    : "",
        navData  : navData
    });
    return;
    try{
    console.info("req.query.page = ",req.params.page)
    var page = parseInt(req.params.page, 10) || 1;
    page = page > 0 ? page : 1;

    var query = {};

    var proxy = new eventproxy();
    proxy.fail(next);

    var limit = config.list_topic_count;
    var options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at'};

    article.getArticleByQuery(query, options, proxy.done('arts', function (topics) {
        return topics;
    }));

    article.getCountByQuery(query, proxy.done(function (all_topics_count) {
        var pages = {
            total: Math.ceil(all_topics_count / limit),
            current :page
        }, paginatoHtml = "";
        if(pages.total > 1){
            paginatoHtml = paginator(pages)
        }
        proxy.emit('pages', paginatoHtml);
    }));

    proxy.all('arts', 'pages', 
        function(arts, pages){
            console.info("1111")
            try{
            navData.curIndex = 1;
            res.render('list.html', {
                articles : arts,
                pages    : pages,
                navData  : navData
            });
            }catch(e){
        console.info(e)
    }
        }
    );
    }catch(e){
        console.info(e)
    }
});
//收藏
router.get('/follow', function(req, res, next){
    var proxy = new eventproxy();
    proxy.fail(next);
    var options = {sort: '-top -create_at'};

    follow.getFollowByQuery({deleted:false}, options, proxy.done("follow"));

    proxy.all('follow',
        function(follows){
            console.info("follows.length = ",follows.length);
            navData.curIndex = 3;
            res.render('follow.html', {
                pages    : "",
                follows  : follows,
                navData  : navData
            });
        }
    );
});
//删除
router.get('/follow/delete/:id', function(req, res, next){
    follow.getDeleteById(req.params.id, function(err, fol){
        if(err){
            return next(err);
        } else{
            res.redirect("/follow");
        }
    })
});
//收藏
router.post('/follow', function(req, res, next){
    var title = validator.trim(req.body.title),
        url = validator.trim(req.body.url),
        folder = validator.trim(req.body.folder),
        description = validator.trim(req.body.description),
        remarks = validator.trim(req.body.remarks);

    var proxy = new eventproxy();
    proxy.fail(next);

    follow.newAndSave(title, url, folder, description, remarks, proxy.done("success", function(fol){
            res.redirect("/follow");
        }
    ));
});
//关于
router.get('/about', function(req, res, next){
    navData.curIndex = 4;
    res.render('about.html', {
        pages    : "",
        navData  : navData
    });
});

//新建文章
router.get('/article/create', auth.userRequired, function(req, res, next) {
    res.render('editArticle.html');
});

//显示文章内容
router.get('/article/:aid', function(req, res, next) {
    article.getArticle(req.params.aid, function(err, artic){
        if(err){
            return next(err);
        } else{
            navData.curIndex = 0;
            res.render('detail.html', {art: artic, navData: navData});
        }
    })
});

//编辑文章
router.get('/article/:aid/edit', auth.userRequired, function(req, res, next) {
  // res.render('new_article');
    article.getArticle(req.params.aid, function(err, artic){
        if(err){
            return next(err);
        } else{
            res.render('editArticle.html', {art: artic});
        }
    })
});

//新建文章
router.post('/article/create', auth.userRequired, function(req, res, next) {
  // res.render('new_article');
    var md = validator.trim(req.body.md),
        html = validator.trim(req.body.html),
        title = validator.trim(req.body.title);
        introduce = validator.trim(req.body.introduce);

    article.newAndSave(title, md, html, introduce, function(err, article){
        if(err){
            // var result = {
            //     code      : 500,
            //     msg       : '数据库错误，创建文章失败'
            // }
            return next(err);
        } else{
            var result = {
                code      : 200,
                msg       : '新建成功',
                id        : article._id
            }
        }
        res.send(result);
    })

});

router.post('/article/:aid/edit', auth.userRequired, function(req, res, next) {
    var aid = req.params.aid,
        md = req.body.md,
        html = req.body.html,
        title = validator.trim(req.body.title);
        introduce = validator.trim(req.body.introduce);

    article.getArticle(aid, function(err, artic){
        if(err){
            // res.
        } else{
            // res.render('editArticle.html',{content:artic.md});
            artic.md = md;
            artic.html = html;
            artic.title = title;
            artic.introduce = introduce;
            artic.update_at = new Date();

            artic.save(function(err){
                if (err) {
                    return next(err);
                }

                res.redirect('/article/' + aid);
            });
        }
    })
});

router.post('/upload', auth.userRequired, function(req, res, next) {
    console.info(req);
    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
      store.upload(file, {filename: filename}, function (err, result) {
        if (err) {
          return next(err);
        }
        res.json({
            // success: true,
            // url: result.url,
            success : 1,           // 0 表示上传失败，1 表示上传成功
            message : "提示的信息，上传成功或上传失败及错误信息等。",
            url     : result.url        // 上传成功时才返回
        });
      });
    });

    req.pipe(req.busboy);
});

module.exports = router;
