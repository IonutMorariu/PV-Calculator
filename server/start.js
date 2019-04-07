const fs = require('fs');
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');

// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/solar-calc.ionut.cc/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/solar-calc.ionut.cc/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/solar-calc.ionut.cc/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

// Make sure we are running node 7.6+
const [major, minor] = process.versions.node.split('.').map(parseFloat);
if (major < 7 || (major === 7 && minor <= 5)) {
	console.log('Wrong version. Update your nodejs version');
	process.exit();
}

// import environmental variables from our variables.env file
require('dotenv').config({ path: 'variables.env' });

// Connect to our Database and handle any bad connections
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
	console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

require('./models/SolarData');
require('./models/StationsData');

// READY?! Let's go!
// Start our app!
const app = require('./app');

// Starting both http & https servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});
