'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rooms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Hash du mot de passe pour les salles protégées'
      },
      is_protected: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Si true, la salle nécessite un mot de passe'
      },
      max_users: {
        type: Sequelize.INTEGER,
        defaultValue: 50
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'general'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('rooms', ['name'], {
      name: 'rooms_name_idx'
    });

    await queryInterface.addIndex('rooms', ['is_protected'], {
      name: 'rooms_is_protected_idx'
    });

    await queryInterface.addIndex('rooms', ['category'], {
      name: 'rooms_category_idx'
    });

    await queryInterface.addIndex('rooms', ['is_active'], {
      name: 'rooms_is_active_idx'
    });

    await queryInterface.addIndex('rooms', ['created_by'], {
      name: 'rooms_created_by_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rooms');
  }
};
