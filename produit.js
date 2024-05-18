const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const produitSchema = new Schema({
  nom: {
    type: String,
    required: true, // Champs obligatoires
  },
  description: {
    type: String,
    required: true,
  },
  qualite: {
    type: String,
    required: true,
  },
});

const Produit = mongoose.model('Produit', produitSchema);

module.exports = Produit;
