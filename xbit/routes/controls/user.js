
var async = require('async');
var crypto = require('crypto');
var User = require('models/user');
var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');

exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('forgot', {
    user: req.user
  });
};

exports.postForgot = (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      const transporter = nodemailer.createTransport(ses({
        accessKeyId: 'AKIAJ3ZGSYLLIF5UWGEA',
        secretAccessKey: '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',
        region: 'us-west-2'
      }));
      const mailOptions = {
        to: user.email,
        from: 'ses-test@logicmonitor.com',
        subject: 'Reset your password on Xbit',
        text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };
      transporter.sendMail(mailOptions, (err) => {
        done(err);
      });
    }
  ], function(err) {
    if (!err) {
      return res.json({status: 200});
    }
  });
};

exports.getReset = (req, res, next) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      return res.redirect('/forgot');
    }
    res.render('reset', {
      user: req.user
    });
  });
};

exports.postReset = (req, res, next) => {
  async.waterfall([
    function (done) {
      User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
      }, function (err, user) {
        if (!user) {
          return res.redirect('forgot');
        }

        user.setPassword(req.body.password, function (err, self) {
          if (err) {
            logger.error("Cannot change password to new password!", err);
            return next(err);
          }

          self.resetPasswordToken = undefined;
          self.resetPasswordExpires = undefined;

          self.save(function (err, newUser) {
            if (err) {
              return next(err);
            }

            done(err, newUser);
          })
        });
      });
    }
  ], function (err) {
    res.redirect('/');
  });

};
