var bcrypt = require('bcrypt');
var moment = require('moment');

moment.locale('zh-cn'); // 使用中文

// 格式化时间
exports.formatDate = function (date, friendly) {
  date = moment(date);

  if (friendly) {
    return date.fromNow();
  } else {
    return date.format('YYYY-MM-DD HH:mm');
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

// exports.pages = function(curPage, total){
//     var result = [], index;
//     if(curPage !== 1){
//         result.push({value:curPage-1, link:curPage-1})
//     }
//     if (total >= 5) {
//         if(curPage > total/2){
//             result.push({value:1,link:1});// 第一页
//             if(curPage === total){
//                 result.push({value:curPage-1,link:curPage-1});
//                 result.push({value:curPage,link:null});
//             } else{
//                 result.push({value:curPage-1,link:curPage-1});
//                 result.push({value:curPage,link:null});
//             }
//         } else {

//         }
//     } else{
//         for(index = 1; index <= total; index++){
//             var item;
//             if(index === curPage){
//                 item = {value:curPage,link:null}
//             } else{
//                 item = {value:index,link:index}
//             }
//             result.push(item);
//         }
//     }
//     if(curPage !== total){
//         result.push({value:curPage+1, link:curPage+1})
//     }
// }
