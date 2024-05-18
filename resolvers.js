const { ApolloError } = require('apollo-server');
const Produit = require('./produit');
const Commande = require('./commande');
const Client = require('./client');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendProduitMessage } = require('./ProduitProducer');
const { sendClientMessage } = require('./clientProducer');
const { sendCommandeMessage } = require('./CommandeProducer');

// Charger les fichiers Protobuf
const produitProtoPath = './produit.proto';
const commandeProtoPath = './commande.proto';
const clientProtoPath = './client.proto';

// Charger les définitions Protobuf
const produitProtoDefinition = protoLoader.loadSync(produitProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const commandeProtoDefinition = protoLoader.loadSync(commandeProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Obtenir les services gRPC
const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;
const commandeProto = grpc.loadPackageDefinition(commandeProtoDefinition).commande;
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;

const clientProduit = new produitProto.ProduitService(
  'localhost:50054',
  grpc.credentials.createInsecure()
);

const clientCommande = new commandeProto.CommandeService(
  'localhost:50055',
  grpc.credentials.createInsecure()
);

const clientClient = new clientProto.ClientService(
  'localhost:50056',
  grpc.credentials.createInsecure()
);

const resolvers = {
  Query: {
    produit: async (_, { id }) => {
      try {
        return await Produit.findById(id);
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche du produit: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    produits: async () => {
      try {
        return await Produit.find();
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche des produits: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    commande: async (_, { id }) => {
      try {
        return await Commande.findById(id);
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche de la commande: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    commandes: async () => {
      try {
        return await Commande.find();
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche des commandes: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    client: async (_, { id }) => {
      try {
        return await Client.findById(id);
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche du client: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    clients: async () => {
      try {
        return await Client.find();
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche des clients: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
  },
  Mutation: {
    createClient: async (_, { nom, email, password }) => {
      try {
        const nouveauClient = new Client({ nom, email, password });
        const client = await nouveauClient.save();
        await sendClientMessage('creation', { id: client._id, nom, email, password });
        return client;
      } catch (error) {
        throw new ApolloError(`Erreur lors de la création du client: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    updateClient: async (_, { id, nom, email, password }) => {
      try {
        const client = await Client.findByIdAndUpdate(id, { nom, email, password }, { new: true });
        if (!client) {
          throw new ApolloError('Client non trouvé', 'NOT_FOUND');
        }
        return client;
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du client: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    createCommande: async (_, { nom, contact, adresse }) => {
      try {
        const nouvelleCommande = new Commande({ nom, contact, adresse });
        const commande = await nouvelleCommande.save();
        await sendCommandeMessage('creation', { id: commande._id, nom, contact, adresse });
        return commande;
      } catch (error) {
        throw new ApolloError(`Erreur lors de la création de la commande: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    deleteCommande: async (_, { id }) => {
      try {
        const commande = await Commande.findByIdAndDelete(id);
        if (!commande) {
          throw new ApolloError('Commande non trouvée', 'NOT_FOUND');
        }
        await sendCommandeMessage('suppression', { id });
        return 'Commande supprimée avec succès';
      } catch (error) {
        throw new ApolloError(`Erreur lors de la suppression de la commande: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    updateCommande: async (_, { id, nom, contact, adresse }) => {
      try {
        const commande = await Commande.findByIdAndUpdate(
          id,
          { nom, contact, adresse },
          { new: true }
        );
        if (!commande) {
          throw new ApolloError('Commande non trouvée', 'NOT_FOUND');
        }
        await sendCommandeMessage('modification', { id: commande._id, nom, contact, adresse });
        return commande;
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour de la commande: ${error.message}`, 'INTERNAL_ERROR');
      }
    },

    createProduit: async (_, { nom, description, qualite }) => {
      try {
        const nouveauProduit = new Produit({ nom, description, qualite });
        const produit = await nouveauProduit.save();
        await sendProduitMessage("creation", {
          id: produit._id,
          nom,
          description,
          qualite,
        });
        return produit;
      } catch (error) {
        throw new ApolloError(`Erreur lors de la création du produit: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    deleteProduit: async (_, { id }) => {
      try {
        const deletedProduit = await Produit.findByIdAndDelete(id);
        if (!deletedProduit) {
          throw new ApolloError('Produit non trouvé', 'NOT_FOUND');
        }
        // Ajoutez ici la logique d'envoi de message si nécessaire
        return 'Produit supprimé avec succès';
      } catch (error) {
        throw new ApolloError(`Erreur lors de la suppression du produit: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
    updateProduit: async (_, { id, nom, description, qualite }) => {
      try {
        const updatedProduit = await Produit.findByIdAndUpdate(
          id,
          { nom, description, qualite },
          { new: true }
        );
        if (!updatedProduit) {
          throw new ApolloError('Produit non trouvé', 'NOT_FOUND');
        }
        // Ajoutez ici la logique d'envoi de message si nécessaire
        return updatedProduit;
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du produit: ${error.message}`, 'INTERNAL_ERROR');
      }
    },
  },
};

module.exports = resolvers;

