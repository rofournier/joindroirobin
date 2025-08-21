// Configuration et constantes
const STORAGE_KEYS = {
    USERNAME: 'joindrerobin_username',
    THEME: 'joindrerobin_theme'
};

const THEMES = {
    light: 'light',
    dark: 'dark'
};

class ModernChatApp {
    constructor() {
        this.socket = null;
        this.username = null;
        this.currentRoom = null;
        this.users = [];
        this.messages = [];
        this.typingUsers = new Set();
        this.typingTimeout = null;
        
        this.init();
    }
    
    init() {
        this.loadStoredData();
        this.checkUsername();
        this.applyTheme();
        this.setupEventListeners();
        this.initializeSocket();
        this.loadRoomFromURL();
    }
    
    // Charger les données stockées
    loadStoredData() {
        // Récupérer le pseudo depuis l'URL en priorité, puis depuis le localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const usernameFromUrl = urlParams.get('username');
        
        if (usernameFromUrl) {
            this.username = usernameFromUrl;
            console.log('✅ Pseudo récupéré depuis l\'URL:', this.username);
        } else {
            this.username = localStorage.getItem(STORAGE_KEYS.USERNAME);
            console.log('📦 Pseudo récupéré depuis le localStorage:', this.username);
        }
        
        this.theme = localStorage.getItem(STORAGE_KEYS.THEME) || THEMES.light;
        
        console.log('🔍 Chat - Données chargées:', {
            username: this.username,
            theme: this.theme,
            storageKey: STORAGE_KEYS.USERNAME,
            allStorage: Object.keys(localStorage),
            usernameFromUrl: usernameFromUrl
        });
    }
    
    // Sauvegarder le thème
    saveTheme(theme) {
        this.theme = theme;
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }
    
    // Appliquer le thème
    applyTheme() {
        if (this.theme === THEMES.dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    
    // Changer de thème
    toggleTheme() {
        const newTheme = this.theme === THEMES.light ? THEMES.dark : THEMES.light;
        this.saveTheme(newTheme);
        this.applyTheme();
    }
    
    // Vérifier le pseudo
    checkUsername() {
        if (!this.username) {
            this.showError('Pseudo non défini. Retour au lobby.');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
    }
    
    // Initialiser Socket.IO
    initializeSocket() {
        this.socket = io();
        
        // Événements Socket.IO
        this.socket.on('connect', () => {
            console.log('🔌 Connecté au serveur');
        });
        
        this.socket.on('room_joined', (data) => {
            this.onRoomJoined(data);
        });
        
        this.socket.on('join_room_error', (data) => {
            this.onJoinRoomError(data);
        });
        
        this.socket.on('new_message', (data) => {
            this.onNewMessage(data);
        });
        
        this.socket.on('user_joined', (data) => {
            this.onUserJoined(data);
        });
        
        this.socket.on('user_left', (data) => {
            this.onUserLeft(data);
        });
        
        this.socket.on('user_typing', (data) => {
            this.onUserTyping(data);
        });
        
        this.socket.on('user_stop_typing', (data) => {
            this.onUserStopTyping(data);
        });
        
        this.socket.on('room_user_count_updated', (data) => {
            this.onUserCountUpdated(data);
        });
        
        this.socket.on('error', (data) => {
            this.showError(data.message);
        });
    }
    
    // Charger la salle depuis l'URL
    loadRoomFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        
        if (roomId) {
            this.joinRoom(parseInt(roomId));
        } else {
            this.showError('Aucune salle spécifiée');
        }
    }
    
    // Rejoindre une salle
    joinRoom(roomId) {
        if (!this.socket || !this.username) return;
        
        // Récupérer le mot de passe stocké pour les salles protégées
        const password = sessionStorage.getItem('roomPassword');
        
        this.socket.emit('join_room', {
            username: this.username,
            roomId: roomId,
            password: password
        });
        
        // Nettoyer le mot de passe du sessionStorage après utilisation
        if (password) {
            sessionStorage.removeItem('roomPassword');
        }
    }
    
    // Événements Socket.IO
    onRoomJoined(data) {
        this.currentRoom = data.room;
        this.users = data.users || [];
        this.messages = data.messages || [];
        
        this.updateRoomInfo(data.room);
        this.updateUserCount(this.users.length);
        this.updateUsersList(this.users);
        this.updateMessages(this.messages);
        
        console.log(`✅ Rejoint la salle: ${data.room.name}`);
        
        // Assurer qu'aucune vérification de protection ne se déclenche après connexion réussie
        console.log('🔒 Room protection status:', data.room.isProtected);
        console.log('✅ Accès à la salle confirmé par le serveur');
    }
    
    onJoinRoomError(data) {
        this.showError(`Impossible de rejoindre la salle: ${data.reason}`);
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
    
    onNewMessage(data) {
        console.log('📨 Nouveau message reçu:', data);
        console.log('📝 Structure du message:', {
            message: data.message,
            hasUser: !!data.message.user,
            username: data.message.user ? data.message.user.username : 'undefined',
            directUsername: data.message.username,
            created_at: data.message.created_at,
            created_at_type: typeof data.message.created_at
        });
        
        this.addMessage(data.message);
        this.scrollToBottom();
    }
    
    onUserJoined(data) {
        this.addUser(data.user);
        this.updateUserCount();
        this.showNotification(`${data.username} a rejoint la salle`, 'info');
    }
    
    onUserLeft(data) {
        this.removeUser(data.username);
        this.updateUserCount();
        this.showNotification(`${data.username} a quitté la salle`, 'info');
    }
    
    onUserTyping(data) {
        if (data.username !== this.username) {
            this.showTypingIndicator(data.username);
        }
    }
    
    onUserStopTyping(data) {
        if (data.username !== this.username) {
            this.hideTypingIndicator(data.username);
        }
    }
    
    onUserCountUpdated(data) {
        this.updateUserCount(data.count);
    }
    
    // Mettre à jour l'interface
    updateRoomInfo(room) {
        document.getElementById('roomName').textContent = room.name;
        document.getElementById('roomDescription').textContent = room.description || 'Aucune description';
    }
    
    updateUserCount(count = null) {
        const userCount = count !== null ? count : this.users.length;
        document.getElementById('userCount').textContent = userCount;
    }
    
    updateUsersList(users) {
        this.users = users;
        
        // Mettre à jour la sidebar desktop
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = users.map(user => this.createUserElement(user)).join('');
        
        // Mettre à jour la modal mobile
        const mobileUsersList = document.getElementById('mobileUsersList');
        mobileUsersList.innerHTML = users.map(user => this.createUserElement(user)).join('');
    }
    
    createUserElement(user) {
        return `
            <div class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-white text-sm font-medium">${user.username.charAt(0).toUpperCase()}</span>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">${user.username}</p>
                    <div class="flex items-center space-x-1">
                        <span class="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">En ligne</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    addUser(user) {
        if (!this.users.find(u => u.username === user.username)) {
            this.users.push(user);
            this.updateUsersList(this.users);
        }
    }
    
    removeUser(username) {
        this.users = this.users.filter(u => u.username !== username);
        this.updateUsersList(this.users);
    }
    
    updateMessages(messages) {
        this.messages = messages;
        const container = document.getElementById('messagesContainer');
        container.innerHTML = messages.map(message => this.createMessageElement(message)).join('');
        this.scrollToBottom();
    }
    
    addMessage(message) {
        this.messages.push(message);
        const container = document.getElementById('messagesContainer');
        container.insertAdjacentHTML('beforeend', this.createMessageElement(message));
    }
    
    createMessageElement(message) {
        // Gérer les messages système (qui n'ont pas de structure user)
        if (message.message_type === 'system') {
            return `
                <div class="flex justify-center">
                    <div class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm px-4 py-2 rounded-full">
                        ${message.content}
                    </div>
                </div>
            `;
        }
        
        // Extraire le nom d'utilisateur selon la structure du message
        const username = message.user ? message.user.username : message.username;
        const isOwnMessage = username === this.username;
        
        return `
            <div class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}">
                    ${!isOwnMessage ? `
                        <div class="flex items-center space-x-2 mb-1">
                            <div class="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                <span class="text-white text-xs font-medium">${username.charAt(0).toUpperCase()}</span>
                            </div>
                            <span class="text-xs text-gray-500 dark:text-gray-400">${username}</span>
                        </div>
                    ` : ''}
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                        <p class="text-gray-900 dark:text-white text-sm">${message.content}</p>
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}">
                        ${this.formatMessageTime(message.created_at)}
                    </div>
                </div>
            </div>
        `;
    }
    
    showTypingIndicator(username) {
        this.typingUsers.add(username);
        this.updateTypingIndicator();
    }
    
    hideTypingIndicator(username) {
        this.typingUsers.delete(username);
        this.updateTypingIndicator();
    }
    
    updateTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        const typingUsers = document.getElementById('typingUsers');
        
        if (this.typingUsers.size > 0) {
            const usersList = Array.from(this.typingUsers).join(', ');
            typingUsers.textContent = usersList;
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }
    
    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }
    
    // Formater l'heure d'un message
    formatMessageTime(createdAt) {
        try {
            let date;
            
            // Si c'est déjà un objet Date
            if (createdAt instanceof Date) {
                date = createdAt;
            }
            // Si c'est une chaîne ISO
            else if (typeof createdAt === 'string') {
                date = new Date(createdAt);
            }
            // Si c'est un timestamp
            else if (typeof createdAt === 'number') {
                date = new Date(createdAt);
            }
            // Si c'est un objet avec des propriétés de date
            else if (createdAt && typeof createdAt === 'object') {
                // Essayer de créer une date à partir des propriétés
                if (createdAt.year && createdAt.month && createdAt.day) {
                    date = new Date(createdAt.year, createdAt.month - 1, createdAt.day, 
                                  createdAt.hour || 0, createdAt.minute || 0, createdAt.second || 0);
                } else {
                    // Fallback : utiliser la date actuelle
                    date = new Date();
                }
            }
            // Fallback par défaut
            else {
                date = new Date();
            }
            
            // Vérifier que la date est valide
            if (isNaN(date.getTime())) {
                console.warn('⚠️ Date invalide détectée:', createdAt);
                return '--:--';
            }
            
            // Formater l'heure
            return date.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
        } catch (error) {
            console.error('❌ Erreur lors du formatage de la date:', error, createdAt);
            return '--:--';
        }
    }
    
    // Configuration de l'auto-resize
    setupAutoResize() {
        const textarea = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        
        textarea.addEventListener('input', () => {
            // Auto-resize
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
            
            // Mettre à jour le compteur de caractères
            const charCount = document.getElementById('charCount');
            charCount.textContent = textarea.value.length;
            
            // Activer/désactiver le bouton d'envoi
            sendBtn.disabled = textarea.value.trim().length === 0;
            
            // Gérer la frappe
            this.handleTyping();
        });
        
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    // Configuration des événements
    setupEventListeners() {
        // Bouton retour
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = '/';
        });
        
        // Menu de la salle
        document.getElementById('roomMenuBtn').addEventListener('click', () => {
            this.toggleRoomMenu();
        });
        
        // Fermer le menu en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#roomMenuBtn') && !e.target.closest('#roomMenu')) {
                this.hideRoomMenu();
            }
        });
        
        // Boutons du menu
        document.getElementById('showUsersBtn').addEventListener('click', () => {
            this.showUsersSidebar();
            this.hideRoomMenu();
        });
        
        document.getElementById('roomInfoBtn').addEventListener('click', () => {
            this.showRoomInfoModal();
            this.hideRoomMenu();
        });
        
        document.getElementById('leaveRoomBtn').addEventListener('click', () => {
            this.leaveRoom();
        });
        
        // Modal des utilisateurs (mobile)
        document.getElementById('closeUsersModal').addEventListener('click', () => {
            this.hideUsersSidebar();
        });
        
        // Modal des infos de la salle
        document.getElementById('closeRoomInfoModal').addEventListener('click', () => {
            this.hideRoomInfoModal();
        });
        
        // Bouton d'envoi
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Configuration de l'auto-resize
        this.setupAutoResize();
    }
    
    // Actions du menu
    toggleRoomMenu() {
        const menu = document.getElementById('roomMenu');
        menu.classList.toggle('hidden');
    }
    
    hideRoomMenu() {
        document.getElementById('roomMenu').classList.add('hidden');
    }
    
    showUsersSidebar() {
        if (window.innerWidth >= 1024) {
            // Sur desktop, la sidebar est toujours visible
            return;
        }
        
        // Sur mobile, afficher la modal
        document.getElementById('usersModal').classList.remove('hidden');
    }
    
    hideUsersSidebar() {
        document.getElementById('usersModal').classList.add('hidden');
    }
    
    showRoomInfoModal() {
        if (this.currentRoom) {
            document.getElementById('modalRoomName').textContent = this.currentRoom.name;
            document.getElementById('modalRoomDescription').textContent = this.currentRoom.description || 'Aucune description';
            document.getElementById('modalRoomCategory').textContent = this.currentRoom.category || 'Général';
            document.getElementById('modalRoomUsers').textContent = `${this.users.length} utilisateur(s)`;
            document.getElementById('modalRoomCreator').textContent = 'Admin';
        }
        
        document.getElementById('roomInfoModal').classList.remove('hidden');
    }
    
    hideRoomInfoModal() {
        document.getElementById('roomInfoModal').classList.add('hidden');
    }
    
    // Envoyer un message
    sendMessage() {
        const textarea = document.getElementById('messageInput');
        const message = textarea.value.trim();
        
        if (!message || !this.socket || !this.currentRoom) return;
        
        this.socket.emit('send_message', {
            username: this.username,
            roomId: this.currentRoom.id,
            content: message,
            messageType: 'text'
        });
        
        // Réinitialiser le textarea
        textarea.value = '';
        textarea.style.height = 'auto';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('sendBtn').disabled = true;
        
        // Arrêter l'indicateur de frappe
        this.handleStopTyping();
    }
    
    // Gérer la frappe
    handleTyping() {
        if (!this.socket || !this.currentRoom) return;
        
        this.socket.emit('typing', {
            username: this.username,
            roomId: this.currentRoom.id
        });
        
        // Arrêter l'indicateur après 3 secondes
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.handleStopTyping();
        }, 3000);
    }
    
    // Arrêter la frappe
    handleStopTyping() {
        if (!this.socket || !this.currentRoom) return;
        
        this.socket.emit('stop_typing', {
            username: this.username,
            roomId: this.currentRoom.id
        });
    }
    
    // Quitter la salle
    leaveRoom() {
        if (this.socket && this.currentRoom) {
            this.socket.emit('leave_room', {
                username: this.username,
                roomId: this.currentRoom.id
            });
        }
        
        window.location.href = '/';
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
        const notifications = document.getElementById('notifications');
        
        const notification = document.createElement('div');
        notification.className = `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 translate-x-full`;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        const colorClass = type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600';
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-lg">${icon}</span>
                <p class="text-gray-900 dark:text-white text-sm">${message}</p>
            </div>
        `;
        
        notifications.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-suppression après 5 secondes
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new ModernChatApp();
});
