var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var GPIO = require("onoff").Gpio;
var express = require('express');
var app = express();
var server = require('http').Server(app);

require('console-stamp')(console, '[HH:MM:ss]');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);

app.use(logger('dev'));
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var STATES = {
  'home': '0',
  'away': '1',
  'night': '2',
  'off': '3',
};

app.get('/', function(req, res) {
  res.render('index.html');
});

app.get('/api/check', function(req, res) {
  // corresponds to "night" mode in Homebridge
  var state = 'night';
  res.setHeader('Content-Type', 'text/plain');
  res.end(STATES[state]);
  console.log('returning state: ' + state + '(' + STATES[state] + ')');
});

app.get('/api/click_off', function(req, res) {
  var state = 'off';
  res.setHeader('Content-Type', 'text/plain');
  res.end(STATES[state]);
  outputSequence(3, 5, '10', 1000);
  console.log('returning state: ' + state + '(' + STATES[state] + ')');
});

app.get('/api/click_away', function(req, res) {
  var state = 'away';
  res.setHeader('Content-Type', 'text/plain');
  res.end(STATES[state]);
  outputSequence(4, 7, '10', 1000);
  console.log('returning state: ' + state + '(' + STATES[state] + ')');
});

app.get('/api/click_home', function(req, res) {
  // home mode requires simultaneous push of both off+away buttons on remote
  var state = 'home';
  res.setHeader('Content-Type', 'text/plain');
  res.end(STATES[state]);
  outputSequence(3, 5, '10', 1000);
  outputSequence(4, 7, '10', 1000);
  console.log('returning state: ' + state + '(' + STATES[state] + ')');
});

function outputSequence(gpio_pin, pin, seq, timeout) {
  var gpio = new GPIO(gpio_pin, 'out');
  gpioWrite(gpio, pin, seq, timeout);
}

function gpioWrite(gpio, pin, seq, timeout) {
  if (!seq || seq.length <= 0) { 
    console.log('closing pin:', pin);
    gpio.unexport();
    return;
  }

  var value = seq.substr(0, 1);
  seq = seq.substr(1);
  setTimeout(function() {
    console.log('gpioWrite, value:', value, ' seq:', seq);
    gpio.writeSync(value);
    gpioWrite(gpio, pin, seq, timeout);
  }, timeout);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

var port = process.env.PORT || 8000;
server.listen(port, function() {
  console.log('AlarmPi listening on port:', port);
});
