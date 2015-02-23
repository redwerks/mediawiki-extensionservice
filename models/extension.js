"use strict";
module.exports = function(sequelize, DataTypes) {
	var Extension = sequelize.define("Extension", {
		extid: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false
		},
		composerName: {
			type: DataTypes.STRING,
			allowNull: true
		},
		data: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	}, {
		classMethods: {
			associate: function(models) {
				// associations can be defined here
			}
		}
	});
	return Extension;
};
