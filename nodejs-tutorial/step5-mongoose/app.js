var path = require('path');
var express = require('express');
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.json());

var mongoose = require("mongoose");
mongoose.connect('localhost', 'test');
var MessageSchema = mongoose.Schema({
    author: {
        type: String,
        validate: {
            validator: function(v) {
                var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
                return re.test(v);
            },
            message: '{VALUE} is not a valid email address'
        },
        required: [true, "Author must be provided"]
    },
    message: {
        type: String,
        required: [true, "Message must be provided"]
    },
    created: Date
});

MessageSchema.pre('save', function(next) {
    if(!this.created) {
        this.created = new Date();
    }

    next();
});

MessageSchema.post('save', function (doc) {
  console.log("Messave have been saved - " + doc);
});

MessageSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

MessageSchema.set('toJSON', {
    virtuals: true
});

var Message = mongoose.model('Message', MessageSchema);

// let's expose bower_components for browser
app.use("/bower_components", express.static(path.join(__dirname, './bower_components')));

// let's expose views for browser (for access main.js)
app.use(express.static(path.join(__dirname, 'views')));

// explicitly set the views directory, default to views
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');


app.get('/', function (req, res) {
    res.render("hello", {
        "author": "Ning",
        "message": "This is a test"
    });
});

app.get('/message', function(req, res, next) {
    Message.find(function(err, msgs) {
        if(err) {
            return next(err);
        }

        return res.json(msgs);
    });
});

app.put('/message', function(req, res, next) {
    console.log("Create message - " + req.body);
    
    var message = new Message(req.body);
    
    message.save(function(err, msg) {
        if(err) {
            return next(err);
        }

        return res.json(msg);
    });
});

app.post('/message/:id', function(req, res, next) {
    console.log("Update message " + req.params.id + " - " + req.body);
    
    Message.findByIdAndUpdate(req.params.id, req.body, {upsert: false, new: true}, function(err, msg) {
        if(err) {
            return next(err);
        }

        return res.json(msg);
    });
});

app.delete('/message/:id', function(req, res, next) {
    console.log("Delete message " + req.params.id);
    
    Message.findByIdAndRemove(req.params.id, function(err, msg) {
        if(err) {
            return next(err);
        }

        return res.json(msg);
    });
});

app.listen(8000, function () {
    console.log('Example app listening on port 8000!');
});
