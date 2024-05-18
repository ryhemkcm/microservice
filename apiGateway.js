
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const Produit = require("./produit");
const Commande = require("./commande");
const Client = require("./client");
const { sendProduitMessage } = require("./ProduitProducer");
const { sendClientMessage } = require("./clientProducer");
const { sendCommandeMessage } = require("./CommandeProducer");

const app = express();


app.use(cors());
app.use(bodyParser.json());

const clientProtoDefinition = protoLoader.loadSync("client.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const produitProtoDefinition = protoLoader.loadSync("produit.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const commandeProtoDefinition = protoLoader.loadSync("commande.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;
const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;
const commandeProto = grpc.loadPackageDefinition(
  commandeProtoDefinition
).commande;

const clientClient = new clientProto.ClientService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);
const produitClient = new produitProto.ProduitService(
  "localhost:50052",
  grpc.credentials.createInsecure()
);
const commandeClient = new commandeProto.CommandeService(
  "localhost:50053",
  grpc.credentials.createInsecure()
);

app.get("/client/:id", async (req, res) => {
  const client_id = req.params.id;
  clientClient.GetClient({ client_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.client);
    }
  });
});

app.post("/client", async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    const nouveauClient = new Client({ nom, email, password });
    
    await sendClientMessage("creation", {
      id: client._id,
      nom,
      email,
      password,
    });
    res.json(client);
  } catch (err) {
    res.status(500).send("Erreur lors de la création du client: " + err.message);
  }
});
app.put("/client/:id", async (req, res) => {
  try {
    const clientId = req.params.id;
    const { nom, email, password } = req.body;
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { nom, email, password },
      { new: true }
    );
    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(updatedClient);
  } catch (err) {
    console.error("Error updating client:", err);
    res.status(500).json({ message: "Error updating client" });
  }
});
app.delete("/client/:id", async (req, res) => {
  try {
    const clientId = req.params.id;
    const deletedClient = await Client.findByIdAndDelete(clientId);
    if (!deletedClient) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error("Error deleting client:", err);
    res.status(500).json({ message: "Error deleting client: " + err.message });
  }
});

app.get("/produit/:id", async (req, res) => {
  const id = req.params.id;
  produitClient.GetProduit({ id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.produit);
    }
  });
});

app.post("/produit", async (req, res) => {
  try {
    const { nom, description, qualite } = req.body;
    const nouveauProduit = new Produit({ nom, description, qualite });
    const produit = await nouveauProduit.save();
    await sendProduitMessage("creation", {
      id: produit._id,
      nom,
      description,
      qualite,
    });
    res.json(produit);
  } catch (err) {
    res.status(500).send("Erreur lors de la création du produit: " + err.message);
  }
});
app.put("/produit", async (req, res) => {
  try {
    const { id, nom, description, qualite } = req.body;

    // Check if 'id' is provided for updating an existing product
    if (id) {
      const updatedProduit = await Produit.findByIdAndUpdate(
        id,
        { nom, description, qualite },
        { new: true } // Return the updated document
      );

      if (!updatedProduit) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }

      // Send message for product update
      await sendProduitMessage("modification", {
        id: updatedProduit._id,
        nom: updatedProduit.nom,
        description: updatedProduit.description,
        qualite: updatedProduit.qualite,
      });

      return res.json(updatedProduit);
    } else {
      // Create a new product if 'id' is not provided
      const nouveauProduit = new Produit({ nom, description, qualite });
      const produit = await nouveauProduit.save();
      
      // Send message for product creation
      await sendProduitMessage("creation", {
        id: produit._id,
        nom,
        description,
        qualite,
      });

      return res.json(produit);
    }
  } catch (err) {
    res.status(500).send("Erreur lors de la création/mise à jour du produit: " + err.message);
  }
});

app.delete("/produit/:id", async (req, res) => {
  const id = req.params.id;
  produitClient.DeleteProduit({ id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: response.message });
    }
  });
});

app.get("/commande/:id", async (req, res) => {
  const commande_id = req.params.id;
  commandeClient.GetCommande({ commande_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.commande);
    }
  });
});

app.post("/commande", async (req, res) => {
  try {
    const { client_id, produit_id, quantite } = req.body;
    const nouvelleCommande = new Commande({
      client_id,
      produit_id,
      quantite,
    });
    const commande = await nouvelleCommande.save();
    await sendCommandeMessage("creation", {
      id: commande._id,
      client_id,
      produit_id,
      quantite,
    });
    res.json(commande);
  } catch (err) {
    res
      .status(500)
      .send("Erreur lors de la création de la commande: " + err.message);
  }
});

app.delete("/commande/:id", async (req, res) => {
  const commande_id = req.params.id;
  commandeClient.DeleteCommande({ commande_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: response.message });
    }
  });
});



const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway opérationnel sur le port ${port}`);
});