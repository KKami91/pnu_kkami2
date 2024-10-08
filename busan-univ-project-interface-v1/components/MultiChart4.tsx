import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine, TooltipProps, Dot, RectangleProps } from 'recharts';
import { Props as LineProps } from 'recharts/types/cartesian/Line';
import { Props as BarProps } from 'recharts/types/cartesian/Bar';
import { addWeeks, subWeeks, isWithinInterval, subSeconds, addSeconds, format, subDays, addDays, startOfDay, endOfDay, startOfHour, subHours, subMinutes, addMinutes, startOfWeek, endOfWeek, isAfter, addHours, previousMonday, nextSunday, eachHourOfInterval, eachMinuteOfInterval } from 'date-fns';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import MemoModal from './MemoModal';
import axios from 'axios'
import { filter } from 'd3';


interface MultiChartProps {
  selectedUser: string;
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  sleepData: any[];
  predictMinuteData: any[];
  predictHourData: any[];
  hrvHourData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
  fetchAdditionalData: (startDate: Date, endDate: Date) => Promise<AdditionalData>;
  initialDateWindow: { start: Date; end: Date; } | null;
  selectedDate: string;
  fetchHrvData: (user: string, start: Date, end: Date) => Promise<any[]>;
  dbStartDate: Date | null;
  dbEndDate: Date | null;
  //checkDataExistence: (startDate: Date, endDate: Date) => Promise<boolean>;
}

interface AdditionalData {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  sleepData: any[];
  hrvData: any[];
}

type DateRange = '1' | '7';

interface CachedDataType {
  [key: string]: AdditionalData;
}

interface WeekRange {
  start: Date;
  end: Date;
}

const MultiChart: React.FC<MultiChartProps> = ({
  selectedUser,
  bpmData: initialBpmData,
  stepData: initialStepData,
  calorieData: initialCalorieData,
  sleepData: initialSleepData,
  predictMinuteData,
  predictHourData,
  hrvHourData,
  onBrushChange,
  fetchAdditionalData,
  initialDateWindow,
  selectedDate,
  fetchHrvData,
  dbStartDate,
  dbEndDate,
  //checkDataExistence: checkDataExistenceFromServer
}) => {
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('hour');
  const [dateRange, setDateRange] = useState<DateRange>('1');
  const [columnCount, setColumnCount] = useState(2);
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);
  const [dateWindow, setDateWindow] = useState(initialDateWindow);
  const [bpmData, setBpmData] = useState(initialBpmData);
  const [stepData, setStepData] = useState(initialStepData);
  const [calorieData, setCalorieData] = useState(initialCalorieData);
  const [sleepData, setSleepData] = useState(initialSleepData);

  // Memo
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [memos, setMemos] = useState<{ [key: string]: string }>({});



  // const [cachedData, setCachedData] = useState<{
  //   [key: string]: AdditionalData
  // }>({});

  const [cachedData, setCachedData] = useState<CachedDataType>({});

  useEffect(() => {
    //console.log(`cachedData in useEffect -> ${Object.keys(cachedData)}`)
    //console.log('Cached Data Keys:', Object.keys(cachedData));
    //console.log('Cached Data:', cachedData);
    //console.log(`cachedData in useEffect -> ${}`)
  })

  const [localHrvData, setLocalHrvData] = useState(hrvHourData);

  const adjustTimeZone = (date: Date) => {
    return subHours(date, 9);
  };

  const adjustTimeZoneAddNine = (date: Date) => {
    return addHours(date, 9);
  };


  useEffect(() => {
    if (dateWindow && selectedUser) {
      fetchMemos();
    }
  }, [dateWindow, selectedUser]);

  const fetchMemos = async () => {
    if (!selectedUser || !dateWindow) return;
    try {
      const response = await axios.get('/api/getMemos', {
        params: {
          user_email: selectedUser,
          startDate: adjustTimeZoneAddNine(dateWindow.start),
          endDate: adjustTimeZoneAddNine(dateWindow.end),
        },
      });

      const memoData = response.data.reduce((acc: { [key: string]: string }, memo: any) => {
        const memoTimestamp = adjustTimeZone(new Date(format(memo.timestamp, 'yyyy-MM-dd HH:mm')))
        acc[`${memo.type}_${memoTimestamp.getTime()}`] = memo.memo;
        return acc;
      }, {});
  
      setMemos(memoData);
    } catch (error) {
      console.error('Error fetching memos:', error);
    }
  };
  
  const saveMemo = async (memo: string) => {
    if (selectedData && selectedUser) {
      try {
        await axios.post('/api/saveMemo', {
          user_email: selectedUser,
          dataType: selectedData.type,
          timestamp: adjustTimeZoneAddNine(selectedData.timestamp),
          memo,
        });
        setMemos(prev => ({
          ...prev,
          [`${selectedData.type}_${selectedData.timestamp}`]: memo
        }));
      } catch (error) {
        console.error('Error saving memo:', error);
      }
    }
    setMemoModalOpen(false);
  };

  // 기존 되던 것...
  // const handleChartClick = (data: any, dataKey: string) => {
  //   if (timeUnit === 'minute') {
  //     setSelectedData({ ...data, type: dataKey });
  //     setMemoModalOpen(true);
  //   }
  // };

  const handleChartClick = (data: any, dataKey: string) => {
    if (dataKey === 'calorie') {
      const interval = 15 * 60 * 1000; // 15분을 밀리초로 표현
      const startOfInterval = Math.floor(data.timestamp / interval) * interval;
      setSelectedData({ ...data, type: dataKey, timestamp: startOfInterval });
    } else {
      setSelectedData({ ...data, type: dataKey });
    }
    setMemoModalOpen(true);
  };


  // const fetchWeekData = useCallback(async (start: Date, end: Date) => {
  //   console.log(`&&fetchWeekData&&`)
  //   const weekKey = format(start, 'yyyy-MM-dd');
  //   if (!cachedData[weekKey]) {
  //     //console.log(`Fetching data for week: ${weekKey}`);
  //     const newData = await fetchAdditionalData(start, end);
  //     setCachedData(prev => ({ ...prev, [weekKey]: newData }));
  //   } else {
  //     //console.log(`Using cached data for week: ${weekKey}`);
  //   }
  // }, [fetchAdditionalData, cachedData]);

  // const prefetchAdjacentWeeks = useCallback(async (currentStart: Date, currentEnd: Date) => {
  //   console.log(`&&prefetchAdjacentWeeks&&`)
  //   const prevWeekStart = subDays(currentStart, 7);
  //   const prevWeekEnd = subSeconds(currentStart, 1);
  //   const nextWeekStart = addSeconds(currentEnd, 1);
  //   const nextWeekEnd = addDays(currentEnd, 7);

  //   // console.log(`in prefetchAdjacentWeeks ------ ${currentStart}, ${currentEnd}`)

  //   // console.log(`in prefetchAdjacentWeeks ------ ${prevWeekStart}, ${prevWeekEnd}`)
  //   // console.log(`in prefetchAdjacentWeeks ------ ${nextWeekStart}, ${nextWeekEnd}`)
  
  //   await Promise.all([
  //     fetchWeekData(prevWeekStart, prevWeekEnd),
  //     fetchWeekData(nextWeekStart, nextWeekEnd)
  //   ]);
  // }, [fetchWeekData]);

  // useEffect(() => {
  //   console.log(`dateWindow ; ; ; ; ${JSON.stringify(dateWindow)}`)
  //   if (dateWindow) {
  //     const loadData = async () => {
  //       const weekStart = startOfWeek(dateWindow.start, { weekStartsOn: 1 });
  //       const weekEnd = endOfWeek(dateWindow.start, { weekStartsOn: 1 });
        
  //       //await fetchWeekData(weekStart, weekEnd);
  //       await prefetchAdjacentWeeks(weekStart, weekEnd);
  
  //       const weekKey = format(weekStart, 'yyyy-MM-dd');
  //       if (cachedData[weekKey]) {
  //         setBpmData(cachedData[weekKey].bpmData);
  //         setStepData(cachedData[weekKey].stepData);
  //         setCalorieData(cachedData[weekKey].calorieData);
  //         setSleepData(cachedData[weekKey].sleepData);
  //         setLocalHrvData(cachedData[weekKey].hrvData);
  //       }
  //     };
  
  //     loadData();
  //   }
  // }, [dateWindow, fetchWeekData, prefetchAdjacentWeeks, cachedData]);

  useEffect(() => {
    const initializeCache = () => {
      let startDate: Date;
      if (initialDateWindow) {
        startDate = initialDateWindow.start;
      } else if (initialBpmData.length > 0) {
        startDate = new Date(initialBpmData[0].timestamp);
      } else if (dbStartDate) {
        startDate = dbStartDate;
      } else {
        console.error('No valid start date found for initialization');
        return;
      }

      const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
      const threeWeeksEnd = addWeeks(weekStart, 2);
      
      const newCachedData: CachedDataType = {};
      for (let i = 0; i < 3; i++) {
        const currentWeekStart = addWeeks(weekStart, i);
        const weekKey = format(currentWeekStart, 'yyyy-MM-dd');
        newCachedData[weekKey] = {
          bpmData: initialBpmData.filter(d => isWithinInterval(new Date(d.timestamp), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
          stepData: initialStepData.filter(d => isWithinInterval(new Date(d.timestamp), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
          calorieData: initialCalorieData.filter(d => isWithinInterval(new Date(d.timestamp), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
          sleepData: initialSleepData.filter(d => isWithinInterval(new Date(d.timestamp_start), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
          hrvData: hrvHourData.filter(d => isWithinInterval(new Date(d.ds), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
        };
      }
      setCachedData(newCachedData);

      // Set initial data for display
      const currentWeekKey = format(weekStart, 'yyyy-MM-dd');
      setBpmData(newCachedData[currentWeekKey].bpmData);
      setStepData(newCachedData[currentWeekKey].stepData);
      setCalorieData(newCachedData[currentWeekKey].calorieData);
      setSleepData(newCachedData[currentWeekKey].sleepData);
      setLocalHrvData(newCachedData[currentWeekKey].hrvData);

      // console.log('Cached Data Keys:', Object.keys(newCachedData));
      // console.log('Cached Data:', newCachedData);
    };

    initializeCache();
  }, [initialDateWindow, initialBpmData, initialStepData, initialCalorieData, initialSleepData, hrvHourData, dbStartDate]);



  // useEffect(() => {
  //   if (dateWindow) {
  //     const loadData = async () => {
  //       const weekStart = startOfWeek(dateWindow.start, { weekStartsOn: 1 });
  //       const weekEnd = endOfWeek(dateWindow.start, { weekStartsOn: 1 });
        
  //       const data = await fetchAdditionalData(weekStart, weekEnd);
        
  //       const weekKey = format(weekStart, 'yyyy-MM-dd');
  //       setCachedData(prev => ({ ...prev, [weekKey]: data }));
        
  //       setBpmData(data.bpmData);
  //       setStepData(data.stepData);
  //       setCalorieData(data.calorieData);
  //       setSleepData(data.sleepData);
  //       setLocalHrvData(data.hrvData);
  //     };
  
  //     loadData();
  //   }
  // }, [dateWindow, fetchAdditionalData]);


  useEffect(() => {
    if (dateWindow) {
      const loadData = async () => {
        const weekKey = format(startOfWeek(dateWindow.start, { weekStartsOn: 1 }), 'yyyy-MM-dd');

        //console.log(`weekKey ; ; ; ; ; ${weekKey}`)
        
        //console.log("Attempting to load data for week:", weekKey);
        
        if (cachedData[weekKey]) {
          //console.log("Using cached data for:", weekKey);
          setBpmData(cachedData[weekKey].bpmData);
          setStepData(cachedData[weekKey].stepData);
          setCalorieData(cachedData[weekKey].calorieData);
          setSleepData(cachedData[weekKey].sleepData);
          setLocalHrvData(cachedData[weekKey].hrvData);
        } else {
          //console.log("Fetching new data for:", weekKey);
          const newData = await fetchAdditionalData(dateWindow.start, dateWindow.end);
          setCachedData(prev => ({ ...prev, [weekKey]: newData }));
          setBpmData(newData.bpmData);
          setStepData(newData.stepData);
          setCalorieData(newData.calorieData);
          setSleepData(newData.sleepData);
          setLocalHrvData(newData.hrvData);
        }
      };
  
      loadData();
    }
  }, [dateWindow, cachedData, fetchAdditionalData]);




  const mapSleepStage = (stage: number | null): number => {
    switch(stage) {
      case 1: return -1;
      case 2: return -1.5;
      case 3: return 0;
      case 4: return -2;
      case 5: return -3;
      case 6: return -2.5;
      default: return 0;
    }
  };

  const sleepStageConfig = {
    0: { color: '#808080', label: 'Unused' },
    '-1': { color: '#FFA500', label: 'Awake' },
    '-1.5': { color: '#90EE90', label: 'Light1' },
    '-2': { color: '#32CD32', label: 'Light2' },
    '-2.5': { color: '#4169E1', label: 'REM' },
    '-3': { color: '#000080', label: 'Deep' },
  };

  const getSleepStageLabel = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'Unknown';
    const stage = value.toString() as keyof typeof sleepStageConfig;
    return sleepStageConfig[stage]?.label || 'Unknown';
  };

  const getSleepStageColor = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '#000000';
    const stage = value.toString() as keyof typeof sleepStageConfig;
    return sleepStageConfig[stage]?.color || '#000000';
  };

  useEffect(() => {
    // 초반 2/2개 생성, 무한 루프 X
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const startOfWeekDate = startOfWeek(selectedDateObj, { weekStartsOn: 1 }); // 월요일 시작
      const endOfWeekDate = endOfWeek(selectedDateObj, { weekStartsOn: 1 }); // 일요일 끝
      setDateWindow({
        start: startOfDay(startOfWeekDate),
        end: endOfDay(endOfWeekDate)
      });
    }
  }, [selectedDate]);

  const processHourlyData = useCallback((data: any[], valueKey: string) => {
    const hourlyData = data.reduce((acc: any, item: any) => {
      const hourKey = startOfHour(adjustTimeZone(new Date(item.timestamp))).getTime();
      if (!acc[hourKey]) {
        acc[hourKey] = { timestamp: hourKey, values: [], sum: 0, count: 0 };
      }
      acc[hourKey].values.push(item.value);
      acc[hourKey].sum += item.value;
      acc[hourKey].count += 1;
      return acc;
    }, {});

    return Object.values(hourlyData).map((item: any) => ({
      timestamp: item.timestamp,
      [valueKey]: valueKey === 'bpm' ? item.sum / item.count : item.sum
    }));
  }, []);

  const hourlyBpmData = useMemo(() => processHourlyData(bpmData, 'bpm'), [bpmData, processHourlyData]);
  const hourlyStepData = useMemo(() => processHourlyData(stepData, 'step'), [stepData, processHourlyData]);
  const hourlyCalorieData = useMemo(() => processHourlyData(calorieData, 'calorie'), [calorieData, processHourlyData]);
  const hourlyHrvData = useMemo(() => {
    return localHrvData.map(item => ({
      timestamp: new Date(item.ds).getTime(),
      hour_rmssd: item.hour_rmssd,
      hour_sdnn: item.hour_sdnn
    }));
  }, [localHrvData]);


  const fillEmptyHours = useCallback((data: any[], start: Date, end: Date, keys: string[]) => {
    const allHours = eachHourOfInterval({ start, end });
    const filledData = allHours.map(hour => {
      const timestamp = hour.getTime();
      const existingData = data.find(item => item.timestamp === timestamp);
      if (existingData) return existingData;
      const emptyData: any = { timestamp };
      keys.forEach(key => emptyData[key] = null);
      return emptyData;
    });
    return filledData;
  }, []);


  // const moveDate = useCallback(async (direction: 'forward' | 'backward') => {
  //   setDateWindow(prevWindow => {
  //     if (!prevWindow || !dbStartDate || !dbEndDate) return prevWindow;
  
  //     const days = dateRange === '7' ? 7 : 1;
  //     let newStart = direction === 'forward' 
  //       ? addDays(prevWindow.start, days) 
  //       : subDays(prevWindow.start, days);
  //     let newEnd = dateRange === '7' ? endOfWeek(newStart, { weekStartsOn: 1 }) : endOfDay(newStart);
  
  //     if (newStart < dbStartDate) newStart = dbStartDate;
  //     if (newEnd > dbEndDate) newEnd = dbEndDate;
  
  //     const adjustedStart = dateRange === '7' ? startOfWeek(newStart, { weekStartsOn: 1 }) : newStart;
  //     const adjustedEnd = dateRange === '7' ? endOfWeek(adjustedStart, { weekStartsOn: 1 }) : newEnd;
  
  //     // 새로운 날짜 범위에 대한 데이터를 즉시 설정
  //     const weekKey = format(startOfWeek(adjustedStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  //     if (cachedData[weekKey]) {
  //       setBpmData(cachedData[weekKey].bpmData);
  //       setStepData(cachedData[weekKey].stepData);
  //       setCalorieData(cachedData[weekKey].calorieData);
  //       setSleepData(cachedData[weekKey].sleepData);
  //       setLocalHrvData(cachedData[weekKey].hrvData);
  //     }
  
  //     return { 
  //       start: startOfDay(adjustedStart), 
  //       end: endOfDay(adjustedEnd) 
  //     };
  //   });
  // }, [dateRange, dbStartDate, dbEndDate, cachedData]);

  // const moveDate = useCallback(async (direction: 'forward' | 'backward') => {
  //   setDateWindow(prevWindow => {
  //     if (!prevWindow || !dbStartDate || !dbEndDate) return prevWindow;
  
  //     const days = dateRange === '7' ? 7 : 1;
  //     let newStart, newEnd;
  
  //     if (dateRange === '7') {
  //       newStart = direction === 'forward' 
  //         ? addDays(prevWindow.start, 7) 
  //         : subDays(prevWindow.start, 7);
  //       newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
  //     } else {
  //       // For 1-day range, move based on the end date
  //       newEnd = direction === 'forward' 
  //         ? addDays(prevWindow.end, 1) 
  //         : subDays(prevWindow.end, 1);
  //       newStart = startOfDay(newEnd);
  //     }
  
  //     // Ensure we don't go beyond the available data range
  //     if (newStart < dbStartDate) {
  //       newStart = dbStartDate;
  //       newEnd = dateRange === '7' ? endOfWeek(newStart, { weekStartsOn: 1 }) : endOfDay(newStart);
  //     }
  //     if (newEnd > dbEndDate) {
  //       newEnd = dbEndDate;
  //       newStart = dateRange === '7' ? startOfWeek(newEnd, { weekStartsOn: 1 }) : startOfDay(newEnd);
  //     }
  
  //     // Load data for the new date range
  //     const weekKey = format(startOfWeek(newStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  //     if (cachedData[weekKey]) {
  //       setBpmData(cachedData[weekKey].bpmData);
  //       setStepData(cachedData[weekKey].stepData);
  //       setCalorieData(cachedData[weekKey].calorieData);
  //       setSleepData(cachedData[weekKey].sleepData);
  //       setLocalHrvData(cachedData[weekKey].hrvData);
  //     } else {
  //       // If data is not cached, you might want to fetch it here
  //       // This depends on how you've implemented data fetching in your app
  //     }
  
  //     return { 
  //       start: newStart, 
  //       end: newEnd 
  //     };
  //   });
  // }, [dateRange, dbStartDate, dbEndDate, cachedData]);

  const moveDate = useCallback(async (direction: 'forward' | 'backward') => {
    setDateWindow(prevWindow => {
      if (!prevWindow || !dbStartDate || !dbEndDate) return prevWindow;
  
      const days = dateRange === '7' ? 7 : 1;
      let newStart, newEnd;
  
      if (dateRange === '7') {
        newStart = direction === 'forward' 
          ? addDays(prevWindow.start, 7) 
          : subDays(prevWindow.start, 7);
        newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
      } else {
        newEnd = direction === 'forward' 
          ? addDays(prevWindow.end, 1) 
          : subDays(prevWindow.end, 1);
        newStart = startOfDay(newEnd);
      }
  
      if (newStart < dbStartDate) {
        newStart = dbStartDate;
        newEnd = dateRange === '7' ? endOfWeek(newStart, { weekStartsOn: 1 }) : endOfDay(newStart);
      }
      if (newEnd > dbEndDate) {
        newEnd = dbEndDate;
        newStart = dateRange === '7' ? startOfWeek(newEnd, { weekStartsOn: 1 }) : startOfDay(newEnd);
      }
  
      const weekStart = startOfWeek(newStart, { weekStartsOn: 1 });
      const threeWeeksStart = subWeeks(weekStart, 1);
      const threeWeeksEnd = addWeeks(weekStart, 1);
  
      // Check if we need to fetch new data
      const weeksToFetch: WeekRange[] = [];
      for (let i = 0; i < 3; i++) {
        const currentWeekStart = addWeeks(threeWeeksStart, i);
        const weekKey = format(currentWeekStart, 'yyyy-MM-dd');
        if (!cachedData[weekKey]) {
          weeksToFetch.push({ start: currentWeekStart, end: addWeeks(currentWeekStart, 1) });
        }
      }
  
      if (weeksToFetch.length > 0) {
        // Fetch data for missing weeks
        Promise.all(weeksToFetch.map(week => 
          fetchAdditionalData(week.start, week.end)
        )).then(results => {
          const newCachedData = { ...cachedData };
          results.forEach((data, index) => {
            const weekKey = format(weeksToFetch[index].start, 'yyyy-MM-dd');
            newCachedData[weekKey] = data;
          });
          setCachedData(newCachedData);
  
          // Set data for the current week
          const currentWeekKey = format(weekStart, 'yyyy-MM-dd');
          if (newCachedData[currentWeekKey]) {
            setBpmData(newCachedData[currentWeekKey].bpmData);
            setStepData(newCachedData[currentWeekKey].stepData);
            setCalorieData(newCachedData[currentWeekKey].calorieData);
            setSleepData(newCachedData[currentWeekKey].sleepData);
            setLocalHrvData(newCachedData[currentWeekKey].hrvData);
          }
        });
      } else {
        // If all data is already cached, just set the current week's data
        const currentWeekKey = format(weekStart, 'yyyy-MM-dd');
        setBpmData(cachedData[currentWeekKey].bpmData);
        setStepData(cachedData[currentWeekKey].stepData);
        setCalorieData(cachedData[currentWeekKey].calorieData);
        setSleepData(cachedData[currentWeekKey].sleepData);
        setLocalHrvData(cachedData[currentWeekKey].hrvData);
      }
  
      return { 
        start: newStart, 
        end: newEnd 
      };
    });
  }, [dateRange, dbStartDate, dbEndDate, cachedData, fetchAdditionalData]);

  
  // const moveDate = useCallback(async (direction: 'forward' | 'backward') => {
  //   setDateWindow(prevWindow => {
  //     if (!prevWindow || !dbStartDate || !dbEndDate) return prevWindow;
  
  //     const days = dateRange === '7' ? 7 : 1;
  //     let newStart, newEnd;
  
  //     if (dateRange === '7') {
  //       newStart = direction === 'forward' 
  //         ? addDays(prevWindow.start, 7) 
  //         : subDays(prevWindow.start, 7);
  //       newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
  //     } else {
  //       newEnd = direction === 'forward' 
  //         ? addDays(prevWindow.end, 1) 
  //         : subDays(prevWindow.end, 1);
  //       newStart = startOfDay(newEnd);
  //     }
  
  //     if (newStart < dbStartDate) {
  //       newStart = dbStartDate;
  //       newEnd = dateRange === '7' ? endOfWeek(newStart, { weekStartsOn: 1 }) : endOfDay(newStart);
  //     }
  //     if (newEnd > dbEndDate) {
  //       newEnd = dbEndDate;
  //       newStart = dateRange === '7' ? startOfWeek(newEnd, { weekStartsOn: 1 }) : startOfDay(newEnd);
  //     }
  
  //     return { 
  //       start: newStart, 
  //       end: newEnd 
  //     };
  //   });
  // }, [dateRange, dbStartDate, dbEndDate]);



  const indexData = useCallback((data: any[]) => {
    //console.log("Indexing data:", data); // 로그 추가
    const indexed = data.reduce((acc: { [key: number]: any }, item) => {
      const timestamp = new Date(item.timestamp).getTime();
      if (!acc[timestamp]) {
        acc[timestamp] = [];
      }
      acc[timestamp].push(item);
      return acc;
    }, {});
    //console.log("Indexed data:", indexed); // 로그 추가
    return indexed;
  }, []);

  const indexedBpmData = useMemo(() => indexData(bpmData), [bpmData, indexData]);
  const indexedStepData = useMemo(() => indexData(stepData), [stepData, indexData]);
  const indexedCalorieData = useMemo(() => indexData(calorieData), [calorieData, indexData]);

  const indexedSleepData = useMemo(() => {
    return sleepData.map(item => ({
      start: new Date(item.timestamp_start).getTime(),
      end: new Date(item.timestamp_end).getTime(),
      value: item.value
    }));
  }, [sleepData]);

  

  const indexedPredictData = useMemo(() => {
    return predictMinuteData.reduce((acc: { [key: number]: any }, item) => {
      const timestamp = new Date(item.ds).getTime();
      acc[timestamp] = item;
      return acc;
    }, {});
  }, [predictMinuteData]);


  const aggregateCalorieData = (data: any[]) => {
    const aggregatedData: { [key: string]: number } = {};
    
    data.forEach(item => {
      const itemDate = new Date(item.timestamp);
      const dayStart = startOfDay(itemDate);
      const minutesSinceStart = Math.floor((adjustTimeZone(itemDate).getTime() - dayStart.getTime()) / (15 * 60 * 1000)) * 15;
      const intervalStart = addMinutes(dayStart, minutesSinceStart);
      const key = format(intervalStart, "yyyy-MM-dd'T'HH:mm:ss");
  
      if (!aggregatedData[key]) {
        aggregatedData[key] = 0;
      }
      aggregatedData[key] += item.value;
    });
  
    return Object.entries(aggregatedData).map(([timestamp, calorie]) => ({
      timestamp: new Date(timestamp).getTime(),
      calorie
    }));
  };

  const displayData = useMemo(() => {
    if (!dateWindow) return [];

    let startDate, endDate;
    if (dateRange === '7') {
      startDate = startOfWeek(dateWindow.start, { weekStartsOn: 1 });
      endDate = endOfWeek(dateWindow.start, { weekStartsOn: 1 });
    } else {
      startDate = startOfDay(dateWindow.end);
      endDate = endOfDay(dateWindow.end);
    }

    const normalStartDate = startDate;
    const normalEndDate = endDate;

    let filteredData;
    //console.log(`in displayData --- timeunit : ${timeUnit}`)
    if (timeUnit === 'hour') {
      //console.log('in displayData timeunit === hour, 무한루프')
      const filledBpmData = fillEmptyHours(hourlyBpmData, startDate, endDate, ['bpm']);
      const filledStepData = fillEmptyHours(hourlyStepData, startDate, endDate, ['step']);
      const filledCalorieData = fillEmptyHours(hourlyCalorieData, startDate, endDate, ['calorie']);
      const filledHrvData = fillEmptyHours(hourlyHrvData, startDate, endDate, ['hour_rmssd', 'hour_sdnn']);

      

      filteredData = filledBpmData.map((item, index) => ({
        ...item,
        step: filledStepData[index]?.step ?? 0,
        calorie: filledCalorieData[index]?.calorie ?? 0,
        hour_rmssd: filledHrvData[index]?.hour_rmssd ?? null,
        hour_sdnn: filledHrvData[index]?.hour_sdnn ?? null,
        hour_pred_bpm: predictHourData.find(p => new Date(p.ds).getTime() === item.timestamp)?.hour_pred_bpm ?? null
      }));

    } else {
      
      const allMinutes = eachMinuteOfInterval({ start: normalStartDate, end: normalEndDate });
      const aggregatedCalorieData = aggregateCalorieData(calorieData);
      
      filteredData = allMinutes.map(minute => {
        const adjustedAddNineMinute = adjustTimeZoneAddNine(minute);
        const timestamp = minute.getTime();
        const adjustTimestamp = adjustedAddNineMinute.getTime();
  
        const bpmItem = indexedBpmData[adjustTimestamp] ? indexedBpmData[adjustTimestamp][0] : null;
        const stepItem = indexedStepData[adjustTimestamp] ? indexedStepData[adjustTimestamp][0] : null;
        //const calorieItem = indexedCalorieData[adjustTimestamp] ? indexedCalorieData[adjustTimestamp][0] : null;
        const calorieItem = aggregatedCalorieData.find(item => item.timestamp <= timestamp && timestamp < item.timestamp + 15 * 60 * 1000);
        const sleepItem = indexedSleepData.find(s => adjustTimestamp >= s.start && adjustTimestamp < s.end);
  
        const originalTimestamp = minute.getTime();
        const predItem = indexedPredictData[originalTimestamp];
  
        return {
          timestamp,
          bpm: bpmItem ? bpmItem.value : null,
          step: stepItem ? stepItem.value : 0,
          //calorie: calorieItem ? calorieItem.value : 0,
          calorie: calorieItem ? calorieItem.calorie : 0,
          sleep_stage: sleepItem ? mapSleepStage(sleepItem.value) : null,
          min_pred_bpm: predItem ? predItem.min_pred_bpm : null
        };
      });
    }

    filteredData = filteredData.filter(item => 
      Object.values(item).every(value => 
        value === null || (typeof value === 'number' && !isNaN(value))
      )
    );

    // console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')
    // console.log(filteredData)
    // console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')

    return filteredData;
  }, [timeUnit, dateRange, dateWindow, hourlyBpmData, hourlyStepData, hourlyCalorieData, hourlyHrvData, 
      indexedBpmData, indexedStepData, indexedCalorieData, indexedSleepData, indexedPredictData, 
      predictHourData, fillEmptyHours]);


  const filteredData = useMemo(() => {
    // displayData가 undefined이거나 배열이 아닌 경우 빈 배열 반환

    if (!Array.isArray(displayData)) return [];

    // brushDomain이 없으면 전체 displayData 반환
    if (!brushDomain) return displayData;

    // brushDomain이 유효한 경우에만 필터링 적용
    if (Array.isArray(brushDomain) && brushDomain.length === 2) {
      return displayData.filter(
        item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
      );
    }

    // 기본적으로 전체 displayData 반환
    return displayData;
  }, [displayData, brushDomain]);

  const handleBrushChange = useCallback((newBrushDomain: any) => {
    if (newBrushDomain && newBrushDomain.length === 2) {
      setBrushDomain(newBrushDomain);
      onBrushChange(newBrushDomain);
    } else {
      setBrushDomain(null);
      onBrushChange(null);
    }
  }, [onBrushChange]);

  const formatDateForDisplay = (time: number) => {
    const date = new Date(time);
    return format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00');
  };

  // 기존 되던 것
  // const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
  //   if (active && payload && payload.length) {
  //     const date = new Date(label as number);
  //     const currentChart = payload[0].dataKey as string;
  
  //     return (
  //       <div className="bg-white p-2 border border-gray-300 rounded shadow">
  //         <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
  //           {format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00')}
  //         </p>
  //         {payload.map((pld, index) => {
  //           if (pld.dataKey === currentChart || (currentChart === 'bpm' && (pld.dataKey === 'min_pred_bpm' || pld.dataKey === 'hour_pred_bpm'))) {
  //             let value = pld.value !== null ? 
  //               (pld.dataKey === 'step' || pld.dataKey === 'calorie' ? 
  //                 Number(pld.value).toFixed(0) : 
  //                 Number(pld.value).toFixed(2)) 
  //               : 'N/A';
              
  //             if (pld.dataKey === 'sleep_stage') {
  //               const sleepStage = pld.value as number;
  //               value = getSleepStageLabel(sleepStage);
  //               return (
  //                 <p key={`${pld.dataKey}-${index}`} style={{ color: getSleepStageColor(sleepStage) }}>
  //                   Sleep Stage: {value}
  //                 </p>
  //               );
  //             }           

  //             const memoKey = `${pld.dataKey}_${date.getTime()}`;
  //             const memo = memos[memoKey];

  //             return (
  //               <React.Fragment key={`${pld.dataKey}-${index}`}>
  //                 <p style={{ color: pld.color }}>
  //                   {`${pld.name}: ${value}`}
  //                 </p>
  //                 {memo && (
  //                   <p className="text-gray-600 italic">Memo: {memo}</p>
  //                 )}
  //               </React.Fragment>
  //             );
  //           }
  //           return null;
  //         })}
  //       </div>
  //     );
  //   }
  //   return null;
  // };

  const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label as number);
      const currentChart = payload[0].dataKey as string;
  
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
            {format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00')}
          </p>
          {payload.map((pld, index) => {
            if (pld.dataKey === currentChart || (currentChart === 'bpm' && (pld.dataKey === 'min_pred_bpm' || pld.dataKey === 'hour_pred_bpm'))) {
              let value = pld.value !== null ? 
                (pld.dataKey === 'step' || pld.dataKey === 'calorie' ? 
                  Number(pld.value).toFixed(0) : 
                  Number(pld.value).toFixed(2)) 
                : 'N/A';
              
              if (pld.dataKey === 'sleep_stage') {
                const sleepStage = pld.value as number;
                value = getSleepStageLabel(sleepStage);
                return (
                  <p key={`${pld.dataKey}-${index}`} style={{ color: getSleepStageColor(sleepStage) }}>
                    Sleep Stage: {value}
                  </p>
                );
              }           
  
              let memoKey = `${pld.dataKey}_${date.getTime()}`;
              if (pld.dataKey === 'calorie') {
                const interval = 15 * 60 * 1000;
                const startOfInterval = Math.floor(date.getTime() / interval) * interval;
                memoKey = `${pld.dataKey}_${startOfInterval}`;
              }
              const memo = memos[memoKey];
  
              return (
                <React.Fragment key={`${pld.dataKey}-${index}`}>
                  <p style={{ color: pld.color }}>
                    {`${pld.name}: ${value}`}
                  </p>
                  {memo && (
                    <p className="text-gray-600 italic">Memo: {memo}</p>
                  )}
                </React.Fragment>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  const renderChart = (dataKey: string, color: string, yAxisLabel: string, ChartType: typeof LineChart | typeof BarChart = LineChart, additionalProps = {}) => {
    // const isLogScale = dataKey === 'step' || dataKey === 'calorie';
    // const calculateDomain = (data: any[]) => {
    //   if (!isLogScale) return [0, 'auto'];
    //   const values = data.map(item => item[dataKey]).filter(value => value > 0);
    //   if (values.length === 0) return [1, 10];
    //   const minValue = Math.min(...values);
    //   const maxValue = Math.max(...values);
    //   return [Math.max(1, minValue / 10), maxValue * 1.1];
    // };
    // const domain = calculateDomain(displayData);
    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <ChartType 
            data={displayData} 
            syncId="healthMetrics"
            onClick={(data) => {
              if (data && data.activePayload && timeUnit === 'minute') {
                handleChartClick(data.activePayload[0].payload, dataKey);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              scale="time" 
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatDateForDisplay}
            />
            <YAxis 
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
              tickFormatter={(value) => value.toFixed(1)}
              domain={dataKey === 'sleep_stage' ? [-3.5, 0.5] : ['auto', 'auto']}
              ticks={dataKey === 'sleep_stage' ? [-3, -2.5, -2, -1.5, -1] : undefined}
              //scale={isLogScale ? 'log' : 'auto'}
              //allowDataOverflow={isLogScale}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKey === 'hrv' ? (
              <>
                <Line type="monotone" dataKey="hour_rmssd" stroke="#8884d8" name="RMSSD" dot={false} connectNulls />
                <Line type="monotone" dataKey="hour_sdnn" stroke="#82ca9d" name="SDNN" dot={false} connectNulls />
              </>
            ) : ChartType === LineChart ? (
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                name={dataKey.toUpperCase()} 
                dot={((props: any) => {
                  const memoKey = `${dataKey}_${props.payload.timestamp}`;
                  if (memos[memoKey]) {
                    return (
                      <circle 
                        cx={props.cx} 
                        cy={props.cy} 
                        r={4} 
                        fill={color} 
                        stroke="black"
                        strokeWidth={2}
                      />
                    );
                  }
                  return null;
                }) as LineProps['dot']}
                activeDot={{ r: 8 }}
                connectNulls 
                {...additionalProps} 
            />
            ) : (
              <Bar 
                dataKey={dataKey} 
                fill={color} 
                name={dataKey.toUpperCase()} 
                {...additionalProps}
                shape={(props: any) => {
                  const memoKey = `${dataKey}_${props.payload.timestamp}`;
                  if (memos[memoKey]) {
                    return (
                      <path 
                        d={`M${props.x},${props.y} h${props.width} v${props.height} h-${props.width}Z`} 
                        fill={color}
                        stroke="black"
                        strokeWidth={2}
                      />
                    );
                  }

                  return (
                    <path 
                      d={`M${props.x},${props.y} h${props.width} v${props.height} h-${props.width}Z`} 
                      fill={color}
                    />
                  );
                }}
            />

            // <Bar 
            //   dataKey={dataKey} 
            //   fill={color} 
            //   name={dataKey.toUpperCase()} 
            //   {...additionalProps}
            //   shape={(props: any) => {
            //     const { x, y, width, height, payload, index, data } = props;
                
            //     if (dataKey === 'calorie') {
            //       const interval = 15 * 60 * 1000; // 15분을 밀리초로 표현
            //       const startOfInterval = Math.floor(payload.timestamp / interval) * interval;
            //       const endOfInterval = startOfInterval + interval;
                  
            //       // 현재 데이터 포인트가 15분 간격의 시작점인 경우에만 바를 그립니다.
            //       if (payload.timestamp === startOfInterval) {
            //         // 바의 너비를 15개 데이터 포인트의 너비로 설정
            //         const barWidth = width * 15;
                    
            //         // 해당 15분 범위 내의 모든 메모를 확인합니다.
            //         const hasMemo = Array.from({length: 15}, (_, i) => i).some(minute => {
            //           const memoKey = `${dataKey}_${startOfInterval + minute * 60 * 1000}`;
            //           return memos[memoKey];
            //         });

            //         const path = `M${x},${y} h${barWidth} v${height} h-${barWidth}Z`;

            //         return (
            //           <path 
            //             d={path}
            //             fill={color}
            //             stroke={hasMemo ? "black" : "none"}
            //             strokeWidth={hasMemo ? 2 : 0}
            //           />
            //         );
            //       }
            //       return null; // 15분 간격의 시작점이 아닌 경우 아무것도 그리지 않습니다.
            //     } else {
            //       // 다른 데이터 타입의 경우 기존 로직을 유지합니다.
            //       const memoKey = `${dataKey}_${payload.timestamp}`;
            //       const path = `M${x},${y} h${width} v${height} h-${width}Z`;

            //       return (
            //         <path 
            //           d={path}
            //           fill={color}
            //           stroke={memos[memoKey] ? "black" : "none"}
            //           strokeWidth={memos[memoKey] ? 2 : 0}
            //         />
            //       );
            //     }
            //   }}
            // />

            // <Bar 
            //   dataKey={dataKey} 
            //   fill={color} 
            //   name={dataKey.toUpperCase()} 
            //   {...additionalProps}
            //   shape={((props: any) => {
            //     const { x, y, width, height, payload, index } = props;
            //     const data = Array.isArray(props.data) ? props.data : [];

            //     console.log('##########################################')
            //     console.log(props)
            //     console.log('##########################################')
                
            //     if (dataKey === 'calorie') {
            //       const interval = 15 * 60 * 1000; // 15분을 밀리초로 표현
            //       const startOfInterval = Math.floor(payload.timestamp / interval) * interval;
            //       const endOfInterval = startOfInterval + interval;

            //       // console.log('##########################################')
            //       // console.log(startOfInterval)
            //       // console.log(endOfInterval)
            //       // console.log('##########################################')
                  
            //       // 현재 데이터 포인트가 15분 간격의 시작점인 경우에만 바를 그립니다.
            //       if (payload.timestamp === startOfInterval) {
            //         // 다음 데이터 포인트를 찾아 바의 너비를 계산합니다.
            //         let nextDataPointIndex = index + 1;
            //         while (nextDataPointIndex < data.length && data[nextDataPointIndex] && data[nextDataPointIndex].timestamp < endOfInterval) {
            //           nextDataPointIndex++;
            //         }
                    
            //         let barWidth;
            //         if (nextDataPointIndex < data.length && data[nextDataPointIndex]) {
            //           const nextDataPoint = data[nextDataPointIndex];
            //           const timeRange = nextDataPoint.timestamp - payload.timestamp;
            //           barWidth = (timeRange / (60 * 1000)) * width;
            //         } else {
            //           // 다음 데이터 포인트가 없으면 15분 간격의 너비를 사용합니다.
            //           barWidth = 15 * width;
            //         }
                    
            //         // 바의 너비가 15분을 초과하지 않도록 제한합니다.
            //         barWidth = Math.min(barWidth, 15 * width);
                    
            //         const path = `M${x},${y} h${barWidth} v${height} h-${barWidth}Z`;

            //         // 해당 15분 범위 내의 모든 메모를 확인합니다.
            //         const hasMemo = Array.from({length: 15}, (_, i) => i).some(minute => {
            //           const memoKey = `${dataKey}_${startOfInterval + minute * 60 * 1000}`;
            //           return memos[memoKey];
            //         });

            //         // console.log('##########################################')
            //         // console.log(props)
            //         // console.log('##########################################')

            //         return (
            //           <path 
            //             d={path}
            //             fill={color}
            //             stroke={hasMemo ? "black" : "none"}
            //             strokeWidth={hasMemo ? 2 : 0}
            //           />
            //         );
            //       }
            //       return null; // 15분 간격의 시작점이 아닌 경우 아무것도 그리지 않습니다.
            //     } else {
            //       // 다른 데이터 타입의 경우 기존 로직을 유지합니다.
            //       const memoKey = `${dataKey}_${payload.timestamp}`;
            //       const path = `M${x},${y} h${width} v${height} h-${width}Z`;

            //       return (
            //         <path 
            //           d={path}
            //           fill={color}
            //           stroke={memos[memoKey] ? "black" : "none"}
            //           strokeWidth={memos[memoKey] ? 2 : 0}
            //         />
            //       );
            //     }
            //   }) as BarProps['shape']}
            // />

            // <Bar 
            //   dataKey={dataKey} 
            //   fill={color} 
            //   name={dataKey.toUpperCase()} 
            //   {...additionalProps}
            //   shape={((props: any) => {
            //     if (props.value <= 0) {
            //       return null; // 0 이하의 값은 표시하지 않음
            //     }

            //     const { x, y, width, height, value } = props;

            //     // 최소 높이 설정
            //     const minHeight = 1;
            //     const adjustedHeight = Math.max(height, minHeight);

            //     const memoKey = `${dataKey}_${props.payload.timestamp}`;
            //     const path = `M${x},${y} h${width} v${adjustedHeight} h-${width}Z`;
                
            //     return (
            //       <path 
            //         d={path}
            //         fill={color}
            //         stroke={memos[memoKey] ? "black" : "none"}
            //         strokeWidth={memos[memoKey] ? 2 : 0}
            //       />
            //     );
            //   }) as BarProps['shape']}
            // />
            )}
            {dataKey === 'bpm' && (
              <Line 
                type="monotone" 
                dataKey={timeUnit === 'hour' ? "hour_pred_bpm" : "min_pred_bpm"} 
                stroke="#82ca9d" 
                dot={false} 
                name={`Predicted BPM (${timeUnit === 'hour' ? 'Hour' : 'Minute'})`} 
                connectNulls
              />
            )}
            {dataKey === 'sleep_stage' && (
              <>
                <ReferenceLine y={0} stroke='lightgray' strokeDasharray='3 3' />
                <ReferenceLine y={-1} stroke='lightgray' strokeDasharray='3 3' />
                <ReferenceLine y={-2} stroke='lightgray' strokeDasharray='3 3' />
                <ReferenceLine y={-3} stroke='lightgray' strokeDasharray='3 3' />
              </>
            )}
          </ChartType>
        </ResponsiveContainer>
      </div>
    );
  };

  const charts = [
    { key: 'bpm', color: '#ff7300', label: 'BPM', type: LineChart },
    { key: 'step', color: 'rgba(130, 202, 157)', label: 'Steps', type: BarChart },
    { key: 'calorie', color: 'rgba(136, 132, 216)', label: 'Calories', type: BarChart },
  ];
  
  if (timeUnit === 'hour') {
    charts.push(
      { key: 'hour_rmssd', color: '#8884d8', label: 'RMSSD', type: LineChart },
      { key: 'hour_sdnn', color: '#82ca9d', label: 'SDNN', type: LineChart }
    );
  } else {
    charts.push({ key: 'sleep_stage', color: '#000000', label: 'Sleep Stage', type: LineChart })
  }

  return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div className="mb-4 flex items-center justify-between">
        <div>
          {[1, 2, 3].map(count => (
            <button
              key={count}
              onClick={() => setColumnCount(count)}
              className={`px-4 py-2 rounded ml-2 ${columnCount === count ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {count} Column{count !== 1 ? 's' : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => moveDate('backward')}
            className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
            disabled={!dateWindow || !dbStartDate || dateWindow.start <= dbStartDate}
          >
            ←
          </button>
          <select
            value={timeUnit}
            onChange={(e) => setTimeUnit(e.target.value as 'minute' | 'hour')}
            className="mr-2 p-2 border rounded"
          >
            <option value="minute">Minute</option>
            <option value="hour">Hour</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="p-2 border rounded"
          >
            <option value="1">1 Day</option>
            <option value="7">7 Days</option>
          </select>
          <button 
            onClick={() => moveDate('forward')}
            className="px-2 py-1 bg-blue-500 text-white rounded ml-2"
            disabled={!dateWindow || !dbEndDate || dateWindow.end >= dbEndDate}
          >
            →
          </button>
        </div>
      </div>
      <div style={{ height: '100px', marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} syncId="healthMetrics">
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              scale="time" 
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatDateForDisplay}
            />
            <Brush 
              dataKey="timestamp" 
              height={30} 
              stroke="#8884d8" 
              onChange={handleBrushChange}
              tickFormatter={formatDateForDisplay}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div 
        className={`grid gap-4`} 
        style={{ 
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gridAutoRows: `calc((100vh - 300px) / ${Math.ceil(charts.length / columnCount)})`
        }}
      >
        {charts.map(chart => (
          <div key={chart.key} className="w-full h-full">
            {renderChart(chart.key, chart.color, chart.label, chart.type)}
          </div>
        ))}
      </div>
      <MemoModal
        isOpen={memoModalOpen}
        onClose={() => setMemoModalOpen(false)}
        onSave={saveMemo}
        data={selectedData}
        existingMemo={selectedData ? memos[`${selectedData.type}_${selectedData.timestamp}`] || '' : ''}
      />
    </div>
  );
};

export default MultiChart;