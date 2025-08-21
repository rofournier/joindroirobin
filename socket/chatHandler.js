const { Room, User, UserRoom } = require('../models');
const AuthService = require('../services/AuthService');
const MessageService = require('../services/MessageService');
const YouTubeService = require('../services/YouTubeService');

class ChatHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // username -> socketId
    this.socketUsers = new Map(); // socketId -> username
    this.userRooms = new Map(); // username -> Set<roomId>
    this.youtubeService = new YouTubeService();
    
    this.initialize();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Nouvelle connexion: ${socket.id}`);
      
      // Authentifier la connexion Socket.IO
      socket.on('authenticate', async (data) => {
        await this.handleAuthentication(socket, data);
      });

      // Événements après authentification
      socket.on('join_room', async (data) => {
        if (!socket.user) {
          socket.emit('error', { message: 'Authentification requise' });
          return;
        }
        await this.handleJoinRoom(socket, data);
      });

      socket.on('leave_room', async (data) => {
        if (!socket.user) {
          socket.emit('error', { message: 'Authentification requise' });
          return;
        }
        await this.handleLeaveRoom(socket, data);
      });

      socket.on('send_message', async (data) => {
        if (!socket.user) {
          socket.emit('error', { message: 'Authentification requise' });
          return;
        }
        await this.handleSendMessage(socket, data);
      });

      socket.on('typing', (data) => {
        if (!socket.user) return;
        this.handleTyping(socket, data);
      });

      socket.on('stop_typing', (data) => {
        if (!socket.user) return;
        this.handleStopTyping(socket, data);
      });

      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Authentifier une connexion Socket.IO
   */
  async handleAuthentication(socket, data) {
    try {
      // Récupérer le token depuis les cookies de la requête HTTP
      const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.match(/authToken=([^;]+)/)?.[1];
      
      if (!token) {
        socket.emit('authentication_error', { message: 'Token d\'authentification requis' });
        return;
      }

      // Vérifier le token JWT
      const result = AuthService.verifyToken(token);
      
      if (!result.valid) {
        socket.emit('authentication_error', { message: 'Token invalide ou expiré' });
        return;
      }

      // Stocker les informations utilisateur dans le socket
      socket.user = result.user;
      
      // Stocker les informations de connexion
      this.userSockets.set(result.user.username, socket.id);
      this.socketUsers.set(socket.id, result.user.username);
      
      console.log(`✅ ${result.user.username} authentifié avec succès`);
      socket.emit('authenticated', { user: result.user });
      
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      socket.emit('authentication_error', { message: 'Erreur d\'authentification' });
    }
  }

  /**
   * Gérer la connexion à une salle
   */
  async handleJoinRoom(socket, data) {
    try {
      const { roomId, password } = data;
      const username = socket.user.username;
      const userId = socket.user.id;
      
      if (!roomId) {
        socket.emit('error', { message: 'RoomId requis' });
        return;
      }

      console.log(`🚪 ${username} tente de rejoindre la salle ${roomId}`);

      // Vérifier l'accès à la salle
      const accessCheck = await AuthService.canUserAccessRoom(userId, roomId, password);
      
      if (!accessCheck.canAccess) {
        console.log(`❌ Accès refusé: ${accessCheck.reason}`);
        socket.emit('join_room_error', { 
          roomId, 
          reason: accessCheck.reason 
        });
        return;
      }

      console.log(`✅ Accès autorisé: ${accessCheck.reason}`);

      // Ajouter l'utilisateur à la salle
      const result = await AuthService.addUserToRoom(userId, roomId);
      
      if (!result.success) {
        socket.emit('error', { message: 'Erreur lors de l\'ajout à la salle' });
        return;
      }

      // Rejoindre la salle Socket.IO
      socket.join(`room_${roomId}`);
      
      // Stocker les informations utilisateur
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
      socket.emit('join_room_success', {
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
          id: socket.user.id,
          username: socket.user.username,
          avatar_url: socket.user.avatar_url
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
      const { roomId } = data;
      const username = socket.user.username;
      const userId = socket.user.id;
      
      if (!roomId) {
        socket.emit('error', { message: 'RoomId requis' });
        return;
      }

      console.log(`🚪 ${username} quitte la salle ${roomId}`);

      // Retirer l'utilisateur de la salle
      await AuthService.removeUserFromRoom(userId, roomId);

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
      const { roomId, content, messageType = 'text', youtubeInfo, imageInfo } = data;
      const username = socket.user.username;
      const userId = socket.user.id;
      
      if (!roomId || !content) {
        socket.emit('error', { message: 'RoomId et contenu requis' });
        return;
      }

      // Vérifier que l'utilisateur est dans la salle
      const userRoom = await UserRoom.findOne({
        where: { user_id: userId, room_id: roomId, is_active: true }
      });
      
      if (!userRoom) {
        socket.emit('error', { message: 'Vous devez être dans la salle pour envoyer un message' });
        return;
      }

      // Traiter le message pour YouTube si c'est du texte
      let processedContent = content;
      let finalYoutubeInfo = youtubeInfo || null;
      
      if (messageType === 'text' && !youtubeInfo) {
        const youtubeResult = this.youtubeService.processMessage(content);
        if (youtubeResult.processed) {
          processedContent = youtubeResult.message;
          finalYoutubeInfo = youtubeResult.videoInfo;
        }
      }

      // Envoyer le message
      const message = await MessageService.sendMessage(username, roomId, processedContent, messageType, imageInfo);
      
      // Préparer les données du message pour la diffusion
      const messageData = {
        id: message.id,
        content: processedContent,
        message_type: message.message_type,
        created_at: message.created_at,
        user: {
          id: message.user.id,
          username: message.user.username,
          avatar_url: message.user.avatar_url
        }
      };

      // Ajouter les informations spécifiques selon le type
      if (finalYoutubeInfo) {
        messageData.youtubeInfo = finalYoutubeInfo;
      }
      if (imageInfo) {
        messageData.imageInfo = imageInfo;
      }

      // Ajouter les informations de fichier si présentes en base
      if (message.file_url) {
        messageData.file_url = message.file_url;
        messageData.file_name = message.file_name;
        messageData.file_size = message.file_size;
      }
      
      // Diffuser le message à tous les utilisateurs de la salle
      this.io.to(`room_${roomId}`).emit('new_message', {
        roomId,
        message: messageData
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
    const { roomId } = data;
    const username = socket.user.username;
    
    if (roomId) {
      socket.to(`room_${roomId}`).emit('user_typing', { username, roomId });
    }
  }

  /**
   * Gérer l'arrêt de frappe
   */
  handleStopTyping(socket, data) {
    const { roomId } = data;
    const username = socket.user.username;
    
    if (roomId) {
      socket.to(`room_${roomId}`).emit('user_stop_typing', { username, roomId });
    }
  }

  /**
   * Gérer la déconnexion
   */
  async handleDisconnect(socket) {
    try {
      if (socket.user) {
        const username = socket.user.username;
        console.log(`🔌 Déconnexion de ${username}`);
        
        // Ne pas retirer l'utilisateur des salles lors de la déconnexion Socket.IO
        // Il peut se reconnecter plus tard et garder son accès
        console.log(`ℹ️ ${username} reste dans ses salles (déconnexion Socket.IO)`);
        
        // Nettoyer seulement les données locales
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
