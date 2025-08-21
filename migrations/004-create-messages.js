'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      message_type: {
        type: Sequelize.ENUM('text', 'image', 'file', 'system'),
        defaultValue: 'text'
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL du fichier si message_type est image ou file'
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Taille du fichier en bytes'
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reply_to_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID du message auquel on répond'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Index pour améliorer les performances
    await queryInterface.addIndex('messages', ['room_id', 'created_at'], {
      name: 'messages_room_created_idx'
    });

    await queryInterface.addIndex('messages', ['user_id'], {
      name: 'messages_user_idx'
    });

    await queryInterface.addIndex('messages', ['message_type'], {
      name: 'messages_type_idx'
    });

    await queryInterface.addIndex('messages', ['is_deleted'], {
      name: 'messages_deleted_idx'
    });

    await queryInterface.addIndex('messages', ['reply_to_id'], {
      name: 'messages_reply_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('messages');
  }
};
