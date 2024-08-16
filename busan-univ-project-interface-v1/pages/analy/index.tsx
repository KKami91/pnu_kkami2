import React, { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import MultiChart from '../../components/MultiChart3';
import CombinedChart from '../../components/CombinedChart3';
import { SkeletonLoader } from '../../components/SkeletonLoaders3';
import { LaptopMinimal, LayoutGrid } from 'lucide-react';
import { parseISO, format, startOfHour, endOfHour } from 'date-fns';

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
  const [predictHourData, setPredictHourData] = useState<DataItem[]>([]);

  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<'combined' | 'multi'>('combined');
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('minute');

  const { globalStartDate, globalEndDate } = useMemo(() => {
    const allDates = [...bpmData, ...stepData, ...calorieData].map(item => new Date(item.ds).getTime());
    return {
      globalStartDate: allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date(),
      globalEndDate: allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date()
    };
  }, [bpmData, stepData, calorieData]);

  const fetchData = async (collection: string, user: string) => {
    try {
      const response = await axios.get('/api/getData3', {
        params: { collection, user_email: user }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${collection} data:`, error);
      throw error;
    }
  };

  const processHourlyData = (data: DataItem[], key: 'bpm' | 'step' | 'calorie') => {
    const hourlyData: { [hour: string]: number[] } = {};
    
    data.forEach(item => {
      const date = parseISO(item.ds);
      const hourKey = format(date, 'yyyy-MM-dd HH:00:00');
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = [];
      }
      
      if (item[key] != null) {
        hourlyData[hourKey].push(Number(item[key]));
      }
    });
    
    return Object.entries(hourlyData).map(([hour, values]) => ({
      ds: hour,
      [key]: key === 'bpm' ? 
        values.reduce((sum, value) => sum + value, 0) / values.length :
        values.reduce((sum, value) => sum + value, 0)
    }));
  };

  const handleBrushChange = (domain: [number, number] | null) => {
    console.log("Brush domain changed:", domain);
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
      const startTimeHour = performance.now();
      const response = await axios.get(`${API_URL}/predict_minute/${user}`);
      console.log(`response.data hour : ${response.data}`);
      setPredictHourData(response.data);
      const endTimeHour = performance.now();
      console.log(`hour fetch 걸린 시간 ${endTimeHour - startTimeHour} ms`);
    } catch (error) {
      console.error('Error in fetchPredictionData: ', error);
    }
  }

  const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = e.target.value
    setSelectedUser(user)
    setSelectedDate('')
    setSaveDates([])
    if (user) {
      setIsLoadingUser(true)
      await checkDb(user)
      await fetchSaveDates(user)
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

  const processedData = useMemo(() => {
    if (timeUnit === 'hour') {
      return {
        bpmData: processHourlyData(bpmData, 'bpm'),
        stepData: processHourlyData(stepData, 'step'),
        calorieData: processHourlyData(calorieData, 'calorie'),
        predictMinuteData: predictHourData
      };
    } else {
      return {
        bpmData,
        stepData,
        calorieData,
        predictMinuteData: []  // 분 단위에서는 예측 데이터를 사용하지 않음
      };
    }
  }, [bpmData, stepData, calorieData, predictHourData, timeUnit]);

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
            className={`p-2 rounded mr-2 ${viewMode === 'multi' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setTimeUnit('minute')}
            className={`p-2 rounded mr-2 ${timeUnit === 'minute' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Minute
          </button>
          <button
            onClick={() => setTimeUnit('hour')}
            className={`p-2 rounded ${timeUnit === 'hour' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Hour
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
                bpmData={processedData.bpmData}
                stepData={processedData.stepData}
                calorieData={processedData.calorieData}
                predictMinuteData={processedData.predictMinuteData}
                globalStartDate={globalStartDate}
                globalEndDate={globalEndDate}
                onBrushChange={handleBrushChange}
              /> 
            ) : (
              <MultiChart
                bpmData={processedData.bpmData}
                stepData={processedData.stepData}
                calorieData={processedData.calorieData}
                predictMinuteData={processedData.predictMinuteData}
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
        {showGraphs && processedData.bpmData.length === 0 && processedData.stepData.length === 0 && processedData.calorieData.length === 0 && processedData.predictMinuteData.length === 0 && (
          <div className="text-center text-red-500">No data available for the charts.</div>
        )}
      </div>
    </div>
  );
}