"use strict";
module.exports = {
	up: function(migration, Sequelize) {
		return migration
			.changeColumn('Extensions', 'composerName', {
				type: Sequelize.STRING,
				allowNull: true
			});
	},
	down: function(migration, Sequelize) {
		return migration
			.changeColumn('Extensions', 'composerName', {
				type: Sequelize.STRING,
				allowNull: false
			});
	}
};
