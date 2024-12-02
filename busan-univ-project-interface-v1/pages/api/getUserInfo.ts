import { NextApiRequest, NextApiResponse } from 'next';
import MongoDBConnection from '@/components/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

//   const { user_email } = req.query;

//   if (!user_email) {
//     return res.status(400).json({ error: 'Missing required parameters' });
//   }

  try {
    const db = await MongoDBConnection.getDb();
    const dataCollection = db.collection('user_info');

    const result = await dataCollection.find().toArray();
    console.log('in get user info result')
    return res.status(200).json(result);

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}