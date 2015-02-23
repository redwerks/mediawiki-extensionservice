"use strict";
require('./lib/check-env');
var env = process.env.NODE_ENV || 'development';

exports[env] = {
	database: process.env.DATABASE_NAME,
	username: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASS,
	host: process.env.DATABASE_HOST,
	dialect: process.env.DATABASE_TYPE,
	storage: process.env.DATABASE_STORAGE
};
