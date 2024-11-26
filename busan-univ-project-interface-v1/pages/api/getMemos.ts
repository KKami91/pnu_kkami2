// import { NextApiRequest, NextApiResponse } from 'next';
// import { MongoClient } from 'mongodb';
// import { addHours, format } from 'date-fns'
// import { formatInTimeZone } from 'date-fns-tz';

// const uri = 'mongodb+srv://ghkdth919:NDP08tR24zOD5OcX@prophetdb.77dodcp.mongodb.net/?appName=prophetDB'

// const adjustTimeZone = (date: Date) => {
//   return addHours(date, 9);
// };

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === 'GET') {
//     const { user_email, startDate, endDate } = req.query;

//     if (!user_email || !startDate || !endDate) {
//       return res.status(400).json({ error: 'Missing required parameters' });
//     }

//     try {
//       const client = await MongoClient.connect(uri);
//       const db = client.db('heart_rate_db');
//       //const collections = ['bpm_test3', 'step_test3', 'calorie_test3', 'sleep_test3'];
//       const collections = ['bpm', 'step', 'calorie', 'sleep'];

//       const memos = [];

//       for (const collectionName of collections) {
//         const collection = db.collection(collectionName);
//         let query;
//         let project;

//         //if (collectionName === 'sleep_test3') {
//         if (collectionName === 'sleep') {
//           query = {
//             user_email,
//             timestamp_start: { 
//               $gte: new Date(format(startDate as string, 'yyyy-MM-dd HH:mm:ss')),
//               $lte: new Date(format(endDate as string, 'yyyy-MM-dd HH:mm:ss'))
//             },
//             memo: { $exists: true }
//           };
//           project = {
//             timestamp_start: 1,
//             timestamp_end: 1,
//             memo: 1,
//             type: { $literal: 'sleep' }
//           };
//         } else {
//           query = {
//             user_email,
//             timestamp: { 
//               $gte: new Date(format(startDate as string, 'yyyy-MM-dd HH:mm:ss')),
//               $lte: new Date(format(endDate as string, 'yyyy-MM-dd HH:mm:ss'))
//             },
//             memo: { $exists: true }
//           };
//           project = {
//             timestamp: 1,
//             memo: 1,
//             type: { $literal: collectionName.split('_')[0] }
//           };
//         }

//         const collectionMemos = await collection.find(query).project(project).toArray();
//         // console.log('startDate & endDate', startDate, endDate)
//         // console.log('startDate & endDate', new Date(format(startDate as string, 'yyyy-MM-dd HH:mm:ss')), new Date(format(endDate as string, 'yyyy-MM-dd HH:mm:ss')))
//         // //console.log('startDate & endDate', new Date(startDate as string), new Date(endDate as string))
//         // //console.log('startDate & endDate', new Date(format(startDate as string, 'yyyy-MM-dd HH:mm:ssXXX')), new Date(format(endDate as string, 'yyyy-MM-dd HH:mm:ssXXX')))
//         // //console.log('CONVERT startDate & endDate', new Date(formatInTimeZone(new Date(startDate as string), 'UTC', 'yyyy-MM-dd HH:mm:ss')), new Date(formatInTimeZone(new Date(endDate as string), 'UTC', 'yyyy-MM-dd HH:mm:ss')))
//         // console.log(`in getMemos.ts ---- collectionMemos ----`, collectionMemos)
//         memos.push(...collectionMemos);
//       }

//       await client.close();

//       res.status(200).json(memos);
//     } catch (error) {
//       console.error('Database error:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   } else {
//     res.setHeader('Allow', ['GET']);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }

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