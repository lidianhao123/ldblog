var article = require('./proxy').Article;

// for(var i = 0; i < 100; i++){
//     article.newAndSave("测试文章创建",'<html><html><html><html><html><html><html><html><html>',function(err, art){}
//     )
// }
// article.newAndSave("测试文章创建",'<html><html><html><html><html><html><html><html><html>',function(err, art){
//     console.info(err);
//     console.info(art);
//     article.getArticle(art._id, function(err, art2){
//         if(err === null){
//             console.info(art2);
//         }
//     });

//     // 取主题
//   var query = {};

//   var limit = config.list_topic_count;
//   var options = { skip: (page - 1) * limit, limit: limit, sort: '-update_at'};

//   article.getArticleByQuery(query, options, function(err, articles){
//     console.info(articles.length);
//   });
// });
var query = {};
var limit = 20;//config.list_topic_count;
var options = { skip: 0, limit: limit, sort: '-update_at'};

article.getArticleByQuery(query, options, function(err, articles){
    // console.info(articles.length);
    for(var i = 0; i < articles.length; i++){
        console.info(articles[i].create_at);
    }
});





