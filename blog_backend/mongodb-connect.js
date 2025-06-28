const { MongoClient, ServerApiVersion } = require('mongodb');

// Replace this with your actual password
const uri = "mongodb+srv://robertmoreno837:ALsIJ9H3pDqgqbgZ@cluster0.rkijrix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
