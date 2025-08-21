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

    // Éléments du drawer
    const drawerUserInitial = document.getElementById('drawerUserInitial');
    const drawerUserName = document.getElementById('drawerUserName');
    if (drawerUserInitial && this.currentUser) {
      drawerUserInitial.textContent = this.currentUser.username.charAt(0).toUpperCase();
    }
    if (drawerUserName && this.currentUser) {
      drawerUserName.textContent = this.currentUser.username;
    }
  }

  /**
   * Configurer les écouteurs d'événements
   */
  setupEventListeners() {
    // Drawer utilisateur mobile-first
    const userMenuButton = document.getElementById('userMenuButton');
    const userDrawer = document.getElementById('userDrawer');
    const closeDrawer = document.getElementById('closeDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawerLogoutButton = document.getElementById('drawerLogoutButton');

    if (userMenuButton && userDrawer) {
      // Ouvrir le drawer
      userMenuButton.addEventListener('click', () => {
        this.openUserDrawer();
      });
    }

    if (closeDrawer && userDrawer) {
      // Fermer le drawer
      closeDrawer.addEventListener('click', () => {
        this.closeUserDrawer();
      });
    }

    if (drawerOverlay && userDrawer) {
      // Fermer avec l'overlay
      drawerOverlay.addEventListener('click', () => {
        this.closeUserDrawer();
      });
    }

    if (drawerLogoutButton) {
      // Déconnexion depuis le drawer
      drawerLogoutButton.addEventListener('click', () => {
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

    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeUserDrawer();
      }
    });
  }

  /**
   * Ouvrir le drawer utilisateur
   */
  openUserDrawer() {
    const userDrawer = document.getElementById('userDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    if (userDrawer && drawerOverlay) {
      userDrawer.classList.remove('translate-x-full');
      userDrawer.classList.add('translate-x-0');
      drawerOverlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden'; // Empêcher le scroll
    }
  }

  /**
   * Fermer le drawer utilisateur
   */
  closeUserDrawer() {
    const userDrawer = document.getElementById('userDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    if (userDrawer && drawerOverlay) {
      userDrawer.classList.remove('translate-x-0');
      userDrawer.classList.add('translate-x-full');
      drawerOverlay.classList.add('hidden');
      document.body.style.overflow = ''; // Restaurer le scroll
    }
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
    
    // Mettre à jour le compteur
    const roomsCount = document.getElementById('roomsCount');
    if (roomsCount) {
      roomsCount.textContent = `${this.rooms.length} salle${this.rooms.length > 1 ? 's' : ''}`;
    }
    
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
    card.className = 'bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]';
    
    // Déterminer le statut et la couleur
    let statusText, statusColor, actionText, actionColor, statusIcon;
    
    if (room.userHasAccess) {
      statusText = 'Accès autorisé';
      statusColor = 'text-green-400';
      actionText = 'Rejoindre';
      actionColor = 'bg-green-500 hover:bg-green-600 active:bg-green-700';
      statusIcon = '✅';
    } else if (room.is_protected) {
      statusText = 'Mot de passe requis';
      statusColor = 'text-yellow-400';
      actionText = 'Rejoindre';
      actionColor = 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700';
      statusIcon = '🔒';
    } else {
      statusText = 'Accès libre';
      statusColor = 'text-blue-400';
      actionText = 'Rejoindre';
      actionColor = 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700';
      statusIcon = '🌐';
    }
    
    // Déterminer le nombre d'utilisateurs
    const userCount = room.userCount || 0;
    const maxUsers = room.max_users || 50;
    const userCountText = `${userCount}/${maxUsers}`;
    const userCountColor = userCount >= maxUsers ? 'text-red-400' : userCount > maxUsers * 0.8 ? 'text-yellow-400' : 'text-green-400';
    const userCountIcon = userCount >= maxUsers ? '🚫' : userCount > maxUsers * 0.8 ? '⚠️' : '👥';
    
    card.innerHTML = `
      <div class="space-y-3">
        <!-- Header avec titre et statut -->
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-white mb-1 truncate">${room.name}</h3>
            <p class="text-gray-400 text-sm line-clamp-2">${room.description || 'Aucune description'}</p>
          </div>
          <div class="flex-shrink-0 ml-3">
            <span class="text-2xl">${statusIcon}</span>
          </div>
        </div>
        
        <!-- Informations de statut -->
        <div class="flex items-center justify-between text-sm">
          <span class="${statusColor} font-medium">${statusText}</span>
          <span class="${userCountColor} flex items-center space-x-1">
            <span>${userCountIcon}</span>
            <span>${userCountText}</span>
          </span>
        </div>
        
        <!-- Bouton d'action -->
        <div class="pt-2">
          <button class="w-full ${actionColor} text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 transform active:scale-95">
            ${actionText}
          </button>
        </div>
      </div>
    `;

    // Ajouter l'événement de clic
    card.addEventListener('click', () => {
      this.joinRoom(room);
      // Feedback tactile
      card.style.transform = 'scale(0.98)';
      setTimeout(() => {
        card.style.transform = '';
      }, 150);
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
    const body = document.body;
    
    if (this.currentTheme === 'light') {
      // Thème clair
      document.documentElement.classList.remove('dark');
      body.classList.remove('bg-gray-900');
      body.classList.add('bg-gray-50');
      
      // Mettre à jour les icônes
      if (sunIcon) sunIcon.classList.remove('hidden');
      if (moonIcon) moonIcon.classList.add('hidden');
      
      // Mettre à jour le header
      this.updateHeaderTheme('light');
      
    } else {
      // Thème sombre
      document.documentElement.classList.add('dark');
      body.classList.remove('bg-gray-50');
      body.classList.add('bg-gray-900');
      
      // Mettre à jour les icônes
      if (sunIcon) sunIcon.classList.add('hidden');
      if (moonIcon) moonIcon.classList.remove('hidden');
      
      // Mettre à jour le header
      this.updateHeaderTheme('dark');
    }
  }

  /**
   * Mettre à jour le thème du header
   */
  updateHeaderTheme(theme) {
    const header = document.querySelector('header');
    if (!header) return;
    
    if (theme === 'light') {
      header.classList.remove('bg-gray-800', 'border-gray-700');
      header.classList.add('bg-white', 'border-gray-200', 'shadow-md');
      
      // Mettre à jour les textes
      const title = header.querySelector('h1');
      if (title) title.classList.remove('text-white');
      if (title) title.classList.add('text-gray-900');
      
      const subtitle = header.querySelector('p');
      if (subtitle) subtitle.classList.remove('text-gray-400');
      if (subtitle) subtitle.classList.add('text-gray-600');
      
    } else {
      header.classList.remove('bg-white', 'border-gray-200', 'shadow-md');
      header.classList.add('bg-gray-800', 'border-gray-700');
      
      // Mettre à jour les textes
      const title = header.querySelector('h1');
      if (title) title.classList.remove('text-gray-900');
      if (title) title.classList.add('text-white');
      
      const subtitle = header.querySelector('p');
      if (subtitle) subtitle.classList.remove('text-gray-600');
      if (subtitle) subtitle.classList.add('text-gray-400');
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
