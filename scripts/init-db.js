#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Initialisation de la base de données JoindreRobin...\n');

// Configuration de la base de données
const config = {
  username: process.env.DB_USER || 'floune',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flounedb',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432
};

console.log('📋 Configuration de la base de données:');
console.log(`   Host: ${config.host}:${config.port}`);
console.log(`   Database: ${config.database}`);
console.log(`   User: ${config.username}`);
console.log('');

// Vérifier que PostgreSQL est accessible
try {
  console.log('🔍 Vérification de la connexion PostgreSQL...');
  const testConnection = `psql -h ${config.host} -p ${config.port} -U ${config.username} -d postgres -c "SELECT 1;"`;
  execSync(testConnection, { stdio: 'pipe' });
  console.log('✅ Connexion PostgreSQL établie\n');
} catch (error) {
  console.error('❌ Impossible de se connecter à PostgreSQL');
  console.error('   Vérifiez que PostgreSQL est démarré et accessible');
  console.error('   Vérifiez vos identifiants de connexion');
  process.exit(1);
}

// Créer la base de données si elle n'existe pas
try {
  console.log('🗄️  Vérification de la base de données...');
  const checkDb = `psql -h ${config.host} -p ${config.port} -U ${config.username} -d postgres -c "SELECT 1 FROM pg_database WHERE datname='${config.database}';"`;
  const dbExists = execSync(checkDb, { stdio: 'pipe' }).toString();
  
  if (!dbExists.includes('1 row')) {
    console.log('📝 Création de la base de données...');
    const createDb = `createdb -h ${config.host} -p ${config.port} -U ${config.username} ${config.database}`;
    execSync(createDb, { stdio: 'inherit' });
    console.log('✅ Base de données créée\n');
  } else {
    console.log('✅ Base de données existe déjà\n');
  }
} catch (error) {
  console.error('❌ Erreur lors de la création de la base de données:', error.message);
  process.exit(1);
}

// Installer les dépendances si nécessaire
try {
  console.log('📦 Vérification des dépendances...');
  execSync('npm list sequelize-cli', { stdio: 'pipe' });
  console.log('✅ Sequelize CLI installé\n');
} catch (error) {
  console.log('📥 Installation de Sequelize CLI...');
  execSync('npm install -g sequelize-cli', { stdio: 'inherit' });
  console.log('✅ Sequelize CLI installé\n');
}

// Exécuter les migrations
try {
  console.log('🔄 Exécution des migrations...');
  const migrationsPath = path.join(__dirname, '..', 'migrations');
  execSync(`npx sequelize-cli db:migrate --migrations-path ${migrationsPath}`, { 
    stdio: 'inherit',
    env: { ...process.env, ...config }
  });
  console.log('✅ Migrations exécutées\n');
} catch (error) {
  console.error('❌ Erreur lors des migrations:', error.message);
  process.exit(1);
}

// Exécuter les seeds
try {
  console.log('🌱 Exécution des seeds...');
  const seedersPath = path.join(__dirname, '..', 'seeders');
  execSync(`npx sequelize-cli db:seed:all --seeders-path ${seedersPath}`, { 
    stdio: 'inherit',
    env: { ...process.env, ...config }
  });
  console.log('✅ Seeds exécutés\n');
} catch (error) {
  console.error('❌ Erreur lors des seeds:', error.message);
  process.exit(1);
}

console.log('🎉 Base de données initialisée avec succès !');
console.log('');
console.log('📊 Tables créées:');
console.log('   - users (utilisateurs)');
console.log('   - rooms (salles de chat)');
console.log('   - user_rooms (associations utilisateur-salle)');
console.log('   - messages (messages de chat)');
console.log('');
console.log('👥 Données de démonstration:');
console.log('   - 3 utilisateurs (JoindreRobin, Floune, ChatBot)');
console.log('   - 4 salles (Général, Développement, Gaming, Musique)');
console.log('   - Messages et associations de démonstration');
console.log('');
console.log('🚀 Vous pouvez maintenant démarrer l\'application avec: npm start');
