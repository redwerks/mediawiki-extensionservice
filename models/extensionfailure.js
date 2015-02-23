"use strict";
module.exports = function(sequelize, DataTypes) {
	var ExtensionFailure = sequelize.define("ExtensionFailure", {
		extid: {
			type: DataTypes.STRING,
			allowNull: false
		},
		error: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	}, {
		classMethods: {
			associate: function(models) {
				ExtensionFailure.belongsTo(models.ExtensionScanJob, {
					as: 'scanJob',
					foreignKey: 'ScanId',
					foreignKeyConstraint: true,
					through: null,
					onDelete: 'CASCADE'
				});
			}
		}
	});
	return ExtensionFailure;
};
