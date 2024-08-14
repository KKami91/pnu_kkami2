import React, { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import MultiChart from '../../components/MultiChart3';
import CombinedChart from '../../components/CombinedChart3';
import { SkeletonLoader } from '../../components/SkeletonLoaders3';
import { LaptopMinimal, LayoutGrid } from 'lucide-react';

const users = ['hswchaos@gmail.com', 'subak63@gmail.com']
const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app'

interface DataItem {
  ds: string;
  bpm?: number;
  step?: number;
  calorie?: number;
  pred_bpm?: number;
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
  const [predictMinuteData, setPredictMinuteData] = useState<DataItem[]>([]);

  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<'combined' | 'multi'>('combined');

  const { globalStartDate, globalEndDate } = useMemo(() => {
    const allData = [...bpmData, ...stepData, ...calorieData, ...predictMinuteData];
    const allDates = allData.map(item => new Date(item.ds).getTime());
    return {
      globalStartDate: allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date(),
      globalEndDate: allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date()
    };
  }, [bpmData, stepData, calorieData, predictMinuteData]);

  const fetchData = async (collection: string, user: string, date: string) => {
    try {
      console.log(`Fetching ${collection} data for user ${user} and date ${date}`);
      const response = await axios.get('/api/getData3', {
        params: { collection, user_email: user, date }
      });
      console.log(`Fetched ${collection} data:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${collection} data:`, error);
      throw error;
    }
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
        const [bpm, step, calorie, predict] = await Promise.all([
          fetchData('bpm', selectedUser, date),
          fetchData('steps', selectedUser, date),
          fetchData('calories', selectedUser, date),
          fetchData('predict', selectedUser, date)
        ]);

        setBpmData(bpm);
        setStepData(step);
        setCalorieData(calorie);
        setPredictMinuteData(predict);

        setShowGraphs(true);
      } catch (error) {
        console.error('Error in handleDateSelect:', error);
        setError(`Error loading data: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false)
      }
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

  const handleBrushChange = (domain: [number, number] | null) => {
    console.log("Brush domain changed:", domain);
    // 여기에 브러시 변경에 대한 추가 로직을 구현할 수 있습니다.
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
      {/* ... (기존 UI 요소들) */}
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