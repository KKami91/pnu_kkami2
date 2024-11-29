import { NextApiRequest, NextApiResponse } from 'next';
import MongoDBConnection from '@/components/lib/mongodb';
import { format } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { user_email, startDate, endDate } = req.query;

  if (!user_email || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const db = await MongoDBConnection.getDb();
    const collections = ['bpm', 'step', 'calorie', 'sleep'];
    const memos = [];

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      let query;
      let project;

      if (collectionName === 'sleep') {
        query = {
          user_email,
          timestamp_start: {
            $gte: new Date(format(startDate as string, 'yyyy-MM-dd HH:mm:ss')),
            $lte: new Date(format(endDate as string, 'yyyy-MM-dd HH:mm:ss'))
          },
          memo: { $exists: true }
        };
        project = {
          timestamp_start: 1,
          timestamp_end: 1,
          memo: 1,
          type: { $literal: 'sleep' }
        };
      } else {
        query = {
          user_email,
          timestamp: {
            $gte: new Date(format(startDate as string, 'yyyy-MM-dd HH:mm:ss')),
            $lte: new Date(format(endDate as string, 'yyyy-MM-dd HH:mm:ss'))
          },
          memo: { $exists: true }
        };
        project = {
          timestamp: 1,
          memo: 1,
          type: { $literal: collectionName }
        };
      }

      const collectionMemos = await collection.find(query).project(project).toArray();
      memos.push(...collectionMemos);
    }

    return res.status(200).json(memos);

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}