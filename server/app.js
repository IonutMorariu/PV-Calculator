const express = require('express');
const bodyParser = require('body-parser');

const routes = require('./routes/index');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.all('/', function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With');
	next();
});

app.use('/', routes);

module.exports = app;
