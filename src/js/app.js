// Configuration et constantes
const STORAGE_KEYS = {
    USERNAME: 'joindrerobin_username',
    THEME: 'joindrerobin_theme'
};

const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

// Classe principale de l'application
class JoindreRobinChat {
    constructor() {
        this.username = null;
        this.currentTheme = THEMES.LIGHT;
        this.rooms = [];
        this.isDrawerOpen = false;
        
        this.init();
    }
    
    init() {
        this.loadStoredData();
        this.setupEventListeners();
        this.applyTheme();
        this.checkUsername();
        this.loadRooms();
    }
    
    // Gestion des données stockées
    loadStoredData() {
        this.username = localStorage.getItem(STORAGE_KEYS.USERNAME);
        this.currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || THEMES.LIGHT;
        console.log('📦 Données chargées depuis le storage:', {
            username: this.username,
            theme: this.currentTheme
        });
    }
    
    saveUsername(username) {
        this.username = username;
        localStorage.setItem(STORAGE_KEYS.USERNAME, username);
        this.updateUsernameDisplay();
    }
    
    saveTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
        this.applyTheme();
    }
    
    // Gestion du thème
    applyTheme() {
        const body = document.body;
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');
        
        if (this.currentTheme === THEMES.DARK) {
            body.classList.add('dark');
            themeIcon.className = 'fas fa-sun mr-3';
            themeText.textContent = 'Mode clair';
        } else {
            body.classList.remove('dark');
            themeIcon.className = 'fas fa-moon mr-3';
            themeText.textContent = 'Mode sombre';
        }
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
        this.saveTheme(newTheme);
    }
    
    // Gestion du pseudo
    checkUsername() {
        console.log('🔍 Vérification du pseudo:', this.username);
        if (!this.username) {
            console.log('❌ Pas de pseudo trouvé, affichage de la modal de bienvenue');
            this.showInitialUsernameModal();
        } else {
            console.log('✅ Pseudo trouvé:', this.username, '- Pas de modal de bienvenue');
            this.updateUsernameDisplay();
        }
    }
    
    showInitialUsernameModal() {
        const modal = document.getElementById('initialUsernameModal');
        modal.classList.remove('hidden');
    }
    
    hideInitialUsernameModal() {
        const modal = document.getElementById('initialUsernameModal');
        modal.classList.add('hidden');
    }
    
    showUsernameModal() {
        const modal = document.getElementById('usernameModal');
        modal.classList.remove('hidden');
        document.getElementById('newUsername').value = this.username || '';
        document.getElementById('newUsername').focus();
    }
    
    hideUsernameModal() {
        const modal = document.getElementById('usernameModal');
        modal.classList.add('hidden');
    }
    
    updateUsernameDisplay() {
        const usernameElement = document.getElementById('currentUsername');
        if (usernameElement && this.username) {
            usernameElement.textContent = this.username;
        }
    }
    
    // Gestion du drawer
    toggleDrawer() {
        const drawer = document.getElementById('profileDrawer');
        this.isDrawerOpen = !this.isDrawerOpen;
        
        if (this.isDrawerOpen) {
            drawer.classList.remove('closed');
            drawer.classList.add('open');
        } else {
            drawer.classList.remove('open');
            drawer.classList.add('closed');
        }
    }
    
    closeDrawer() {
        const drawer = document.getElementById('profileDrawer');
        this.isDrawerOpen = false;
        drawer.classList.remove('open');
        drawer.classList.add('closed');
    }
    
    // Gestion des salles
    async loadRooms() {
        try {
            const response = await fetch('/api/rooms');
            this.rooms = await response.json();
            this.renderRooms();
        } catch (error) {
            console.error('Erreur lors du chargement des salles:', error);
            this.showError('Erreur lors du chargement des salles');
        }
    }
    
    renderRooms() {
        const grid = document.getElementById('roomsGrid');
        if (!grid) return;
        
        grid.innerHTML = this.rooms.map(room => this.createRoomCard(room)).join('');
    }
    
    createRoomCard(room) {
        const isProtected = room.isProtected;
        const protectionIcon = isProtected ? 'fas fa-lock' : 'fas fa-unlock';
        const protectionColor = isProtected ? 'text-yellow-500' : 'text-green-500';
        
        return `
            <div class="card p-6 cursor-pointer group" data-room-id="${room.id}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                            ${room.name}
                        </h3>
                        <p class="text-secondary-600 dark:text-secondary-400 text-sm mb-3">
                            ${room.description}
                        </p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i class="${protectionIcon} ${protectionColor} text-lg"></i>
                        <span class="text-xs text-secondary-500 dark:text-secondary-400">
                            ${room.userCount} utilisateurs
                        </span>
                    </div>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span class="text-xs text-secondary-500 dark:text-secondary-400">
                            En ligne
                        </span>
                    </div>
                    
                    <button class="btn-primary text-sm py-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Rejoindre
                    </button>
                </div>
            </div>
        `;
    }
    
    // Gestion des événements
    setupEventListeners() {
        // Bouton profil
        document.getElementById('profileBtn')?.addEventListener('click', () => {
            this.toggleDrawer();
        });
        
        // Fermeture du drawer
        document.getElementById('closeDrawer')?.addEventListener('click', () => {
            this.closeDrawer();
        });
        
        // Fermeture du drawer en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (this.isDrawerOpen && !e.target.closest('#profileDrawer') && !e.target.closest('#profileBtn')) {
                this.closeDrawer();
            }
        });
        
        // Changement de thème
        document.getElementById('toggleThemeBtn')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Changement de pseudo
        document.getElementById('changeUsernameBtn')?.addEventListener('click', () => {
            this.showUsernameModal();
        });
        
        // Formulaire de pseudo initial
        document.getElementById('initialUsernameForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('initialUsername').value.trim();
            if (username) {
                this.saveUsername(username);
                this.hideInitialUsernameModal();
                this.showSuccess(`Bienvenue, ${username} !`);
            }
        });
        
        // Formulaire de changement de pseudo
        document.getElementById('usernameForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('newUsername').value.trim();
            if (username) {
                this.saveUsername(username);
                this.hideUsernameModal();
                this.showSuccess(`Pseudo changé pour ${username} !`);
            }
        });
        
        // Annulation du changement de pseudo
        document.getElementById('cancelUsername')?.addEventListener('click', () => {
            this.hideUsernameModal();
        });
        
        // Clic sur les salles
        document.addEventListener('click', (e) => {
            const roomCard = e.target.closest('[data-room-id]');
            if (roomCard) {
                const roomId = roomCard.dataset.roomId;
                this.joinRoom(roomId);
            }
        });
        
        // Gestion des touches clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isDrawerOpen) {
                    this.closeDrawer();
                }
                this.hideUsernameModal();
                this.hideInitialUsernameModal();
                this.hidePasswordModal();
            }
        });
    }
    
    // Actions sur les salles
    joinRoom(roomId) {
        console.log('🚪 joinRoom appelé avec roomId:', roomId);
        const room = this.rooms.find(r => r.id == roomId);
        console.log('🔍 Salle trouvée:', room);
        
        if (!room) {
            console.log('❌ Salle non trouvée');
            return;
        }
        
        if (!this.username) {
            console.log('❌ Pas de pseudo, affichage erreur');
            this.showError('Vous devez d\'abord définir un pseudo');
            return;
        }
        
        console.log('🔒 Salle protégée?', room.isProtected);
        
        if (room.isProtected) {
            console.log('🔐 Affichage modal mot de passe pour:', room.name);
            // Demander le mot de passe pour les salles protégées
            this.showPasswordModal(room);
        } else {
            console.log('✅ Accès direct à la salle publique:', room.name);
            // Accès direct aux salles publiques
            this.redirectToChat(room.id);
        }
    }
    
    // Afficher la modale de mot de passe
    showPasswordModal(room) {
        console.log('🔐 showPasswordModal appelé pour:', room.name);
        // Créer la modale de mot de passe
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.id = 'passwordModal';
        
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="modal-content">
                    <div class="text-center mb-6">
                        <h3 class="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                            Salle protégée
                        </h3>
                        <p class="text-secondary-600 dark:text-secondary-400 mb-4">
                            La salle <strong>${room.name}</strong> nécessite un mot de passe
                        </p>
                    </div>
                    
                    <form id="passwordForm" class="space-y-4">
                        <input 
                            type="password" 
                            id="roomPassword" 
                            class="input-field" 
                            placeholder="Mot de passe de la salle"
                            required
                        >
                        
                        <div class="flex space-x-3">
                            <button type="button" id="cancelPassword" class="flex-1 btn-secondary">
                                Annuler
                            </button>
                            <button type="submit" class="flex-1 btn-primary">
                                Rejoindre
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gérer le formulaire
        const form = modal.querySelector('#passwordForm');
        const cancelBtn = modal.querySelector('#cancelPassword');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('roomPassword').value;
            if (password) {
                this.joinProtectedRoom(room.id, password);
                this.hidePasswordModal();
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            this.hidePasswordModal();
        });
        
        // Focus sur le champ mot de passe
        setTimeout(() => {
            document.getElementById('roomPassword').focus();
        }, 100);
    }
    
    // Cacher la modale de mot de passe
    hidePasswordModal() {
        const modal = document.getElementById('passwordModal');
        if (modal) {
            modal.remove();
        }
    }
    
    // Rejoindre une salle protégée
    async joinProtectedRoom(roomId, password) {
        try {
            console.log('🔐 Validation du mot de passe pour la salle:', roomId);
            
            // Valider le mot de passe avec le backend
            const response = await fetch(`/api/rooms/${roomId}/validate-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: this.username,
                    password: password
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Mot de passe validé, redirection vers le chat');
                // Stocker le mot de passe temporairement pour la connexion Socket.IO
                sessionStorage.setItem('roomPassword', password);
                this.redirectToChat(roomId);
            } else {
                console.log('❌ Mot de passe invalide:', result.reason);
                this.showError(result.reason || 'Mot de passe incorrect');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la validation du mot de passe:', error);
            this.showError('Erreur lors de la connexion à la salle');
        }
    }
    
    // Rediriger vers le chat
    redirectToChat(roomId) {
        // Passer le pseudo en paramètre d'URL pour éviter les problèmes de localStorage
        window.location.href = `/chat.html?room=${roomId}&username=${encodeURIComponent(this.username)}`;
    }
    
    // Notifications
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showInfo(message) {
        this.showNotification(message, 'info');
    }
    
    showNotification(message, type = 'info') {
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = `fixed top-24 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className += ` ${colors[type]}`;
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-suppression
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    new JoindreRobinChat();
});

// Gestion des erreurs globales
window.addEventListener('error', (e) => {
    console.error('Erreur globale:', e.error);
});

// Gestion des promesses rejetées
window.addEventListener('unhandledrejection', (e) => {
    console.error('Promesse rejetée:', e.reason);
});
