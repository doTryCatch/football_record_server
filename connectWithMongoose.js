const mongoose = require('mongoose');
const databse='/FOOTBALL_RECORD_SET'
const url = "mongodb://127.0.0.1:27017";
const options={ useNewUrlParser: true, useUnifiedTopology: true }
// mogoose

module.exports=mongoose.connect(url + databse,options);