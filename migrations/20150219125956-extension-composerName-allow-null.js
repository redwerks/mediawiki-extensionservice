"use strict";
module.exports = {
	up: function(migration, DataTypes, done) {
		migration
			.changeColumn('Extensions', 'composerName', {
				type: DataTypes.STRING,
				allowNull: true
			})
			.done(done);
	},
	down: function(migration, DataTypes, done) {
		migration
			.changeColumn('Extensions', 'composerName', {
				type: DataTypes.STRING,
				allowNull: false
			})
			.done(done);
	}
};
