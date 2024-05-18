const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commandeSchema = new Schema({
  nom: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  adresse: {
    type: String,
    required: true,
  },
});

const Commande = mongoose.model('Commande', commandeSchema);

module.exports = Commande; // Assurez-vous que le modèle est bien exporté
