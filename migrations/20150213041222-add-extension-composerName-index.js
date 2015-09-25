"use strict";
module.exports = {
	up: function(migration) {
		return migration.addIndex('Extensions', ['composerName']);
	},
	down: function(migration) {
		return migration.removeIndex('Extensions', ['composerName']);
	}
};
