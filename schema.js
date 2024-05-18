const { gql } = require('apollo-server');


const typeDefs = gql`
    type Produit {
        id: String!
        nom: String!
        description: String!
        qualite: String!
    }

    type Commande {
        id: String!
        nom: String!
        contact: String!
        adresse: String!
    }

    type Client {
        id: String!
        nom: String!
        email: String!
        password: String!
    }

    type Query {
        produit(id: String!): Produit
        produits: [Produit]
        commande(id: String!): Commande
        commandes: [Commande]
        client(id: String!): Client
        clients: [Client]
    }

    type Mutation {
        createProduit(nom: String!, description: String!, qualite: String!): Produit
        deleteProduit(id: String!): String
        updateProduit(id: String!, nom: String!, description: String!, qualite: String!): Produit
    
        createCommande(nom: String!, contact: String!, adresse: String!): Commande
        deleteCommande(id: String!): String
        updateCommande(id: String!, nom: String!, contact: String!, adresse: String!): Commande
    
        createClient(nom: String!, email: String!, password: String!): Client
        deleteClient(id: String!): String
        updateClient(id: String!, nom: String!, email: String!, password: String!): Client
    }
    
`;

module.exports = typeDefs;
