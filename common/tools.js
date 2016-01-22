var bcrypt = require('bcrypt');
var moment = require('moment');

moment.locale('zh-cn'); // 使用中文

// 格式化时间
exports.formatDate = function (date, type) {
  date = moment(date);

  switch(type){
    case 1:
        return date.fromNow();
    break;
    case 2:
        return date.format('YYYY-MM-DD HH:mm');
    break;
    case 3:
        return date.format('MM-DD');
    break;
    default:
        date.fromNow();
    break
  }
};

exports.validateId = function (str) {
  return (/^[a-zA-Z0-9\-_]+$/i).test(str);
};

exports.bhash = function (str, callback) {
  bcrypt.hash(str, 10, callback);
};

exports.bcompare = function (str, hash, callback) {
  bcrypt.compare(str, hash, callback);
};