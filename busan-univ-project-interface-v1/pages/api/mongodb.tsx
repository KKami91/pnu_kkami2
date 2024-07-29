import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, Db } from 'mongodb';

// 각 컬렉션의 데이터 타입을 정의합니다.
interface CalorieData {
  ds : string;
  calorie : number;
}

interface PredictionData {
  ds : string;
  y : number;
  yhat : number;
}

interface AnalysisData {
  ds : string;
  sdnn : number;
  rmssd : number;
}

interface StepData {
  ds : string;
  step : number;
}

interface SleepData {
  ds_start : string;
  ds_end : string;
  stage : string;
}


interface AllData {
  calorieData: CalorieData[];
  predictionData: PredictionData[];
  analysisData: AnalysisData[];
  stepData: StepData[];
  sleepData: SleepData[];
}



if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local');
  }
  
  const uri = process.env.MONGODB_URI;
  
  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AllData | { error: string }>
  ) {
    const client = new MongoClient(uri);

  try {
    await client.connect();
    const db: Db = client.db('prophetdb');

    // 각 컬렉션에서 데이터를 가져옵니다.
    const calorieData = await db.collection<CalorieData>('calorie_results').find({}).toArray();
    const predictionData = await db.collection<PredictionData>('prediction_results').find({}).toArray();
    const analysisData = await db.collection<AnalysisData>('analysis_results').find({}).toArray();
    const stepData = await db.collection<StepData>('step_results').find({}).toArray();
    const sleepData = await db.collection<SleepData>('sleep_results').find({}).toArray();

    // 모든 데이터를 하나의 객체로 합칩니다.
    const allData: AllData = {
      calorieData,
      predictionData,
      analysisData,
      stepData,
      sleepData
    };

    res.status(200).json(allData);
  } catch (error) {
    console.error('Database connection failed', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  } finally {
    await client.close();
  }
}