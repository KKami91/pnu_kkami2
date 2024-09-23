import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import axios from 'axios'
import MultiChart from '../../components/MultiChart4';
import CombinedChart from '../../components/CombinedChart3';
import { SkeletonLoader } from '../../components/SkeletonLoaders3';
import { LaptopMinimal, LayoutGrid } from 'lucide-react';
import { parseISO, format, startOfHour, endOfHour, startOfWeek, endOfWeek, addDays, subDays, isSunday, nextSunday, endOfDay, startOfDay, previousSunday, previousMonday, isSaturday, isFriday, isFuture, nextMonday, nextSaturday } from 'date-fns';
import RmssdCalendar from '../../components/RmssdCalendar';
import SdnnCalendar from '../../components/SdnnCalendar';

const users = ['hswchaos@gmail.com', 'subak63@gmail.com', '27hyobin@gmail.com', 'skdlove1009@gmail.com']
const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app'

const LoadingSpinner = () => (
  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2">
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
  </div>
)

interface AdditionalData {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  sleepData: any[];
  hrvData: any[];
}

interface DataItem {
  ds: string;
  timestamp: string;
  type: string;
  value?: string;
  bpm?: number;
  step?: number;
  calorie?: number;
  rmssd?: number;
  sdnn?: number;
  min_pred_bpm: number | null;
  pred_rmssd?: number;
}

interface SleepData {
  ds_start: string;
  ds_end: string;
  stage: number | null;
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
  const [sleepData, setSleepData] = useState<SleepData[]>([]);
  // const [predictHourData, setPredictHourData] = useState<DataItem[]>([]);

  const [predictMinuteData, setPredictMinuteData] = useState<any[]>([]);
  const [predictHourData, setPredictHourData] = useState<any[]>([]);

  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<'combined' | 'multi'>('multi');
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('minute');

  const [hrvHourData, setHrvHourData] = useState<any[]>([]);
  const [hrvDayData, setHrvDayData] = useState<any[]>([]);

  const [currentDisplayRange, setCurrentDisplayRange] = useState<{ start: Date; end: Date } | null>(null);
  const [initialDateWindow, setInitialDateWindow] = useState<{ start: Date; end: Date } | null>(null);

  const { globalStartDate, globalEndDate } = useMemo(() => {
    const allDates = [...bpmData, ...stepData, ...calorieData].map(item => new Date(item.timestamp).getTime());
    return {
      globalStartDate: allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date(),
      globalEndDate: allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date()
    };
  }, [bpmData, stepData, calorieData]);

  const [dbStartDate, setDbStartDate] = useState<Date | null>(null);
  const [dbEndDate, setDbEndDate] = useState<Date | null>(null);

  const fetchDataRanges = async (user: string) => {
    try {
      const collections = ['bpm_div', 'step_div', 'calorie_div'];
      const ranges = await Promise.all(collections.map(async (collection) => {
        const response = await axios.get('/api/getDataRange', {
          params: { collection, user_email: user }
        });
        return response.data;
      }));

      const allStartDates = ranges.map(r => new Date(r.startDate).getTime());
      const allEndDates = ranges.map(r => new Date(r.endDate).getTime());

      //console.log(`in index.tsx - response allStartDates : ${allStartDates}`)
      //console.log(`in index.tsx - response allEndDates : ${allEndDates}`)

      setDbStartDate(startOfWeek(new Date(Math.min(...allStartDates)), { weekStartsOn: 1 }));
      setDbEndDate(endOfWeek(new Date(Math.max(...allEndDates)), {weekStartsOn: 1 }));
    } catch (error) {
      console.error('Error fetching data ranges:', error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchDataRanges(selectedUser);
    }
  }, [selectedUser]);

  // console.log(`all---dates--- ${globalStartDate}`)

  // const fetchData = async (collection: string, user: string, date: string) => {
  //   try {
  //     const fetchStart = performance.now()
  //     const selectDate = new Date(date);
  //     const startDate = startOfWeek(subDays(selectDate, 7), { weekStartsOn: 1 });
  //     const endDate = endOfWeek(addDays(selectDate, 7), { weekStartsOn: 1 });

  //     const response = await axios.get('/api/getData3_div', {
  //       params: { 
  //         collection, 
  //         user_email: user, 
  //         startDate: format(startDate, 'yyyy-MM-dd'),
  //         endDate: format(endDate, 'yyyy-MM-dd')
  //        }
  //     });
  //     //console.log('in fetchData response.data')
  //     //console.log(typeof(response.data))
  //     //console.log('in fetchData response.data')
  //     const fetchEnd = performance.now()
  //     //console.log(`In index ${collection} 걸린 시간 : ${fetchEnd - fetchStart}`)
  //     return response.data;
  //   } catch (error) {
  //     console.error(`Error fetching ${collection} data:`, error);
  //     throw error;
  //   }
  // };

  const getWeekRange = (date: Date) => {
    const datePreviousMonday = previousMonday(startOfWeek(date, {weekStartsOn: 1}));
    const dateNextSunday = nextSunday(endOfWeek(date, {weekStartsOn: 1}));

    return { start: startOfDay(datePreviousMonday), end: dateNextSunday };
  };

  const fetchData = async (collection: string, user: string, startDate: Date, endDate: Date) => {
    try {
      const fetchStart = performance.now()
      const response = await axios.get('/api/getData3_div', {
        params: { 
          collection, 
          user_email: user, 
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        }
      });
      // if (collection === 'calorie_div') {
      //   console.log('123123123')
      //   console.log(response)
      // }
      const fetchEnd = performance.now()
      //console.log(`2024-09-19 --- fetchData length --- ${fetchData.length} ---- `)
      console.log(`In index ${collection} 걸린 시간 : ${fetchEnd - fetchStart}`)
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${collection} data:`, error);
      throw error;
    }
  };

  // const fetchAdditionalData = useCallback(async (startDate: Date, endDate: Date): Promise<AdditionalData> => {
  //   if (!selectedUser) return { bpmData: [], stepData: [], calorieData: [], sleepData: [] };

  //   try {
  //     const [bpm, step, calorie, sleep] = await Promise.all([
  //       fetchData('bpm_div', selectedUser, startDate, endDate),
  //       fetchData('step_div', selectedUser, startDate, endDate),
  //       fetchData('calorie_div', selectedUser, startDate, endDate),
  //       fetchData('sleep_div', selectedUser, startDate, endDate),
  //     ]);

  //     console.log('--0--')
  //     console.log(calorie)

  //     return { 
  //       bpmData: bpm || [], 
  //       stepData: step || [], 
  //       calorieData: calorie || [], 
  //       sleepData: sleep || [] 
  //     };
  //   } catch (error) {
  //     console.error('Error fetching additional data:', error);
  //     // Return empty arrays instead of throwing an error
  //     return { bpmData: [], stepData: [], calorieData: [], sleepData: [] };
  //   }
  // }, [selectedUser, fetchData]);

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
    //console.log("Brush domain changed2:", domain);
  };

  // const handleDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const date = e.target.value;
  //   console.log(`in handleDateSelect date : ${date}`);
  //   setSelectedDate(date);
  //   if (date) {
  //     setIsLoading(true);
  //     setError(null);
  //     setShowGraphs(false);
  //     setRenderTime(null);
  //     startTimeRef.current = performance.now();
  //     try {
  //       const selectedDate = new Date(date);
  //       const { start: fetchStartDate, end: fetchEndDate } = getWeekRange(selectedDate);
  
  //       console.log(`Fetching data from ${fetchStartDate} to ${fetchEndDate}`);
  
  //       const [bpm, step, calorie, sleep] = await Promise.all([
  //         fetchData('bpm_div', selectedUser, fetchStartDate, fetchEndDate),
  //         fetchData('step_div', selectedUser, fetchStartDate, fetchEndDate),
  //         fetchData('calorie_div', selectedUser, fetchStartDate, fetchEndDate),
  //         fetchData('sleep_div', selectedUser, fetchStartDate, fetchEndDate),
  //       ]);
  
  //       console.log(`fetch bpm length : ${bpm.length}`);
  
  //       setBpmData(bpm);
  //       setStepData(step);
  //       setCalorieData(calorie);
  //       setSleepData(sleep);
  
  //       // Prediction 데이터 가져오기
  //       await fetchPredictionData(selectedUser);
  
  //       // HRV 데이터 가져오기
  //       console.log(`in index.tsx - handleDateSelect - fetchStartDate : ${fetchStartDate} <------> fetchEndDate : ${fetchEndDate}`)
  //       await fetchHrvData(selectedUser, fetchStartDate, fetchEndDate);
  
  //       const renderStartDate = startOfDay(nextSunday(selectedDate));
  //       const renderEndDate = endOfDay(addDays(renderStartDate, 6));
  
  //       setInitialDateWindow({ start: renderStartDate, end: renderEndDate });
  
  //       setShowGraphs(true);
  //     } catch (error) {
  //       console.error('Error in handleDateSelect:', error);
  //       setError(`Error loading data: ${error instanceof Error ? error.message : String(error)}`);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  // };

  // const handleDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const date = e.target.value;
  //   setSelectedDate(date);
  //   if (date) {
  //     setIsLoading(true);
  //     setError(null);
  //     try {
  //       const selectedDate = new Date(date);
  //       const { start: fetchStartDate, end: fetchEndDate } = getWeekRange(selectedDate);
        

  //       const responseDay = await axios.get(`${API_URL}/feature_day_div/${selectedUser}`);
  //       setHrvDayData(responseDay.data.day_hrv);

  //       const data = await fetchAdditionalData(fetchStartDate, fetchEndDate);
        
  //       setBpmData(data.bpmData);
  //       setStepData(data.stepData);
  //       setCalorieData(data.calorieData);
  //       setSleepData(data.sleepData);
  //       setHrvHourData(data.hrvData);
  
  //       // Prediction 데이터 가져오기 (필요한 경우)
  //       await fetchPredictionData(selectedUser);
  
  //       setShowGraphs(true);
  //     } catch (error) {
  //       console.error('Error in handleDateSelect:', error);
  //       setError(`Error loading data: ${error instanceof Error ? error.message : String(error)}`);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  // };

  const handleDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) {
      setIsLoading(true);
      setError(null);
      setShowGraphs(false);  // 그래프를 숨깁니다.
      setRenderTime(null);   // 렌더 시간을 초기화합니다.
      startTimeRef.current = performance.now();  // 시작 시간을 기록합니다.
      try {
        const selectedDate = new Date(date);
        const { start: fetchStartDate, end: fetchEndDate } = getWeekRange(selectedDate);
        
        const calendarStartTime = performance.now();
        const responseDay = await axios.get(`${API_URL}/feature_day_div/${selectedUser}`);
        setHrvDayData(responseDay.data.day_hrv);
        const calendarendTime = performance.now();
        console.log(`히트맵 일일 HRV 전체 데이터 가져오는데 걸리는 시간 : ${calendarendTime - calendarStartTime} ms`);


        const firstFetchStartTime = performance.now();
        const data = await fetchAdditionalData(fetchStartDate, fetchEndDate);
        const firstFetchEndTime = performance.now();
        console.log(`handleDateSelect에서 첫 fetch 데이터 걸린 시간 (약 2주) ${firstFetchEndTime - firstFetchStartTime} ms`);
        
        setBpmData(data.bpmData);
        setStepData(data.stepData);
        setCalorieData(data.calorieData);
        setSleepData(data.sleepData);
        setHrvHourData(data.hrvData);
  
        // Prediction 데이터 가져오기 (필요한 경우)
        const predictStartTime = performance.now();
        await fetchPredictionData(selectedUser);
        const predictEndTime = performance.now();
        console.log(`예측 데이터 가져오는데 걸리는 시간 : ${predictEndTime - predictStartTime} ms`);
  
        setShowGraphs(true);  // 모든 데이터 로딩이 완료되면 그래프를 표시합니다.
      } catch (error) {
        console.error('Error in handleDateSelect:', error);
        setError(`Error loading data: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    }
  };


  // const fetchHrvData = async (user: string, start: Date, end: Date) => {
  //   try {
  //     const response = await axios.get(`${API_URL}/feature_hour_div/${user}/${start.getTime()}/${end.getTime()}`);
  //     setHrvHourData(response.data.hour_hrv);
  //     const dayFeatureStart = performance.now()
  //     const responseDay = await axios.get(`${API_URL}/feature_day_div/${user}`);
  //     const dayFeatureEnd = performance.now()
  //     console.log(`day feature 걸린 시간 : ${dayFeatureEnd - dayFeatureStart}ms`)
  //     setHrvDayData(responseDay.data.day_hrv);
  //     //console.log(responseDay.data.day_hrv);
  //   } catch (error) {
  //     console.error('Error in fetchHrvData: ', error);
  //   }
  // }

  const fetchHrvData = useCallback(async (user: string, start: Date, end: Date) => {
    try {
      // console.log(`in fetchHrvData in index.tsx - - - - - - - - - - -`)
      // console.log(`in fetchHrvData2 start : ${start} ------ > end : ${end}`)
      const featureHourStartTime = performance.now()
      const response = await axios.get(`${API_URL}/feature_hour_div/${user}/${start.getTime()}/${end.getTime()}`);
      const featureHourEndTime = performance.now()
      console.log(`HRV 시간 단위 데이터 계산 걸린 시간 : ${featureHourEndTime - featureHourStartTime} ms`)
      // console.log(response.data.hour_hrv)
      // console.log('123124124234dasdvxvxvxvxcvxcvx')
      // console.log('123124124234dasdvxvxvxvxcvxcvx : ', response.data)
      // console.log('#############@@@@@@@@@@@@@@############')
      // console.log(`in fetchHrvData2 start : ${start} ------ > end : ${end} -------> data : ${response.data}`)
      return response.data.hour_hrv;
    } catch (error) {
      console.error('Error in fetchHrvData: ', error);
      return [];
    }
  }, [API_URL]);

  const fetchAdditionalData = useCallback(async (startDate: Date, endDate: Date): Promise<AdditionalData> => {
    if (!selectedUser) return { bpmData: [], stepData: [], calorieData: [], sleepData: [], hrvData: [] };

    console.log(`in fetchAdditionalData --- startDate : ${startDate} <------> endDate : ${endDate}`)

    try {
      const additionalStartTime = performance.now()
      const [bpm, step, calorie, sleep, hrv] = await Promise.all([
        fetchData('bpm_div', selectedUser, startDate, endDate),
        fetchData('step_div', selectedUser, startDate, endDate),
        fetchData('calorie_div', selectedUser, startDate, endDate),
        fetchData('sleep_div', selectedUser, startDate, endDate),
        fetchHrvData(selectedUser, startDate, endDate),  // HRV 데이터 fetch 추가
      ]);
      console.log('@@@@@-@@@@@ : hrv', hrv)
      const additionalEndTime = performance.now()
      console.log(`In FetchAdditionalData 에서 bpm, step, calorie, sleep fetch + hrv 계산 전체 걸린 시간 : ${additionalEndTime - additionalStartTime} ms`)

      // console.log('@@@@@@@@@@@@@@@hrv@@@@@@@@@@')
      // console.log(hrv)
      // console.log('@@@@@@@@@@@@@@@hrv@@@@@@@@@@')

      return { 
        bpmData: bpm || [], 
        stepData: step || [], 
        calorieData: calorie || [], 
        sleepData: sleep || [],
        hrvData: hrv || [],  // HRV 데이터 추가
      };
    } catch (error) {
      console.error('Error fetching additional data:', error);
      return { bpmData: [], stepData: [], calorieData: [], sleepData: [], hrvData: [] };
    }
  }, [selectedUser, fetchData, fetchHrvData]);
  

  const fetchPredictionData = async (user: string) => {
    try {
      const [minuteResponse, hourResponse] = await Promise.all([
        axios.get(`${API_URL}/predict_minute_div/${user}`),
        axios.get(`${API_URL}/predict_hour_div/${user}`)
      ]);
  
      //console.log('Minute prediction data:', minuteResponse.data);
      //console.log('Hour prediction data:', hourResponse.data);
  
      // 객체에서 배열을 추출
      const minutePredictions = minuteResponse.data.min_pred_bpm || [];
      const hourPredictions = hourResponse.data.hour_pred_bpm || [];
  
      setPredictMinuteData(minutePredictions);
      setPredictHourData(hourPredictions);
    } catch (error) {
      console.error('Error in fetchPredictionData: ', error);
      setPredictMinuteData([]);
      setPredictHourData([]);
    }
  }

  const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = e.target.value
    setSelectedUser(user)
    setSelectedDate('')
    setSaveDates([])
    if (user) {
      setIsLoadingUser(true)
      // 서버 dynamodb 데이터 처리 및 mongodb 저장 걸린 시간 (1)
      const startTimeCheckDB = performance.now();
      await checkDb(user)
      const endTimeCheckDB = performance.now();
      console.log(`In Index.tsx ---> checkDB 걸린 시간 (1) : ${endTimeCheckDB - startTimeCheckDB} ms`);

    //   // 서버 저장 시간 가져오기 걸린 시간
    //   const startTimeFetchSaveDates = performance.now();
    //   await fetchSaveDates(user)
    //   const endTimeFetchSaveDates = performance.now();
    //   console.log(`fetchSaveDates 걸린 시간 (저장 시간 가져오기 (2)) : ${endTimeFetchSaveDates - startTimeFetchSaveDates} ms`);
      
      setIsLoadingUser(false)
    }
  }
  
  const checkDb = async (user: string) => {
    try {
      await axios.post(`${API_URL}/check_db3_dynamodb`, { user_email: user })
    } catch (error) {
      setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const fetchSaveDates = async (user: string) => {
    try {
      const response = await axios.get(`${API_URL}/get_save_dates_div/${user}`);
      //console.log(response)
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
          {/* <button
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
          </button> */}
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
                predictHourData={predictHourData}
                hrvHourData={hrvHourData}  // 새로운 HRV 데이터 전달
                globalStartDate={globalStartDate}
                globalEndDate={globalEndDate}
                onBrushChange={handleBrushChange}
              /> 
            ) : (
              <MultiChart
              bpmData={bpmData}
              stepData={stepData}
              calorieData={calorieData}
              sleepData={sleepData}
              predictMinuteData={predictMinuteData}
              predictHourData={predictHourData}
              hrvHourData={hrvHourData}
              globalStartDate={globalStartDate}
              globalEndDate={globalEndDate}
              onBrushChange={handleBrushChange}
              fetchAdditionalData={fetchAdditionalData}
              fetchHrvData={fetchHrvData}
              initialDateWindow={initialDateWindow}
              selectedDate={selectedDate}
              dbStartDate={dbStartDate}
              dbEndDate={dbEndDate}
              //timeUnit={timeUnit}
            />
            )}
            {renderTime !== null && (
              <div className="mt-4 text-center text-gray-600">
                Total render time: {renderTime.toFixed(2)} ms
              </div>
            )}
          {hrvDayData.length > 0 && (
            <div className="mt-8">
              <RmssdCalendar hrvDayData={hrvDayData} />
              <SdnnCalendar hrvDayData={hrvDayData} />
            </div>
          )}
          </>
        ) : null}
        {/* {showGraphs && processedData.bpmData.length === 0 && processedData.stepData.length === 0 && processedData.calorieData.length === 0 && processedData.predictMinuteData.length === 0 && (
          <div className="text-center text-red-500">No data available for the charts.</div>
        )} */}
        {showGraphs && bpmData.length === 0 && stepData.length === 0 && calorieData.length === 0 && predictMinuteData.length === 0 && (
          <div className="text-center text-red-500">No data available for the charts.</div>
        )}
      </div>
    </div>
  );
}