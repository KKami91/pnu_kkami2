import { NextApiRequest, NextApiResponse } from 'next';
import MongoDBConnection from '@/components/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { user_email } = req.query;
  const collections = ['bpm', 'step', 'calorie', 'sleep'];

  if (!user_email) {
    return res.status(400).json({ error: 'Missing user_email' });
  }

  try {
    const db = await MongoDBConnection.getDb();

    const promises = collections.map(async (collectionName) => {
      const collection = db.collection(collectionName);

      const pipeline = [
        { $match: { user_email } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: collectionName === 'sleep' ? '$timestamp_start' : '$timestamp',
                timezone: '+09:00',
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return { collection: collectionName, data: results };
    });

    const results = await Promise.all(promises);
    return res.status(200).json(results);

  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}