// var EventProxy = require('eventproxy');
var models     = require('../models');
var Article      = models.Article;
// var User       = require('./user');
var tools      = require('../common/tools');
var _          = require('lodash');

exports.newAndSave = function (title, md, html, introduce, tab, callback) {
  var article       = new Article();
  article.title     = title;
  article.md        = md;
  article.html      = html;
  article.introduce = introduce;
  article.tab       = tab;
  // article.author_id = authorId;

  article.save(callback);
};

// exports.edit = function (id, title, md, html, callback) {
//   var article       = new Article();
//   article.title     = title;
//   article.md        = md;
//   article.html      = html;
//   // article.tab       = tab;
//   // article.author_id = authorId;

//   Article.findOneAndUpdate(id, callback);
// };

/**
 * 根据主题ID，查找一篇文章
 * @param {String} id 文章ID
 * @param {Function} callback 回调函数
 */
exports.getArticle = function (id, callback) {
  Article.findOne({_id: id}, callback);
};

/**
 * 根据关键词，获取文章列表
 * Callback:
 * - err, 数据库错误
 * - count, 文章列表
 * @param {String} query 搜索关键词
 * @param {Object} opt 搜索选项
 * @param {Function} callback 回调函数
 */
exports.getArticleByQuery = function (query, opt, callback) {
  query.deleted = false;

  Article.find(query, {}, opt, function (err, artciles) {
    if (err) {
      return callback(err);
    }
    if (artciles.length === 0) {
      return callback(null, []);
    }
    callback(err,artciles);
  });
};

/**
 * 获取关键词能搜索到的文章数量
 * Callback:
 * - err, 数据库错误
 * - count, 文章数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery = function (query, callback) {
  Article.count(query, callback);
};


