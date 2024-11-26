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



//     const { user_email, timestamp } = req.query;

//     if (!user_email || !timestamp) {
//       return res.status(400).json({ error: 'Missing required parameters' });
//     }

//     try {
//       const client = await MongoClient.connect(uri);
//       const db = client.db('heart_rate_db');
//       const collection = db.collection('day_memo')

//       const memos = [];

//         let query;
//         let project;

//           query = {
//             user_email,
//             timestamp: new Date(format(timestamp as string, 'yyyy-MM-dd HH:mm:ss')),
//             memo: { $exists: true }
//           };

        
        
//         const collectionMemos = await collection.find(query).toArray();
//         // console.log('startDate & endDate', startDate, endDate)
//         // console.log('startDate & endDate', new Date(format(startDate as string, 'yyyy-MM-dd HH:mm:ss')), new Date(format(endDate as string, 'yyyy-MM-dd HH:mm:ss')))
//         // //console.log('startDate & endDate', new Date(startDate as string), new Date(endDate as string))
//         // //console.log('startDate & endDate', new Date(format(startDate as string, 'yyyy-MM-dd HH:mm:ssXXX')), new Date(format(endDate as string, 'yyyy-MM-dd HH:mm:ssXXX')))
//         // //console.log('CONVERT startDate & endDate', new Date(formatInTimeZone(new Date(startDate as string), 'UTC', 'yyyy-MM-dd HH:mm:ss')), new Date(formatInTimeZone(new Date(endDate as string), 'UTC', 'yyyy-MM-dd HH:mm:ss')))
//         // console.log(`in getMemos.ts ---- collectionMemos ----`, collectionMemos)
//         memos.push(...collectionMemos);
      

//       //await client.close();

//       console.log('getMemos;; ',memos)

//         res.status(200).json(memos);
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

  const { user_email, timestamp } = req.query;

  if (!user_email || !timestamp) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const client = await MongoDBConnection.getClient();
    const db = client.db('heart_rate_db');
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