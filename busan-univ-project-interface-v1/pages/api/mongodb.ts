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
  analysisDates: string[];
}



console.log('start...');
if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

console.log('before uri');
const uri = process.env.MONGODB_URI;
console.log(uri);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AllData | { error: string }>
) {
  console.log(`req ${req.query}`);
  console.log(`res ${res}`);
  const { user, date } = req.query;
  console.log(`user ${user}`);
  console.log(`date ${date}`);

  if (!user) {
    return res.status(400).json({ error: 'User is required' });
  }
  console.log('before client');
  const client = new MongoClient(uri);
  console.log('after client' , client);

  try {
    console.log('in try');
    await client.connect();
    const db: Db = client.db('prophetdb');
    console.log('db', db);



    // 분석 날짜 가져오기
    const analysisDates = await db.collection('analysis_results').distinct('analysis_date', { user_email: user });
    console.log('analysisDates', analysisDates);

    // 특정 날짜가 제공된 경우에만 해당 날짜의 데이터를 가져옵니다.
    let calorieData: CalorieData[] = [];
    let predictionData: PredictionData[] = [];
    let analysisData: AnalysisData[] = [];
    let stepData: StepData[] = [];
    let sleepData: SleepData[] = [];

    if (date) {
      calorieData = await db.collection<CalorieData>('calorie_results').find({ user_email: user, calorie_date: date }).toArray();
      predictionData = await db.collection<PredictionData>('prediction_results').find({ user_email: user, prediction_date: date }).toArray();
      analysisData = await db.collection<AnalysisData>('analysis_results').find({ user_email: user, analysis_date: date }).toArray();
      stepData = await db.collection<StepData>('step_results').find({ user_email: user, step_date: date }).toArray();
      sleepData = await db.collection<SleepData>('sleep_results').find({ user_email: user, sleep_date: date }).toArray();
    }

    const allData: AllData = {
      calorieData,
      predictionData,
      analysisData,
      stepData,
      sleepData,
      analysisDates
    };

    res.status(200).json(allData);
  } catch (error) {
    console.error('Database connection failed', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  } finally {
    await client.close();
  }
}