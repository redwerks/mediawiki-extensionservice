"use strict";
module.exports = {
	up: function(migration, Sequelize) {
		return migration.createTable(
			"ExtensionScanJobs",
			{
				id: {
					allowNull: false,
					autoIncrement: true,
					primaryKey: true,
					type: Sequelize.INTEGER
				},
				startedAt: {
					type: Sequelize.DATE,
					allowNull: false
				},
				endedAt: {
					type: Sequelize.DATE,
					allowNull: true
				},
				extensions: {
					type: Sequelize.INTEGER,
					allowNull: true
				},
				failures: {
					type: Sequelize.INTEGER,
					allowNull: true
				},
				createdAt: {
					allowNull: false,
					type: Sequelize.DATE
				},
				updatedAt: {
					allowNull: false,
					type: Sequelize.DATE
				}
			});
	},
	down: function(migration) {
		return migration.dropTable("ExtensionScanJobs");
	}
};
