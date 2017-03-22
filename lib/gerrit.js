"use strict";
var superagent = require('./superagent'),
	url = require('url'),
	path = require('path'),
	_ = require('lodash');

exports.get = function(p) {
	var u = url.parse('https://gerrit.wikimedia.org/r/');
	delete u.path;
	u.pathname = path.join(u.pathname, p);
	return superagent.get(url.format(u))
		.accept('json')
		.parse(function(res, fn) {
			// Modified version of superagent/lib/node/parsers/json.js
			// Gerit prefixes JSON with )]}'
			res.text = '';
			res.setEncoding('utf8');
			res.on('data', function(chunk) { res.text += chunk; });
			res.on('end', function() {
				var text, body, err;
				try {
					text = res.text && res.text
						.replace(/^\s*|\s*$/g, '')
						.replace(/^\)\]\}'\n?/, '');
					body = text && JSON.parse(text);
				} catch (e) {
					err = e;
				} finally {
					fn(err, body);
				}
			});
		});
};

exports.getExtensions = function() {
	return exports.get('/projects/')
		.promise()
		.then(function(res) {
			return _(res.body)
				.filter(function(ext, name) {
					ext.path = name;
					return ext;
				})
				.filter(function(ext) {
					return /^mediawiki\/extensions\/[-_0-9A-Za-z]+$/.test(ext.path);
				})
				.map(function(ext) {
					ext.name = ext.path.replace(/^mediawiki\/extensions\//, '');
					return ext;
				})
				.value();
		});
};
