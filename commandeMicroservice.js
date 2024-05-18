const mongoose = require('mongoose');

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const Commande = require('./commande');
const { sendCommandeMessage } = require('./CommandeProducer');

const commandeProtoPath = './commande.proto';

const commandeProtoDefinition = protoLoader.loadSync(commandeProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const commandeProto = grpc.loadPackageDefinition(commandeProtoDefinition).commande;

mongoose.connect('mongodb://127.0.0.1:27017/shop')
  .then(() => console.log('Connecté à la base de données MongoDB "shop"'))
  .catch((err) => {
    console.error('Erreur de connexion à la base de données MongoDB "shop":', err);
    process.exit(1);
  });

const commandeService = {
  getCommande: async (call, callback) => {
    try {
      const commandeId = call.request.commande_id;
      const commande = await Commande.findById(commandeId);

      if (!commande) {
        return callback(new Error("Commande non trouvée"));
      }

      callback(null, { commande });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche de la commande"));
    }
  },

  searchCommandes: async (call, callback) => {
    try {
      const commandes = await Commande.find();
      callback(null, { commandes });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche des commandes"));
    }
  },
  
  createCommande: async (call, callback) => {
    try {
      const { nom, contact, adresse } = call.request;
      const nouvelleCommande = new Commande({ nom, contact, adresse });
      const commande = await nouvelleCommande.save();
      
      await sendCommandeMessage('creation', { id: commande._id, nom, contact, adresse });
  
      callback(null, { commande });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  
  updateCommande: async (call, callback) => {
    try {
      const { commande_id, nom, contact, adresse } = call.request;
      const commande = await Commande.findByIdAndUpdate(
        commande_id,
        { nom, contact, adresse },
        { new: true }
      );

      if (!commande) {
        return callback({ code: grpc.status.NOT_FOUND, message: "Commande non trouvée" });
      }

      await sendCommandeMessage('modification', commande);
      callback(null, { commande });
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la commande:", err);
      callback({ code: grpc.status.INTERNAL, message: "Erreur lors de la mise à jour de la commande: " + err.message });
    }
  },
  
  deleteCommande: async (call, callback) => {
    try {
      const commandeId = call.request.commande_id;
      const commande = await Commande.findByIdAndDelete(commandeId);

      if (!commande) {
        return callback(new Error("Commande non trouvée"));
      }

      await sendCommandeMessage('suppression', commande);

      callback(null, { message: "Commande supprimée avec succès" });
    } catch (err) {
      callback(new Error("Erreur lors de la suppression de la commande: " + err.message));
    }
  },
};

const server = new grpc.Server();
server.addService(commandeProto.CommandeService.service, commandeService);

server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Échec de la liaison du serveur:", err);
    return;
  }
  server.start();
  console.log(`Service Commande opérationnel sur le port ${boundPort}`);
});
