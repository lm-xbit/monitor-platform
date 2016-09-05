var mongoose = require('lib/mongo');
var passportLocalMongoose = require('passport-local-mongoose');
var moment = require('moment');

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
          validator: function (k) {
            return k && !k.match(/^\s*$/);
          },
          message: 'key cannot be empty'
        },
        required: [true, 'key cannot be empty']
      },
      name: String,
      type: String,
      primary: Boolean, // if this is the primary APP. Only one primary APP shall exists
      connected: Boolean, // if this APP has been connected?
      connectedOn: Date,   // when this device is connected
      connectCode: String, // code for requesting connecting
      connectInfo: mongoose.Schema.Types.Mixed, // information of connected device

      lastReportedOn: Date, // when this APP last reported back data?
      description: String,
      createOn: {type: Number, default: Date.now()},
      updateOn: {type: Number, default: Date.now()}
    }
);

var UserSchema = new Schema(
  {
    email: {
      type: String,
      index: true,
      unique: true,
      validate: {
        validator: function(email) {
          var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
          return re.test(email)
        },
        message: "Invalid email address provided"
      },
      required: [true, 'Email address is required'],
    },

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
      }
//      required: [true, 'password cannot be empty']
    },

    phone: {type: String, default: ''},

    createOn: {type: Number, default: Date.now()},
    updateOn: {type: Number, default: Date.now()},

    // userKeys: [ {type: UserKeySchema, required: false} ]
    userKeys: [ UserKeySchema ],

    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { // options
    autoIndex: true,
    id: true,
    _id: true,
    strict: true
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
    ret.updateOn = moment(ret.updateOn).format('MMMM Do YYYY, h:mm:ss a');
    ret.createOn = moment(ret.createOn).format('MMMM Do YYYY, h:mm:ss a');
    delete ret._id;
    delete ret.__v;
  }
});

UserSchema.pre('save', function(next) {
  console.info("Try to save the user");
  var now = Date.now();
  this.updateOn = now;

  if (!this.createOn) {
    this.createOn = now;
  }
  next();
});

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


UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
module.exports = mongoose.model('User', UserSchema);
