"use strict";
module.exports = {
	up: function(migration, Sequelize) {
		return migration.createTable(
			"ExtensionFailures",
			{
				id: {
					allowNull: false,
					autoIncrement: true,
					primaryKey: true,
					type: Sequelize.INTEGER
				},
				ScanId: {
					type: Sequelize.INTEGER,
					references: 'ExtensionScanJobs',
					referencesKey: 'id',
					onDelete: 'CASCADE',
					onUpdate: 'CASCADE'
				},
				extid: {
					type: Sequelize.STRING,
					allowNull: false
				},
				error: {
					type: Sequelize.TEXT,
					allowNull: false
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
		return migration.dropTable("ExtensionFailures");
	}
};
