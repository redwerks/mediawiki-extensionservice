"use strict";
module.exports = {
	up: function(migration, Sequelize) {
		return migration
			.changeColumn('Extensions', 'data', {
				type: Sequelize.TEXT,
				allowNull: false
			});
	},
	down: function(migration, Sequelize) {
		return migration
			.changeColumn('Extensions', 'data', {
				type: Sequelize.BLOB,
				allowNull: false
			});
	}
};
