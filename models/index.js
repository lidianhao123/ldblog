var mongoose = require('mongoose');
var config   = require('../config');

mongoose.connect(config.db, {
  server: {poolSize: 20},
  user: config.dbuser,
  pass: config.dbpass
}, function (err) {
  if (err) {
    console.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

// models
require('./user');
require('./article');
require('./follow');

exports.User      = mongoose.model('User');
exports.Article   = mongoose.model('Article');
exports.Follow    = mongoose.model('Follow');
