#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Vérifier les arguments de ligne de commande
const args = process.argv.slice(2);
const shouldReset = args.includes('--reset') || args.includes('-r');
const shouldForce = args.includes('--force') || args.includes('-f');

console.log('🚀 Initialisation de la base de données JoindreRobin...\n');

if (shouldReset) {
  console.log('🔄 Mode RÉINITIALISATION activé - La base sera supprimée et recréée\n');
}

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

// Gérer la base de données (création ou réinitialisation)
try {
  console.log('🗄️  Vérification de la base de données...');
  const checkDb = `psql -h ${config.host} -p ${config.port} -U ${config.username} -d postgres -c "SELECT 1 FROM pg_database WHERE datname='${config.database}';"`;
  const dbExists = execSync(checkDb, { stdio: 'pipe' }).toString();
  
  if (dbExists.includes('1 row') || dbExists.includes('1 ligne')) {
    if (shouldReset) {
      console.log('🗑️  Suppression de la base de données existante...');
      
      // Fermer toutes les connexions actives
      const closeConnections = `psql -h ${config.host} -p ${config.port} -U ${config.username} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${config.database}' AND pid <> pg_backend_pid();"`;
      try {
        execSync(closeConnections, { stdio: 'pipe' });
      } catch (error) {
        // Ignorer les erreurs de fermeture de connexions
      }
      
      // Supprimer la base
      const dropDb = `dropdb -h ${config.host} -p ${config.port} -U ${config.username} ${config.database}`;
      execSync(dropDb, { stdio: 'inherit' });
      console.log('✅ Base de données supprimée\n');
      
      // Recréer la base
      console.log('📝 Recréation de la base de données...');
      const createDb = `createdb -h ${config.host} -p ${config.port} -U ${config.username} ${config.database}`;
      execSync(createDb, { stdio: 'inherit' });
      console.log('✅ Base de données recréée\n');
    } else {
      console.log('✅ Base de données existe déjà\n');
      console.log('💡 Utilisez --reset pour réinitialiser complètement la base\n');
      // Sortir ici car la base existe déjà et on ne veut pas la réinitialiser
      process.exit(0);
    }
  } else {
    console.log('📝 Création de la base de données...');
    const createDb = `createdb -h ${config.host} -p ${config.port} -U ${config.username} ${config.database}`;
    execSync(createDb, { stdio: 'inherit' });
    console.log('✅ Base de données créée\n');
  }
} catch (error) {
  console.error('❌ Erreur lors de la gestion de la base de données:', error.message);
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
console.log('   - 1 utilisateur Admin');
console.log('   - 5 salles (Général, Cousins, Lardo, Les Gogols, Keur)');
console.log('   - Messages et associations de démonstration');
console.log('');
console.log('🚀 Vous pouvez maintenant démarrer l\'application avec: npm start');
console.log('');
console.log('📖 Utilisation du script:');
console.log('   npm run db:init          # Initialisation normale');
console.log('   npm run db:reset         # Réinitialisation complète');
console.log('   node scripts/init-db.js  # Exécution directe');
console.log('   node scripts/init-db.js --reset  # Mode réinitialisation');
console.log('   node scripts/init-db.js -r       # Mode réinitialisation (raccourci)');
