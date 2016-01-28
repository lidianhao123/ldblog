var models  = require('../models');
var Follow    = models.Follow;

/**
 *创建新收藏链接
 *callback：
 * - err, 数据库异常
 * - follows, 数组
 * @param {String} title: 收藏名
 * @param {String} url: 地址
 * @param {String} description: 描述
 * @param {String} remarks: 备注
 */
exports.newAndSave = function (title, url, folder, description, remarks, callback) {
  var follow          = new Follow();
  follow.title        = title;
  follow.url          = url;
  follow.folder       = folder;
  follow.description  = description;
  follow.remarks      = remarks;

  follow.save(callback);
};

/**
 * 根据关键词，获取收藏内容
 * Callback:
 * - err, 数据库错误
 * - count, 文章列表
 * @param {String} query 搜索关键词
 * @param {Object} opt 搜索选项
 * @param {Function} callback 回调函数
 */
exports.getFollowByQuery = function (query, opt, callback) {

  Follow.find(query, {}, opt, function (err, follows) {
    if (err) {
      return callback(err);
    }
    if (follows.length === 0) {
      return callback(null, []);
    }
    callback(err,follows);
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
  Follow.count(query, callback);
};

/**
 * 根据收藏ID，将对应项目deleted
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} followId 收藏项ID
 * @param {Function} callback 回调函数
 */
exports.getDeleteById = function (followId, callback) {
  Follow.findOne({_id: followId}, function (err, fol) {
    if (err || !fol) {
      return callback(err);
    }
    fol.deleted    = true;
    fol.save(callback);
  });
};
