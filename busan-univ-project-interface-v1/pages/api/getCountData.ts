import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://ghkdth919:NDP08tR24zOD5OcX@prophetdb.77dodcp.mongodb.net/?appName=prophetDB'
const client = new MongoClient(uri);

// async function getCountData(req: NextApiRequest, res: NextApiResponse) {
//     try {
//       const { user_email } = req.query; // user_email 추출
//       const collections = ['bpm', 'step', 'calorie', 'sleep']; // 사용할 컬렉션 목록
  
//       if (!user_email) {
//         return res.status(400).json({ error: 'Missing user_email' });
//       }
  
//       await client.connect(); // MongoDB 연결
//       const db = client.db('heart_rate_db');
  
//       // 모든 컬렉션에서 날짜별 데이터 집계 실행
//       const promises = collections.map(async (collectionName) => {
//         const collection = db.collection(collectionName);
  
//         let pipeline;

//         if (collectionName === 'sleep') {
//           // sleep 컬렉션의 경우 timestamp_start 기준으로 집계
//           pipeline = [
//             { $match: { user_email } },
//             {
//               $group: {
//                 _id: {
//                   $dateToString: {
//                     format: '%Y-%m-%d',
//                     date: '$timestamp_start',
//                     timezone: '+09:00', // UTC -> KST 변환
//                   },
//                 },
//                 count: { $sum: 1 },
//               },
//             },
//             { $sort: { _id: 1 } },
//           ];
//         } else {
//           // 다른 컬렉션들은 timestamp 기준으로 집계
//           pipeline = [
//             { $match: { user_email } },
//             {
//               $group: {
//                 _id: {
//                   $dateToString: {
//                     format: '%Y-%m-%d',
//                     date: '$timestamp',
//                     timezone: '+09:00', // UTC -> KST 변환
//                   },
//                 },
//                 count: { $sum: 1 },
//               },
//             },
//             { $sort: { _id: 1 } },
//           ];
//         }
  
//         const results = await collection.aggregate(pipeline).toArray();
//         //console.log('in getcoundData.ts , result', results)
//         return { collection: collectionName, data: results };
//       });

//       //console.log('in getcoundData.ts , result', results)
  
//       // 모든 컬렉션의 결과를 기다림
//       const results = await Promise.all(promises);

      
  
//       res.status(200).json(results); // 결과 응답
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     } finally {
//       await client.close(); // MongoDB 연결 종료
//     }
//   }
  
//   export default getCountData;

async function getCountData(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user_email } = req.query; // user_email 추출
    const collections = ['bpm', 'step', 'calorie', 'sleep']; // 사용할 컬렉션 목록

    if (!user_email) {
      return res.status(400).json({ error: 'Missing user_email' });
    }

    await client.connect(); // MongoDB 연결
    const db = client.db('heart_rate_db');

    // 모든 컬렉션에서 날짜별 데이터 집계 실행
    const promises = collections.map(async (collectionName) => {
      const collection = db.collection(collectionName);

      let pipeline;

      if (collectionName === 'sleep') {
        // sleep 컬렉션의 경우 timestamp_start 기준으로 집계
        pipeline = [
          { $match: { user_email } },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$timestamp_start',
                  timezone: '+09:00', // UTC -> KST 변환
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ];
      } else {
        // 다른 컬렉션들은 timestamp 기준으로 집계
        pipeline = [
          { $match: { user_email } },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$timestamp',
                  timezone: '+09:00', // UTC -> KST 변환
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ];
      }

      const results = await collection.aggregate(pipeline).toArray();
      console.log('in getcoundData.ts , result', results)
      return { collection: collectionName, data: results };
    });

    //console.log('in getcoundData.ts , result', results)

    // 모든 컬렉션의 결과를 기다림
    const results = await Promise.all(promises);

    

    res.status(200).json(results); // 결과 응답
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close(); // MongoDB 연결 종료
  }
}

export default getCountData;