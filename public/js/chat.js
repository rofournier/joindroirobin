// Configuration et constantes
const STORAGE_KEYS = {
    USERNAME: 'joindrerobin_username',
    THEME: 'joindrerobin_theme'
};

const THEMES = {
    light: 'light',
    dark: 'dark'
};

class ChatApp {
    constructor() {
        this.socket = null;
    this.currentUser = null;
        this.currentRoom = null;
    this.isTyping = false;
        this.typingTimeout = null;
    
    this.initialize();
  }

  /**
   * Initialiser l'application
   */
  async initialize() {
    try {
      // Vérifier l'authentification
      const authStatus = await this.checkAuthStatus();
      if (!authStatus.authenticated) {
        window.location.href = '/';
        return;
      }

      this.currentUser = authStatus.user;
      this.initializeUI();
      this.setupEventListeners();
      
      // Récupérer l'ID de la salle depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('room');
      
      if (roomId) {
        await this.loadRoomInfo(roomId);
        // La connexion Socket.IO sera faite dans loadRoomInfo si l'accès est autorisé
        } else {
        this.showError('Aucune salle spécifiée');
        setTimeout(() => {
          window.location.href = '/lobby';
        }, 2000);
      }
      
      console.log('✅ Utilisateur authentifié:', this.currentUser.username);
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      window.location.href = '/';
    }
  }

  /**
   * Vérifier le statut d'authentification
   */
  async checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        throw new Error('Non authentifié');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      throw error;
    }
  }

  /**
   * Initialiser l'interface utilisateur
   */
  initializeUI() {
    // Mettre à jour l'interface utilisateur
    this.updateUserInterface();
    
    // Ajuster la hauteur du textarea
    this.setupTextareaAutoResize();
  }

  /**
   * Mettre à jour l'interface utilisateur
   */
  updateUserInterface() {
    // Initiale de l'utilisateur
    const userInitial = document.getElementById('userInitial');
    if (userInitial && this.currentUser) {
      userInitial.textContent = this.currentUser.username.charAt(0).toUpperCase();
    }

    // Nom d'utilisateur
    const userName = document.getElementById('userName');
    if (userName && this.currentUser) {
      userName.textContent = this.currentUser.username;
    }
  }

  /**
   * Configurer l'auto-redimensionnement du textarea
   */
  setupTextareaAutoResize() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;

    messageInput.addEventListener('input', () => {
      // Réinitialiser la hauteur
      messageInput.style.height = 'auto';
      
      // Calculer la nouvelle hauteur
      const newHeight = Math.min(messageInput.scrollHeight, 120);
      messageInput.style.height = newHeight + 'px';
      
      // Mettre à jour le compteur de caractères
      this.updateCharCount();
    });

    // Gérer la touche Entrée
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  /**
   * Mettre à jour le compteur de caractères
   */
  updateCharCount() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    
    if (messageInput && charCount) {
      const count = messageInput.value.length;
      charCount.textContent = count;
      
      // Changer la couleur selon le nombre de caractères
      if (count > 800) {
        charCount.className = 'absolute bottom-2 right-2 text-xs text-red-400';
      } else if (count > 600) {
        charCount.className = 'absolute bottom-2 right-2 text-xs text-yellow-400';
      } else {
        charCount.className = 'absolute bottom-2 right-2 text-xs text-gray-500';
      }
    }
  }

  /**
   * Configurer les écouteurs d'événements
   */
  setupEventListeners() {
    // Formulaire d'envoi de message
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
      messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    // Bouton retour au lobby
    const backToLobby = document.getElementById('backToLobby');
    if (backToLobby) {
      backToLobby.addEventListener('click', () => {
        window.location.href = '/lobby';
      });
    }

    // Menu utilisateur
    const userMenuButton = document.getElementById('userMenuButton');
    if (userMenuButton) {
      userMenuButton.addEventListener('click', () => {
        this.toggleUserMenu();
      });
    }

    // Boutons du menu utilisateur
    const roomInfoButton = document.getElementById('roomInfoButton');
    if (roomInfoButton) {
      roomInfoButton.addEventListener('click', () => {
        this.showRoomInfo();
        this.toggleUserMenu();
      });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        this.logout();
      });
    }

    // Boutons d'action
    const imageUploadBtn = document.getElementById('imageUploadBtn');
    if (imageUploadBtn) {
      imageUploadBtn.addEventListener('click', () => {
        this.showImageUploadModal();
      });
    }

    const youtubeBtn = document.getElementById('youtubeBtn');
    if (youtubeBtn) {
      youtubeBtn.addEventListener('click', () => {
        this.showYouTubeModal();
      });
    }

    // Gestion des modals
    this.setupModalEventListeners();

    // Fermeture des overlays
    const closeRoomInfo = document.getElementById('closeRoomInfo');
    if (closeRoomInfo) {
      closeRoomInfo.addEventListener('click', () => {
        this.hideRoomInfo();
      });
    }

    // Fermer les overlays en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#userMenuOverlay') && !e.target.closest('#userMenuButton')) {
        this.hideUserMenu();
      }
      if (!e.target.closest('#roomInfoOverlay') && !e.target.closest('#roomInfoButton')) {
        this.hideRoomInfo();
      }
    });
  }

  /**
   * Charger les informations de la salle
   */
  async loadRoomInfo(roomId) {
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des infos de la salle');
      }

      const room = await response.json();
      this.currentRoom = room;
      this.updateRoomDisplay();
      
      // Vérifier si l'utilisateur a accès à la salle
      if (room.is_protected) {
        // Vérifier l'accès via l'API
        const hasAccess = await this.checkRoomAccess(room.id);
        if (!hasAccess) {
          // Afficher la modal de mot de passe
          this.showPasswordModal();
          return;
        }
      }
      
      // Si on arrive ici, l'utilisateur a accès à la salle
      // Se connecter à Socket.IO
      this.connectToSocket();
      
    } catch (error) {
      console.error('Erreur lors de la récupération des infos de la salle:', error);
      this.showError('Erreur lors de la récupération des infos de la salle');
    }
  }

  /**
   * Vérifier l'accès d'un utilisateur à une salle
   */
  async checkRoomAccess(roomId) {
    try {
      const response = await fetch(`/api/rooms/${roomId}/check-access`);
      if (response.ok) {
        const result = await response.json();
        return result.hasAccess;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'accès:', error);
      return false;
    }
  }

  /**
   * Mettre à jour l'affichage de la salle
   */
  updateRoomDisplay() {
    const roomTitle = document.getElementById('roomTitle');
    const roomStatus = document.getElementById('roomStatus');
    
    if (roomTitle && this.currentRoom) {
      roomTitle.textContent = this.currentRoom.name;
    }
    
    if (roomStatus && this.currentRoom) {
      if (this.currentRoom.is_protected) {
        roomStatus.textContent = 'Salle protégée 🔒';
        roomStatus.className = 'text-xs text-yellow-400';
        } else {
        roomStatus.textContent = 'Salle publique 🌐';
        roomStatus.className = 'text-xs text-blue-400';
      }
    }
  }

  /**
   * Se connecter à Socket.IO
   */
  async connectToSocket() {
    try {
      // Récupérer le token JWT
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Token d\'authentification non disponible');
      }

      // Connexion Socket.IO avec authentification
      this.socket = io({
        auth: {
          token: token
        }
      });

      // Authentifier la connexion Socket.IO
      this.socket.emit('authenticate');

      // Écouter les événements d'authentification
      this.socket.on('authenticated', (data) => {
        console.log('✅ Authentification Socket.IO réussie');
        this.setupSocketEventListeners();
        this.joinRoomSocket();
      });

      this.socket.on('authentication_error', (data) => {
        console.error('❌ Erreur d\'authentification Socket.IO:', data);
        this.showError('Erreur d\'authentification');
                window.location.href = '/';
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion Socket.IO:', error);
        this.showError('Erreur de connexion au chat');
      });

    } catch (error) {
      console.error('Erreur lors de la connexion Socket.IO:', error);
      this.showError('Erreur lors de la connexion au chat');
    }
  }

  /**
   * Récupérer le token d'authentification
   */
  async getAuthToken() {
    try {
      // Récupérer le vrai token JWT pour Socket.IO
      const response = await fetch('/api/auth/token');
      if (response.ok) {
        const result = await response.json();
        return result.token;
      }
      throw new Error('Non authentifié');
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Configurer les écouteurs d'événements Socket.IO
   */
  setupSocketEventListeners() {
    if (!this.socket) return;

    // Rejoindre la salle
    this.socket.on('join_room_success', (data) => {
      this.onJoinRoomSuccess(data);
        });
        
        this.socket.on('join_room_error', (data) => {
            this.onJoinRoomError(data);
        });
        
    // Messages
        this.socket.on('new_message', (data) => {
            this.onNewMessage(data);
        });
        
    // Utilisateurs
        this.socket.on('user_joined', (data) => {
            this.onUserJoined(data);
        });
        
        this.socket.on('user_left', (data) => {
            this.onUserLeft(data);
        });
        
    // Frappe
        this.socket.on('user_typing', (data) => {
            this.onUserTyping(data);
        });
        
        this.socket.on('user_stop_typing', (data) => {
            this.onUserStopTyping(data);
        });
  }

  /**
   * Rejoindre la salle via Socket.IO
   */
  joinRoomSocket() {
    if (!this.socket || !this.currentRoom) return;

    this.socket.emit('join_room', {
      roomId: this.currentRoom.id
    });
  }

  /**
   * Gérer le succès de connexion à une salle
   */
  onJoinRoomSuccess(data) {
    console.log('✅ Connecté à la salle:', data);
    this.displayMessages(data.messages || []);
    this.displayUsers(data.users || []);
    
    // Mettre à jour le statut
    const roomStatus = document.getElementById('roomStatus');
    if (roomStatus) {
      roomStatus.textContent = 'Connecté ✅';
      roomStatus.className = 'text-xs text-green-400';
    }
  }

  /**
   * Gérer l'erreur de connexion à une salle
   */
  onJoinRoomError(data) {
    console.error('❌ Erreur de connexion à la salle:', data);
    this.showError(`Impossible de rejoindre la salle: ${data.reason}`);
  }

  /**
   * Afficher les messages
   */
  displayMessages(messages) {
    const messagesContainer = document.querySelector('.messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <p class="text-sm">Aucun message pour le moment</p>
          <p class="text-xs text-gray-500 mt-2">Soyez le premier à parler !</p>
        </div>
      `;
      return;
    }
    
    messages.forEach(message => {
      this.addMessageToDisplay(message);
    });
    
    // Scroll vers le bas
    this.scrollToBottom();
  }

  /**
   * Afficher les utilisateurs
   */
  displayUsers(users) {
    // Cette fonction sera utilisée pour l'overlay d'infos de salle
    this.currentRoomUsers = users || [];
  }

  /**
   * Ajouter un message à l'affichage
   */
  addMessageToDisplay(message) {
    const messagesContainer = document.querySelector('.messages');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = 'message mb-3';
    
    const isOwnMessage = message.user.username === this.currentUser.username;
    const messageClass = isOwnMessage ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-700 text-white';
    
    messageElement.innerHTML = `
      <div class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'}">
        <div class="max-w-xs lg:max-w-md ${messageClass} rounded-2xl px-4 py-3 shadow-lg">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-xs font-medium ${isOwnMessage ? 'text-blue-100' : 'text-gray-300'}">
              ${message.user.username}
            </span>
            <span class="text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-400'}">
              ${this.formatMessageTime(message.created_at)}
            </span>
          </div>
          <div class="text-sm leading-relaxed">
            ${this.formatMessageContent(message)}
          </div>
        </div>
      </div>
    `;

    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  /**
   * Formater le contenu d'un message
   */
  formatMessageContent(message) {
    let content = message.content;
    
    // Traitement des liens
    content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-300 hover:underline">$1</a>');
    
    // Traitement des retours à la ligne
    content = content.replace(/\n/g, '<br>');
    
    // Ajouter les informations YouTube si présentes
    if (message.youtubeInfo) {
      const videoId = message.youtubeInfo.videoId;
      content += `
        <div class="mt-3 p-3 bg-gray-600/50 rounded-xl">
          <div class="aspect-video w-full mb-2">
            <iframe class="w-full h-full rounded-lg" 
                    src="https://www.youtube.com/embed/${videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>
          </div>
          <div class="text-xs text-gray-300">
            🎥 Vidéo YouTube partagée
          </div>
        </div>
      `;
    }
    
    // Ajouter les informations d'image si présentes
    if (message.imageInfo) {
      content += `
        <div class="mt-3">
          <img src="${message.imageInfo.url}" 
               alt="Image partagée" 
               class="max-w-full h-auto rounded-xl shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
               onclick="window.open('${message.imageInfo.url}', '_blank')">
          <div class="text-xs text-gray-300 mt-1">
            🖼️ Image partagée (${this.formatFileSize(message.imageInfo.size)})
          </div>
        </div>
      `;
    } else if (message.file_url && message.message_type === 'image') {
      // Image sauvegardée en base de données
      content += `
        <div class="mt-3">
          <img src="${message.file_url}" 
               alt="Image partagée" 
               class="max-w-full h-auto rounded-xl shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
               onclick="window.open('${message.file_url}', '_blank')">
          <div class="text-xs text-gray-300 mt-1">
            🖼️ Image partagée${message.file_size ? ` (${this.formatFileSize(message.file_size)})` : ''}
          </div>
        </div>
      `;
    }
    
    return content;
  }

  /**
   * Formater la taille d'un fichier
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formater l'heure d'un message
   */
  formatMessageTime(timestamp) {
    try {
      // Gérer différents formats de timestamp
      let date;
      
      // Debug: voir ce qu'on reçoit
      console.log('Timestamp reçu:', timestamp, typeof timestamp);
      
      if (!timestamp) {
        console.log('Timestamp vide, utilisation de la date actuelle');
        date = new Date();
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        console.log('Type de timestamp non reconnu:', typeof timestamp);
        return 'maintenant';
      }

      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.log('Date invalide après conversion:', date);
        return 'maintenant';
      }

      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error, 'Timestamp:', timestamp);
      return 'maintenant';
    }
  }

  /**
   * Scroll vers le bas
   */
  scrollToBottom() {
    const messagesContainer = document.querySelector('.messages');
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  /**
   * Envoyer un message
   */
  sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !this.socket || !this.currentRoom) return;

    const content = messageInput.value.trim();
    if (!content) return;

    // Envoyer le message via Socket.IO
    this.socket.emit('send_message', {
      roomId: this.currentRoom.id,
      content,
      messageType: 'text'
    });

    // Vider l'input et réinitialiser la hauteur
    messageInput.value = '';
    messageInput.style.height = '44px';
    this.updateCharCount();
    
    // Arrêter l'indicateur de frappe
    if (this.isTyping) {
      this.isTyping = false;
      clearTimeout(this.typingTimeout);
      this.socket.emit('stop_typing', { roomId: this.currentRoom.id });
    }
  }

  /**
   * Gérer l'arrivée d'un nouvel utilisateur
   */
  onUserJoined(data) {
    console.log('👋 Nouvel utilisateur:', data);
    this.showInfo(`${data.username} a rejoint la salle`);
  }

  /**
   * Gérer le départ d'un utilisateur
   */
  onUserLeft(data) {
    console.log('👋 Utilisateur parti:', data);
    this.showInfo(`${data.username} a quitté la salle`);
  }

  /**
   * Gérer un nouveau message
   */
  onNewMessage(data) {
    console.log('💬 Nouveau message:', data);
    this.addMessageToDisplay(data.message);
  }

  /**
   * Gérer la frappe
   */
  onUserTyping(data) {
    this.showTypingIndicator(data.username);
  }

  /**
   * Gérer l'arrêt de frappe
   */
  onUserStopTyping(data) {
    this.hideTypingIndicator();
  }

  /**
   * Afficher l'indicateur de frappe
   */
  showTypingIndicator(username) {
    let indicator = document.getElementById('typingIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'typingIndicator';
      indicator.className = 'px-4 py-2 text-sm text-gray-400 italic';
      const messagesContainer = document.querySelector('.messages');
      if (messagesContainer) {
        messagesContainer.appendChild(indicator);
      }
    }
    indicator.textContent = `${username} est en train d'écrire...`;
    indicator.classList.remove('hidden');
  }

  /**
   * Masquer l'indicateur de frappe
   */
  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.classList.add('hidden');
    }
  }

  /**
   * Afficher la modal de mot de passe
   */
  showPasswordModal() {
    if (!this.currentRoom) return;
    
    // Créer la modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.id = 'passwordModal';
    
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 bg-yellow-500 rounded-full flex items-center justify-center">
            <span class="text-2xl">🔒</span>
                            </div>
          <h3 class="text-xl font-semibold text-white mb-2">Salle protégée</h3>
          <p class="text-gray-400">${this.currentRoom.name}</p>
          <p class="text-sm text-gray-500 mt-2">Cette salle nécessite un mot de passe</p>
                        </div>
        
        <form id="passwordForm" class="space-y-4">
          <div>
            <label for="roomPassword" class="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
            <input type="password" id="roomPassword" 
                   class="w-full px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                   placeholder="Entrez le mot de passe"
                   required>
                    </div>
          
          <div class="flex space-x-3">
            <button type="button" id="cancelPassword" 
                    class="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors">
              Retour au lobby
            </button>
            <button type="submit" 
                    class="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
              Rejoindre
            </button>
                    </div>
        </form>
            </div>
        `;

    document.body.appendChild(modal);

    // Gérer la soumission du formulaire
    const passwordForm = document.getElementById('passwordForm');
    const roomPassword = document.getElementById('roomPassword');
    const cancelButton = document.getElementById('cancelPassword');

    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.validateRoomPassword(roomPassword.value);
    });

    cancelButton.addEventListener('click', () => {
      window.location.href = '/lobby';
    });

    // Focus sur l'input
    roomPassword.focus();
  }

  /**
   * Masquer la modal de mot de passe
   */
  hidePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Valider le mot de passe de la salle
   */
  async validateRoomPassword(password) {
    try {
      const response = await fetch(`/api/rooms/${this.currentRoom.id}/validate-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        this.hidePasswordModal();
        this.showSuccess('Mot de passe correct ! Connexion...');
        
        // Maintenant qu'on a l'accès, se connecter à Socket.IO
        this.connectToSocket();
        } else {
        const error = await response.json();
        this.showError(error.message || 'Mot de passe incorrect');
      }
    } catch (error) {
      console.error('Erreur lors de la validation du mot de passe:', error);
      this.showError('Erreur lors de la validation du mot de passe');
    }
  }

  /**
   * Afficher les informations de la salle
   */
  showRoomInfo() {
    if (!this.currentRoom) return;

    const roomInfoContent = document.getElementById('roomInfoContent');
    if (roomInfoContent) {
      roomInfoContent.innerHTML = `
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-400 mb-2">Nom de la salle</h4>
            <p class="text-white">${this.currentRoom.name}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-400 mb-2">Description</h4>
            <p class="text-white">${this.currentRoom.description || 'Aucune description'}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-400 mb-2">Statut</h4>
            <p class="text-white">${this.currentRoom.is_protected ? '🔒 Protégée' : '🌐 Publique'}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-400 mb-2">Utilisateurs connectés</h4>
            <p class="text-white">${this.currentRoomUsers ? this.currentRoomUsers.length : 0} utilisateur(s)</p>
          </div>
        </div>
      `;
    }

    const overlay = document.getElementById('roomInfoOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }

  /**
   * Masquer les informations de la salle
   */
  hideRoomInfo() {
    const overlay = document.getElementById('roomInfoOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  /**
   * Afficher le menu utilisateur
   */
  toggleUserMenu() {
    const overlay = document.getElementById('userMenuOverlay');
    if (overlay) {
      overlay.classList.toggle('hidden');
    }
  }

  /**
   * Masquer le menu utilisateur
   */
  hideUserMenu() {
    const overlay = document.getElementById('userMenuOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  /**
   * Configurer les écouteurs d'événements des modals
   */
  setupModalEventListeners() {
    // Modal YouTube
    const closeYouTubeModal = document.getElementById('closeYouTubeModal');
    const cancelYouTube = document.getElementById('cancelYouTube');
    const youtubeForm = document.getElementById('youtubeForm');

    if (closeYouTubeModal) {
      closeYouTubeModal.addEventListener('click', () => {
        this.hideYouTubeModal();
      });
    }

    if (cancelYouTube) {
      cancelYouTube.addEventListener('click', () => {
        this.hideYouTubeModal();
      });
    }

    if (youtubeForm) {
      youtubeForm.addEventListener('submit', (e) => {
                e.preventDefault();
        this.shareYouTubeVideo();
      });
    }

    // Modal Upload Image
    const closeImageModal = document.getElementById('closeImageModal');
    const cancelImage = document.getElementById('cancelImage');
    const selectImage = document.getElementById('selectImage');
    const imageFileInput = document.getElementById('imageFileInput');

    if (closeImageModal) {
      closeImageModal.addEventListener('click', () => {
        this.hideImageUploadModal();
      });
    }

    if (cancelImage) {
      cancelImage.addEventListener('click', () => {
        this.hideImageUploadModal();
      });
    }

    if (selectImage) {
      selectImage.addEventListener('click', () => {
        imageFileInput.click();
      });
    }

    if (imageFileInput) {
      imageFileInput.addEventListener('change', (e) => {
        this.handleImageUpload(e.target.files[0]);
      });
    }

    // Drag & Drop pour les images
    this.setupDragAndDrop();
  }

  /**
   * Configurer le drag & drop pour les images
   */
  setupDragAndDrop() {
    const imageUploadModal = document.getElementById('imageUploadModal');
    if (!imageUploadModal) return;

    const dropZone = imageUploadModal.querySelector('.border-dashed');

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-500', 'bg-blue-500/10');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
      
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        this.handleImageUpload(files[0]);
      }
    });
  }

  /**
   * Afficher la modal YouTube
   */
  showYouTubeModal() {
    const modal = document.getElementById('youtubeModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.getElementById('youtubeUrl').focus();
    }
  }

  /**
   * Masquer la modal YouTube
   */
  hideYouTubeModal() {
    const modal = document.getElementById('youtubeModal');
    if (modal) {
      modal.classList.add('hidden');
      document.getElementById('youtubeUrl').value = '';
    }
  }

  /**
   * Afficher la modal d'upload d'image
   */
  showImageUploadModal() {
    const modal = document.getElementById('imageUploadModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  /**
   * Masquer la modal d'upload d'image
   */
  hideImageUploadModal() {
    const modal = document.getElementById('imageUploadModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  /**
   * Partager une vidéo YouTube
   */
  async shareYouTubeVideo() {
    const url = document.getElementById('youtubeUrl').value.trim();
    if (!url) return;

    try {
      // Extraire l'ID de la vidéo YouTube
      const videoId = this.extractYouTubeId(url);
      if (!videoId) {
        this.showError('URL YouTube invalide');
        return;
      }

      // Envoyer le message avec les infos YouTube
            this.socket.emit('send_message', {
                roomId: this.currentRoom.id,
        content: `🎥 Vidéo YouTube: ${url}`,
        messageType: 'text',
        youtubeInfo: {
          videoId: videoId,
          url: url
        }
      });

      this.hideYouTubeModal();
      this.showSuccess('Vidéo YouTube partagée !');

    } catch (error) {
      console.error('Erreur lors du partage YouTube:', error);
      this.showError('Erreur lors du partage de la vidéo');
    }
  }

  /**
   * Extraire l'ID d'une URL YouTube
   */
  extractYouTubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  /**
   * Gérer l'upload d'image
   */
  async handleImageUpload(file) {
        if (!file) return;
        
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            this.showError('Veuillez sélectionner une image valide');
            return;
        }
        
    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.showError('L\'image est trop volumineuse (max 5MB)');
            return;
        }

    try {
      this.showInfo('Upload de l\'image en cours...');
      
            const formData = new FormData();
      formData.append('image', file);
            
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData
            });
            
      if (response.ok) {
            const result = await response.json();
            
                // Envoyer le message avec l'image
                this.socket.emit('send_message', {
                    roomId: this.currentRoom.id,
          content: `🖼️ Image partagée`,
          messageType: 'image',
          imageInfo: {
            url: result.image.url || result.url,
            filename: file.name,
            size: file.size
          }
        });

        this.hideImageUploadModal();
        this.showSuccess('Image partagée avec succès !');
        
            } else {
        const error = await response.json();
        this.showError(error.message || 'Erreur lors de l\'upload');
            }

        } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
            this.showError('Erreur lors de l\'upload de l\'image');
        }
    }
    
  /**
   * Déconnexion
   */
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Rediriger quand même
      window.location.href = '/';
    }
  }

  /**
   * Afficher un message de succès
   */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
  /**
   * Afficher un message d'erreur
   */
    showError(message) {
        this.showNotification(message, 'error');
    }
    
  /**
   * Afficher un message d'information
   */
    showInfo(message) {
        this.showNotification(message, 'info');
    }
    
  /**
   * Afficher une notification
   */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 max-w-sm ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    
    notification.textContent = message;
    document.body.appendChild(notification);
        
        // Auto-suppression après 5 secondes
            setTimeout(() => {
                if (notification.parentNode) {
        notification.remove();
                }
        }, 5000);
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});
