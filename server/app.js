const express = require('express');
const bodyParser = require('body-parser');

const routes = require('./routes/index');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.use('/', routes);

module.exports = app;
