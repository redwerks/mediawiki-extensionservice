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
			allowNull: false,
			defaultValue: function() { return {}; },
			get: function() {
				var val = this.getDataValue('data');
				if ( val ) {
					return JSON.parse(val);
				}
			},
			set: function(val) {
				this.setDataValue('data', val && JSON.stringify(val));
			}
		}
	}, {
		classMethods: {
			associate: function(models) {
				// associations can be defined here
			},

			findByExtid: function(extid, options, queryOptions) {
				options = options || {};
				options.where = options.where || {};
				options.where.extid = extid;

				return this.find(options, queryOptions);
			}
		}
	});
	return Extension;
};
