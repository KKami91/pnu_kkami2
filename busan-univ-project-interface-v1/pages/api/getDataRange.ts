// pages/api/getDataRange.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { subHours } from 'date-fns'


const uri = process.env.MONGODB_URI
let client: MongoClient | null = null;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri as string);
    await client.connect();
  }
  return client;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { collection, user_email } = req.query;

    if (!collection || !user_email) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const client = await connectToDatabase();
      const database = client.db('heart_rate_db');
      const dataCollection = database.collection(collection as string);

      const pipeline = [
        { $match: { user_email: user_email } },
        {
          $group: {
            _id: null,
            startDate: { $min: "$timestamp" },
            endDate: { $max: "$timestamp" }
          }
        },
        {
          $project: {
            _id: 0,
            startDate: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S.%L%z",
                date: "$startDate",
                timezone: "UTC"
              }
            },
            endDate: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S.%L%z",
                date: "$endDate",
                timezone: "UTC"
              }
            }
          }
        }
      ];

      const result = await dataCollection.aggregate(pipeline).toArray();

      if (result.length > 0) {
        res.status(200).json({
          startDate: result[0].startDate,
          endDate: result[0].endDate
        });
      } else {
        res.status(200).json({
          startDate: null,
          endDate: null
        });
      }
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}