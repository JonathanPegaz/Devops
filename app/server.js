const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');

const app = express();

const bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


// public assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use('/coverage', express.static(path.join(__dirname, '..', 'coverage')));

// ejs for view templates
app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// load route
require('./consumer');
require('./route')(app);

// server
const port = process.env.PORT || 3000;
app.server = app.listen(port);
console.log(`listening on port ${port}`);

module.exports = app;
