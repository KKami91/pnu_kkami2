import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

interface HRVData {
  metadata: {
    id: string;
  };
  startTime: string;
  samples: {
    time?: string;
    beatsPerMinute: number;
  }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const jsonData: HRVData[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'hrv.json'), 'utf-8'));

      const uploadPromises = jsonData.map((item) => {
        const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
          TableName: 'hrv_post5',
          Item: {
            'metadata.id': item.metadata.id,
            time: item.samples[0]?.time || item.startTime, // samples[0].time이 없는 경우 startTime 사용
            beatsPerMinute: item.samples[0].beatsPerMinute,
          },
        };
      
        return dynamoDB.put(params).promise();
      });

      await Promise.all(uploadPromises);

      res.status(200).json({ message: 'Data uploaded successfully' });
    } catch (error) {
      console.error('Error uploading data to DynamoDB:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}