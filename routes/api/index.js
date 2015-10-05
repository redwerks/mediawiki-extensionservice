"use strict";
var _ = require('lodash'),
	path = require('path'),
	URL = require('url'),
	tamper = require('tamper'),
	highlight = require('highlight.js'),
	jade = require('jade'),
	router = require('express-promise-router')();

module.exports = router;

// Allow .json and .html to be appended to API paths to override the Accepts
router.use(function(req, res, next) {
	var url = URL.parse(req.url);
	delete url.path;
	if ( url.pathname.match(/\.json$/) ) {
		req.headers.accept = 'application/json';
		url.pathname = url.pathname.replace(/\.json$/, '');
	} else if ( url.parse(req.url).pathname.match(/\.html$/) ) {
		req.headers.accept = 'text/html';
		url.pathname = url.pathname.replace(/\.html$/, '');
	}
	req.url = URL.format(url);
	next();
});

// Intercept API responses and depending on Accept: output a page with syntax highlighted json in html.
router.use(tamper(function(req, res) {
	if ( !/^application\/json(;|$)/i.test(res.getHeader('Content-Type')) ) {
		return;
	}

	var accept = req.accepts('html', 'json');
	res.vary('accept');
	if ( accept === 'html' ) {
		res.setHeader('Content-Type', 'text/html; charset=UTF-8');

		return function(body) {
			try {
				body = JSON.parse(body);
			} catch ( e ) {
				console.error('api intercept: JSON.parse failed to parse an application/json body');
				console.error(e.stack || e);
				return body;
			}

			return jade.renderFile(path.join(__dirname, '../../views/json-preview.jade'),
				_.merge(
					{},
					req.app.locals,
					res.locals,
					{
						title: req.method + ' ' + req.url,
						result: highlight.highlight('json', JSON.stringify(body, null, 2), true).value
					}));
		};
	}
}));

// Include the API methods
router.use('/', require('./extension'));
