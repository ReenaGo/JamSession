'use strict';
module.exports = (sequelize, DataTypes) => {
  const communities = sequelize.define('communities', {
    comName: DataTypes.STRING
  }, {});
  communities.associate = function(models) {
    // communities.hasMany(models.user);
    communities.belongsToMany(models.user, {through: 'membership'});
    // associations can be defined here
  };
  return communities;
};