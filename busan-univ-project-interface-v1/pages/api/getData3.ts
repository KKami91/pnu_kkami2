import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri as string)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { collection, user_email } = req.query

    if (!collection || !user_email) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    try {
      await client.connect()
      const database = client.db('heart_rate_db')
      const dataCollection = database.collection(collection as string)

      const query = {
        user_email, 
        // ['save_date']: date,
      }
      
      const result = await dataCollection.findOne(query)

      if (result) {
        res.status(200).json(result.data)
      } else {
        res.status(404).json({ error: 'Data not found' })
      }
    } catch (error) {
      console.error('Database error:', error)
      res.status(500).json({ error: 'Internal server error' })
    } finally {
      await client.close()
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}