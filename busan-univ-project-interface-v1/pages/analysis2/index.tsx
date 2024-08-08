import { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import MultiChart from '../../components/MultiChart';
import CombinedChart from '../../components/CombinedChart2';
import { SkeletonLoader } from '../../components/SkeletonLoaders2';
import { min, max } from 'date-fns';
import { LaptopMinimal, LayoutGrid } from 'lucide-react';

const users = ['hswchaos@gmail.com', 'subak63@gmail.com']
const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app'

const LoadingSpinner = () => (
  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2">
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
  </div>
)

interface HourlyData {
  ds: string
  bpm: number | null
  rmssd: number | null
  sdnn: number | null
  step: number | null
  calorie: number | null
}

interface DailyData {
  ds: string
  bpm: number | null
  rmssd: number | null
  sdnn: number | null
  step: number | null
  calorie: number | null
}

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');
  const [analysisDates, setAnalysisDates] = useState([]);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showGraphs, setShowGraphs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);

  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<'combined' | 'multi'>('combined');

  const { globalStartDate, globalEndDate } = useMemo(() => {
    const allTimestamps = [...hourlyData, ...dailyData].map(item => new Date(item.ds).getTime());
    return {
      globalStartDate: allTimestamps.length > 0 ? new Date(Math.min(...allTimestamps)) : new Date(),
      globalEndDate: allTimestamps.length > 0 ? new Date(Math.max(...allTimestamps)) : new Date()
    };
  }, [hourlyData, dailyData]);

  const fetchData = async (collection: string, user: string, date: string) => {
    try {
      const response = await axios.get('/api/getData2', {
        params: { collection, user_email: user, date }
      });
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
        const [hourlyData, dailyData] = await Promise.all([
          fetchData('hourly', selectedUser, date),
          fetchData('daily', selectedUser, date),
        ]);
        console.log('Hourly Data:', hourlyData);
        console.log('Daily Data:', dailyData);
        setHourlyData(hourlyData);
        setDailyData(dailyData);
        setShowGraphs(true);
      } catch (error) {
        setError(`Error loading data: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = e.target.value
    setSelectedUser(user)
    setSelectedDate('')
    setAnalysisDates([])
    if (user) {
      setIsLoadingUser(true)
      const start = performance.now();
      await checkDb(user)
      const end = performance.now();
      console.log(`checkDb 걸린 시간 : ${end - start} ms`);
      await fetchAnalysisDates(user)
      setIsLoadingUser(false)
    }
  }
  
  const fetchAnalysisDates = async (user: string) => {
    try {
      const response = await axios.get(`${API_URL}/check_dates/${user}`)
      setAnalysisDates(response.data.dates)
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage(`Error fetching dates: ${error instanceof Error ? error.message : String(error)}`)
      setAnalysisDates([])
    }
  }

  const checkDb = async (user: string) => {
    try {
      await axios.post(`${API_URL}/check_db2`, { user_email: user })
    } catch (error) {
      setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleBrushChange = (domain: [number, number] | null) => {
    console.log('Brush domain changed:', domain);
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
      {selectedUser && (
        <div className="mb-4 flex items-center">
          <label className="mr-2">분석 날짜:</label>
          {analysisDates.length > 0 ? (
            <select 
              value={selectedDate} 
              onChange={handleDateSelect}
              className="border p-2 rounded mr-2"
            >
              <option value="">Select a date</option>
              {analysisDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          ) : (
            <p>No analysis dates available</p>
          )}
          {isLoadingDate && <LoadingSpinner />}
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
                hourlyData={hourlyData}
                dailyData={dailyData}
                globalStartDate={globalStartDate}
                globalEndDate={globalEndDate}
                onBrushChange={handleBrushChange}
              />
            ) : (
              <MultiChart
                hourlyData={hourlyData}
                dailyData={dailyData}
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
        {showGraphs && hourlyData.length === 0 && dailyData.length === 0 && (
          <div className="text-center text-red-500">No data available for the charts.</div>
        )}
      </div>
    </div>
  );
}