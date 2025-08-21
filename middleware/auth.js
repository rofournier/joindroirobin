const AuthService = require('../services/AuthService');

/**
 * Middleware d'authentification JWT
 */
const authenticateToken = (req, res, next) => {
  // Récupérer le token depuis les cookies ou les headers
  const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token d\'authentification requis' 
    });
  }

  try {
    // Vérifier le token
    const result = AuthService.verifyToken(token);
    
    if (!result.valid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token invalide ou expiré' 
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = result.user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Erreur d\'authentification' 
    });
  }
};

/**
 * Middleware optionnel d'authentification (pour les routes qui peuvent être publiques ou privées)
 */
const optionalAuth = (req, res, next) => {
  const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const result = AuthService.verifyToken(token);
      if (result.valid) {
        req.user = result.user;
      }
    } catch (error) {
      // Ignorer l'erreur pour l'authentification optionnelle
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
