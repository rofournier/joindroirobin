const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000] // Limite de 2000 caractères
      }
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'system'),
      defaultValue: 'text'
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL du fichier si message_type est image ou file'
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Taille du fichier en bytes'
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    edited_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    reply_to_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      },
      comment: 'ID du message auquel on répond'
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['room_id', 'created_at']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['message_type']
      },
      {
        fields: ['is_deleted']
      }
    ]
  });

  Message.associate = (models) => {
    // Un message appartient à un utilisateur
    Message.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Un message appartient à une salle
    Message.belongsTo(models.Room, {
      foreignKey: 'room_id',
      as: 'room'
    });

    // Un message peut répondre à un autre message
    Message.belongsTo(models.Message, {
      foreignKey: 'reply_to_id',
      as: 'replyTo'
    });

    // Un message peut avoir plusieurs réponses
    Message.hasMany(models.Message, {
      foreignKey: 'reply_to_id',
      as: 'replies'
    });
  };

  // Méthodes d'instance
  Message.prototype.isText = function() {
    return this.message_type === 'text';
  };

  Message.prototype.isImage = function() {
    return this.message_type === 'image';
  };

  Message.prototype.isFile = function() {
    return this.message_type === 'file';
  };

  Message.prototype.isSystem = function() {
    return this.message_type === 'system';
  };

  Message.prototype.markAsEdited = function() {
    this.is_edited = true;
    this.edited_at = new Date();
  };

  Message.prototype.markAsDeleted = function() {
    this.is_deleted = true;
    this.deleted_at = new Date();
  };

  return Message;
};
