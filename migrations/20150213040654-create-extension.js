"use strict";
module.exports = {
	up: function(migration, DataTypes, done) {
		migration.createTable("Extensions", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER
			},
			extid: {
				type: DataTypes.STRING,
				unique: true,
				allowNull: false
			},
			composerName: {
				type: DataTypes.STRING,
				allowNull: false
			},
			data: {
				type: DataTypes.BLOB,
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
		migration.dropTable("Extensions").done(done);
	}
};