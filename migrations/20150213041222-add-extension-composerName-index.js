"use strict";
module.exports = {
	up: function(migration, DataTypes, done) {
		migration.addIndex('Extensions', ['composerName']).done(done);
	},
	down: function(migration, DataTypes, done) {
		migration.removeIndex('Extensions', ['composerName']).done(done);
	}
};
