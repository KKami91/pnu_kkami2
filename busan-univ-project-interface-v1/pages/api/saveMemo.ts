import { NextApiRequest, NextApiResponse } from 'next';
import MongoDBConnection from '@/components/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { user_email, dataType, timestamp, end, memo } = req.body;

  // Validation
  if (dataType === 'sleep') {
    if (!user_email || !dataType || !timestamp || !end || memo === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  } else {
    if (!user_email || !dataType || !timestamp || memo === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  }

  try {
    const db = await MongoDBConnection.getDb();
    const collection = db.collection(dataType);

    const query = dataType === 'sleep'
      ? {
          user_email,
          timestamp_start: new Date(timestamp),
          timestamp_end: new Date(end)
        }
      : {
          user_email,
          timestamp: new Date(timestamp)
        };

    const result = await collection.updateOne(
      query,
      { $set: { memo } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.status(200).json({ message: 'Memo saved successfully' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}