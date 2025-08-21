'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_rooms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Quand l\'utilisateur a quitté la salle'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Si false, l\'utilisateur a quitté la salle'
      },
      role: {
        type: Sequelize.ENUM('member', 'moderator', 'admin'),
        defaultValue: 'member'
      },
      last_read_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Dernière fois que l\'utilisateur a lu les messages'
      },
      notification_preferences: {
        type: Sequelize.JSONB,
        defaultValue: {
          sound: true,
          desktop: true,
          mentions: true
        }
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
    await queryInterface.addIndex('user_rooms', ['user_id', 'room_id'], {
      unique: true,
      name: 'user_rooms_user_room_unique'
    });

    await queryInterface.addIndex('user_rooms', ['room_id', 'is_active'], {
      name: 'user_rooms_room_active_idx'
    });

    await queryInterface.addIndex('user_rooms', ['user_id', 'is_active'], {
      name: 'user_rooms_user_active_idx'
    });

    await queryInterface.addIndex('user_rooms', ['role'], {
      name: 'user_rooms_role_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_rooms');
  }
};
