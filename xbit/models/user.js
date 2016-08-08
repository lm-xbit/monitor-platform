var mongoose = require('lib/mongo');
var passportLocalMongoose = require('passport-local-mongoose');
var moment = require('moment');

var dateFormat = 'YYYY-MM-DD HH:mm:ss Z';

var Schema = mongoose.Schema;

function dateFormat(time) {
  var date = new Date();
  date.setTime(time);

  return date.toString();
}

var UserKeySchema = new Schema(
  {
      key: {
        type: String,
        validate: {
          validator: function(k) {
            return k && !k.match(/^\s*$/);
          },
          message: 'key cannot be empty'
        },
        required: [true, 'key cannot be empty']
      },
      createOn: {type: Number, default: Date.now() },
      updateOn: {type: Number, default: Date.now() }
  }
);

UserKeySchema.pre('save', function(next){
  var now = Date.now();

  this.updateOn = now;
  if (!this.createOn) {
    this.createOn = now;
  }
  next();
});

UserKeySchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.id = ret._id;
    ret.updateOn = moment(ret.updateOn).format(dateFormat);
    ret.createOn = moment(ret.createOn).format(dateFormat);
    delete ret._id;
    delete ret.__v;
  }
});

var UserSchema = new Schema(
  {
    username: {
      type: String,
      index: true,
      unique: true,
      validate: {
        validator: function(name) {
          return name && !name.match(/^\s*$/)
        },
        message: 'username cannot be empty'
      },
      required: [true, 'username is required'],
      minlength: [6, 'username is too short']
    },

    password: {
      type: String,
      validate: {
        validator: function(pass) {
          return pass && !pass.match(/^\s*$/)
        },
        message: 'password cannot be empty'
      },
      required: [true, 'password cannot be empty']
    },

    phone: {type: String, default: ''},

    createOn: {type: Number, default: Date.now()},
    updateOn: {type: Number, default: Date.now()},

    // userKeys: [ {type: UserKeySchema, required: false} ]
    userKeys: [ UserKeySchema ]
  },
  { // options
    autoIndex: true,
    id: true,
    _id: true,
    strict: true
  }
);

UserSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.id = ret._id;

    ret.updateOn = moment(ret.updateOn).format(dateFormat);
    ret.createOn = moment(ret.createOn).format(dateFormat);

    delete ret.password;
    delete ret._id;
    delete ret.__v;
  }
});

UserSchema.pre('save', function(next) {
  var now = Date.now();
  this.updateOn = now;

  if (!this.createOn) {
    this.createOn = now;
  }
  next();
});

// UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);