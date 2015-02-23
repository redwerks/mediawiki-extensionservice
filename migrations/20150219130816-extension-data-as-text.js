"use strict";
module.exports = {
	up: function(migration, DataTypes, done) {
		migration
			.changeColumn('Extensions', 'data', {
				type: DataTypes.TEXT,
				allowNull: false
			})
			.done(done);
	},
	down: function(migration, DataTypes, done) {
		migration
			.changeColumn('Extensions', 'data', {
				type: DataTypes.BLOB,
				allowNull: false
			})
			.done(done);
	}
};
