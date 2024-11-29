import { NextApiRequest, NextApiResponse } from 'next';
import MongoDBConnection from '@/components/lib/mongodb';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { user_email, searchTerm } = req.query;

  if (!user_email) {
    return res.status(400).json({ error: 'Missing user_email parameter' });
  }

  try {
    const db = await MongoDBConnection.getDb();
    const collections = ['bpm', 'step', 'calorie', 'sleep', 'day_memo'];
    const searchResults = [];

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      let query = {
        user_email,
        memo: { 
          $exists: true,
          $regex: searchTerm ? new RegExp(searchTerm as string, 'i') : /./
        }
      };

      let project = collectionName === 'sleep' 
        ? {
            timestamp_start: 1,
            timestamp_end: 1,
            memo: 1,
            type: { $literal: collectionName }
          }
        : {
            timestamp: 1,
            memo: 1,
            type: { $literal: collectionName }
          };

      const memos = await collection.find(query).project(project).toArray();
      searchResults.push(...memos);
    }

    // Sort results by timestamp (or timestamp_start for sleep data)
    searchResults.sort((a, b) => {
      const aTime = a.timestamp || a.timestamp_start;
      const bTime = b.timestamp || b.timestamp_start;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return res.status(200).json(searchResults);

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}