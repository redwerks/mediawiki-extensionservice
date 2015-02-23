"use strict";
module.exports = {
	up: function(migration, DataTypes, done) {
		migration.createTable("ExtensionFailures", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER
			},
			ScanId: {
				type: DataTypes.INTEGER,
				references: 'ExtensionScanJobs',
				referencesKey: 'id',
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE'
			},
			extid: {
				type: DataTypes.STRING,
				allowNull: false
			},
			error: {
				type: DataTypes.TEXT,
				allowNull: false
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
		migration.dropTable("ExtensionFailures").done(done);
	}
};
