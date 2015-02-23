'use strict';

var fs = require('graceful-fs'),
	path = require('path'),
	Sequelize = require('sequelize'),
	basename = path.basename(module.filename),
	sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASS, {
		host: process.env.DATABASE_HOST,
		dialect: process.env.DATABASE_TYPE,
		storage: process.env.DATABASE_STORAGE
	}),
	db = {};

fs
	.readdirSync(__dirname)
	.filter(function(file) {
		return (file.indexOf('.') !== 0) && (file !== basename);
	})
	.forEach(function(file) {
		var model = sequelize['import'](path.join(__dirname, file));
		db[model.name] = model;
	});

Object.keys(db).forEach(function(modelName) {
	if ('associate' in db[modelName]) {
		db[modelName].associate(db);
	}
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
