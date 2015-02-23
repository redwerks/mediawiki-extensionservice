"use strict";
module.exports = {
	up: function(migration, DataTypes, done) {
		migration.createTable("ExtensionScanJobs", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER
			},
			startedAt: {
				type: DataTypes.DATE,
				allowNull: false
			},
			endedAt: {
				type: DataTypes.DATE,
				allowNull: true
			},
			extensions: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			failures: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			createdAt: {
				allowNull: false,
				type: DataTypes.DATE
			},
			updatedAt: {
				allowNull: false,
				type: DataTypes.DATE
			}
		}).done(done);
	},
	down: function(migration, DataTypes, done) {
		migration.dropTable("ExtensionScanJobs").done(done);
	}
};
