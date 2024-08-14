import React, { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import MultiChart from '../../components/MultiChart3';
import CombinedChart from '../../components/CombinedChart3';
import { SkeletonLoader } from '../../components/SkeletonLoaders3';
import { LaptopMinimal, LayoutGrid } from 'lucide-react';

const users = ['hswchaos@gmail.com', 'subak63@gmail.com']
const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app'

const LoadingSpinner = () => (
  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2">
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
  </div>
)

interface DataItem {
  ds: string;
  bpm?: number;
  step?: number;
  calorie?: number;
  rmssd?: number;
  sdnn?: number;
  min_pred_bpm: number | null;
  pred_rmssd?: number;
}

interface DataBPM {
  ds: string;
  bpm: number | null;
}

interface DataStep {
  ds: string;
  step: number | null;
}

interface DataCalorie {
  ds: string;
  calorie: number | null;
}

interface DataSleep {
  ds_start: string;
  ds_end: string;
  stage: number | null;
}

interface DataFeature {
  ds: string;
  rmssd: number | null;
  sdnn: number | null;
}

interface DataPrediction {
  ds: string;
  pred_bpm: number | null;
}



interface FeatureResponse {
  hour_hrv: DataFeature[];
  day_hrv: DataFeature[];
}

interface DataPredictionMinute {
  ds: string;
  min_pred_bpm: number | null;
}



export default function Home() {
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showGraphs, setShowGraphs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveDates, setSaveDates] = useState<string[]>([]);

  const [bpmData, setBpmData] = useState<DataItem[]>([]);
  const [stepData, setStepData] = useState<DataItem[]>([]);
  const [calorieData, setCalorieData] = useState<DataItem[]>([]);


  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<'combined' | 'multi'>('combined');

  const [featureMinuteData, setFeatureMinuteData] = useState<DataFeature[]>([]);
  const [featureHourData, setFeatureHourData] = useState<DataFeature[]>([]);
  const [featureDayData, setFeatureDayData] = useState<DataFeature[]>([]);
  const [predictMinuteData, setPredictMinuteData] = useState<DataPredictionMinute[]>([]);
  const [predictHourData, setPredictHourData] = useState<DataPrediction[]>([]);
  const [predictDayData, setPredictDayData] = useState<DataPrediction[]>([]);

  const { globalStartDate, globalEndDate } = useMemo(() => {
    const allData = [...bpmData, ...stepData, ...calorieData];
    const allDates = allData.map(item => new Date(item.ds).getTime());
    return {
      globalStartDate: allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date(),
      globalEndDate: allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date()
    };
  }, [bpmData, stepData, calorieData]);

  const fetchData = async (collection: string, user: string) => {
    try {
      // console.log(`Fetching ${collection} data for user ${user}`);
      const response = await axios.get('/api/getData3', {
        params: { collection, user_email: user }
      });
      // console.log(`Fetched ${collection} data:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${collection} data:`, error);
      throw error;
    }
  };

  const handleBrushChange = (domain: [number, number] | null) => {
    console.log("Brush domain changed:", domain);
    // 여기에 브러시 변경에 대한 추가 로직을 구현할 수 있습니다.
  };

  const handleDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value
    setSelectedDate(date)
    if (date) {
      setIsLoading(true)
      setError(null)
      setShowGraphs(false)
      setRenderTime(null)
      startTimeRef.current = performance.now();
      try {
        const [bpm, step, calorie] = await Promise.all([
          fetchData('bpm', selectedUser),
          fetchData('steps', selectedUser),
          fetchData('calories', selectedUser),
          
        ]);

        setBpmData(bpm);
        setStepData(step);
        setCalorieData(calorie);
        
        await fetchPredictionData(selectedUser);

        setShowGraphs(true);
      } catch (error) {
        console.error('Error in handleDateSelect:', error);
        setError(`Error loading data: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false)
      }
    }
  }

  const fetchPredictionData = async (user: string) => {
    try {

      const response_minute = await axios.get(`${API_URL}/predict_minute/${user}`);
      // console.log('fetchPredictionData-minute : ', response_minute);
      // const response_hour = await axios.get(`${API_URL}/predict_hour/${user}`);
      // console.log('fetchPredictionData-hour : ', response_hour);
      // const response_day = await axios.get(`${API_URL}/predict_day/${user}`);
      // console.log('fetchPredictionData-day : ', response_day);
      
      


      setPredictMinuteData(response_minute.data);
      // setPredictHourData(response_hour.data);
      // setPredictDayData(response_day.data);

      console.log('predict-min', response_minute.data.min_pred_bpm)
      // console.log('predict-hour', response_hour.data.hour_pred_bpm)
      // console.log('predict-day', response_day.data.day_pred_bpm)
    } catch (error) {
      console.error('Error.........In featchPredictionData: ', error);
    }
  }

  const fetchFeatureData = async (user: string) => {
    try {
      const response_hour = await axios.get(`${API_URL}/feature_hour/${user}`);
      const response_day = await axios.get(`${API_URL}/feature_day/${user}`);
      console.log('fetchPredictionData-hour : ', response_hour);
      console.log('fetchPredictionData-day : ', response_day);


      setFeatureHourData(response_hour.data);
      setFeatureDayData(response_day.data);


      console.log('feature-hour', response_hour.data);
      console.log('feature-day', response_day.data);
    } catch (error) {
      console.error('Error.........In featchFeatureData: ', error);
    }
  }

  const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = e.target.value
    setSelectedUser(user)
    setSelectedDate('')
    setSaveDates([])
    if (user) {
      setIsLoadingUser(true)
      const start = performance.now();
      await checkDb(user)
      await fetchSaveDates(user)
      const end = performance.now();
      console.log(`checkDb and fetchSaveDates 걸린 시간 : ${end - start} ms`);
      setIsLoadingUser(false)
    }
  }
  
  const checkDb = async (user: string) => {
    try {
      await axios.post(`${API_URL}/check_db3`, { user_email: user })
    } catch (error) {
      setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const fetchSaveDates = async (user: string) => {
    try {
      const response = await axios.get(`${API_URL}/get_save_dates/${user}`);
      setSaveDates(response.data.save_dates);
    } catch (error) {
      console.error('Error fetching save dates:', error);
      setMessage(`Error fetching save dates: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  useEffect(() => {
    if (showGraphs && startTimeRef.current !== null) {
      const endTime = performance.now();
      const totalTime = endTime - startTimeRef.current;
      setRenderTime(totalTime);
      startTimeRef.current = null;
    }
  }, [showGraphs]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Heart Rate and Sleep Analysis Dashboard</h1>
      <div className="mb-4 flex items-center">
        <label className="mr-2">계정 선택:</label>
        <select 
          value={selectedUser} 
          onChange={handleUserSelect}
          className="border p-2 rounded mr-2"
        >
          <option value="">Select a user</option>
          {users.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
        {isLoadingUser && <LoadingSpinner />}
      </div>
      {selectedUser && saveDates.length > 0 && (
        <div className="mb-4 flex items-center">
          <label className="mr-2">저장된 날짜 선택:</label>
          <select 
            value={selectedDate} 
            onChange={handleDateSelect}
            className="border p-2 rounded mr-2"
          >
            <option value="">Select a date</option>
            {saveDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
          {isLoading && <LoadingSpinner />}
        </div>
      )}
      {selectedDate && (
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={() => setViewMode('combined')}
            className={`p-2 rounded mr-2 ${viewMode === 'combined' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <LaptopMinimal size={20} />
          </button>
          <button
            onClick={() => setViewMode('multi')}
            className={`p-2 rounded ${viewMode === 'multi' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      )}
      <div className="mt-8">
        {isLoading ? (
          <SkeletonLoader viewMode={viewMode} columns={1} />
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : showGraphs ? (
          <>
            {viewMode === 'combined' ? (
              <CombinedChart
                bpmData={bpmData}
                stepData={stepData}
                calorieData={calorieData}
                predictMinuteData={predictMinuteData}
                globalStartDate={globalStartDate}
                globalEndDate={globalEndDate}
                onBrushChange={handleBrushChange}
              />
            ) : (
              <MultiChart
                bpmData={bpmData}
                stepData={stepData}
                calorieData={calorieData}
                predictMinuteData={predictMinuteData}
                globalStartDate={globalStartDate}
                globalEndDate={globalEndDate}
                onBrushChange={handleBrushChange}
              />
            )}
            {renderTime !== null && (
              <div className="mt-4 text-center text-gray-600">
                Total render time: {renderTime.toFixed(2)} ms
              </div>
            )}
          </>
        ) : null}
        {showGraphs && bpmData.length === 0 && stepData.length === 0 && calorieData.length === 0 && predictMinuteData.length === 0 && (
          <div className="text-center text-red-500">No data available for the charts.</div>
        )}
      </div>
    </div>
  );
}
