const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/shop'); // Connexion à MongoDB avec le nom de ta base de données
    console.log('Connecté à la base de données de ton projet');
  } catch (error) {
    console.error('Erreur de connexion à la base de données de ton projet:', error.message);
    process.exit(1); // Quitte le processus en cas d'erreur de connexion
  }
};

module.exports = connectDB;
