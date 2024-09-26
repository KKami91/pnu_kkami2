import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { parseISO, startOfDay, endOfDay } from 'date-fns';

const uri = 'mongodb+srv://ghkdth919:NDP08tR24zOD5OcX@prophetdb.77dodcp.mongodb.net/?appName=prophetDB';
let client: MongoClient | null = null;

async function connectToDatabase() {
    if (!client) {
      client = new MongoClient(uri, {
        maxPoolSize: 10, // 연결 풀 크기 제한
        minPoolSize: 5,  // 최소 연결 유지
      });
      await client.connect();
    }
    return client;
  }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { startDate, endDate, user_email } = req.query;

    if (!startDate || !endDate || !user_email) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const client = await connectToDatabase();
      const database = client.db('heart_rate_db');
      const collections = ['bpm_test2', 'step_test2', 'calorie_test2', 'sleep_test2'];

      const start = startOfDay(parseISO(startDate as string));
      const end = endOfDay(parseISO(endDate as string));

      const results = await Promise.all(collections.map(async (collectionName) => {
        const collection = database.collection(collectionName);
        const count = await collection.countDocuments({
          user_email,
          timestamp: { $gte: start, $lte: end }
        });
        return { [collectionName]: count > 0 };
      }));

      const existence = Object.assign({}, ...results);

      res.status(200).json(existence);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}