const { Message, User, Room } = require('../models');

class MessageService {
  /**
   * Envoyer un message dans une salle
   */
  async sendMessage(username, roomId, content, messageType = 'text', fileInfo = null) {
    try {
      // Vérifier que l'utilisateur est dans la salle
      const user = await User.findOne({ where: { username } });
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const room = await Room.findByPk(roomId);
      if (!room) {
        throw new Error('Salle non trouvée');
      }

      // Préparer les données du message
      const messageData = {
        content,
        message_type: messageType,
        user_id: user.id,
        room_id: roomId
      };

      // Ajouter les informations de fichier si c'est une image
      if (fileInfo && messageType === 'image') {
        messageData.file_url = fileInfo.url;
        messageData.file_name = fileInfo.filename;
        messageData.file_size = fileInfo.size;
      }

      // Créer le message
      const message = await Message.create(messageData);

      // Récupérer le message avec les informations utilisateur
      const messageWithUser = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar_url']
          }
        ]
      });

      return messageWithUser;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
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
        order: [['created_at', 'ASC']],
        limit,
        offset
      });

      return messages;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  }

  /**
   * Marquer un message comme lu
   */
  async markMessageAsRead(username, roomId, messageId) {
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) return false;

      // Mettre à jour la dernière lecture dans user_rooms
      const { UserRoom } = require('../models');
      await UserRoom.update(
        { last_read_at: new Date() },
        { 
          where: { 
            user_id: user.id, 
            room_id: roomId 
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Erreur lors du marquage du message comme lu:', error);
      return false;
    }
  }

  /**
   * Supprimer un message (soft delete)
   */
  async deleteMessage(username, messageId) {
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) return false;

      const message = await Message.findByPk(messageId);
      if (!message) return false;

      // Vérifier que l'utilisateur peut supprimer le message
      // (soit l'auteur, soit un modérateur/admin)
      if (message.user_id !== user.id) {
        // TODO: Vérifier les permissions de modérateur/admin
        return false;
      }

      message.is_deleted = true;
      message.deleted_at = new Date();
      await message.save();

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      return false;
    }
  }

  /**
   * Éditer un message
   */
  async editMessage(username, messageId, newContent) {
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) return false;

      const message = await Message.findByPk(messageId);
      if (!message) return false;

      // Vérifier que l'utilisateur est l'auteur du message
      if (message.user_id !== user.id) {
        return false;
      }

      message.content = newContent;
      message.is_edited = true;
      message.edited_at = new Date();
      await message.save();

      return message;
    } catch (error) {
      console.error('Erreur lors de l\'édition du message:', error);
      return false;
    }
  }
}

module.exports = new MessageService();
