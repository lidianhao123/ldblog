var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;

var FollowSchema = new Schema({
  title: { type: String},
  description: { type: String },
  remarks: {type: String},
  url: {type: String},
  folder: {type: String},
  
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  
});

FollowSchema.plugin(BaseModel);

mongoose.model('Follow', FollowSchema);
