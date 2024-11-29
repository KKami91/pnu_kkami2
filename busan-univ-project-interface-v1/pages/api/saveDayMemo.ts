import { NextApiRequest, NextApiResponse } from 'next';
import MongoDBConnection from '@/components/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { user_email, timestamp, memo } = req.body;

  if (!user_email || !timestamp || memo === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const db = await MongoDBConnection.getDb();
    const collection = db.collection('day_memo');

    const query = {
      user_email,
      timestamp: new Date(timestamp)
    };

    const result = await collection.updateOne(
      query,
      { $set: { memo } },
      { upsert: true }
    );

    return res.status(200).json({ message: 'Memo saved successfully' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}