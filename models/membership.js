'use strict';
module.exports = (sequelize, DataTypes) => {
  const membership = sequelize.define('membership', {
    community_Id: DataTypes.INTEGER,
    user_Id: DataTypes.INTEGER
  }, {});
  membership.associate = function(models) {
    membership.belongsTo(models.communities);
    membership.belongsTo(models.user);
    // associations can be defined here
  };
  return membership;
};