"use strict";
module.exports = function(sequelize, DataTypes) {
	var ExtensionScanJob = sequelize.define("ExtensionScanJob", {
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
		}
	}, {
		classMethods: {
			associate: function(models) {
				ExtensionScanJob.hasMany(models.ExtensionFailure, {
					foreignKey: 'ScanId',
					foreignKeyConstraint: true
				});
			}
		}
	});
	return ExtensionScanJob;
};
