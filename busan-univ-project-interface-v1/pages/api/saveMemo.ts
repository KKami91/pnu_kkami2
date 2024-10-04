import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { addHours } from 'date-fns'

const uri = process.env.MONGODB_URI

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { user_email, dataType, timestamp, memo } = req.body;

    if (!user_email || !dataType || !timestamp || memo === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const client = await MongoClient.connect(uri);
      const db = client.db('heart_rate_db');
      const collection = db.collection(`${dataType}_test3`);

      const result = await collection.updateOne(
        { user_email, timestamp: new Date(timestamp) },
        { $set: { memo } }
      );

      await client.close();

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

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