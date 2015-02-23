"use strict";
var dotenv = require('dotenv'),
	_ = require('lodash'),
	fmt = require('util').format,
	chalk = require('chalk');
// Load settings from a .env file
dotenv.load();

// Make sure all the configuration we need is set
var ok = true,
	config = {
		GIT_BIN: {
			description: "The path to the git binary.",
			required: false
		},
		STORAGE_DIR: {
			description: "Storage location for cloned extension repositories"
		},
		DATABASE_TYPE: {
			description: "Sequelize database type/dialect",
			values: ['mysql', 'mariadb', 'sqlite', 'postgres', 'mssql']
		},
		DATABASE_NAME: {
			description: "Sequelize database name"
		},
		DATABASE_HOST: {
			description: "Sequelize database host",
			required: false
		},
		DATABASE_USER: {
			description: "Sequelize database user"
		},
		DATABASE_PASS: {
			description: "Sequelize database password"
		},
		DATABASE_PORT: {
			description: "Sequelize database port",
			required: false
		},
		DATABASE_STORAGE: {
			description: "Sequelize database storage path for sqlite"
		}
	};

for ( var key in config ) {
	var c = config[key];

	if ( /^DATABASE_(NAME|HOST|USER|PASS|PORT)$/.test(key) && process.env.DATABASE_TYPE === 'sqlite' ) {
		continue;
	}

	if ( key === 'DATABASE_STORAGE' && process.env.DATABASE_TYPE !== 'sqlite' ) {
		continue;
	}

	if ( !process.env[key] && c.required !== false ) {
		console.error(chalk.red(fmt('%s not set:', key)));
		console.error(chalk.yellow(c.description));
		console.error('');
		ok = false;
	} else if ( c.values && !_.contains(c.values, process.env[key]) ) {
		console.error(chalk.red(fmt('%s is not within the accepted values for %s', process.env[key], key)));
		console.error('');
		ok = false;
	}
}

if ( !ok ) {
	console.error(chalk.red('Required environment variables not set, have you configured a .env file?'));
	process.exit(1);
}
