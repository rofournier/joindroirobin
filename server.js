const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const db = require('./models');
const { authenticateToken, optionalAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes d'authentification
const AuthService = require('./services/AuthService');

// Enregistrement d'un nouvel utilisateur
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username et mot de passe requis' 
      });
    }
    
    const result = await AuthService.registerUser(username, password, email);
    
    if (result.success) {
      // Définir le cookie d'authentification
      res.cookie('authToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
        sameSite: 'strict'
      });
      
      res.json({ 
        success: true, 
        user: result.user,
        message: 'Utilisateur enregistré avec succès'
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'enregistrement' 
    });
  }
});

// Connexion utilisateur
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username et mot de passe requis' 
      });
    }
    
    const result = await AuthService.authenticateUser(username, password);
    
    if (result.success) {
      // Définir le cookie d'authentification
      res.cookie('authToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
        sameSite: 'strict'
      });
      
      res.json({ 
        success: true, 
        user: result.user,
        message: 'Connexion réussie'
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la connexion' 
    });
  }
});

// Déconnexion utilisateur
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    await AuthService.logoutUser(req.user.id);
    
    // Supprimer le cookie d'authentification
    res.clearCookie('authToken');
    
    res.json({ 
      success: true, 
      message: 'Déconnexion réussie' 
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la déconnexion' 
    });
  }
});

// Vérifier le statut d'authentification
app.get('/api/auth/me', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ 
      success: true, 
      authenticated: true,
      user: req.user 
    });
  } else {
    res.json({ 
      success: true, 
      authenticated: false 
    });
  }
});

// Récupérer le token JWT pour Socket.IO
app.get('/api/auth/token', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    token: req.cookies.authToken 
  });
});

// Routes des salles (avec authentification optionnelle)
app.get('/api/rooms', optionalAuth, async (req, res) => {
  try {
    const RoomService = require('./services/RoomService');
    const rooms = await RoomService.getAllRooms();
    
    // Si l'utilisateur est authentifié, ajouter les informations d'accès
    if (req.user) {
      for (const room of rooms) {
        const userRoom = await db.UserRoom.findOne({
          where: { user_id: req.user.id, room_id: room.id, is_active: true }
        });
        room.userHasAccess = !!userRoom;
      }
    }
    
    res.json(rooms);
  } catch (error) {
    console.error('Erreur lors de la récupération des salles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des salles' });
  }
});

app.get('/api/rooms/:id', optionalAuth, async (req, res) => {
  try {
    const RoomService = require('./services/RoomService');
    const room = await RoomService.getRoomById(req.params.id);
    
    if (req.user) {
      const userRoom = await db.UserRoom.findOne({
        where: { user_id: req.user.id, room_id: room.id, is_active: true }
      });
      room.userHasAccess = !!userRoom;
    }
    
    res.json(room);
  } catch (error) {
    console.error('Erreur lors de la récupération de la salle:', error);
    res.status(404).json({ error: 'Salle non trouvée' });
  }
});

// Validation du mot de passe pour une salle (authentification requise)
app.post('/api/rooms/:id/validate-password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mot de passe requis' 
      });
    }
    
    const accessCheck = await AuthService.canUserAccessRoom(req.user.id, id, password);
    
    if (accessCheck.canAccess) {
      // Ajouter l'utilisateur à la salle
      await AuthService.addUserToRoom(req.user.id, id);
      
      res.json({ 
        success: true, 
        message: 'Accès autorisé'
      });
    } else {
      res.json({ success: false, reason: accessCheck.reason });
    }
  } catch (error) {
    console.error('Erreur lors de la validation du mot de passe:', error);
    res.status(500).json({ 
      success: false, 
      reason: 'Erreur lors de la validation' 
    });
  }
});

// Vérifier l'accès d'un utilisateur à une salle (authentification requise)
app.get('/api/rooms/:id/check-access', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'utilisateur a déjà accès à cette salle
    const hasAccess = await AuthService.checkUserRoomAccess(req.user.id, id);
    
    res.json({ 
      success: true, 
      hasAccess: hasAccess 
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'accès:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la vérification' 
    });
  }
});

// Configuration multer pour l'upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non supporté'), false);
        }
    }
});

// Route d'upload d'images (authentification requise)
app.post('/api/upload/image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'Aucune image fournie' 
            });
        }

        const ImageService = require('./services/ImageService');
        const imageService = new ImageService();
        const result = await imageService.processAndSaveImage(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        if (result.success) {
            res.json({
                success: true,
                image: result
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de l\'upload' 
        });
    }
});

// Route principale - page de connexion
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route du lobby (après connexion)
app.get('/lobby', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route du chat (authentification requise)
app.get('/chat', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Middleware statique (après les routes spécifiques)
app.use(express.static(path.join(__dirname, 'public')));

// Routes pour servir les images uploadées
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Initialisation de Socket.IO avec authentification
const ChatHandler = require('./socket/chatHandler');
const chatHandler = new ChatHandler(io);

// Initialisation de la base de données et démarrage du serveur
async function startServer() {
  try {
    // Tester la connexion à la base de données
    await db.authenticate();
    
    // Synchroniser les modèles avec la base de données
    if (process.env.NODE_ENV === 'development') {
      await db.sync({ alter: true });
    } else {
      await db.sync();
    }
    
    // Démarrer le serveur
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📱 Chat app ready for JoindreRobin!`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();