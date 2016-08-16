require('app-module-path').addPath(__dirname);

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('routes/index');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/front-end/resources/assets/xbit.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
if(process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, 'public')));
}
else {
  app.use(express.static(path.join(__dirname, 'front-end/resources/assets')));

  var webpack = require('webpack');
  var webpackDevMiddleware = require('webpack-dev-middleware');
  var webpackHotMiddleware = require('webpack-hot-middleware');
  var webpackDevConfig = require('./webpack/webpack.hot.config.js');

  console.log("Non-production %s mode will use webpack to service frontend. Public path is %s", process.env.NODE_ENV, webpackDevConfig.output.publicPath);

  try {
    var compiler = webpack(webpackDevConfig);

    console.log("#######Webpack config compiled ...");
    // attach to the compiler & the server
    app.use(webpackDevMiddleware(compiler, {
      // public path should be the same with webpack config
      publicPath: webpackDevConfig.output.publicPath,
      noInfo: true,
      stats: {
        colors: true
      }
    }));

    app.use(webpackHotMiddleware(compiler));

    console.log("#######Webpack hot middleware hooked ...");
  }
  catch(err) {
    console.log("Cannot load webpack hot middleware", err);
  }
}

app.set('views', path.join(__dirname, 'views/'));

app.use(require('express-session') ( {
  secret : 'xbit',
  resave : false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

// passport config
var User = require("./models/user");
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found - ' + req.url);
  err.status = 404;
  next(err);
});


app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//   app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
