// import { NextApiRequest, NextApiResponse } from 'next';
// import { MongoClient } from 'mongodb';
// import { addHours } from 'date-fns'

// const uri = 'mongodb+srv://ghkdth919:NDP08tR24zOD5OcX@prophetdb.77dodcp.mongodb.net/?appName=prophetDB'

// const adjustTimeZone = (date: Date) => {
//     return addHours(date, 9);
//   };

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === 'POST') {
//     const { user_email, dataType, timestamp, end, memo } = req.body;

//     if (dataType === 'sleep') {
//       if (!user_email || !dataType || !timestamp || !end || memo === undefined) {
//         return res.status(400).json({ error: 'Missing required parameters' });
//       }
//     } else {
//       if (!user_email || !dataType || !timestamp || memo === undefined) {
//         return res.status(400).json({ error: 'Missing required parameters' });
//       }
//     }


//     console.log('is Save Data ----> ', memo)


//     try {
//       const client = await MongoClient.connect(uri);
//       const db = client.db('heart_rate_db');
//       //const collection = db.collection(`${dataType}_test3`);
//       const collection = db.collection(`${dataType}`);

//       let query;
//       if (dataType === 'sleep') {
//         //console.log('memomemo')
//         query = { 
//           user_email, 
//           timestamp_start: new Date(timestamp),
//           timestamp_end: new Date(end)
//         };
//       } else {
//         query = { 
//           user_email, 
//           timestamp: new Date(timestamp) 
//         };
//       }

//       console.log('queryquery', query)

//       const result = await collection.updateOne(
//         query,
//         { $set: { memo } }
//       );

//       await client.close();

//       if (result.matchedCount === 0) {
//         return res.status(404).json({ error: 'Document not found' });
//       }

//       res.status(200).json({ message: 'Memo saved successfully' });
//     } catch (error) {
//       console.error('Database error:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   } else {
//     res.setHeader('Allow', ['POST']);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }

//   // export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   //   if (req.method === 'POST') {
//   //     const { user_email, dataType, timestamp, end, memo } = req.body;
  
//   //     if (!user_email || !dataType || !timestamp || memo === undefined) {
//   //       return res.status(400).json({ error: 'Missing required parameters' });
//   //     }
  
//   //     try {
//   //       const client = await MongoClient.connect(uri);
//   //       const db = client.db('heart_rate_db');
//   //       const collection = db.collection(`${dataType}_test3`);
  
//   //       const result = await collection.updateOne(
//   //         { user_email, timestamp: new Date(timestamp) },
//   //         { $set: { memo } }
//   //       );
  
//   //       await client.close();
  
//   //       if (result.matchedCount === 0) {
//   //         return res.status(404).json({ error: 'Document not found' });
//   //       }
  
//   //       res.status(200).json({ message: 'Memo saved successfully' });
//   //     } catch (error) {
//   //       console.error('Database error:', error);
//   //       res.status(500).json({ error: 'Internal server error' });
//   //     }
//   //   } else {
//   //     res.setHeader('Allow', ['POST']);
//   //     res.status(405).end(`Method ${req.method} Not Allowed`);
//   //   }
//   // }

import { NextApiRequest, NextApiResponse } from 'next';
import MongoDBConnection from '@/components/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { user_email, dataType, timestamp, end, memo } = req.body;

  // Validation
  if (dataType === 'sleep') {
    if (!user_email || !dataType || !timestamp || !end || memo === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  } else {
    if (!user_email || !dataType || !timestamp || memo === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  }

  try {
    const client = await MongoDBConnection.getClient();
    const db = client.db('heart_rate_db');
    const collection = db.collection(dataType);

    const query = dataType === 'sleep'
      ? {
          user_email,
          timestamp_start: new Date(timestamp),
          timestamp_end: new Date(end)
        }
      : {
          user_email,
          timestamp: new Date(timestamp)
        };

    const result = await collection.updateOne(
      query,
      { $set: { memo } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.status(200).json({ message: 'Memo saved successfully' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}