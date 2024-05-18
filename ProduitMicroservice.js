const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const Produit = require('./produit');
const { sendProduitMessage } = require('./ProduitProducer');

const produitProtoPath = './produit.proto';

const produitProtoDefinition = protoLoader.loadSync(produitProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;

mongoose.connect('mongodb://127.0.0.1:27017/vente')
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });

const produitService = {
  getProduit: async (call, callback) => {
    try {
      const produitId = call.request.produit_id;
      const produit = await Produit.findById(produitId);

      if (!produit) {
        return callback({ code: grpc.status.NOT_FOUND, message: "Produit non trouvé" });
      }

      callback(null, { produit });
    } catch (err) {
      console.error("Erreur lors de la recherche du produit:", err);
      callback({ code: grpc.status.INTERNAL, message: "Erreur lors de la recherche du produit" });
    }
  },

  searchProduits: async (call, callback) => {
    try {
      const produits = await Produit.find();
      callback(null, { produits });
    } catch (err) {
      console.error("Erreur lors de la recherche des produits:", err);
      callback({ code: grpc.status.INTERNAL, message: "Erreur lors de la recherche des produits" });
    }
  },

  createProduit: async (call, callback) => {
    try {
      const { nom, description, qualite } = call.request;
      const nouveauProduit = new Produit({ nom, description, qualite });
      const produit = await nouveauProduit.save();
      
      await sendProduitMessage('creation', { id: produit._id, nom, qualite });
  
      callback(null, { produit });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  updateProduit: async (call, callback) => {
    try {
      const { produit_id, nom, description, qualite } = call.request;
      const produit = await Produit.findByIdAndUpdate(
        produit_id,
        { nom, description, qualite },
        { new: true }
      );

      if (!produit) {
        return callback({ code: grpc.status.NOT_FOUND, message: "Produit non trouvé" });
      }

      await sendProduitMessage('modification', produit);
      callback(null, { produit });
    } catch (err) {
      console.error("Erreur lors de la mise à jour du produit:", err);
      callback({ code: grpc.status.INTERNAL, message: "Erreur lors de la mise à jour du produit: " + err.message });
    }
  },

  deleteProduit: async (call, callback) => {
    try {
      const produitId = call.request.produit_id;
      const produit = await Produit.findByIdAndDelete(produitId);

      if (!produit) {
        return callback({ code: grpc.status.NOT_FOUND, message: "Produit non trouvé" });
      }

      await sendProduitMessage('suppression', produit);

      callback(null, { message: "Produit supprimé avec succès" });
    } catch (err) {
      console.error("Erreur lors de la suppression du produit:", err);
      callback({ code: grpc.status.INTERNAL, message: "Erreur lors de la suppression du produit: " + err.message });
    }
  },
};

const server = new grpc.Server();
server.addService(produitProto.ProduitService.service, produitService);

server.bindAsync('0.0.0.0:50054', grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Échec de la liaison du serveur:", err);
    return;
  }
  server.start();
  console.log(`Service Produit opérationnel sur le port ${boundPort}`);
});

