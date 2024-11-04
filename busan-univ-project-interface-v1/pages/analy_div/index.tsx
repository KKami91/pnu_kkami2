// // import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
// // import axios from 'axios'
// // import MultiChart from '../../components/MultiChart4';
// // import CombinedChart from '../../components/CombinedChart3';
// // import { SkeletonLoader } from '../../components/SkeletonLoaders3';
// // import { LaptopMinimal, LayoutGrid, BarChart } from 'lucide-react';
// // import { parseISO, format, subSeconds, startOfHour, endOfHour, startOfWeek, endOfWeek, addDays, subDays, isSunday, nextSunday, endOfDay, startOfDay, previousSunday, previousMonday, isSaturday, isFriday, isFuture, nextMonday, nextSaturday } from 'date-fns';
// // import RmssdCalendar from '../../components/RmssdCalendar';
// // import SdnnCalendar from '../../components/SdnnCalendar';
// // import SdnnCalHeatmap from '../../components/CalHeatMapSdnn'
// // import RmssdCalHeatmap from '../../components/CalHeatMapRmssd'

// // const users = ['hswchaos@gmail.com', 'subak63@gmail.com', '27hyobin@gmail.com', 'skdlove1009@gmail.com', 'sueun4701@gmail.com']


// // const LoadingSpinner = () => (
// //   <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2">
// //     <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
// //   </div>
// // )

// // interface AdditionalData {
// //   bpmData: any[];
// //   stepData: any[];
// //   calorieData: any[];
// //   sleepData: any[];
// //   hrvData: any[];
// // }

// // interface DataItem {
// //   ds: string;
// //   timestamp: string;
// //   timestamp_start: string;
// //   timestamp_end: string;
// //   type: string;
// //   value?: string;
// //   bpm?: number;
// //   step?: number;
// //   calorie?: number;
// //   rmssd?: number;
// //   sdnn?: number;
// //   min_pred_bpm: number | null;
// //   pred_rmssd?: number;
// // }

// // export default function Home() {
// //   const [selectedUser, setSelectedUser] = useState('');
// //   const [message, setMessage] = useState('');
// //   const [isLoadingUser, setIsLoadingUser] = useState(false);
// //   const [selectedDate, setSelectedDate] = useState('');
// //   const [showGraphs, setShowGraphs] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [saveDates, setSaveDates] = useState<string[]>([]);

// //   const [bpmData, setBpmData] = useState<DataItem[]>([]);
// //   const [stepData, setStepData] = useState<DataItem[]>([]);
// //   const [calorieData, setCalorieData] = useState<DataItem[]>([]);
// //   const [sleepData, setSleepData] = useState<DataItem[]>([]);

// //   const [predictMinuteData, setPredictMinuteData] = useState<any[]>([]);
// //   const [predictHourData, setPredictHourData] = useState<any[]>([]);

// //   const [renderTime, setRenderTime] = useState<number | null>(null);
// //   const startTimeRef = useRef<number | null>(null);

// //   const [viewMode, setViewMode] = useState<'combined' | 'multi' | 'echarts'>('multi');
// //   const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('minute');

// //   const [hrvHourData, setHrvHourData] = useState<any[]>([]);
// //   const [hrvDayData, setHrvDayData] = useState<any[]>([]);

// //   const [initialDateWindow, setInitialDateWindow] = useState<{ start: Date; end: Date } | null>(null);

// //   const { globalStartDate, globalEndDate } = useMemo(() => {
// //     const allDates = [...bpmData, ...stepData, ...calorieData].map(item => new Date(item.timestamp).getTime());
// //     return {
// //       globalStartDate: allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date(),
// //       globalEndDate: allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date()
// //     };
// //   }, [bpmData, stepData, calorieData]);

// //   const [dbStartDate, setDbStartDate] = useState<Date | null>(null);
// //   const [dbEndDate, setDbEndDate] = useState<Date | null>(null);

// //   const [cachedData, setCachedData] = useState<{
// //     [key: string]: AdditionalData
// //   }>({});

// //   // const fetchDataRanges = async (user: string) => {
// //   //   try {
// //   //     const collections = ['bpm_test2', 'step_test2', 'calorie_test2'];
// //   //     const ranges = await Promise.all(collections.map(async (collection) => {
// //   //       const response = await axios.get('/api/getDataRange', {
// //   //         params: { collection, user_email: user }
// //   //       });
// //   //       return response.data;
// //   //     }));

// //   //     const allStartDates = ranges.map(r => new Date(r.startDate).getTime());
// //   //     const allEndDates = ranges.map(r => new Date(r.endDate).getTime());

// //   //     setDbStartDate(startOfWeek(new Date(Math.min(...allStartDates)), { weekStartsOn: 1 }));
// //   //     setDbEndDate(endOfWeek(new Date2(Math.max(...allEndDates)), {weekStartsOn: 1 }));
// //   //   } catch (error) {
// //   //     console.error('Error fetching data ranges:', error);
// //   //   }
// //   // };

// //   const fetchDataRanges = async (user: string) => {
// //     try {
// //       const collections = ['bpm_test3', 'step_test3', 'calorie_test3'];
// //       const ranges = await Promise.all(collections.map(async (collection) => {
// //         const response = await axios.get('/api/getDataRange', {
// //           params: { collection, user_email: user }
// //         });
// //         return response.data;
// //       }));

// //       const allStartDates = ranges.map(r => new Date(r.startDate).getTime());
// //       const allEndDates = ranges.map(r => new Date(r.endDate).getTime());

// //       setDbStartDate(startOfWeek(new Date(Math.min(...allStartDates)), { weekStartsOn: 1 }));
// //       setDbEndDate(endOfWeek(new Date(Math.max(...allEndDates)), {weekStartsOn: 1 }));
// //     } catch (error) {
// //       console.error('Error fetching data ranges:', error);
// //     }
// //   };

// //   useEffect(() => {
// //     if (selectedUser) {
// //       fetchDataRanges(selectedUser);
// //     }
// //   }, [selectedUser]);

// //   const getWeekRange = (date: Date) => {
// //     const datePreviousMonday = previousMonday(startOfWeek(date, {weekStartsOn: 1}));
// //     const dateNextSunday = nextSunday(endOfWeek(date, {weekStartsOn: 1}));

// //     return { start: startOfDay(datePreviousMonday), end: dateNextSunday };
// //   };

// //   const fetchData = async (collection: string, user: string, startDate: Date, endDate: Date) => {
// //     try {
// //       const fetchStart = performance.now()
// //       const response = await axios.get('/api/getData3_agg', {
// //         params: { 
// //           collection, 
// //           user_email: user, 
// //           startDate: format(startDate, 'yyyy-MM-dd'),
// //           endDate: format(endDate, 'yyyy-MM-dd')
// //         }
// //       });

// //       //console.log(`in fetchData -- : ${JSON.stringify(response).slice(0,100)}`)

// //       //console.log(`in fetchData -->>>>>${collection} ${JSON.stringify(response.data)}`)

// //       const fetchEnd = performance.now()
// //       console.log(`In index ${collection} 걸린 시간 : ${fetchEnd - fetchStart} // ${startDate} ~ ${endDate}`)
// //       return response.data;
// //     } catch (error) {
// //       console.error(`Error fetching ${collection} data:`, error);
// //       throw error;
// //     }
// //   };


// //   // const processHourlyData = (data: DataItem[], key: 'bpm' | 'step' | 'calorie') => {
// //   //   const hourlyData: { [hour: string]: number[] } = {};
    
// //   //   data.forEach(item => {
// //   //     const date = parseISO(item.ds);
// //   //     const hourKey = format(date, 'yyyy-MM-dd HH:00:00');
      
// //   //     if (!hourlyData[hourKey]) {
// //   //       hourlyData[hourKey] = [];
// //   //     }
      
// //   //     if (item[key] != null) {
// //   //       hourlyData[hourKey].push(Number(item[key]));
// //   //     }
// //   //   });
    
// //   //   return Object.entries(hourlyData).map(([hour, values]) => ({
// //   //     ds: hour,
// //   //     [key]: key === 'bpm' ? 
// //   //       values.reduce((sum, value) => sum + value, 0) / values.length :
// //   //       values.reduce((sum, value) => sum + value, 0)
// //   //   }));
// //   // };

// //   const handleBrushChange = (domain: [number, number] | null) => {
// //     //console.log("Brush domain changed2:", domain);
// //   };

// //   const handleDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
// //     const date = e.target.value;
// //     setSelectedDate(date);
// //     if (date) {
// //       setIsLoading(true);
// //       setError(null);
// //       setShowGraphs(false);  // 그래프를 숨깁니다.
// //       startTimeRef.current = performance.now();  // 시작 시간을 기록합니다.
// //       try {
// //         const selectedDate = new Date(date);
// //         const { start: fetchStartDate, end: fetchEndDate } = getWeekRange(selectedDate);
        
// //         const calendarStartTime = performance.now();
// //         const responseDay = await axios.get(`${API_URL}/feature_day_div/${selectedUser}`);
// //         setHrvDayData(responseDay.data.day_hrv);
// //         const calendarendTime = performance.now();
// //         console.log(`히트맵 일일 HRV 전체 데이터 가져오는데 걸리는 시간 : ${calendarendTime - calendarStartTime} ms`);


// //         console.log(`in handleDateSelect start : ${fetchStartDate} , end : ${fetchEndDate}`)

// //         const firstFetchStartTime = performance.now();
// //         const data = await fetchAdditionalData(fetchStartDate, fetchEndDate);
// //         const firstFetchEndTime = performance.now();
// //         console.log(`handleDateSelect에서 첫 fetch 데이터 걸린 시간 (약 2주) ${firstFetchEndTime - firstFetchStartTime} ms`);
        
// //         // console.log(`in handleDateSelect ${JSON.stringify(data)}`)

// //         setBpmData(data.bpmData);
// //         setStepData(data.stepData);
// //         setCalorieData(data.calorieData);
// //         setSleepData(data.sleepData);
// //         setHrvHourData(data.hrvData);
  
// //         // Prediction 데이터 가져오기 (필요한 경우)
// //         const predictStartTime = performance.now();
// //         await fetchPredictionData(selectedUser);
// //         const predictEndTime = performance.now();
// //         console.log(`예측 데이터 가져오는데 걸리는 시간 : ${predictEndTime - predictStartTime} ms`);
  
// //         setShowGraphs(true);  // 모든 데이터 로딩이 완료되면 그래프를 표시합니다.
// //       } catch (error) {
// //         console.error('Error in handleDateSelect:', error);
// //         setError(`Error loading data: ${error instanceof Error ? error.message : String(error)}`);
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     }
// //   };

// //   const fetchHrvData = useCallback(async (user: string, start: Date, end: Date) => {
// //     try {
// //       const featureHourStartTime = performance.now()
// //       const response = await axios.get(`${API_URL}/feature_hour_div/${user}/${start.getTime()}/${end.getTime()}`);
// //       const featureHourEndTime = performance.now()
// //       //console.log(`HRV 시간 단위 데이터 계산 걸린 시간 : ${featureHourEndTime - featureHourStartTime} ms`)
      
// //       // 응답 데이터 확인 및 처리
// //       if (response.data && response.data.hour_hrv) {
// //         return response.data.hour_hrv;
// //       } else {
// //         //console.warn('HRV data is missing or invalid');
// //         return [];
// //       }
// //     } catch (error) {
// //       console.error('Error in fetchHrvData: ', error);
// //       return [];
// //     }
// //   }, [API_URL]);

// //   const fetchAdditionalData = useCallback((startDate: Date, endDate: Date): Promise<AdditionalData> => {
// //     if (!selectedUser) return Promise.resolve({ bpmData: [], stepData: [], calorieData: [], sleepData: [], hrvData: [] });

// //     console.log(`@@@@@@@@@@@@@@@@@@**${startDate}**FETCHADDITIONALDATA**${endDate}**@@@@@@@@@@@@@@@@@@@@@@@`)
// //     const subSecondsEndDate = subSeconds(endDate, 1)
// //     return Promise.all([
// //       fetchData('bpm_test3', selectedUser, startDate, subSecondsEndDate),
// //       fetchData('step_test3', selectedUser, startDate, subSecondsEndDate),
// //       fetchData('calorie_test3', selectedUser, startDate, subSecondsEndDate),
// //       fetchData('sleep_test3', selectedUser, startDate, subSecondsEndDate),
// //       fetchHrvData(selectedUser, startDate, subSecondsEndDate),
// //     ])
// //       .then(([bpm, step, calorie, sleep, hrv]) => {

// //         //console.log(`in fetchAdditionalData bpm length : ${JSON.stringify(bpm)}`)

// //         const hrvData = bpm.length === 0 ? [] : hrv;
  
// //         return {
// //           bpmData: bpm || [],
// //           stepData: step || [],
// //           calorieData: calorie || [],
// //           sleepData: sleep || [],
// //           hrvData: hrvData,
// //         };
// //       })
// //       .catch((error) => {
// //         console.error('Error fetching additional data:', error);
// //         return { bpmData: [], stepData: [], calorieData: [], sleepData: [], hrvData: [] };
// //       });
// //   }, [selectedUser, fetchData, fetchHrvData]);
  

// //   const fetchPredictionData = async (user: string) => {
// //     try {
// //       const [minuteResponse, hourResponse] = await Promise.all([
// //         axios.get(`${API_URL}/predict_minute_div/${user}`),
// //         axios.get(`${API_URL}/predict_hour_div/${user}`)
// //       ]);

// //       const minutePredictions = minuteResponse.data.min_pred_bpm || [];
// //       const hourPredictions = hourResponse.data.hour_pred_bpm || [];
  
// //       setPredictMinuteData(minutePredictions);
// //       setPredictHourData(hourPredictions);
// //     } catch (error) {
// //       console.error('Error in fetchPredictionData: ', error);
// //       setPredictMinuteData([]);
// //       setPredictHourData([]);
// //     }
// //   }

// //   const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
// //     const user = e.target.value
// //     setSelectedUser(user)
// //     setSelectedDate('')
// //     setSaveDates([])
// //     if (user) {
// //       setIsLoadingUser(true)
// //       // 서버 dynamodb 데이터 처리 및 mongodb 저장 걸린 시간 (1)
// //       const startTimeCheckDB = performance.now();
// //       await checkDb(user)
// //       const endTimeCheckDB = performance.now();
// //       console.log(`In Index.tsx ---> checkDB 걸린 시간 (1) : ${endTimeCheckDB - startTimeCheckDB} ms`);

// //       // 서버 저장 시간 가져오기 걸린 시간
// //       const startTimeFetchSaveDates = performance.now();
// //       await fetchSaveDates(user)
// //       const endTimeFetchSaveDates = performance.now();
// //       console.log(`fetchSaveDates 걸린 시간 (저장 시간 가져오기 (2)) : ${endTimeFetchSaveDates - startTimeFetchSaveDates} ms`);
      
// //       setIsLoadingUser(false)
// //     }
// //   }
  
// //   const checkDb = async (user: string) => {
// //     try {
// //       await axios.post(`${API_URL}/check_db3_dynamodb`, { user_email: user })
      
// //     } catch (error) {
// //       setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
// //     }
// //   }

// //   const fetchSaveDates = async (user: string) => {
// //     try {
// //       const response = await axios.get(`${API_URL}/get_save_dates_div/${user}`);
// //       setSaveDates(response.data.save_dates);
// //     } catch (error) {
// //       console.error('Error fetching save dates:', error);
// //       setMessage(`Error fetching save dates: ${error instanceof Error ? error.message : String(error)}`);
// //     }
// //   };

// //   // useEffect(() => {
// //   //   if (showGraphs && startTimeRef.current !== null) {
// //   //     const endTime = performance.now();
// //   //     const totalTime = endTime - startTimeRef.current;
// //   //     setRenderTime(totalTime);
// //   //     startTimeRef.current = null;
// //   //   }
// //   // }, [showGraphs]);

// //   // const processedData = useMemo(() => {
// //   //   if (timeUnit === 'hour') {
// //   //     return {
// //   //       bpmData: processHourlyData(bpmData, 'bpm'),
// //   //       stepData: processHourlyData(stepData, 'step'),
// //   //       calorieData: processHourlyData(calorieData, 'calorie'),
// //   //       predictMinuteData: predictHourData
// //   //     };
// //   //   } else {
// //   //     return {
// //   //       bpmData,
// //   //       stepData,
// //   //       calorieData,
// //   //       predictMinuteData: []  // 분 단위에서는 예측 데이터를 사용하지 않음
// //   //     };
// //   //   }
// //   // }, [bpmData, stepData, calorieData, predictHourData, timeUnit]);

// //   return (
// //     <div className="container mx-auto p-4">
// //       <h1 className="text-2xl font-bold mb-4">Heart Rate and Sleep Analysis Dashboard</h1>
// //       <div className="mb-4 flex items-center">
// //         <label className="mr-2">계정 선택:</label>
// //         <select 
// //           value={selectedUser} 
// //           onChange={handleUserSelect}
// //           className="border p-2 rounded mr-2"
// //         >
// //           <option value="">Select a user</option>
// //           {users.map(user => (
// //             <option key={user} value={user}>{user}</option>
// //           ))}
// //         </select>
// //         {isLoadingUser && <LoadingSpinner />}
// //       </div>
// //       {selectedUser && saveDates.length > 0 && (
// //         <div className="mb-4 flex items-center">
// //           <label className="mr-2">저장된 날짜 선택:</label>
// //           <select 
// //             value={selectedDate} 
// //             onChange={handleDateSelect}
// //             className="border p-2 rounded mr-2"
// //           >
// //             <option value="">Select a date</option>
// //             {saveDates.map(date => (
// //               <option key={date} value={date}>{date}</option>
// //             ))}
// //           </select>
// //           {isLoading && <LoadingSpinner />}
// //         </div>
// //       )}
// //       {selectedDate && (
// //         <div className="mb-4 flex items-center justify-end">
// //           <button
// //             onClick={() => setViewMode('combined')}
// //             className={`p-2 rounded mr-2 ${viewMode === 'combined' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
// //           >
// //             <LaptopMinimal size={20} />
// //           </button>
// //           <button
// //             onClick={() => setViewMode('multi')}
// //             className={`p-2 rounded mr-2 ${viewMode === 'multi' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
// //           >
// //             <LayoutGrid size={20} />
// //           </button>
// //           <button
// //             onClick={() => setViewMode('echarts')}
// //             className={`p-2 rounded mr-2 ${viewMode === 'echarts' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
// //           >
// //             <BarChart size={20} />
// //           </button>
// //         </div>
// //       )}
// //       <div className="mt-8">
// //         {isLoading ? (
// //           <SkeletonLoader viewMode={viewMode} columns={1} />
// //         ) : error ? (
// //           <div className="text-center text-red-500">{error}</div>
// //         ) : showGraphs ? (
// //           <>
// //             {viewMode === 'combined' ? (
// //               <CombinedChart
// //                 bpmData={bpmData}
// //                 stepData={stepData}
// //                 calorieData={calorieData}
// //                 predictMinuteData={predictMinuteData}
// //                 predictHourData={predictHourData}
// //                 hrvHourData={hrvHourData}  // 새로운 HRV 데이터 전달
// //                 globalStartDate={globalStartDate}
// //                 globalEndDate={globalEndDate}
// //                 onBrushChange={handleBrushChange}
// //               /> 
// //             ) : (
// //               <MultiChart
// //               selectedUser={selectedUser}
// //               bpmData={bpmData}
// //               stepData={stepData}
// //               calorieData={calorieData}
// //               sleepData={sleepData}
// //               predictMinuteData={predictMinuteData}
// //               predictHourData={predictHourData}
// //               hrvHourData={hrvHourData}
// //               globalStartDate={globalStartDate}
// //               globalEndDate={globalEndDate}
// //               onBrushChange={handleBrushChange}
// //               fetchAdditionalData={fetchAdditionalData}
// //               fetchHrvData={fetchHrvData}
// //               initialDateWindow={initialDateWindow}
// //               selectedDate={selectedDate}
// //               dbStartDate={dbStartDate}
// //               dbEndDate={dbEndDate}
// //             />
// //           )}
// //           {/* {renderTime !== null && (
// //             <div className="mt-4 text-center text-gray-600">
// //               Total render time: {renderTime.toFixed(2)} ms
// //             </div>
// //           )} */}
// //         {hrvDayData.length > 0 && (
// //           <div className="mt-8">
// //             <RmssdCalHeatmap hrvDayData={hrvDayData} />
// //             <SdnnCalHeatmap hrvDayData={hrvDayData} />
// //             {/* <RmssdCalendar hrvDayData={hrvDayData} />
// //             <SdnnCalendar hrvDayData={hrvDayData} /> */}
// //           </div>
// //         )}
// //         </>
// //       ) : null}
// //       {showGraphs && bpmData.length === 0 && stepData.length === 0 && calorieData.length === 0 && predictMinuteData.length === 0 && (
// //         <div className="text-center text-red-500">No data available for the charts.</div>
// //       )}
// //       </div>
// //     </div>
// //   );
// // }

// //const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app'

// import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
// import axios from 'axios'
// import MultiChart from '../../components/MultiChart4';
// import CombinedChart from '../../components/CombinedChart3';
// import { SkeletonLoader } from '../../components/SkeletonLoaders3';
// import { LaptopMinimal, LayoutGrid, BarChart } from 'lucide-react';
// import { addHours, parseISO, format, startOfHour, endOfHour, startOfWeek, endOfWeek, addDays, subDays, isSunday, nextSunday, endOfDay, startOfDay, previousSunday, previousMonday, isSaturday, isFriday, isFuture, nextMonday, nextSaturday, subSeconds } from 'date-fns';

// import CombinedHrvHeatmap from '../../components/CombinedHrvHeatmap';


// import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

// import DataAvailabilityCalendar from '../../components/DataCountCalendar'
// // ///
// // import Calendar from 'react-calendar';
// // import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// // import styles from './CustomCalendar2.module.css'
// interface DataResult {
//   collection: string;
//   data: { _id: string; count: number }[];
// }
// // ////

// // // const getDataCountForDate = (date: Date, data: DataResult[]) => {
// // //   const dateString = addDays(date, 1).toISOString().split('T')[0]; // 'YYYY-MM-DD' 형식으로 변환
// // //   return {
// // //     bpm: data.find((d) => d.collection === 'bpm')?.data.find((item) => item._id === dateString)?.count || 0,
// // //     step: data.find((d) => d.collection === 'step')?.data.find((item) => item._id === dateString)?.count || 0,
// // //     calorie: data.find((d) => d.collection === 'calorie')?.data.find((item) => item._id === dateString)?.count || 0,
// // //     sleep: data.find((d) => d.collection === 'sleep')?.data.find((item) => item._id === dateString)?.count || 0,
// // //   };
// // // };

// // const getDataCountForDate = (date: Date, data: DataResult[]) => {
// //   // 날짜만 추출 (YYYY-MM-DD 형식)
// //   const dateString = format(date, 'yyyy-MM-dd');

// //   return {
// //     bpm: data.find((d) => d.collection === 'bpm')?.data.find((item) => 
// //       format(parseISO(item._id), 'yyyy-MM-dd') === dateString
// //     )?.count || 0,
// //     step: data.find((d) => d.collection === 'step')?.data.find((item) => 
// //       format(parseISO(item._id), 'yyyy-MM-dd') === dateString
// //     )?.count || 0,
// //     calorie: data.find((d) => d.collection === 'calorie')?.data.find((item) => 
// //       format(parseISO(item._id), 'yyyy-MM-dd') === dateString
// //     )?.count || 0,
// //     sleep: data.find((d) => d.collection === 'sleep')?.data.find((item) => 
// //       format(parseISO(item._id), 'yyyy-MM-dd') === dateString
// //     )?.count || 0,
// //   };
// // };

// // ///


// // const getDataCountForDate = (date: Date, data: DataResult[]) => {
// //   const dateString = addDays(date, 1).toISOString().split('T')[0]; // 'YYYY-MM-DD' 형식으로 변환
// //   return {
// //     bpm: data.find((d) => d.collection === 'bpm')?.data.find((item) => item._id === dateString)?.count || 0,
// //     step: data.find((d) => d.collection === 'step')?.data.find((item) => item._id === dateString)?.count || 0,
// //     calorie: data.find((d) => d.collection === 'calorie')?.data.find((item) => item._id === dateString)?.count || 0,
// //     sleep: data.find((d) => d.collection === 'sleep')?.data.find((item) => item._id === dateString)?.count || 0,
// //   };
// // };

// const getDataCountForDate = (date: Date, data: DataResult[]) => {
//   // 날짜만 추출 (YYYY-MM-DD 형식)
//   const dateString = format(date, 'yyyy-MM-dd');

//   return {
//     bpm: data.find((d) => d.collection === 'bpm')?.data.find((item) => 
//       format(parseISO(item._id), 'yyyy-MM-dd') === dateString
//     )?.count || 0,
//     step: data.find((d) => d.collection === 'step')?.data.find((item) => 
//       format(parseISO(item._id), 'yyyy-MM-dd') === dateString
//     )?.count || 0,
//     calorie: data.find((d) => d.collection === 'calorie')?.data.find((item) => 
//       format(parseISO(item._id), 'yyyy-MM-dd') === dateString
//     )?.count || 0,
//     sleep: data.find((d) => d.collection === 'sleep')?.data.find((item) => 
//       format(parseISO(item._id), 'yyyy-MM-dd') === dateString
//     )?.count || 0,
//   };
// };


// const users = ['hswchaos@gmail.com', 'subak63@gmail.com', '27hyobin@gmail.com', 'skdlove1009@gmail.com', 'sueun4701@gmail.com', 'psy.suh.hg@gmail.com']
// const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app'

// const LoadingSpinner = () => (
//   <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2">
//     <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
//   </div>
// )

// interface AdditionalData {
//   bpmData: any[];
//   stepData: any[];
//   calorieData: any[];
//   sleepData: any[];
//   hrvData: any[];
// }

// interface DataItem {
//   ds: string;
//   timestamp: string;
//   timestamp_start: string;
//   timestamp_end: string;
//   type?: string;
//   value?: string;
//   bpm?: number;
//   step?: number;
//   calorie?: number;
//   rmssd?: number;
//   sdnn?: number;
//   min_pred_bpm: number | null;
//   pred_rmssd?: number;
//   //firstDate?: string;
// }

// export default function Home() {
//   const [selectedUser, setSelectedUser] = useState('');
//   const [message, setMessage] = useState('');
//   const [isLoadingUser, setIsLoadingUser] = useState(false);
//   const [selectedDate, setSelectedDate] = useState('');
//   const [showGraphs, setShowGraphs] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [saveDates, setSaveDates] = useState<string[]>([]);

//   const [bpmData, setBpmData] = useState<DataItem[]>([]);
//   const [stepData, setStepData] = useState<DataItem[]>([]);
//   const [calorieData, setCalorieData] = useState<DataItem[]>([]);
//   const [sleepData, setSleepData] = useState<DataItem[]>([]);
//   const [firstDate, setFirstDate] = useState<any[]>([]);

//   const [predictMinuteData, setPredictMinuteData] = useState<any[]>([]);
//   const [predictHourData, setPredictHourData] = useState<any[]>([]);

//   const [renderTime, setRenderTime] = useState<number | null>(null);
//   const startTimeRef = useRef<number | null>(null);

//   const [viewMode, setViewMode] = useState<'combined' | 'multi' | 'echarts'>('multi');
//   const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('minute');

//   const [hrvHourData, setHrvHourData] = useState<any[]>([]);
//   const [hrvDayData, setHrvDayData] = useState<any[]>([]);

//   const [initialDateWindow, setInitialDateWindow] = useState<{ start: Date; end: Date } | null>(null);

//   const multiChartRef = useRef<HTMLDivElement>(null);

//   ///테스트;;
//   const [hrvConvertDate, setHrvConvertDate] = useState<DataItem[]>([]);

//   ///
//   const [countData, setCountData] = useState<DataResult[]>([]);
//   ///

//   const scrollToMultiChart = useCallback(() => {
//     if (multiChartRef.current) {
//       multiChartRef.current.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, []);

  
//   const timezoneOffset = new Date().getTimezoneOffset()
//   const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1


//   const { globalStartDate, globalEndDate } = useMemo(() => {
//     const allDates = [...bpmData, ...stepData, ...calorieData].map(item => new Date(item.timestamp).getTime());
//     return {
//       globalStartDate: allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date(),
//       globalEndDate: allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date()
//     };
//   }, [bpmData, stepData, calorieData]);

//   const [dbStartDate, setDbStartDate] = useState<Date | null>(null);
//   const [dbEndDate, setDbEndDate] = useState<Date | null>(null);


//   const fetchDataRanges = async (user: string) => {
//     try {

//       const collections = ['bpm', 'step', 'calorie'];
//       const ranges = await Promise.all(collections.map(async (collection) => {
//         const response = await axios.get('/api/getDataRange', {
//           params: { collection, user_email: user }
//         });
//         return response.data;
//       }));

//       //console.log('in fetchDataRanges ; ranges', ranges)


//       const allStartDates = ranges.map((r) => new Date(r.startDate).getTime());
//       const allEndDates = ranges.map((r) => new Date(r.endDate).getTime());

//       const dbStartDate = new Date(Math.min(...allStartDates));
//       const dbEndDate = addDays(new Date(Math.max(...allEndDates)), 3);

//       setDbStartDate(dbStartDate);
//       setDbEndDate(dbEndDate);

//     } catch (error) {
//       console.error('Error fetching data ranges:', error);
//     }
//   };

//   useEffect(() => {
//     if (selectedUser) {
//       fetchDataRanges(selectedUser);
//     }
//   }, [selectedUser]);

//   const getWeekRange = (date: Date) => {
//     //console.log('@@@@@in getWeekRange 초기 date: ', date)
//     const datePreviousMonday = previousMonday(startOfWeek(date, {weekStartsOn: 1}));
//     const dateNextSunday = nextSunday(endOfWeek(date, {weekStartsOn: 1}));
//     // console.log('@@@@@in getWeekRange 변환 월요일: ', datePreviousMonday)
//     // console.log('@@@@@in getWeekRange 변환 일요일: ', dateNextSunday)

//     return { start: startOfDay(datePreviousMonday), end: dateNextSunday };
//   };

//   const fetchData = async (collection: string, user: string, startDate: Date, endDate: Date) => {
//     try {
//       const fetchStart = performance.now()

//       const utcStartDate = formatInTimeZone(startDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
//       const utcEndDate = formatInTimeZone(endDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    
//       const response = await axios.get('/api/getData3_agg', {
//         params: { 
//           collection, 
//           user_email: user, 

//           startDate: utcStartDate,
//           endDate: utcEndDate

//         }
//       });

//       const fetchEnd = performance.now()
//       console.log(`In index ${collection} 걸린 시간 : ${fetchEnd - fetchStart} // ${startDate} ~ ${endDate}`)
//       return response.data;
//     } catch (error) {
//       console.error(`Error fetching ${collection} data:`, error);
//       throw error;
//     }
//   };



//   const handleBrushChange = (domain: [number, number] | null) => {
//     //console.log("Brush domain changed2:", domain);
//   };

//   const handleDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const date = e.target.value;
//     setSelectedDate(date);
//     if (date) {
//       setIsLoading(false);
//       setError(null);
//       setShowGraphs(false);  // 그래프를 숨깁니다.
//       startTimeRef.current = performance.now();  // 시작 시간을 기록합니다.
//       try {
//         const selectedDate = new Date(date);
//         //const { start: fetchStartDate, end: fetchEndDate } = getWeekRange(selectedDate);
//         const timezoneOffset = new Date().getTimezoneOffset()
//         const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1

//         const weekRange = getWeekRange(selectedDate);

//         // console.log('in handleDateSelect weekRange.start, weekRagne.end : ', weekRange.start , weekRange.end)

//         // const testWeekRangeStart = weekRange.start.getTime()
//         // const testWeekRangeEnd = weekRange.end.getTime()
//         // const testOffsetMsWeekRangeStart = testWeekRangeStart - offsetMs
//         // const testOffsetMsWeekRangeEnd = testWeekRangeEnd - offsetMs
//         // const testNewDateOffsetMsWeekRangeStart = new Date(testOffsetMsWeekRangeStart)
//         // const testNewDateOffsetMsWeekRangeEnd = new Date(testOffsetMsWeekRangeEnd)
//         // console.log('변환 테스트 getTime weekRange : ', testWeekRangeStart , testWeekRangeEnd)
//         // console.log('변환 테스트 getTime - offsetMs : ', testOffsetMsWeekRangeStart , testOffsetMsWeekRangeEnd)
//         // console.log('변환 테스트 new Date getTime - offsetMs : ', testNewDateOffsetMsWeekRangeStart , testNewDateOffsetMsWeekRangeEnd)

//         // const utcStartDate = formatInTimeZone(weekRange.start, 'UTC', "yyyy-MM-dd'T'00:00:00.000'Z'");
//         // const utcEndDate = formatInTimeZone(weekRange.end, 'UTC', "yyyy-MM-dd'T'23:59:59.999'Z'");

//         const utcStartDate = new Date(weekRange.start.getTime() - offsetMs);
//         const utcEndDate = new Date(weekRange.end.getTime() - offsetMs);

//         // console.log('in handleDateSelect utcStartDate, utcEndDate : ', utcStartDate , utcEndDate)
//         // console.log('in handleDateSelect new Date utcStartDate, new Date utcEndDate : ', new Date(utcStartDate) , new Date(utcEndDate))

//         const responseDay = await axios.get(`${API_URL}/feature_day_div/${selectedUser}`);
//         console.log('%%%%%%%%%%%%%%%%%%%%dayHRV%%%%%%%%%%%%%%%%%%%%')

//         //console.log(responseDay.data.day_hrv)
        

//         // const hrvConvertDate = responseDay.data.day_hrv
//         // const dayConvertHrv = responseDay.data.day_hrv.map(item => ({
//         //   ...item,
//         //   ds: format(item.ds, 'yyyy-MM-dd')
//         // }))

//         console.log('%%%%%%%%%%%%%%%%%%%%dayHRV%%%%%%%%%%%%%%%%%%%%')
//         setHrvDayData(responseDay.data.day_hrv);

//         const firstFetchStartTime = performance.now();

        

//         //const data = await fetchAdditionalData(fetchStartDate, fetchEndDate);
//         //const data = await fetchAdditionalData(new Date(utcStartDate), new Date(utcEndDate));
//         const data = await fetchAdditionalData(utcStartDate, utcEndDate);
//         const firstFetchEndTime = performance.now();
//         console.log(`handleDateSelect에서 첫 fetch 데이터 걸린 시간 (약 2주) ${firstFetchEndTime - firstFetchStartTime} ms`);

//         setBpmData(data.bpmData);
//         setStepData(data.stepData);
//         setCalorieData(data.calorieData);
//         setSleepData(data.sleepData);
//         setHrvHourData(data.hrvData);

//         const predictStartTime = performance.now();
//         await fetchPredictionData(selectedUser);
//         const predictEndTime = performance.now();
//         console.log(`예측 데이터 가져오는데 걸리는 시간 : ${predictEndTime - predictStartTime} ms`);


  
//         setShowGraphs(true);  // 모든 데이터 로딩이 완료되면 그래프를 표시합니다.
//         setTimeout(scrollToMultiChart, 100);
//       } catch (error) {
//         console.error('Error in handleDateSelect:', error);
//         setError(`Error loading data: ${error instanceof Error ? error.message : String(error)}`);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };


//   const fetchHrvData = useCallback(async (user: string, start: Date, end: Date) => {
//     try {

//       const utcStart = formatInTimeZone(start, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
//       const utcEnd = formatInTimeZone(end, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

      
//       const response = await axios.get(`${API_URL}/feature_hour_div/${user}/${new Date(utcStart).getTime()}/${new Date(utcEnd).getTime()}`);

//       // console.log('----------------in fetchHrvData --------------')
//       // console.log(response.data)
//       // console.log(response.data.hour_hrv.map((item: any) => ({
//       //   ...item,
//       //   ds: formatInTimeZone(new Date(item.ds), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
//       // })))
//       // console.log('----------------in fetchHrvData --------------')

//       if (response.data && response.data.hour_hrv) {
//         return response.data.hour_hrv.map((item: any) => ({
//           ...item,
//           ds: formatInTimeZone(new Date(item.ds), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
//         }));
//       }
//       return [];

//     } catch (error) {
//       console.error('Error in fetchHrvData: ', error);
//       return [];
//     }
//   }, [API_URL]);

//   const fetchAdditionalData = useCallback((startDate: Date, endDate: Date): Promise<AdditionalData> => {
//     if (!selectedUser) return Promise.resolve({ bpmData: [], stepData: [], calorieData: [], sleepData: [], hrvData: [] });


//     console.log('in fetchAdditionalData : (startDate, endDate) : ', startDate, '~~', endDate)

//     return Promise.all([

//       fetchData('bpm', selectedUser, startDate, endDate),
//       fetchData('step', selectedUser, startDate, endDate),
//       fetchData('calorie', selectedUser, startDate, endDate),
//       fetchData('sleep', selectedUser, startDate, endDate),
//       fetchHrvData(selectedUser, startDate, endDate),
//     ])
//       .then(([bpm, step, calorie, sleep, hrv]) => {

//       const processedBpmData = bpm.map((item: DataItem) => ({
//         ...item,
//         timestamp: formatInTimeZone(new Date(item.timestamp), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
//       }));

//       //console.log('after processedBpmData', processedBpmData)

//       const processedStepData = step.map((item: DataItem) => ({
//         ...item,
//         timestamp: formatInTimeZone(new Date(item.timestamp), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
//       }));

//       //console.log('after processedStepData', processedStepData)

//       const processedCalorieData = calorie.map((item: DataItem) => ({
//         ...item,
//         timestamp: formatInTimeZone(new Date(item.timestamp), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
//       }));

//       //console.log('after processedCalorieData', processedCalorieData)

//       console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&')
//       console.log('before processedSleepData : ', sleep)

//       const processedSleepData = sleep.map((item: DataItem) => ({
//         ...item,
//         timestamp_start: formatInTimeZone(new Date(item.timestamp_start), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
//         timestamp_end: formatInTimeZone(new Date(item.timestamp_end), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
//       }));

//       console.log('after processedSleepData', processedSleepData)
//       console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&')

//       const processedHrvData = hrv.map((item: DataItem) => ({
//         ...item,
//         timestamp: formatInTimeZone(new Date(item.ds), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
//       }));

//       //console.log('after processedHrvData', processedHrvData)


  

//         //const hrvData = bpm.length === 0 ? [] : hrv;

//       //console.log('in fetchAdditionalData --- initialize ;; ; bpm : ', bpm)

//         //setTimeout(scrollToMultiChart, 100);
//         // return {
//         //   bpmData: bpm || [],
//         //   stepData: step || [],
//         //   calorieData: calorie || [],
//         //   sleepData: sleep || [],
//         //   hrvData: hrvData,
//         // };


//       //console.log('in fetchAdditionalData', processedBpmData)

//       return {
//         bpmData: processedBpmData,
//         stepData: processedStepData,
//         calorieData: processedCalorieData,
//         sleepData: processedSleepData,
//         hrvData: processedHrvData,
//       };
//     })
//     .catch((error) => {
//       console.error('Error fetching additional data:', error);
//       return { bpmData: [], stepData: [], calorieData: [], sleepData: [], hrvData: [] };
//     });
//   }, [selectedUser, fetchData, fetchHrvData]);
  

//   const fetchPredictionData = async (user: string) => {
//     try {
//       const [minuteResponse, hourResponse] = await Promise.all([
//         axios.get(`${API_URL}/predict_minute_div/${user}`),
//         axios.get(`${API_URL}/predict_hour_div/${user}`)
//       ]);

//       const minutePredictions = minuteResponse.data.min_pred_bpm || [];
//       const hourPredictions = hourResponse.data.hour_pred_bpm || [];

//       //console.log('in fetchPredictionData : minute response : ', minuteResponse.data)
  
//       setPredictMinuteData(minutePredictions);
//       setPredictHourData(hourPredictions);
//     } catch (error) {
//       console.error('Error in fetchPredictionData: ', error);
//       setPredictMinuteData([]);
//       setPredictHourData([]);
//     }
//   }

//   const utcToLocal = (utcDateString: string, timeZone: string): string => {
//     const utcDate = new Date(utcDateString);
//     return utcDate.toLocaleString('en-US', { timeZone });
//   };

//   const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const user = e.target.value
//     const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
//     // console.log('My TimeZone ;;;; ', userTimeZone, 'utcToLocal ;;;; ', utcToLocal('2024-10-14T12:50:00.000+00:00', userTimeZone))

//     // console.log('formatInTimeZone(new Date(), UTC, yyyy-MM-dd HH:mm:ssXXX)', formatInTimeZone(new Date(), 'UTC', 'yyyy-MM-dd HH:mm:ssXXX'))
//     // console.log('formatInTimeZone(new Date(), UTC, yyyy-MM-dd HH:mm:ss zzz)', formatInTimeZone(new Date(), 'UTC', 'yyyy-MM-dd HH:mm:ss zzz'))
  
//     // console.log('toZonedTime(new Date(), UTC)', toZonedTime(new Date(), 'UTC'))
//     // console.log('fromZonedTime(new Date(), UTC)', fromZonedTime(new Date(), 'UTC'))

//     const nowUtc = new Date(Date.now());

//     //console.log('------', Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDay(), nowUtc.getUTCHours(), nowUtc.getUTCMinutes()))
//     const startOfDayUtc = new Date(Date.UTC(
//       nowUtc.getUTCFullYear(),
//       nowUtc.getUTCMonth(),
//       nowUtc.getUTCDate()
//     ));
//     //console.log(startOfDayUtc)

//     // console.log('33333',localDate)
//     // console.log(new Date())
//     // console.log('22222', utcDate)
//     // console.log('11111', Intl.DateTimeFormat().resolvedOptions().timeZone)
//     // console.log('00000', fromZonedTime(localDate, 'Europe/Moscow'))

//     setSelectedUser(user)
//     setSelectedDate('')
//     setSaveDates([])
//     if (user) {
//       setIsLoadingUser(true)
//       // 서버 dynamodb 데이터 처리 및 mongodb 저장 걸린 시간 (1)
//       const startTimeCheckDB = performance.now();
//       await checkDb(user)
//       const endTimeCheckDB = performance.now();
//       console.log(`In Index.tsx ---> checkDB 걸린 시간 (1) : ${endTimeCheckDB - startTimeCheckDB} ms`);

//       const responseDay = await axios.get(`${API_URL}/feature_day_div/${user}`);
//       const userFirstDate = await axios.get(`${API_URL}/get_start_dates/${user}`)

//       const userStartDate = userFirstDate.data.start_date
//       setFirstDate([userStartDate])

//       console.log('---------------------------')
//       console.log('---------------------------')
//       console.log(responseDay.data.day_hrv)
//       console.log('---------------------------')
//       console.log('---------------------------')
//       setHrvDayData(responseDay.data.day_hrv);

//       const countDataResponse = await axios.get('/api/getCountData', { params: { user_email: user } })
//       setCountData(countDataResponse.data);

//       // 서버 저장 시간 가져오기 걸린 시간
//       const startTimeFetchSaveDates = performance.now();
//       await fetchSaveDates(user)
//       const endTimeFetchSaveDates = performance.now();
//       console.log(`fetchSaveDates 걸린 시간 (저장 시간 가져오기 (2)) : ${endTimeFetchSaveDates - startTimeFetchSaveDates} ms`);
      
//       setIsLoadingUser(false)
//     }
//   }
  
//   const checkDb = async (user: string) => {
//     try {
//       await axios.post(`${API_URL}/check_db3_dynamodb`, { user_email: user })
      
//     } catch (error) {
//       setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
//     }
//   }

//   const fetchSaveDates = async (user: string) => {
//     try {
//       const response = await axios.get(`${API_URL}/get_save_dates_div/${user}`);
//       //console.log('--- in fetchSaveDates --- before convert', response.data.save_dates)
//       //const convertSaveDate = [new Date(new Date(response.data.save_dates).getTime() + offsetMs).toString()]
//       //console.log('--- in fetchSaveDates --- after convert', convertSaveDate)
//       setSaveDates(response.data.save_dates);
//       //setSaveDates(convertSaveDate);
//     } catch (error) {
//       console.error('Error fetching save dates:', error);
//       setMessage(`Error fetching save dates: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   };


//   // const tileContent = ({ date }: { date: Date }) => {
//   //   const counts = getDataCountForDate(date, countData);
//   //   const hasData = Object.values(counts).some(count => count > 0);
  
//   //   if (counts.bpm < 1440 - 60 || counts.calorie < 96 - 4) {
//   //     return hasData ? (
//   //       <div className={styles.tileContentUnderCount}>
//   //       <div className={styles.dataCount}>{counts.bpm} / {counts.step} </div>
//   //       <div className={styles.dataCount}>{counts.calorie} / {counts.sleep}</div>
//   //     </div>
//   //     ) : null;
//   //   } else {
//   //     return hasData ? (
//   //       <div className={styles.tileContent}>
//   //       <div className={styles.dataCount}>{counts.bpm} / {counts.step}</div>
//   //       <div className={styles.dataCount}>{counts.calorie} / {counts.sleep}</div>
//   //     </div>
//   //     ) : null;
//   //   }

//   // };

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Heart Rate and Sleep Analysis Dashboard</h1>
//       <div className="mb-4 flex items-center">
//         <label className="mr-2">계정 선택:</label>
//         <select 
//           value={selectedUser} 
//           onChange={handleUserSelect}
//           className="border p-2 rounded mr-2"
//         >
//           <option value="">Select a user</option>
//           {users.map(user => (
//             <option key={user} value={user}>{user}</option>
//           ))}
//         </select>
//         {isLoadingUser && <LoadingSpinner />}
//       </div>
//       {selectedUser && saveDates.length > 0 && (
//         <div className="mb-4 flex items-center">
//           <label className="mr-2">저장된 날짜 선택:</label>
//           <select 
//             value={selectedDate} 
//             onChange={handleDateSelect}
//             className="border p-2 rounded mr-2"
//           >
//             <option value="">Select a date</option>
//             {saveDates.map(date => (
//               <option key={date} value={date}>{date}</option>
//             ))}
//           </select>
//           {isLoading && <LoadingSpinner />}
//         </div>
//       )}
//       {isLoading ? (
//         <SkeletonLoader viewMode={viewMode} columns={1} />
//       ) : selectedUser && countData.length > 0 && !error ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <DataAvailabilityCalendar countData={countData} />
//         {/* <Card className='w-[850px]'>
//           <CardHeader>
//             <CardTitle>Data Availability (BPM/Steps/Calories/Sleep)</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <Calendar
//               //onClickDay={handleDateSelect}
//               tileContent={tileContent}
//               className={styles.customCalendar}
//               locale="ko"
//               nextLabel="▶"
//               prevLabel="◀"
//               next2Label={null}
//               prev2Label={null}
//             />
//           </CardContent>
//         </Card> */}
//         {/* <Card>
//           <CardHeader>
//             <CardTitle>HRV Heatmaps</CardTitle>
//           </CardHeader>
//           <CardContent className="flex flex-col space-y-4">
//             <CombinedHrvHeatmap hrvDayData={hrvDayData} firstDate={firstDate} />
//           </CardContent>
//         </Card> */}



//       </div>

//       ) : (
//         <div></div>
//       )}
//       {selectedDate && (
//         <div className="mb-4 flex items-center justify-end">
//           <button
//             onClick={() => setViewMode('combined')}
//             className={`p-2 rounded mr-2 ${viewMode === 'combined' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//           >
//             <LaptopMinimal size={20} />
//           </button>
//           <button
//             onClick={() => setViewMode('multi')}
//             className={`p-2 rounded mr-2 ${viewMode === 'multi' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//           >
//             <LayoutGrid size={20} />
//           </button>
//           <button
//             onClick={() => setViewMode('echarts')}
//             className={`p-2 rounded mr-2 ${viewMode === 'echarts' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//           >
//             <BarChart size={20} />
//           </button>
//         </div>
//       )}
//       <div className="mt-8">
//         {isLoading ? (
//           <SkeletonLoader viewMode={viewMode} columns={1} />
//         ) : error ? (
//           <div className="text-center text-red-500">{error}</div>
//         ) : showGraphs ? (
//           <>
//             {viewMode === 'combined' ? (
//               <CombinedChart
//                 bpmData={bpmData}
//                 stepData={stepData}
//                 calorieData={calorieData}
//                 predictMinuteData={predictMinuteData}
//                 predictHourData={predictHourData}
//                 hrvHourData={hrvHourData}  // 새로운 HRV 데이터 전달
//                 globalStartDate={globalStartDate}
//                 globalEndDate={globalEndDate}
//                 onBrushChange={handleBrushChange}
//               /> 
//             ) : (
//               <div ref={multiChartRef}>
              
//                 <MultiChart
//                 selectedUser={selectedUser}
//                 bpmData={bpmData}
//                 stepData={stepData}
//                 calorieData={calorieData}
//                 sleepData={sleepData}
//                 predictMinuteData={predictMinuteData}
//                 predictHourData={predictHourData}
//                 hrvHourData={hrvHourData}
//                 globalStartDate={globalStartDate}
//                 globalEndDate={globalEndDate}
//                 onBrushChange={handleBrushChange}
//                 fetchAdditionalData={fetchAdditionalData}
//                 fetchHrvData={fetchHrvData}
//                 initialDateWindow={initialDateWindow}
//                 selectedDate={selectedDate}
//                 dbStartDate={dbStartDate}
//                 dbEndDate={dbEndDate}
//                 scrollToMultiChart={scrollToMultiChart}
//               />
//             </div>
//           )}

//         {hrvDayData.length > 0 && (
//           <div className="mt-8">

//             <CombinedHrvHeatmap hrvDayData={hrvDayData} firstDate={firstDate} />

//           </div>
//         )}
//         </>
//       ) : null}
//       {showGraphs && bpmData.length === 0 && stepData.length === 0 && calorieData.length === 0 && predictMinuteData.length === 0 && (
//         <div className="text-center text-red-500">No data available for the charts.</div>
//       )}
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import axios from 'axios'
import MultiChart from '../../components/MultiChart4';
import CombinedChart from '../../components/CombinedChart3';
import { SkeletonLoader } from '../../components/SkeletonLoaders3';
import {   
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Plus,
  Sparkles,
  LaptopMinimal, 
  LayoutGrid, 
  BarChart } from 'lucide-react';
import { addHours, parseISO, format, startOfHour, endOfHour, startOfWeek, endOfWeek, addDays, subDays, isSunday, nextSunday, endOfDay, startOfDay, previousSunday, previousMonday, isSaturday, isFriday, isFuture, nextMonday, nextSaturday, subSeconds } from 'date-fns';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Calendar } from "@/components/ui/calendar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import CombinedHrvHeatmap from '../../components/CombinedHrvHeatmap';
import dynamic from 'next/dynamic';



import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

import DataAvailabilityCalendar from '../../components/DataCountCalendar'

import styles from './CustomCalendar3.module.css'
interface DataResult {
  collection: string;
  data: { _id: string; count: number }[];
}


const users = ['hswchaos@gmail.com', 'subak63@gmail.com', '27hyobin@gmail.com', 'skdlove1009@gmail.com', 'sueun4701@gmail.com', 'psy.suh.hg@gmail.com']
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
  timestamp_start: string;
  timestamp_end: string;
  type?: string;
  value?: string;
  bpm?: number;
  step?: number;
  calorie?: number;
  rmssd?: number;
  sdnn?: number;
  min_pred_bpm: number | null;
  pred_rmssd?: number;
  //firstDate?: string;
}

TempPage.getLayout = (page: React.ReactElement) => page;
export default function TempPage() {
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
  const [sleepData, setSleepData] = useState<DataItem[]>([]);
  const [firstDate, setFirstDate] = useState<any[]>([]);

  const [predictMinuteData, setPredictMinuteData] = useState<any[]>([]);
  const [predictHourData, setPredictHourData] = useState<any[]>([]);

  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<'combined' | 'multi' | 'echarts'>('multi');
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('minute');

  const [hrvHourData, setHrvHourData] = useState<any[]>([]);
  const [hrvDayData, setHrvDayData] = useState<any[]>([]);

  const [initialDateWindow, setInitialDateWindow] = useState<{ start: Date; end: Date } | null>(null);

  const multiChartRef = useRef<HTMLDivElement>(null);

  ///테스트;;
  const [hrvConvertDate, setHrvConvertDate] = useState<DataItem[]>([]);

  ///
  const [countData, setCountData] = useState<DataResult[]>([]);
  ///

  const scrollToMultiChart = useCallback(() => {
    if (multiChartRef.current) {
      multiChartRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

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

      const collections = ['bpm', 'step', 'calorie'];
      const ranges = await Promise.all(collections.map(async (collection) => {
        const response = await axios.get('/api/getDataRange', {
          params: { collection, user_email: user }
        });
        return response.data;
      }));

      const allStartDates = ranges.map((r) => new Date(r.startDate).getTime());
      const allEndDates = ranges.map((r) => new Date(r.endDate).getTime());

      const dbStartDate = new Date(Math.min(...allStartDates));
      const dbEndDate = addDays(new Date(Math.max(...allEndDates)), 3);

      setDbStartDate(dbStartDate);
      setDbEndDate(dbEndDate);

    } catch (error) {
      console.error('Error fetching data ranges:', error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchDataRanges(selectedUser);
    }
  }, [selectedUser]);

  const getWeekRange = (date: Date) => {

    const datePreviousMonday = previousMonday(startOfWeek(date, {weekStartsOn: 1}));
    const dateNextSunday = nextSunday(endOfWeek(date, {weekStartsOn: 1}));

    return { start: startOfDay(datePreviousMonday), end: dateNextSunday };
  };

  const fetchData = async (collection: string, user: string, startDate: Date, endDate: Date) => {
    try {
      const fetchStart = performance.now()

      const utcStartDate = formatInTimeZone(startDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      const utcEndDate = formatInTimeZone(endDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    
      const response = await axios.get('/api/getData3_agg', {
        params: { 
          collection, 
          user_email: user, 

          startDate: utcStartDate,
          endDate: utcEndDate

        }
      });

      const fetchEnd = performance.now()
      //console.log(`In index ${collection} 걸린 시간 : ${fetchEnd - fetchStart} // ${startDate} ~ ${endDate}`)
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${collection} data:`, error);
      throw error;
    }
  };



  const handleBrushChange = (domain: [number, number] | null) => {
    //console.log("Brush domain changed2:", domain);
  };

  const handleDateSelect = useCallback(async (event: Event) => {
    const customEvent = event as CustomEvent<{ date: string }>;
    const { date } = customEvent.detail;
    //console.log(`index 히트맵에서 선택된 날짜: ${date}`);
    
    const selectedDate = new Date(date);

    setSelectedDate(format(selectedDate, 'yyyy-MM-dd'));
    
  }, [scrollToMultiChart]);

  useEffect(() => {
    window.addEventListener('dateSelect', handleDateSelect);
    return () => {
      window.removeEventListener('dateSelect', handleDateSelect);
    };
  }, [handleDateSelect]);



  const fetchHrvData = useCallback(async (user: string, start: Date, end: Date) => {
    try {

      const utcStart = formatInTimeZone(start, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      const utcEnd = formatInTimeZone(end, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

      
      const response = await axios.get(`${API_URL}/feature_hour_div/${user}/${new Date(utcStart).getTime()}/${new Date(utcEnd).getTime()}`);

      if (response.data && response.data.hour_hrv) {
        return response.data.hour_hrv.map((item: any) => ({
          ...item,
          ds: formatInTimeZone(new Date(item.ds), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        }));
      }
      return [];

    } catch (error) {
      console.error('Error in fetchHrvData: ', error);
      return [];
    }
  }, [API_URL]);

  const fetchAdditionalData = useCallback((startDate: Date, endDate: Date): Promise<AdditionalData> => {
    if (!selectedUser) return Promise.resolve({ bpmData: [], stepData: [], calorieData: [], sleepData: [], hrvData: [] });

    console.log('in index fetchAddtionalData start, end ', startDate, endDate)

    return Promise.all([

      fetchData('bpm', selectedUser, startDate, endDate),
      fetchData('step', selectedUser, startDate, endDate),
      fetchData('calorie', selectedUser, startDate, endDate),
      fetchData('sleep', selectedUser, startDate, endDate),
      fetchHrvData(selectedUser, startDate, endDate),
    ])
      .then(([bpm, step, calorie, sleep, hrv]) => {

      console.log('fetch BPM Data : ', bpm)

      const processedBpmData = bpm.map((item: DataItem) => ({
        ...item,
        timestamp: formatInTimeZone(new Date(item.timestamp), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      }));

      console.log('precessed BPM Data : ', processedBpmData)

      const processedStepData = step.map((item: DataItem) => ({
        ...item,
        timestamp: formatInTimeZone(new Date(item.timestamp), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      }));

      const processedCalorieData = calorie.map((item: DataItem) => ({
        ...item,
        timestamp: formatInTimeZone(new Date(item.timestamp), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      }));

      const processedSleepData = sleep.map((item: DataItem) => ({
        ...item,
        timestamp_start: formatInTimeZone(new Date(item.timestamp_start), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        timestamp_end: formatInTimeZone(new Date(item.timestamp_end), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      }));

      const processedHrvData = hrv.map((item: DataItem) => ({
        ...item,
        timestamp: formatInTimeZone(new Date(item.ds), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      }));

      return {
        bpmData: processedBpmData,
        stepData: processedStepData,
        calorieData: processedCalorieData,
        sleepData: processedSleepData,
        hrvData: processedHrvData,
      };
    })
    .catch((error) => {
      console.error('Error fetching additional data:', error);
      return { bpmData: [], stepData: [], calorieData: [], sleepData: [], hrvData: [] };
    });
  }, [selectedUser, fetchData, fetchHrvData]);
  

  const fetchPredictionData = async (user: string) => {
    try {
      const [minuteResponse, hourResponse] = await Promise.all([
        axios.get(`${API_URL}/predict_minute_div/${user}`),
        axios.get(`${API_URL}/predict_hour_div/${user}`)
      ]);

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

      await checkDb(user)

      const responseDay = await axios.get(`${API_URL}/feature_day_div/${user}`);
      const userFirstDate = await axios.get(`${API_URL}/get_start_dates/${user}`)

      const userStartDate = userFirstDate.data.start_date
      setFirstDate([userStartDate])

      setHrvDayData(responseDay.data.day_hrv);

      const countDataResponse = await axios.get('/api/getCountData', { params: { user_email: user } })

      console.log(countDataResponse.data)
      setCountData(countDataResponse.data);

      await fetchSaveDates(user)

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

      setSaveDates(response.data.save_dates);

    } catch (error) {
      console.error('Error fetching save dates:', error);
      setMessage(`Error fetching save dates: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    calendars: [
      {
        name: "My Calendars",
        items: ["Personal", "Work", "Family"],
      },
      {
        name: "Favorites",
        items: ["Holidays", "Birthdays"],
      },
      {
        name: "Other",
        items: ["Travel", "Reminders", "Deadlines"],
      },
    ],
  }


  const handleSelection = (email: string) => {
    // HTMLSelectElement 이벤트를 시뮬레이션
    const event = {
      target: {
        value: email
      }
    } as React.ChangeEvent<HTMLSelectElement>
    
    handleUserSelect(event)
  }

  function NavUser({
    user,
  }: {
    user: {
      name: string
      email: string
      avatar: string
    }
  }) {
    const { isMobile } = useSidebar()
  
    return (
      <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-center text-base">
                  {selectedUser || "계정 선택"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel>사용자 계정 선택</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {users.map((user) => (
              <DropdownMenuItem
                key={user}
                onClick={() => handleSelection(user)}
                className="cursor-pointer"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selectedUser === user ? "opacity-100" : "opacity-0"
                  }`}
                />
                {user}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
    )
  }

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelSize, setPanelSize] = useState(45);

  

  const handleTriggerClick = () => {
    if (!isCollapsed) {
      // 닫을 때
      setPanelSize(0);
      setIsCollapsed(true);
    } else {
      // 열 때
      setPanelSize(45);
      setIsCollapsed(false);
    }
  };

  const DataAvailabilityCalendar = dynamic(
    () => import('../../components/DataCountCalendar'),
    { ssr: false }
  );

  return (
    <div className={styles.container} h-auto max-h-fit>
      <SidebarProvider className='h-[1000px] flex items.center rounded-lg'>
        <ResizablePanelGroup direction="horizontal" className="rounded-lg border-2" style={{ height: '987px', flexShrink: 0}}>
          <div className={`h-[987px] transition-all duration-300 ease-in-out flex ${
            isCollapsed ? 'w-0' : 'w-[550px]'
          }`}>
            <ResizablePanel 
              defaultSize={45}
              minSize={45}
              maxSize={50}
            >
              <div className={`h-full bg-background transition-all duration-500 ${
                isCollapsed ? 'opacity-0' : 'opacity-100'
              }`}>
                <div className="h-16 border-b border-sidebar-border">
                  <NavUser user={data.user} />
                </div>
                {/* <div className="w-full h-[860px]"> */}
                <div className="h-[calc(100%-4rem)]"> 
                  <DataAvailabilityCalendar countData={countData} />
                </div>
              </div>
            </ResizablePanel>

            {/* <ResizableHandle 
              withHandle 
              className={`transition-transform duration-300 ${
                isCollapsed ? '-translate-x-full' : 'translate-x-0'
              }`}
            /> */}
            <ResizableHandle withHandle />
          </div>

          <ResizablePanel>
            <div className="h-full flex flex-col">
              <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
                <div onClick={handleTriggerClick}>
                  <SidebarTrigger className="-ml-1" />
                </div>
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage>{selectedUser}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </header>
              <div className="flex-1 overflow-auto p-4">
                <div className="auto-rows-min gap-4 md:grid-cols-5">
                  {hrvDayData.length > 0 && (
                    <div className="mt-8">
                      <CombinedHrvHeatmap hrvDayData={hrvDayData} firstDate={firstDate} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarProvider>

      {isLoading ? (
        <SkeletonLoader viewMode={viewMode} columns={1} />
      ) : selectedUser && selectedDate && countData.length > 0 && !error ? (
        <div className="grid-cols-1 md:grid-cols-2 gap-4">
            <div ref={multiChartRef}>
              <MultiChart
              selectedUser={selectedUser}
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
              scrollToMultiChart={scrollToMultiChart}
            />
          </div>
      </div>

      ) : (
        <div></div>
      )}
      {/* {selectedDate && (
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
            onClick={() => setViewMode('echarts')}
            className={`p-2 rounded mr-2 ${viewMode === 'echarts' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <BarChart size={20} />
          </button>
        </div>
      )} */}
    </div>
  );
}