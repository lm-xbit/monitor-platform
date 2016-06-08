var express = require('express'),
  bodyParser = require('body-parser');
var path = require('path'),
  ejs = require('ejs'),
  app = express();
var jsonParser = bodyParser.json()
app.use(jsonParser);

var app = express();
var app1 = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.listen(3000, function() {
  console.log('app listening on port 3000!');
});
// expose static folder for browser
app.use(express.static('bower_components'));
app.use('/statics', express.static(
  path.join(__dirname, './statics')));

function sendHello(req, res) {
  res.render('index', {
    user: "xbit",
    title: "homepage",
    method: req.method,
    path: req.path
  });
};

function postHello(req, res) {
  res.json({
    "Method": req.method,
    "Path": req.path
  });
}

app.use('/', function(req, res, next) {
  console.log('Time: %s :: url：%s', Date.now(), req.originalUrl);
  if ('/' == req.path) {
    res.send('Server is ok now!')
    return;
  }
  console.log("test console" + req.path);
  next();
});

app.get('/getHello', sendHello);
app.post('/postHello', postHello);


//Restful test;
var products = [{
  name: 'apple juice',
  description: 'good',
  price: 12.12
}, {
  name: 'banana juice',
  description: 'just so sos',
  price: 4.50
}];

//get resource lists;
app.get('/products', function(req, res) {
  res.json(products);
});

//get resource by id;
app.get('/products/:id', function(req, res) {
  res.json(products[req.params.id]);
});

//can't find;
app.get('/products/:id', function(req, res) {
  if (products.length <= req.params.id || req.params.id < 0) {
    res.statusCode = 404;
    return res.send('Error 404: No products found')
  }
  res.json(products[req.params.id]);
});

//post data;
app.post('/products', jsonParser, function(req, res) {
  res.setHeader('Content-Type', 'text/plain')
  var newProduct = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price
  };

  products.push(newProduct);
  res.statusCode = 201;
  res.location('/products/' + products.length);
  res.json(true);
});

app.route('/routeTest')
  .all(function(req, res, next) {
    console.log("roteTest all");
    next();
  })
  .get(sendHello)
  .post(postHello);

app.use('/angular', function(req, res) {
  res.render('angularTest', {
    "author": "angular",
    "message": "This is a test"
  });
});

app.use('/bootstrap', function(req, res) {
  res.render('bootstrap', {
    "author": "bootstrap",
    "message": "This is a test"
  });
});

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    code: err.status
  });
});
