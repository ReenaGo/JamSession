'use strict';
module.exports = (sequelize, DataTypes) => {
  const jam = sequelize.define('jam', {
    jamName: DataTypes.STRING,
    jamDescription: DataTypes.STRING,
    jamURL: DataTypes.STRING
  }, {});
  jam.associate = function(models) {
    // associations can be defined here
  };
  return jam;
};