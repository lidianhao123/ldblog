var models  = require('../models');
var User    = models.User;
var utility = require('utility');

/**
 * 根据登录名查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} loginName 登录名
 * @param {Function} callback 回调函数
 */
exports.getUserByName = function (name, callback) {
  User.findOne({'name': name}, callback);
};

/**
 * 根据用户ID，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} id 用户ID
 * @param {Function} callback 回调函数
 */
exports.getUserById = function (id, callback) {
  if (!id) {
    return callback();
  }
  User.findOne({_id: id}, callback);
};

exports.newAndSave = function (name, pass, callback) {
  console.info("pass = ",pass);
  var user         = new User();
  user.name        = name;
  user.pass        = pass;

  user.save(callback);
};

