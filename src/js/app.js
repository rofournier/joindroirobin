// Configuration et constantes
const STORAGE_KEYS = {
    THEME: 'joindrerobin_theme'
};

const THEMES = {
    light: 'light',
    dark: 'dark'
};

class LobbyApp {
    constructor() {
    this.currentUser = null;
        this.rooms = [];
    this.currentTheme = 'dark';
    
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
      this.loadRooms();
      
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
    
    // Charger le thème
    this.loadTheme();
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

    // Nom d'utilisateur dans le menu
    const userNameMenu = document.getElementById('userNameMenu');
    if (userNameMenu && this.currentUser) {
      userNameMenu.textContent = this.currentUser.username;
    }
  }

  /**
   * Configurer les écouteurs d'événements
   */
  setupEventListeners() {
    // Menu utilisateur
    const userMenuButton = document.getElementById('userMenuButton');
    if (userMenuButton) {
      userMenuButton.addEventListener('click', () => {
        this.toggleUserMenu();
      });
    }

    // Bouton déconnexion
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        this.logout();
      });
    }

    // Bouton thème
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Fermer le menu en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#userMenu') && !e.target.closest('#userMenuButton')) {
        this.hideUserMenu();
      }
    });
  }

  /**
   * Charger les salles disponibles
   */
    async loadRooms() {
        try {
            const response = await fetch('/api/rooms');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des salles');
      }

            this.rooms = await response.json();
      this.displayRooms();
      
        } catch (error) {
            console.error('Erreur lors du chargement des salles:', error);
            this.showError('Erreur lors du chargement des salles');
        }
    }
    
  /**
   * Afficher les salles sous forme de cartes
   */
  displayRooms() {
    const roomsGrid = document.getElementById('roomsGrid');
    if (!roomsGrid) return;

    if (this.rooms.length === 0) {
      roomsGrid.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
                    </div>
          <p class="text-sm">Aucune salle disponible</p>
            </div>
        `;
      return;
    }

    roomsGrid.innerHTML = '';
    
    this.rooms.forEach(room => {
      const roomCard = this.createRoomCard(room);
      roomsGrid.appendChild(roomCard);
    });
  }

  /**
   * Créer une carte de salle
   */
  createRoomCard(room) {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors cursor-pointer';
    
    // Déterminer le statut et la couleur
    let statusText, statusColor, actionText, actionColor;
    
    if (room.userHasAccess) {
      statusText = 'Accès autorisé';
      statusColor = 'text-green-400';
      actionText = 'Rejoindre';
      actionColor = 'bg-green-500 hover:bg-green-600';
    } else if (room.is_protected) {
      statusText = 'Mot de passe requis';
      statusColor = 'text-yellow-400';
      actionText = 'Rejoindre';
      actionColor = 'bg-blue-500 hover:bg-blue-600';
    } else {
      statusText = 'Accès libre';
      statusColor = 'text-blue-400';
      actionText = 'Rejoindre';
      actionColor = 'bg-blue-500 hover:bg-blue-600';
    }

    card.innerHTML = `
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-white mb-1">${room.name}</h3>
          <p class="text-sm text-gray-400 mb-2">${room.description || 'Aucune description'}</p>
          <div class="flex items-center space-x-4 text-xs">
            <span class="${statusColor}">${statusText}</span>
            <span class="text-gray-500">${room.userCount || 0} utilisateur(s)</span>
          </div>
        </div>
        <div class="ml-3">
          ${room.is_protected ? '<span class="text-yellow-400 text-2xl">🔒</span>' : '<span class="text-blue-400 text-2xl">🌐</span>'}
        </div>
      </div>
      <button class="w-full ${actionColor} text-white py-2 px-4 rounded-lg font-medium transition-colors">
        ${actionText}
      </button>
    `;

    // Ajouter l'événement de clic
    card.addEventListener('click', () => {
      this.joinRoom(room);
    });

    return card;
  }

  /**
   * Rejoindre une salle
   */
  async joinRoom(room) {
    try {
      if (room.userHasAccess) {
        // Accès direct
        window.location.href = `/chat?room=${room.id}`;
      } else if (room.is_protected) {
        // Demander le mot de passe
                this.showPasswordModal(room);
        } else {
        // Salle publique
        window.location.href = `/chat?room=${room.id}`;
      }
    } catch (error) {
      console.error('Erreur lors de la connexion à la salle:', error);
      this.showError('Erreur lors de la connexion à la salle');
    }
  }

  /**
   * Afficher la modal de mot de passe
   */
    showPasswordModal(room) {
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
          <p class="text-gray-400">${room.name}</p>
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
                                Annuler
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
      await this.validateRoomPassword(room.id, roomPassword.value);
    });

    cancelButton.addEventListener('click', () => {
            this.hidePasswordModal();
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
  async validateRoomPassword(roomId, password) {
    try {
            const response = await fetch(`/api/rooms/${roomId}/validate-password`, {
                method: 'POST',
                headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        this.hidePasswordModal();
        this.showSuccess('Mot de passe correct ! Redirection...');
        
        // Rediriger vers la salle
        setTimeout(() => {
          window.location.href = `/chat?room=${roomId}`;
        }, 1000);
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
   * Afficher/masquer le menu utilisateur
   */
  toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  /**
   * Masquer le menu utilisateur
   */
  hideUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
      menu.classList.add('hidden');
    }
  }

  /**
   * Charger le thème
   */
  loadTheme() {
    this.currentTheme = localStorage.getItem('joindrerobin_theme') || 'dark';
    this.applyTheme();
  }

  /**
   * Appliquer le thème
   */
  applyTheme() {
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    
    if (this.currentTheme === 'light') {
      document.documentElement.classList.remove('dark');
      if (sunIcon) sunIcon.classList.remove('hidden');
      if (moonIcon) moonIcon.classList.add('hidden');
    } else {
      document.documentElement.classList.add('dark');
      if (sunIcon) sunIcon.classList.add('hidden');
      if (moonIcon) moonIcon.classList.remove('hidden');
    }
  }

  /**
   * Basculer le thème
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('joindrerobin_theme', this.currentTheme);
    this.applyTheme();
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
  new LobbyApp();
});
