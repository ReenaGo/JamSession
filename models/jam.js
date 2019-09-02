'use strict';
module.exports = (sequelize, DataTypes) => {
  const jam = sequelize.define('jam', {
    jamName: DataTypes.STRING,
    jamDescription: DataTypes.STRING,
    jamURL: DataTypes.STRING,
    date: DataTypes.DATE,
    time: DataTypes.TIME
  }, {});
  jam.associate = function(models) {
    // associations can be defined here
  };
  return jam;
};