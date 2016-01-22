var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;

var UserSchema = new Schema({
  name: { type: String},
  pass: { type: String },
  
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  
  accessToken: {type: String},
});

UserSchema.plugin(BaseModel);

mongoose.model('User', UserSchema);
