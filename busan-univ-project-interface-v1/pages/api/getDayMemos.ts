import { NextApiRequest, NextApiResponse } from 'next';
import MongoDBConnection from '@/components/lib/mongodb';
import { format } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { user_email, timestamp } = req.query;

  if (!user_email || !timestamp) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const db = await MongoDBConnection.getDb();
    const collection = db.collection('day_memo');

    const query = {
      user_email,
      timestamp: new Date(format(timestamp as string, 'yyyy-MM-dd HH:mm:ss')),
      memo: { $exists: true }
    };

    const memos = await collection.find(query).toArray();
    return res.status(200).json(memos);

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}