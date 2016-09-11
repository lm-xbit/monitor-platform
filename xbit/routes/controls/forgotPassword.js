var express = require('express');
var bunyan = require('bunyan');
var async = require('async');
var crypto = require('crypto');
var User = require('models/user');
var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');
var configs = require('config');

var router = express.Router();
var logger = require('common/xBitLogger');

/**
 * Page to input email to send reset password token
 */
router.get('/', function (req, res) {
  if (req.isAuthenticated()) {
    logger.info('User %s has been logged in', req.user);
    return res.redirect('/');
  }

  res.render('forgot', {
    user: req.user
  });
});


/**
 * Send password reset token to email
 * {"email": "a@b.com"}
 */
router.post('/', function (req, res) {
  logger.info('Try procedure to send reset password token to user %s.', req.body.email);
  
  async.waterfall([
    function (done) {
      logger.info('Try generating random token');
      
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        
        if(err) {
          logger.error('Can not generate random token %s!', err.message);
        }
        
        done(err, token);
      });
    },
    function (token, done) {
      logger.info('Try getting user via email %s', req.body.email);
      
      User.findOne({email: req.body.email}, function (err, user) {
        if (err) {
          logger.error('Can not get user %s due to %s!', req.body.email, err.message);
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        logger.info('Try setting reset password token');
        user.save(function (err) {
          if(err) {
            logger.error('Can not set token %s with expire date %s due to %s!', token, user.resetPasswordExpires, err.message);
          }
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      logger.info('Try sending token to email %s', user.email);
      
      const transporter = nodemailer.createTransport(ses({
        accessKeyId: configs.sesAWSId,
        secretAccessKey: configs.sesAWSKey,
        region: configs.sesRegion
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
        if(err) {
          logger.error('Email sending failed due to %s!', err.message);
        }
        done(err);
      });
    }
  ], function (err) {
    if (!err) {
      return res.json({status: 200});
    } 
  });
});

module.exports = router;