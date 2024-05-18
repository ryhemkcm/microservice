const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
 
const sendCommandeMessage = async (eventType, commandeData) => {
  try {
    await producer.connect();
    await producer.send({
      topic: 'commande-events', // Remplacer 'reservation-events' par 'commande-events'
      messages: [
        { value: JSON.stringify({ eventType, commandeData }) }
      ],
    });
    console.log('Message Kafka envoyé avec succès pour l\'événement:', eventType);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message Kafka:', error);
  } finally {
    await producer.disconnect();
  }
};

module.exports = {
  sendCommandeMessage,
};
