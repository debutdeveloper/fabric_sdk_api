var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var validator = require('express-validator');

var indexRouter = require('./routes/index');
var categoryRouter = require('./routes/category');
var assetRouter = require('./routes/asset');
var userRouter = require('./routes/user');
var requestRouter = require('./routes/rq');
var dashboardRouter = require('./routes/dashboard');
var authMiddleware = require('./middleware/auth');

var networkRouter = require('./routes/network');
var notification = require('./routes/notifications')

var network = require('./application/Controllers/NetworkController');

var io = require('socket.io')(3002);

var app = express();

global.socket_io = io;

io.on('connection',function(socket_io){
  network.chaininfo().then(function(queRes){
    io.emit("block_added",queRes);
  }).catch(function(err){
    console.error("Error while fetching block height ==> " + err)
  });
  
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(authMiddleware);

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/asset', assetRouter);
app.use('/category', categoryRouter);
app.use('/request', requestRouter);
app.use('/dashboard', dashboardRouter);
app.use('/network', networkRouter);
app.use('/notifications',notification);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
