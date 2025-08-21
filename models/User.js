const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true // Pour l'instant, on n'a pas d'authentification
    },
    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_seen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'banned'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['username']
      },
      {
        fields: ['is_online']
      },
      {
        fields: ['status']
      }
    ]
  });

  User.associate = (models) => {
    // Un utilisateur peut être dans plusieurs salles
    User.belongsToMany(models.Room, {
      through: 'UserRoom',
      as: 'rooms',
      foreignKey: 'user_id',
      otherKey: 'room_id'
    });

    // Un utilisateur peut envoyer plusieurs messages
    User.hasMany(models.Message, {
      foreignKey: 'user_id',
      as: 'messages'
    });
  };

  return User;
};
