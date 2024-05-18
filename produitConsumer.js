const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'produit-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'produit-group' });

const run = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'produit-events', fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log('Received produit event:', event);
        // Traitez l'événement de produit ici en fonction de l'événement reçu (création, modification, suppression, etc.)
        // Exemple : Appelez les fonctions appropriées pour gérer les événements de produit
        switch (event.eventType) {
          case 'creation':
            handleProduitCreation(event.produitData);
            break;
          case 'modification':
            handleProduitModification(event.produitData);
            break;
          case 'suppression':
            handleProduitSuppression(event.produitData);
            break;
          default:
            console.warn('Event type not recognized:', event.eventType);
        }
      },
    });
  } catch (error) {
    console.error('Error with Kafka consumer:', error);
  }
};

const handleProduitCreation = (produitData) => {
  console.log('Handling produit creation event:', produitData);
  // Logique pour gérer la création de produit ici
};

const handleProduitModification = (produitData) => {
  console.log('Handling produit modification event:', produitData);
  // Logique pour gérer la modification de produit ici
};

const handleProduitSuppression = (produitData) => {
  console.log('Handling produit suppression event:', produitData);
  // Logique pour gérer la suppression de produit ici
};

run().catch(console.error);
