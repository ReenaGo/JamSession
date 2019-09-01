'use strict';
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    Image: DataTypes.STRING,
    Bio: DataTypes.STRING
  }, {});
  user.associate = function(models) {
   // user.hasMany(models.communities)
   user.belongsToMany(models.communities, {through: 'membership'});
    // associations can be defined here
  };
  return user;
};