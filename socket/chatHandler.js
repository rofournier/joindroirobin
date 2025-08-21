const AuthService = require('../services/AuthService');
const MessageService = require('../services/MessageService');
const YouTubeService = require('../services/YouTubeService');
const { Room, User, UserRoom } = require('../models');

class ChatHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // username -> socketId
    this.socketUsers = new Map(); // socketId -> username
    this.userRooms = new Map(); // username -> Set of roomIds
    this.youtubeService = new YouTubeService();
  }

  /**
   * Initialiser les gestionnaires Socket.IO
   */
  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Nouvelle connexion: ${socket.id}`);

      // Gestion de la connexion à une salle
      socket.on('join_room', async (data) => {
        await this.handleJoinRoom(socket, data);
      });

      // Gestion de la sortie d'une salle
      socket.on('leave_room', async (data) => {
        await this.handleLeaveRoom(socket, data);
      });

      // Gestion de l'envoi de message
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Gestion de la frappe
      socket.on('typing', (data) => {
        this.handleTyping(socket, data);
      });

      // Gestion de l'arrêt de frappe
      socket.on('stop_typing', (data) => {
        this.handleStopTyping(socket, data);
      });

      // Gestion de la déconnexion
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Gérer la connexion à une salle
   */
  async handleJoinRoom(socket, data) {
    try {
      const { username, roomId, password } = data;
      
      if (!username || !roomId) {
        socket.emit('error', { message: 'Username et roomId requis' });
        return;
      }

      console.log(`🚪 ${username} tente de rejoindre la salle ${roomId}`);

      // Vérifier l'accès à la salle
      const accessCheck = await AuthService.canUserAccessRoom(username, roomId, password);
      
      if (!accessCheck.canAccess) {
        socket.emit('join_room_error', { 
          roomId, 
          reason: accessCheck.reason 
        });
        return;
      }

      // Ajouter l'utilisateur à la salle
      const result = await AuthService.addUserToRoom(username, roomId);
      
      if (!result.success) {
        socket.emit('error', { message: 'Erreur lors de l\'ajout à la salle' });
        return;
      }

      // Rejoindre la salle Socket.IO
      socket.join(`room_${roomId}`);
      
      // Stocker les informations utilisateur
      this.userSockets.set(username, socket.id);
      this.socketUsers.set(socket.id, username);
      
      if (!this.userRooms.has(username)) {
        this.userRooms.set(username, new Set());
      }
      this.userRooms.get(username).add(roomId);

      // Récupérer les messages de la salle
      const messages = await MessageService.getRoomMessages(roomId);
      
      // Récupérer les utilisateurs de la salle
      const room = await Room.findByPk(roomId, {
        include: [
          {
            model: User,
            as: 'users',
            through: {
              attributes: ['role', 'joined_at'],
              where: { is_active: true }
            },
            attributes: ['id', 'username', 'is_online', 'avatar_url']
          }
        ]
      });

      // Confirmer la connexion à la salle
      socket.emit('room_joined', {
        roomId,
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          isProtected: room.is_protected
        },
        messages,
        users: room.users
      });

      // Notifier les autres utilisateurs
      socket.to(`room_${roomId}`).emit('user_joined', {
        username,
        roomId,
        user: {
          id: result.user.id,
          username: result.user.username,
          avatar_url: result.user.avatar_url
        }
      });

      // Mettre à jour le compteur d'utilisateurs en temps réel
      this.updateRoomUserCount(roomId);

      console.log(`✅ ${username} a rejoint la salle ${roomId}`);

    } catch (error) {
      console.error('Erreur lors de la connexion à la salle:', error);
      socket.emit('error', { message: 'Erreur lors de la connexion à la salle' });
    }
  }

  /**
   * Gérer la sortie d'une salle
   */
  async handleLeaveRoom(socket, data) {
    try {
      const { username, roomId } = data;
      
      if (!username || !roomId) {
        socket.emit('error', { message: 'Username et roomId requis' });
        return;
      }

      console.log(`🚪 ${username} quitte la salle ${roomId}`);

      // Retirer l'utilisateur de la salle
      await AuthService.removeUserFromRoom(username, roomId);

      // Quitter la salle Socket.IO
      socket.leave(`room_${roomId}`);
      
      // Mettre à jour les informations locales
      if (this.userRooms.has(username)) {
        this.userRooms.get(username).delete(roomId);
        if (this.userRooms.get(username).size === 0) {
          this.userRooms.delete(username);
        }
      }

      // Notifier les autres utilisateurs
      socket.to(`room_${roomId}`).emit('user_left', {
        username,
        roomId
      });

      // Mettre à jour le compteur d'utilisateurs en temps réel
      this.updateRoomUserCount(roomId);

      console.log(`✅ ${username} a quitté la salle ${roomId}`);

    } catch (error) {
      console.error('Erreur lors de la sortie de la salle:', error);
      socket.emit('error', { message: 'Erreur lors de la sortie de la salle' });
    }
  }

  /**
   * Gérer l'envoi de message
   */
  async handleSendMessage(socket, data) {
    try {
      const { username, roomId, content, messageType = 'text' } = data;
      
      if (!username || !roomId || !content) {
        socket.emit('error', { message: 'Username, roomId et content requis' });
        return;
      }

      // Vérifier que l'utilisateur est dans la salle
      const isInRoom = await AuthService.isUserInRoom(username, roomId);
      if (!isInRoom) {
        socket.emit('error', { message: 'Vous devez être dans la salle pour envoyer un message' });
        return;
      }

      // Traiter le message pour YouTube si c'est du texte
      let processedContent = content;
      let youtubeInfo = null;
      
      if (messageType === 'text') {
        const youtubeResult = this.youtubeService.processMessage(content);
        if (youtubeResult.processed) {
          processedContent = youtubeResult.message;
          youtubeInfo = youtubeResult.videoInfo;
        }
      }

      // Envoyer le message
      const message = await MessageService.sendMessage(username, roomId, processedContent, messageType);
      
      // Diffuser le message à tous les utilisateurs de la salle
      this.io.to(`room_${roomId}`).emit('new_message', {
        roomId,
        message: {
          id: message.id,
          content: processedContent,
          message_type: message.message_type,
          created_at: message.created_at,
          user: {
            id: message.user.id,
            username: message.user.username,
            avatar_url: message.user.avatar_url
          },
          youtubeInfo: youtubeInfo
        }
      });

      console.log(`💬 ${username} a envoyé un message dans la salle ${roomId}`);

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
    }
  }

  /**
   * Gérer la frappe
   */
  handleTyping(socket, data) {
    const { username, roomId } = data;
    if (username && roomId) {
      socket.to(`room_${roomId}`).emit('user_typing', { username, roomId });
    }
  }

  /**
   * Gérer l'arrêt de frappe
   */
  handleStopTyping(socket, data) {
    const { username, roomId } = data;
    if (username && roomId) {
      socket.to(`room_${roomId}`).emit('user_stop_typing', { username, roomId });
    }
  }

  /**
   * Gérer la déconnexion
   */
  async handleDisconnect(socket) {
    try {
      const username = this.socketUsers.get(socket.id);
      
      if (username) {
        console.log(`🔌 Déconnexion de ${username}`);
        
        // Retirer l'utilisateur de toutes ses salles
        if (this.userRooms.has(username)) {
          for (const roomId of this.userRooms.get(username)) {
            await AuthService.removeUserFromRoom(username, roomId);
            
            // Notifier les autres utilisateurs
            socket.to(`room_${roomId}`).emit('user_left', {
              username,
              roomId
            });
            
            // Mettre à jour le compteur d'utilisateurs
            this.updateRoomUserCount(roomId);
          }
        }

        // Nettoyer les données locales
        this.userSockets.delete(username);
        this.userRooms.delete(username);
        this.socketUsers.delete(socket.id);
      }

      console.log(`✅ Déconnexion gérée pour ${socket.id}`);

    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }

  /**
   * Mettre à jour le compteur d'utilisateurs d'une salle
   */
  async updateRoomUserCount(roomId) {
    try {
      const userCount = await UserRoom.count({
        where: { room_id: roomId, is_active: true }
      });

      // Diffuser la mise à jour du compteur
      this.io.emit('room_user_count_updated', {
        roomId,
        userCount
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compteur:', error);
    }
  }

  /**
   * Obtenir les informations d'une salle
   */
  async getRoomInfo(roomId) {
    try {
      const room = await Room.findByPk(roomId, {
        include: [
          {
            model: User,
            as: 'users',
            through: {
              attributes: ['role', 'joined_at'],
              where: { is_active: true }
            },
            attributes: ['id', 'username', 'is_online', 'avatar_url']
          }
        ]
      });

      return room;
    } catch (error) {
      console.error('Erreur lors de la récupération des infos de la salle:', error);
      return null;
    }
  }
}

module.exports = ChatHandler;
