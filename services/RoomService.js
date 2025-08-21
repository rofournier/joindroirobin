const { Room, User, UserRoom, Message } = require('../models');

class RoomService {
  /**
   * Récupérer toutes les salles avec le nombre d'utilisateurs
   */
  async getAllRooms() {
    try {
      // Récupérer d'abord toutes les salles
      const rooms = await Room.findAll({
        where: { is_active: true },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username']
          }
        ],
        attributes: [
          'id',
          'name',
          'description',
          'is_protected',
          'category',
          'max_users',
          'created_at'
        ]
      });

      // Pour chaque salle, compter les utilisateurs actifs
      const roomsWithUserCount = await Promise.all(
        rooms.map(async (room) => {
          const userCount = await UserRoom.count({
            where: {
              room_id: room.id,
              is_active: true
            }
          });

          return {
            id: room.id,
            name: room.name,
            description: room.description,
            userCount: userCount,
            isProtected: room.is_protected,
            category: room.category,
            maxUsers: room.max_users,
            createdAt: room.created_at,
            creator: room.creator ? {
              id: room.creator.id,
              username: room.creator.username
            } : null
          };
        })
      );

      return roomsWithUserCount;
    } catch (error) {
      console.error('Erreur lors de la récupération des salles:', error);
      throw new Error('Impossible de récupérer les salles');
    }
  }

  /**
   * Récupérer une salle par son ID avec ses utilisateurs
   */
  async getRoomById(roomId) {
    try {
      const room = await Room.findByPk(roomId, {
        include: [
          {
            model: User,
            as: 'users',
            through: {
              attributes: ['joined_at', 'role', 'last_read_at'],
              where: { is_active: true }
            },
            attributes: ['id', 'username', 'is_online', 'avatar_url']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username']
          }
        ]
      });

      if (!room) {
        throw new Error('Salle non trouvée');
      }

      return room;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la salle ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle salle
   */
  async createRoom(roomData, creatorId) {
    try {
      const room = await Room.create({
        ...roomData,
        created_by: creatorId
      });

      // Ajouter le créateur à la salle
      await UserRoom.create({
        user_id: creatorId,
        room_id: room.id,
        role: 'admin'
      });

      return room;
    } catch (error) {
      console.error('Erreur lors de la création de la salle:', error);
      throw new Error('Impossible de créer la salle');
    }
  }

  /**
   * Vérifier si un utilisateur peut accéder à une salle
   */
  async canUserAccessRoom(userId, roomId, password = null) {
    try {
      const room = await Room.findByPk(roomId);
      if (!room) {
        return { canAccess: false, reason: 'Salle non trouvée' };
      }

      // Si la salle n'est pas protégée, accès libre
      if (!room.is_protected) {
        return { canAccess: true, room };
      }

      // Si la salle est protégée mais pas de mot de passe fourni
      if (!password) {
        return { canAccess: false, reason: 'Mot de passe requis' };
      }

      // TODO: Implémenter la vérification du mot de passe
      // Pour l'instant, on accepte tous les mots de passe
      return { canAccess: true, room };
    } catch (error) {
      console.error('Erreur lors de la vérification d\'accès:', error);
      return { canAccess: false, reason: 'Erreur de vérification' };
    }
  }

  /**
   * Ajouter un utilisateur à une salle
   */
  async addUserToRoom(userId, roomId, role = 'member') {
    try {
      const [userRoom, created] = await UserRoom.findOrCreate({
        where: { user_id: userId, room_id: roomId },
        defaults: {
          role,
          joined_at: new Date()
        }
      });

      if (!created) {
        // L'utilisateur était déjà dans la salle, le réactiver
        userRoom.is_active = true;
        userRoom.left_at = null;
        userRoom.joined_at = new Date();
        await userRoom.save();
      }

      return userRoom;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur à la salle:', error);
      throw new Error('Impossible d\'ajouter l\'utilisateur à la salle');
    }
  }

  /**
   * Retirer un utilisateur d'une salle
   */
  async removeUserFromRoom(userId, roomId) {
    try {
      const userRoom = await UserRoom.findOne({
        where: { user_id: userId, room_id: roomId }
      });

      if (userRoom) {
        userRoom.leaveRoom();
        await userRoom.save();
      }

      return true;
    } catch (error) {
      console.error('Erreur lors du retrait de l\'utilisateur de la salle:', error);
      throw new Error('Impossible de retirer l\'utilisateur de la salle');
    }
  }

  /**
   * Récupérer les messages d'une salle
   */
  async getRoomMessages(roomId, limit = 50, offset = 0) {
    try {
      const messages = await Message.findAll({
        where: { 
          room_id: roomId,
          is_deleted: false
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar_url']
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return messages.reverse(); // Remettre dans l'ordre chronologique
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw new Error('Impossible de récupérer les messages');
    }
  }
}

module.exports = new RoomService();
