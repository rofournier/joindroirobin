const { Room, User, UserRoom } = require('../models');

class AuthService {
  /**
   * Vérifier si un utilisateur peut accéder à une salle
   */
  async canUserAccessRoom(username, roomId, password = null) {
    try {
      // Récupérer la salle
      const room = await Room.findByPk(roomId);
      if (!room) {
        return { canAccess: false, reason: 'Salle non trouvée' };
      }

      // Si la salle n'est pas protégée, accès libre
      if (!room.is_protected) {
        return { canAccess: true, room, reason: 'Salle publique' };
      }

      // Si la salle est protégée mais pas de mot de passe fourni
      if (!password) {
        return { canAccess: false, reason: 'Mot de passe requis pour cette salle' };
      }

      // Vérifier le mot de passe
      if (room.password_hash) {
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(password, room.password_hash);
        
        if (!isValid) {
          return { canAccess: false, reason: 'Mot de passe incorrect' };
        }
      } else {
        // Si pas de hash défini, utiliser les mots de passe par défaut
        const defaultPasswords = {
          2: 'xK9mP2qR',     // Cousins
          3: 'vN7hL4tY',     // Lardo
          4: 'wQ8jM5uZ',     // Les Gogols
          5: 'aB3cD6eF'      // Keur
        };
        
        if (defaultPasswords[room.id] !== password) {
          return { canAccess: false, reason: 'Mot de passe incorrect' };
        }
      }

      return { canAccess: true, room, reason: 'Mot de passe correct' };
    } catch (error) {
      console.error('Erreur lors de la vérification d\'accès:', error);
      return { canAccess: false, reason: 'Erreur de vérification' };
    }
  }

  /**
   * Ajouter un utilisateur à une salle
   */
  async addUserToRoom(username, roomId, role = 'member') {
    try {
      // Récupérer ou créer l'utilisateur
      let user = await User.findOne({ where: { username } });
      if (!user) {
        user = await User.create({
          username,
          is_online: true,
          last_seen: new Date()
        });
      } else {
        // Mettre à jour le statut en ligne
        user.is_online = true;
        user.last_seen = new Date();
        await user.save();
      }

      // Vérifier si l'utilisateur est déjà dans la salle
      const existingUserRoom = await UserRoom.findOne({
        where: { user_id: user.id, room_id: roomId }
      });

      if (existingUserRoom) {
        // Réactiver l'utilisateur dans la salle
        existingUserRoom.is_active = true;
        existingUserRoom.left_at = null;
        existingUserRoom.joined_at = new Date();
        await existingUserRoom.save();
      } else {
        // Ajouter l'utilisateur à la salle
        await UserRoom.create({
          user_id: user.id,
          room_id: roomId,
          role,
          joined_at: new Date()
        });
      }

      return { success: true, user, roomId };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur à la salle:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retirer un utilisateur d'une salle
   */
  async removeUserFromRoom(username, roomId) {
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      const userRoom = await UserRoom.findOne({
        where: { user_id: user.id, room_id: roomId }
      });

      if (userRoom) {
        userRoom.is_active = false;
        userRoom.left_at = new Date();
        await userRoom.save();
      }

      // Mettre à jour le statut en ligne si l'utilisateur n'est dans aucune salle
      const activeRooms = await UserRoom.count({
        where: { user_id: user.id, is_active: true }
      });

      if (activeRooms === 0) {
        user.is_online = false;
        await user.save();
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors du retrait de l\'utilisateur de la salle:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifier si un utilisateur est dans une salle
   */
  async isUserInRoom(username, roomId) {
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) return false;

      const userRoom = await UserRoom.findOne({
        where: { user_id: user.id, room_id: roomId, is_active: true }
      });

      return !!userRoom;
    } catch (error) {
      console.error('Erreur lors de la vérification de présence:', error);
      return false;
    }
  }
}

module.exports = new AuthService();
