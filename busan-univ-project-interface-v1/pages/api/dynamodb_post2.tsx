import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const params: AWS.DynamoDB.DocumentClient.ScanInput = {
        TableName: 'hrv_time',
      };

      const result = await dynamoDB.scan(params).promise();
      console.log('Number of items:', result.Items?.length || 0);
      res.status(200).json(result.Items);
    } catch (error) {
      console.error('Error accessing DynamoDB:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      res.status(500).json({ error: 'Internal Server Error', message: error });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}