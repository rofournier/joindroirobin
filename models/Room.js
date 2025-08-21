const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Room = sequelize.define('Room', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true, // null = salle publique
      comment: 'Hash du mot de passe pour les salles protégées'
    },
    is_protected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si true, la salle nécessite un mot de passe'
    },
    max_users: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      validate: {
        min: 1,
        max: 1000
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'general'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'rooms',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['is_protected']
      },
      {
        fields: ['category']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  Room.associate = (models) => {
    // Une salle peut avoir plusieurs utilisateurs
    Room.belongsToMany(models.User, {
      through: 'UserRoom',
      as: 'users',
      foreignKey: 'room_id',
      otherKey: 'user_id'
    });

    // Une salle peut avoir plusieurs messages
    Room.hasMany(models.Message, {
      foreignKey: 'room_id',
      as: 'messages'
    });

    // Une salle est créée par un utilisateur
    Room.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  };

  // Méthodes d'instance
  Room.prototype.isPublic = function() {
    return !this.is_protected;
  };

  Room.prototype.isPrivate = function() {
    return this.is_protected;
  };

  Room.prototype.getUserCount = async function() {
    const count = await this.countUsers();
    return count;
  };

  return Room;
};
