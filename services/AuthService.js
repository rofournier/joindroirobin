const { Room, User, UserRoom } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtExpiresIn = '7d'; // 7 jours
  }

  /**
   * Enregistrer un nouvel utilisateur
   */
  async registerUser(username, password, email = null) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return { success: false, error: 'Nom d\'utilisateur déjà pris' };
      }

      // Créer le nouvel utilisateur
      const userData = {
        username,
        password_hash: await bcrypt.hash(password, 10)
      };
      
      // Ajouter l'email seulement s'il est fourni et non vide
      if (email && email.trim()) {
        userData.email = email.trim();
      }
      
      const user = await User.create(userData);

      // Générer le token JWT
      const token = this.generateToken(user);

      return { 
        success: true, 
        user: { id: user.id, username: user.username, email: user.email },
        token 
      };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      return { success: false, error: 'Erreur lors de l\'enregistrement' };
    }
  }

  /**
   * Authentifier un utilisateur
   */
  async authenticateUser(username, password) {
    try {
      // Trouver l'utilisateur
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      // Vérifier le mot de passe
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      // Vérifier le statut
      if (user.status !== 'active') {
        return { success: false, error: 'Compte non actif' };
      }

      // Mettre à jour le statut en ligne
      user.is_online = true;
      user.last_seen = new Date();
      await user.save();

      // Générer le token JWT
      const token = this.generateToken(user);

      return { 
        success: true, 
        user: { id: user.id, username: user.username, email: user.email },
        token 
      };
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      return { success: false, error: 'Erreur lors de l\'authentification' };
    }
  }

  /**
   * Vérifier un token JWT
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return { valid: true, user: decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Générer un token JWT
   */
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        email: user.email 
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  /**
   * Vérifier si un utilisateur peut accéder à une salle
   */
  async canUserAccessRoom(userId, roomId, password = null) {
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

      // Vérifier si l'utilisateur a déjà accès
      const userRoom = await UserRoom.findOne({
        where: { user_id: userId, room_id: roomId, is_active: true }
      });

      if (userRoom) {
        return { canAccess: true, room, reason: 'Accès déjà autorisé' };
      }

      // Si pas d'accès et pas de mot de passe, refuser
      if (!password) {
        return { canAccess: false, reason: 'Mot de passe requis pour cette salle' };
      }

      // Vérifier le mot de passe
      const isValid = await bcrypt.compare(password, room.password_hash);
      if (!isValid) {
        return { canAccess: false, reason: 'Mot de passe incorrect' };
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
  async addUserToRoom(userId, roomId, role = 'member') {
    try {
      // Vérifier si l'utilisateur est déjà dans la salle
      const existingUserRoom = await UserRoom.findOne({
        where: { user_id: userId, room_id: roomId }
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
          user_id: userId,
          room_id: roomId,
          role,
          joined_at: new Date(),
          is_active: true
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur à la salle:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retirer un utilisateur d'une salle
   */
  async removeUserFromRoom(userId, roomId) {
    try {
      const userRoom = await UserRoom.findOne({
        where: { user_id: userId, room_id: roomId, is_active: true }
      });

      if (userRoom) {
        userRoom.is_active = false;
        userRoom.left_at = new Date();
        await userRoom.save();
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors du retrait de l\'utilisateur de la salle:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifier si un utilisateur a accès à une salle
   */
  async checkUserRoomAccess(userId, roomId) {
    try {
      // Vérifier si l'utilisateur a déjà accès à cette salle
      const userRoom = await UserRoom.findOne({
        where: { user_id: userId, room_id: roomId, is_active: true }
      });

      return !!userRoom; // Retourne true si l'utilisateur a accès, false sinon
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'accès:', error);
      return false;
    }
  }

  /**
   * Déconnecter un utilisateur
   */
  async logoutUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        user.is_online = false;
        user.last_seen = new Date();
        await user.save();
      }
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AuthService();
