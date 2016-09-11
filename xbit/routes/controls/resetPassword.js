var express = require('express');
var bunyan = require('bunyan');
var User = require('models/user');

var router = express.Router();
var logger = require('common/xBitLogger');

/**
 * Page to type new password
 */
router.get('/:token', function(req, res){
    let timestamp = Date.now();
    logger.info('Try getting valid resetPasswordToken %s no earlier than %s', req.params.token, timestamp);
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt:  timestamp} }, function(err, user) {
        if (err || !user) {
            let errMsg = err ? err.message : 'Invalid token';
            logger.error('Cannot get valid resetPasswordToken %s due to %s', req.params.token, errMsg);
            return res.redirect('/forgot');
        }
        
        res.render('reset', {
            user: req.user
        });
    });
});

/**
 * Reset password by token
 * {"password": "xxx"}
 */
router.post('/:token', function(req, res, next) {
    let timestamp = Date.now();
    logger.info('Try reset password via token %s no earlier than %s', req.params.token, timestamp);
    
    User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: timestamp}
    }, function (err, user) {
        if (err || !user) {
            let errMsg = err ? err.message : 'Invalid token';
            logger.error('Cannot get valid resetPasswordToken %s due to %s', req.params.token, errMsg);
            return res.redirect('forgot');
        }

        user.setPassword(req.body.password, function (err, self) {
            if (err) {
                logger.error('Cannot change password to new password!', err);
                return next(err);
            }

            self.resetPasswordToken = undefined;
            self.resetPasswordExpires = undefined;

            logger.info('Try updating password for user %s', self.email);

            self.save(function (err) {
                if (err) {
                    logger.err('Cannot update user %s!', self.email);
                    return next(err);
                }

                res.redirect('/');
            })
        });
    });
});

module.exports = router;

