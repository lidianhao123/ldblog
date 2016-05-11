var models  = require('../models');
var Tags    = models.Tags;

/**
 *创建新标签
 *callback：
 * - err, 数据库异常
 * - Tagss, 数组
 * @param {String} name: 收藏名
 * @param {String} url: 地址
 * @param {String} description: 描述
 * @param {String} remarks: 备注
 */
exports.newAndSave = function (name, folder, description, remarks, callback) {
  var tag          = new Tags();
  tag.name        = name;
  tag.folder       = folder;
  tag.description  = description;
  tag.remarks      = remarks;

  tag.save(callback);
};

/**
 * 根据关键词，获取标签内容
 * Callback:
 * - err, 数据库错误
 * - count, 标签列表
 * @param {String} query 搜索关键词
 * @param {Object} opt 搜索选项
 * @param {Function} callback 回调函数
 */
exports.getTagsByQuery = function (query, opt, callback) {

  Tags.find(query, {}, opt, function (err, tags) {
    if (err) {
      return callback(err);
    }
    if (tags.length === 0) {
      return callback(null, []);
    }
    callback(err,tags);
  });
};

/**
 * 获取标签数量
 * Callback:
 * - err, 数据库错误
 * - count, 标签数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery = function (query, callback) {
  Tags.count(query, callback);
};

/**
 * 根据收藏ID，将对应项目deleted
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} TagsId 收藏项ID
 * @param {Function} callback 回调函数
 */
exports.getDeleteById = function (TagsId, callback) {
  callback();
};
