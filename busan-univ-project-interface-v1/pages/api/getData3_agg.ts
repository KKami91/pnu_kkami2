// import { NextApiRequest, NextApiResponse } from 'next';
// import { MongoClient } from 'mongodb';
// import { startOfDay, endOfDay, subDays, addDays, subHours, startOfWeek, endOfWeek, parseISO, addHours } from 'date-fns'

// const uri = process.env.MONGODB_URI
// let client: MongoClient | null = null;

// async function connectToDatabase() {
//     if (!client) {
//       client = new MongoClient(uri);
//       await client.connect();
//     }
//     return client;
//   }
  
//   const adjustTimeZone = (date: Date) => {
//     return addHours(date, 9);
//   };
  
//   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method === 'GET') {
//       const startTime = performance.now();
//       const { collection, user_email, startDate, endDate } = req.query;
  
//       //console.log(`in getData3_div date : ${startDate} ~ ${endDate}`);
  
//       if (!collection || !user_email || !startDate || !endDate) {
//         return res.status(400).json({ error: 'Missing required parameters' });
//       }
  
//       try {
//         const client = await connectToDatabase();
//         const database = client.db('heart_rate_db');
//         const dataCollection = database.collection(collection as string);
  
//         const start = adjustTimeZone(startOfDay(parseISO(startDate as string)));
//         const end = adjustTimeZone(endOfDay(parseISO(endDate as string)));
  
//         //console.log(`In getData3_div Date Range : ${start} ~ ${end}`);
  
//         let matchStage: any = {
//           user_email,
//           timestamp: { $gte: start, $lte: end }
//         };
  
//         let projectStage: any = {
//           _id: 0,
//           timestamp: 1,
//           timestamp_start: 1,
//           timestamp_end: 1,
//           value: 1
//         }
  
//         if (collection === 'sleep_test3') {
//           matchStage = {
//             user_email,
//             timestamp_start: { $gte: start, $lte: end }
//           };
//         }
  
//       //   if (collection === 'sleep_test3') {
//       //     prject = {
//       //       user_email,
//       //       timestamp_start: { $gte: start, $lte: end }
//       //     };
//       //   }
  
//         const pipeline = [
//           { 
//               $match: matchStage 
//           },
//           { 
//               $project: projectStage
//           }
//         ]
  
//         const startTime = performance.now()
//         const result = await dataCollection.aggregate(pipeline).toArray();
        
//         //console.log(`**********${collection} result 길이 : ${result.length} & 시간대 : ${startDate} ~ ${endDate}********`);
//         const endTime = performance.now();
//         console.log(`in getData3_agg -> ${collection} result 걸린 시간 : ${endTime - startTime} // ${result.length}`)
  
//         if (result) {
//           res.status(200).json(result);
//         } else {
//           res.status(404).json({ error: 'Data not found' });
//         }
//       } catch (error) {
//         console.error('Database error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//       }
//     } else {
//       res.setHeader('Allow', ['GET']);
//       res.status(405).end(`Method ${req.method} Not Allowed`);
//     }
//   }
  
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { startOfDay, endOfDay, subDays, addDays, subHours, startOfWeek, endOfWeek, parseISO, addHours } from 'date-fns'

const uri = process.env.MONGODB_URI
let client: MongoClient | null = null;
  
  

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

const adjustTimeZone = (date: Date) => {
  return addHours(date, 9);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const startTime = performance.now();
    const { collection, user_email, startDate, endDate } = req.query;

    console.log(`@@@@@@@@@@@@@@@@@ in getData3_div original date : ${startDate} ~ ${endDate}`);

    if (!collection || !user_email || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const client = await connectToDatabase();
      const database = client.db('heart_rate_db');
      const dataCollection = database.collection(collection as string);

      // 로컬 전용
      //const start = adjustTimeZone(startOfDay(parseISO(startDate as string)));
      //const end = adjustTimeZone(endOfDay(parseISO(endDate as string)));

      // 배포 전용
      const start = startOfDay(parseISO(startDate as string));
      const end = endOfDay(parseISO(endDate as string));

      console.log(`%%%%%%%%%%%%%% In getData3_div convert date : ${start} ~ ${end}`);

      let matchStage: any = {
        user_email,
        timestamp: { $gte: start, $lte: end }
      };

      let projectStage: any = {
        _id: 0,
        timestamp: 1,
        timestamp_start: 1,
        timestamp_end: 1,
        value: 1
      }

      if (collection === 'sleep_test3') {
        matchStage = {
          user_email,
          timestamp_start: { $gte: start, $lte: end }
        };
      }

    //   if (collection === 'sleep_test3') {
    //     prject = {
    //       user_email,
    //       timestamp_start: { $gte: start, $lte: end }
    //     };
    //   }

      const pipeline = [
        { 
            $match: matchStage 
        },
        { 
            $project: projectStage
        }
      ]

      const startTime = performance.now()
      const result = await dataCollection.aggregate(pipeline).toArray();
      
      //console.log(`**********${collection} result 길이 : ${result.length} & 시간대 : ${startDate} ~ ${endDate}********`);
      const endTime = performance.now();
      //console.log(`in getData3_agg -> result 걸린 시간 : ${endTime - startTime} ------- ${collection} ----- ${result.length} --- ${start} --- ${end}`)
      //console.log(result.slice(0,5), result.slice(result.length - 5, result.length))

      if (result) {
        res.status(200).json(result);
      } else {
        res.status(404).json({ error: 'Data not found' });
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



