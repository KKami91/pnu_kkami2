import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

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
  if (req.method === 'POST') {
    const { user_email, dataType, timestamp, memo } = req.body;

    if (!user_email || !dataType || !timestamp || !memo) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const client = await connectToDatabase();
      const db = client.db('heart_rate_db');
      const collection = db.collection('memos');

      const result = await collection.updateOne(
        { user_email, dataType, timestamp },
        { $set: { memo } },
        { upsert: true }
      );

      await client.close();

      res.status(200).json({ message: 'Memo saved successfully' });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}