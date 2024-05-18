const { Kafka } = require('kafkajs'); // Importer le module Kafka

// Configuration du client Kafka
const kafka = new Kafka({
  clientId: 'commande-consumer', // Identifiant du client Kafka
  brokers: ['localhost:9092'], // Liste des brokers Kafka
});

// Création du consommateur Kafka
const consumer = kafka.consumer({ groupId: 'commande-group' }); // Groupe de consommateurs

// Fonction pour exécuter le consommateur Kafka
const run = async () => {
  try {
    await consumer.connect(); // Connexion au broker Kafka
    await consumer.subscribe({ topic: 'commande-events', fromBeginning: true }); // S'abonner au topic des événements de commande
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString()); // Convertir le message en JSON
        console.log('Received commande event:', event); // Afficher le message reçu

        // Traiter l'événement de commande en fonction du type d'événement
        switch (event.eventType) {
          case 'creation':
            handleCommandeCreation(event.commandeData); // Gérer la création de commande
            break;
          case 'modification':
            handleCommandeModification(event.commandeData); // Gérer la modification de commande
            break;
          case 'suppression':
            handleCommandeSuppression(event.commandeData); // Gérer la suppression de commande
            break;
          default:
            console.warn('Event type not recognized:', event.eventType); // Avertir en cas de type inconnu
        }
      },
    });
  } catch (error) {
    console.error('Error with Kafka consumer:', error); // Gérer les erreurs
  }
};

// Logique pour gérer la création de commande
const handleCommandeCreation = (commandeData) => {
  console.log('Handling commande creation event:', commandeData);
  // Ajoutez votre logique pour gérer la création de commande ici
};

// Logique pour gérer la modification de commande
const handleCommandeModification = (commandeData) => {
  console.log('Handling commande modification event:', commandeData);
  // Ajoutez votre logique pour gérer la modification de commande ici
};

// Logique pour gérer la suppression de commande
const handleCommandeSuppression = (commandeData) => {
  console.log('Handling commande suppression event:', commandeData);
  // Ajoutez votre logique pour gérer la suppression de commande ici
};

// Exécuter le consommateur Kafka
run().catch(console.error); // Gérer les erreurs globales
