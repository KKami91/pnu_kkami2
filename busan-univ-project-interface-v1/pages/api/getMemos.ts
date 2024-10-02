import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { addHours } from 'date-fns'

const uri = process.env.MONGODB_URI

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { user_email, startDate, endDate } = req.query;

    if (!user_email || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const client = await MongoClient.connect(uri);
      const db = client.db('heart_rate_db');
      const collections = ['bpm_test2', 'step_test2', 'calorie_test2'];

      const memos = [];

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        const collectionMemos = await collection.find({
          user_email,
          timestamp: { 
            $gte: new Date(startDate as string), 
            $lte: new Date(endDate as string) 
          },
          memo: { $exists: true }
        }).project({
          timestamp: 1,
          memo: 1,
          type: { $substr: [collectionName, 0, { $indexOfBytes: [collectionName, '_'] }] }
        }).toArray();

        memos.push(...collectionMemos);
      }

      await client.close();

      res.status(200).json(memos);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
