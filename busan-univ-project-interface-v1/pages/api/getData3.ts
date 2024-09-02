import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
let client: MongoClient | null = null;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri as string);
    await client.connect();
  }
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const startTime = performance.now()
    const { collection, user_email } = req.query;

    if (!collection || !user_email) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const client = await connectToDatabase();
      const database = client.db('heart_rate_db');
      const dataCollection = database.collection(collection as string);

      const query = {
        user_email,
        // ['save_date']: date,
      };

      const result = await dataCollection.findOne(query);
      const endTime = performance.now()
      console.log(`getData ${collection}에서의 걸린 시간 ${endTime - startTime}ms`);

      if (result) {
        res.status(200).json(result.data);
      } else {
        res.status(404).json({ error: 'Data not found' });
      }
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
