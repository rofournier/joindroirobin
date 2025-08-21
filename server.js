const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./models');

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
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
const RoomService = require('./services/RoomService');

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await RoomService.getAllRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Erreur lors de la récupération des salles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des salles' });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const room = await RoomService.getRoomById(req.params.id);
    res.json(room);
  } catch (error) {
    console.error('Erreur lors de la récupération de la salle:', error);
    res.status(404).json({ error: 'Salle non trouvée' });
  }
});

app.get('/api/rooms/:id/messages', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const messages = await RoomService.getRoomMessages(req.params.id, parseInt(limit), parseInt(offset));
    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

// Validation du mot de passe pour une salle
app.post('/api/rooms/:id/validate-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        reason: 'Username et mot de passe requis' 
      });
    }
    
    const AuthService = require('./services/AuthService');
    const accessCheck = await AuthService.canUserAccessRoom(username, id, password);
    
    if (accessCheck.canAccess) {
      res.json({ success: true, message: 'Accès autorisé' });
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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Initialisation de la base de données et démarrage du serveur
async function startServer() {
  try {
    // Tester la connexion à la base de données
    await db.authenticate();
    
    // Synchroniser les modèles avec la base de données
    // En développement, on peut forcer la synchronisation
    if (process.env.NODE_ENV === 'development') {
      await db.sync({ alter: true });
    } else {
      await db.sync();
    }
    
    // Initialiser Socket.IO
    const ChatHandler = require('./socket/chatHandler');
    const chatHandler = new ChatHandler(io);
    chatHandler.initialize();
    console.log('🔌 Socket.IO initialisé avec succès');
    
    // Démarrer le serveur
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📱 Chat app ready for JoindreRobin!`);
      console.log(`🗄️  Database connected successfully`);
      console.log(`🔌 Socket.IO ready for real-time chat!`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();
