'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {


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
          created_by: null,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Cousins',
          description: 'Salle des cousins',
          password_hash: await bcrypt.hash('xK9mP2qR', 10),
          is_protected: true,
          category: 'family',
          max_users: 30,
          is_active: true,
          created_by: null,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Lardo',
          description: 'Salle Lardo',
          password_hash: await bcrypt.hash('vN7hL4tY', 10),
          is_protected: true,
          category: 'private',
          max_users: 20,
          is_active: true,
          created_by: null,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Les Gogols',
          description: 'Salle des gogols',
          password_hash: await bcrypt.hash('wQ8jM5uZ', 10),
          is_protected: true,
          category: 'fun',
          max_users: 40,
          is_active: true,
          created_by: null,
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
          created_by: null,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Les pingouins',
          description: 'Banquise',
          password_hash: await bcrypt.hash('aB3cGT5', 10),
          is_protected: true,
          category: 'fun',
          max_users: 25,
          is_active: true,
          created_by: null,
          created_at: new Date(),
          updated_at: new Date()
        },
      ], { returning: ['id'] });

      console.log('✅ Salles créées:', rooms.length);

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
