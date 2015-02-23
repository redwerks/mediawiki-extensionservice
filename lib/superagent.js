"use strict";
var _ = require('lodash'),
	pkg = require('../package.json'),
	request = require('superagent');
require('superagent-bluebird-promise');

_.each(['get', 'post'], function(method) {
	exports[method] = function(url) {
		return request[method](url)
			.set('User-Agent', 'MediaWiki-ExtensionService/' + pkg.version);
	};
});
