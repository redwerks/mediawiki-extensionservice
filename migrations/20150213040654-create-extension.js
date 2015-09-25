"use strict";
module.exports = {
	up: function(migration, Sequelize) {
		return migration.createTable(
			"Extensions",
			{
				id: {
					allowNull: false,
					autoIncrement: true,
					primaryKey: true,
					type: Sequelize.INTEGER
				},
				extid: {
					type: Sequelize.STRING,
					unique: true,
					allowNull: false
				},
				composerName: {
					type: Sequelize.STRING,
					allowNull: false
				},
				data: {
					type: Sequelize.BLOB,
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
		return migration.dropTable("Extensions");
	}
};