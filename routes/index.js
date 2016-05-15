var validator = require('validator');
var express = require('express');
var router = express.Router();
var article = require('../proxy').Article;
var follow = require('../proxy').Follow;
var tags = require('../proxy').Tags;
var store  = require('../common/store');
var tools = require('../common/tools');
var auth = require('../middlewares/auth');
var eventproxy = require('eventproxy');
var config = require('../config');
var paginator = require('../common/paginator');
var navData = config.site_navs;
// var cors = require('cors');

/* GET home page. */
router.get('/', collection);
router.get('/page/:page', collection);

function collection(req, res, next) {
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
            total   :  Math.ceil(all_topics_count / limit),
            current :  page,
            format  :  "/page/%d"
        }, paginatoHtml = "";
        if(pages.total > 1){
            paginatoHtml = paginator(pages)
        }
        proxy.emit('pages', paginatoHtml, all_topics_count);
        proxy.emit('count', all_topics_count);
    }));

    proxy.all('arts', 'pages', 'count',
        function(arts, pages, count){
            navData.curIndex = 0;
            res.render('index.html', {
                articles : arts,
                pages    : pages,
                navData  : navData,
                allArtNum: count
            });
        }
    );
}

router.get('/archives/:page', function(req, res, next){
    var page = parseInt(req.params.page, 10) || 1;
    page = page > 0 ? page : 1;

    var query = {};

    var proxy = new eventproxy();
    proxy.fail(next);

    var limit = config.list_topic_count;
    var options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at'};

    article.getArticleByQuery(query, options, proxy.done('arts', function (arts) {
        var Arr = [], i = 1, old = null, len = arts.length;

        old = tools.formatDate(arts[0].last_reply_at, 4);
        Arr.push(old);
        Arr.push(arts[0]);
        for(; i < len; i++){
            var year = tools.formatDate(arts[i].last_reply_at, 4);
            if(old !== year){
                Arr.push(year);
                old = year;
            }
            Arr.push(arts[i]);
        }
        return Arr;
    }));

    article.getCountByQuery(query, proxy.done(function (all_topics_count) {
        var pages = {
            total   :  Math.ceil(all_topics_count / limit),
            current :  page,
            format  :  "/archives/%d"
        }, paginatoHtml = "";
        if(pages.total > 1){
            paginatoHtml = paginator(pages)
        }
        proxy.emit('pages', paginatoHtml);
        proxy.emit('count', all_topics_count);
    }));

    proxy.all('arts', 'pages', 'count',
        function(arts, pages, count){
            navData.curIndex = 1;
            res.render('list.html', {
                articles : arts,
                pages    : pages,
                navData  : navData,
                allArtNum: count
            });
        }
    );
});

//获取收藏列表
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
//删除收藏
router.get('/follow/delete/:id', auth.userRequired, function(req, res, next){
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
//根据标签获取对应文章列表
router.get('/tags/:id', function(req, res, next){
    var query = {},id;

    var proxy = new eventproxy();
    proxy.fail(next);

    if(req.params.id){
        id = validator.trim(req.params.id);
        query = {"tags.id":id};
    } else {
        proxy.emit('error');
    }

    var options = { sort: '-top -last_reply_at'};

    article.getArticleByQuery(query, options, proxy.done('arts', function (topics) {
        return topics;
    }));

    tags.getTagsByQuery({_id:id},proxy.done('tag'));

    proxy.all('arts','tag',
        function(arts,tag){
            console.info(tag);
            var arr = [];
            arr.push(tag[0].name+"共计"+arts.length+"篇文章");
            navData.curIndex = 2
            res.render('list.html', {
                articles : arr.concat(arts),
                // pages    : "",
                navData  : navData
            });
        }
    );
});
//获取标签列表
router.get('/tags', function(req, res, next){
    var proxy = new eventproxy();
    proxy.fail(next);
    var options = {sort: '-top -create_at'};

    tags.getTagsByQuery({deleted:false}, options, proxy.done("success"));

    proxy.all('success',
        function(tags){
            console.info("tags.length = ",tags.length);
            var index = tags.length-1;
            for(index; index > -1; index--){
                tags[index].style = creatNewTagStyle();
            }
            navData.curIndex = 2;
            res.render('tags.html', {
                // pages    : "",
                length   : tags.length,
                navData  : navData,
                tags     : tags
            });
        }
    );
});
//获取标签列表信息json格式数据
router.get('/tagslist', auth.userRequired, function(req, res, next){
    var proxy = new eventproxy();
    proxy.fail(next);
    var options = {sort: '-top -create_at'};

    tags.getTagsByQuery({deleted:false}, options, proxy.done("success"));
    proxy.all('success',
        function(tags){
            console.info(tags);
            res.send({
                data:tags,
                code:200,
                msg: "获取标签列表成功"
            });
        }
    );
});
//产生随机样式
function creatNewTagStyle(){
    var fontSizeArr = ["24px","22px","20px","14px"],
        colorArr = ["#ccc","#666","#999"];

    return "font-size:" + tools.random(fontSizeArr) + "; color:" + tools.random(colorArr) + ";";
}
// 创建标签
router.get('/tags/create/:name', auth.userRequired, function(req, res, next){
    var name = "",
        folder = "",
        description = "",
        remarks = "";
    
    var proxy = new eventproxy();
    proxy.fail(next);

    if(req.params.name){
        name = validator.trim(req.params.name);
    } else {
        proxy.emit('error');
    }
    // if(req.body.folder){
    //     folder = validator.trim(req.body.folder);
    // }
    // if(req.body.description){
    //     description = validator.trim(req.body.description);
    // }
    // if(req.body.remarks){
    //     remarks = validator.trim(req.body.name);
    // }
    var options = {sort: '-top -create_at'};

    tags.getTagsByQuery({name:name}, options, proxy.done("query"));

    proxy.once("query", function(tag){
        if (tag.length > 0) {//标签名称已存在
            res.send({
                code  : 201,
                msg   : '标签名称已存在'
                // tag    : tag
            });
        } else{
            tags.newAndSave(name, folder, description, remarks, proxy.done("success"));
        }
    });

    proxy.once('success',
        function(tag){
            console.info("follows.length = ",tag);
            res.send({
                code  : 200,
                msg   : '新建成功',
                tag    : tag
            });
        }
    );

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
            artic.tag = JSON.stringify(artic.tags);
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
        title = validator.trim(req.body.title),
        introduce = validator.trim(req.body.introduce),
        tag = [];

    if(req.body.tag){
        tag = JSON.parse(req.body.tag);
    }
    console.log(tag);

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
            artic.tags = tag;

            artic.save(function(err){
                if (err) {
                    return next(err);
                }

                var result = {
                    code      : 200,
                    msg       : '修改成功',
                    id        : article._id
                }
                res.send(result);
                // res.redirect('/article/' + aid);
            });
        }
    })
});

router.post('/upload', auth.userRequired, function(req, res, next) {
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
//党建云平台使用
router.post('/uploadimg', function(req, res, next) {
    console.info("uploadimg")

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

    if (req.method == 'OPTIONS') {
        res.sendStatus(200); /*让options请求快速返回*/
    } else {
        req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            try{
            store.upload2(file, {filename: filename}, function (err, result) {
                console.info("store.upload",err)
                if (err) {
                  return next(err);
                }
                res.json({
                    // success: true,
                    // url: result.url,
                    success : 1,           // 0 表示上传失败，1 表示上传成功
                    message : "提示的信息，上传成功或上传失败及错误信息等。",
                    url     : result.url,        // 上传成功时才返回
                    id      : result.url,
                    name    : "丁丁历险记"
                });
            });
            }catch(e){
                console.info(e);
            }
        });

        req.pipe(req.busboy);
    }
});

module.exports = router;
