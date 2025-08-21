const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserRoom = sequelize.define('UserRoom', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rooms',
        key: 'id'
      }
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Quand l\'utilisateur a quitté la salle'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Si false, l\'utilisateur a quitté la salle'
    },
    role: {
      type: DataTypes.ENUM('member', 'moderator', 'admin'),
      defaultValue: 'member'
    },
    last_read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Dernière fois que l\'utilisateur a lu les messages'
    },
    notification_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        sound: true,
        desktop: true,
        mentions: true
      }
    }
  }, {
    tableName: 'user_rooms',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'room_id']
      },
      {
        fields: ['room_id', 'is_active']
      },
      {
        fields: ['user_id', 'is_active']
      },
      {
        fields: ['role']
      }
    ]
  });

  UserRoom.associate = (models) => {
    // Cette table est une table de liaison, pas besoin d'associations supplémentaires
    // Les associations sont gérées dans les modèles User et Room
  };

  // Méthodes d'instance
  UserRoom.prototype.isActive = function() {
    return this.is_active;
  };

  UserRoom.prototype.isModerator = function() {
    return this.role === 'moderator' || this.role === 'admin';
  };

  UserRoom.prototype.isAdmin = function() {
    return this.role === 'admin';
  };

  UserRoom.prototype.leaveRoom = function() {
    this.is_active = false;
    this.left_at = new Date();
  };

  UserRoom.prototype.rejoinRoom = function() {
    this.is_active = true;
    this.left_at = null;
    this.joined_at = new Date();
  };

  return UserRoom;
};
