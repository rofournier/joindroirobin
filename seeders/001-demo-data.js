'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Créer des utilisateurs de démonstration
      const users = await queryInterface.bulkInsert('users', [
        {
          username: 'Admin',
          email: 'admin@admin.com',
          is_online: true,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { returning: ['id'] });

      console.log('✅ Utilisateurs créés:', users.length);

      // Créer les nouvelles salles avec mots de passe aléatoires
      const rooms = await queryInterface.bulkInsert('rooms', [
        {
          name: 'Général',
          description: 'Discussion générale et accueil - Accès libre',
          password_hash: null, // Pas de mot de passe pour l'accès libre
          is_protected: false,
          category: 'general',
          max_users: 50,
          is_active: true,
          created_by: users[0].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Cousins',
          description: 'Salle des cousins - Discussions familiales',
          password_hash: await bcrypt.hash('xK9mP2qR', 10),
          is_protected: true,
          category: 'family',
          max_users: 30,
          is_active: true,
          created_by: users[0].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Lardo',
          description: 'Salle Lardo - Discussions privées',
          password_hash: await bcrypt.hash('vN7hL4tY', 10),
          is_protected: true,
          category: 'private',
          max_users: 20,
          is_active: true,
          created_by: users[0].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Les Gogols',
          description: 'Salle des gogols - Humour et détente',
          password_hash: await bcrypt.hash('wQ8jM5uZ', 10),
          is_protected: true,
          category: 'fun',
          max_users: 40,
          is_active: true,
          created_by: users[0].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Keur',
          description: 'Salle Keur - Discussions spéciales',
          password_hash: await bcrypt.hash('aB3cD6eF', 10),
          is_protected: true,
          category: 'special',
          max_users: 25,
          is_active: true,
          created_by: users[0].id,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { returning: ['id'] });

      console.log('✅ Salles créées:', rooms.length);

      // Créer les associations utilisateur-salle
      const userRooms = await queryInterface.bulkInsert('user_rooms', [
        {
          user_id: users[0].id,
          room_id: rooms[0].id, // Général
          role: 'admin',
          joined_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          user_id: users[0].id,
          room_id: rooms[1].id, // Cousins
          role: 'admin',
          joined_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          user_id: users[0].id,
          room_id: rooms[2].id, // Lardo
          role: 'admin',
          joined_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          user_id: users[0].id,
          room_id: rooms[3].id, // Les Gogols
          role: 'admin',
          joined_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          user_id: users[0].id,
          room_id: rooms[4].id, // Keur
          role: 'admin',
          joined_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);

      console.log('✅ Associations utilisateur-salle créées:', userRooms.length);

      // Créer quelques messages de démonstration
      const messages = await queryInterface.bulkInsert('messages', [
        {
          content: 'Bienvenue dans la salle Général ! 👋',
          message_type: 'system',
          user_id: users[0].id,
          room_id: rooms[0].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          content: 'Salut tout le monde ! Ravi de vous rejoindre !',
          message_type: 'text',
          user_id: users[0].id,
          room_id: rooms[0].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          content: 'Bienvenue dans la salle Cousins ! 👨‍👩‍👧‍👦',
          message_type: 'system',
          user_id: users[0].id,
          room_id: rooms[1].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          content: 'Bienvenue dans la salle Lardo ! 🔒',
          message_type: 'system',
          user_id: users[0].id,
          room_id: rooms[2].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          content: 'Bienvenue dans la salle Les Gogols ! 😄',
          message_type: 'system',
          user_id: users[0].id,
          room_id: rooms[3].id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          content: 'Bienvenue dans la salle Keur ! ✨',
          message_type: 'system',
          user_id: users[0].id,
          room_id: rooms[4].id,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);

      console.log('✅ Messages créés:', messages.length);

      console.log('🎉 Base de données peuplée avec succès !');

    } catch (error) {
      console.error('❌ Erreur lors du seeding:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Supprimer les données dans l'ordre inverse
    await queryInterface.bulkDelete('messages', null, {});
    await queryInterface.bulkDelete('user_rooms', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
