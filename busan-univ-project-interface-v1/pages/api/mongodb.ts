import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, Db } from 'mongodb';
import { AllData, CalorieData, PredictionData, AnalysisData, StepData, SleepData } from '../../types/data';



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
  const { user, date } = req.query;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db: Db = client.db('prophetdb');

    // 항상 분석 날짜 가져오기
    const analysisDates = await db.collection('analysis_results').distinct('analysis_date');

    let calorieData: CalorieData[] = [];
    let predictionData: PredictionData[] = [];
    let analysisData: AnalysisData[] = [];
    let stepData: StepData[] = [];
    let sleepData: SleepData[] = [];

    if (user) {
      const query = date ? { user_email: user, analysis_date: date } : { user_email: user };
      
      // 날짜가 지정되지 않은 경우 가장 최근 날짜 사용
      const latestDate = date || (await db.collection('analysis_results').find({ user_email: user }).sort({ analysis_date: -1 }).limit(1).toArray())[0]?.analysis_date;

      if (latestDate) {
        calorieData = await db.collection<CalorieData>('calorie_results').find({ user_email: user, calorie_date: latestDate }).toArray();
        predictionData = await db.collection<PredictionData>('prediction_results').find({ user_email: user, prediction_date: latestDate }).toArray();
        analysisData = await db.collection<AnalysisData>('analysis_results').find({ user_email: user, analysis_date: latestDate }).toArray();
        stepData = await db.collection<StepData>('step_results').find({ user_email: user, step_date: latestDate }).toArray();
        sleepData = await db.collection<SleepData>('sleep_results').find({ user_email: user, sleep_date: latestDate }).toArray();
      }
    }

    const allData: AllData = {
      calorieData,
      predictionData,
      analysisData,
      stepData,
      sleepData,
      analysisDates: analysisDates || null
    };

    res.status(200).json(allData);
  } catch (error) {
    console.error('Database connection failed', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  } finally {
    await client.close();
  }
}