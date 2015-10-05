"use strict";
var path = require('path'),
	express = require('express'),
	consolidate = require('consolidate'),
	logger = require('morgan'),
	helmet = require('helmet'),
	responseTime = require('response-time'),
	compression = require('compression'),
	legacyExpires = require('express-legacy-expires'),
	cacheResponseDirective = require('express-cache-response-directive'),
	bodyParser = require('body-parser'),
	errorhandler = require('errorhandler'),
	app = express();

module.exports = app;

app.set('port', parseInt(process.env.TOOL_WEB_PORT || process.env.PORT || '3000', 10));

app.engine('jade', consolidate.jade);
app.engine('ractive', consolidate.ractive);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware
app.use(logger('dev'));
app.use(responseTime({digits: 5}));
app.use(compression());
app.use(legacyExpires());
app.use(cacheResponseDirective());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(helmet.frameguard('sameorigin'));
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(function(req, res, next) {
	// This IE feature is ususally more trouble than help for well made websites
	res.setHeader('X-XSS-Protection', '0');
	next();
});
app.use(function(req, res, next) {
	// For debugging declare the environment we're using
	res.setHeader('X-Node-Environment', app.get('env'));
	next();
});

var root = express.Router();
app.locals.webroot = (process.env.WEB_PATH || '/').replace(/\/$/, '');

// Serve static files in public/
root.use(express.static(path.join(__dirname, 'public')));

// Serve the contents of the node_modules we depend on
root.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

// Routes
root.use('/', require('../routes'));

// Add root
app.use(process.env.WEB_PATH || '/', root);

// 404s
app.use(function(req, res) {
	var accepts = req.accepts('json', 'html');
	res.status(404);
	res.vary('accept');
	if ( accepts === 'html' ) {
		res.type('html');
		res.send("Page not found");
	} else {
		res.json({
			error: {
				message: "Page not found"
			}
		});
	}
});

// Error handler
app.use(errorhandler());
