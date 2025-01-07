import { NextApiRequest, NextApiResponse } from 'next';
import MongoDBConnection from '@/components/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { collection, user_email } = req.query;

  if (!collection || !user_email) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const db = await MongoDBConnection.getDb();
    const dataCollection = db.collection(collection as string);

    const matchStage = { user_email };

    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          _id: 0,
          ds: {
            $dateToString: {
              format: "%Y-%m-%dT%H:%M:%S.%L%z",
              date: { $add: ["$ds"] },
              timezone: "UTC"
            }
          },
          min_pred_bpm: 1,
          hour_pred_bpm: 1,
        }
      }
    ];

    const result = await dataCollection.aggregate(pipeline).toArray();
    return res.status(200).json(result);

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}