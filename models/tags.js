var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;

var TagsSchema = new Schema({
  name: { type: String},
  description: { type: String },
  remarks: {type: String},
  folder: {type: String},
  deleted: {type: Boolean, default: false},
  
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
});

TagsSchema.plugin(BaseModel);

mongoose.model('Tags', TagsSchema);
