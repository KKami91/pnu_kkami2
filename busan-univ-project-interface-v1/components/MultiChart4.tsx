import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine, TooltipProps, Dot, ReferenceArea } from 'recharts';
import { Props as LineProps } from 'recharts/types/cartesian/Line';
import { Props as BarProps } from 'recharts/types/cartesian/Bar';
import { addWeeks, subWeeks, isWithinInterval, subSeconds, addSeconds, format, subDays, addDays, startOfDay, endOfDay, 
  startOfHour, subHours, subMinutes, addMinutes, startOfWeek, endOfWeek, isAfter, addHours, 
  previousMonday, nextSunday, eachHourOfInterval, eachMinuteOfInterval } from 'date-fns';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import MemoModal from './MemoModal';
import axios from 'axios'
import { Memo } from './types'
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import * as ReactDOM from 'react-dom';
import NoonSleepChart from './NoonSleepChart';


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
  scrollToMultiChart: () => void;
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



interface WeekData {
  bpmData: Array<{ timestamp: string; value: number }>;
  stepData: Array<{ timestamp: string; value: number }>;
  calorieData: Array<{ timestamp: string; value: number }>;
  sleepData: Array<{ timestamp_start: string; timestamp_end: string; value: number }>;
  hrvData: Array<{ ds: string; hour_rmssd: number; hour_sdnn: number }>;
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
  scrollToMultiChart,
}) => {

  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('minute');
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
  const [memos, setMemos] = useState<{ [key: string]: Memo }>({});

  // heatmap
  const [heatmapSelectedDate, setHeatmapSelectedDate] = useState<Date | null>(null);


  const [cachedData, setCachedData] = useState<CachedDataType>({});

  const isInitialFetch = useRef(false); 


  const timezoneOffset = new Date().getTimezoneOffset()
  const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1

  // useEffect(() => {
  //   console.log('-----------------------')
  //   console.log(dateWindow)
  //   console.log('-----------------------')
  // }, [dateWindow])


  const fetchThreeWeeksData = useCallback(async (selectedDate: Date) => {
    //console.log('is in fetchThreeWeeksData .... cachedData ? ', cachedData)
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const previousWeekStart = subWeeks(selectedWeekStart, 1);
    const nextWeekStart = addWeeks(selectedWeekStart, 1);

    const weeksToFetch = [previousWeekStart, selectedWeekStart, nextWeekStart];
    //console.log('in fetchThreeWeeksData ;;; , ', selectedWeekStart, previousWeekStart, nextWeekStart)
    const newCachedData = { ...cachedData };

    // console.log('Selected Date:', selectedDate);
    // console.log('Selected Week Start:', selectedWeekStart);
    // console.log('Previous Week Start:', previousWeekStart);
    // console.log('Next Week Start:', nextWeekStart);

    if (JSON.stringify(newCachedData) !== JSON.stringify(cachedData)) {
      //console.log('????')
      setCachedData(newCachedData);
    }

    await Promise.all(weeksToFetch.map(async (weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      //console.log('in fetchThreeWeeksData , in promise ;; ', weekStart, weekEnd)

      // console.log(`Week ${weekKey}:`, {
      //   start: weekStart,
      //   end: weekEnd,
      //   startUTC: weekStart.toUTCString(),
      //   endUTC: weekEnd.toUTCString()
      // });


      if (!newCachedData[weekKey]) {
        const weekData = await fetchAdditionalData(new Date(weekStart.getTime() - offsetMs), new Date(weekEnd.getTime() - offsetMs));
        //console.log('typeof ;;;; ',typeof(weekData.bpmData[0].timestamp))
        //console.log('typeof ;;;; ',weekData.bpmData[0].timestamp)
        // const adjustedWeekData = {
        //   bpmData: weekData.bpmData.map(item => ({
        //     ...item,
        //     timestamp: formatInTimeZone(new Date(new Date(item.timestamp).getTime() - offsetMs),'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z"),
        //   })),
        //   stepData: weekData.stepData.map(item => ({
        //     ...item,
        //     timestamp: formatInTimeZone(new Date(new Date(item.timestamp).getTime() - offsetMs),'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z"),
        //   })),
        //   calorieData: weekData.calorieData.map(item => ({
        //     ...item,
        //     timestamp: formatInTimeZone(new Date(new Date(item.timestamp).getTime() - offsetMs),'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z"),
        //   })),
        //   sleepData: weekData.sleepData.map(item => ({
        //     ...item,
        //     timestamp_start: formatInTimeZone(new Date(new Date(item.timestamp_start).getTime() - offsetMs),'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z"),
        //     timestamp_end: formatInTimeZone(new Date(new Date(item.timestamp_end).getTime() - offsetMs),'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z"),
        //   })),
        //   hrvData: weekData.hrvData.map(item => ({
        //     ...item,
        //     ds: formatInTimeZone(new Date(new Date(item.ds).getTime() - offsetMs),'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX"),
        //   }))
        // };
        // console.log('in promise? , adjustedWeekData', adjustedWeekData)


        newCachedData[weekKey] = weekData;
        
      }
    }));


    //console.log('fetchThreeWeeksData',newCachedData)

    setCachedData(newCachedData);

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const currentWeekKey = format(selectedWeekStart, 'yyyy-MM-dd');

    console.log('before filtered data ', sleepData)
    
    const filteredBpmData = newCachedData[currentWeekKey].bpmData.filter(d => format(new Date(d.timestamp), 'yyyy-MM-dd') === selectedDateStr);
    const filteredStepData = newCachedData[currentWeekKey].stepData.filter(d => format(new Date(d.timestamp), 'yyyy-MM-dd') === selectedDateStr);
    const filteredCalorieData = newCachedData[currentWeekKey].calorieData.filter(d => format(new Date(d.timestamp), 'yyyy-MM-dd') === selectedDateStr);
    const filteredSleepData = newCachedData[currentWeekKey].sleepData.filter(d => format(new Date(d.timestamp_start), 'yyyy-MM-dd') === selectedDateStr);
    const filteredHrvData = newCachedData[currentWeekKey].hrvData.filter(d => format(new Date(d.ds), 'yyyy-MM-dd') === selectedDateStr);

    console.log('multichart filtered sleep data : ',filteredSleepData)

    setBpmData(filteredBpmData);
    setStepData(filteredStepData);
    setCalorieData(filteredCalorieData);
    setSleepData(filteredSleepData);
    setLocalHrvData(filteredHrvData);
  
  }, [cachedData, fetchAdditionalData]);

/////////////
const handleDateSelect = useCallback(async (event: Event) => {
  const customEvent = event as CustomEvent<{ date: string }>;
  const { date } = customEvent.detail;
  //console.log(`MultiChart 히트맵에서 선택된 날짜: ${date}`);

  //console.log('date + offsetMs', new Date(new Date(date).getTime() + offsetMs))
  //console.log(formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss'))
  //console.log(new Date(formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss')))
  //console.log('date + offsetMs222', new Date(formatInTimeZone(new Date(new Date(date).getTime() + offsetMs), 'UTC', 'yyyy-MM-dd HH:mm:ss')))
  
  //const selectedDate = new Date(formatInTimeZone(new Date(new Date(date).getTime() + offsetMs), 'UTC', 'yyyy-MM-dd HH:mm:ss'))
  const selectedDate = new Date(formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss'))
  //const selectedDate = new Date(date);
  //console.log(`MultiChart 히트맵에서 선택된 날짜222: ${selectedDate}`);
  //const convertSelectedDate = new Date(selectedDate.getTime() + offsetMs)
  //console.log(`MultiChart 히트맵에서 선택된 날짜333: ${convertSelectedDate}`);
  //const test = new Date(formatInTimeZone(selectedDate, 'UTC', 'yyyy-MM-dd HH:mm:ss'))
  //console.log('last test', test)
  
  
  setTimeout(scrollToMultiChart, 10);
  
  // 3주치 데이터 가져오기
  //console.log('in multichart handledateselect - before fetchThreeWeeksData', selectedDate)
  await fetchThreeWeeksData(selectedDate);
  
}, [fetchThreeWeeksData, scrollToMultiChart]);

// selectedDate prop이 변경될 때의 처리
// useEffect(() => {
//   if (selectedDate) {
//     const date = new Date(selectedDate);
//     console.log("MultiChart received new selectedDate:", selectedDate);
    
//     setDateWindow({
//       start: startOfDay(date),
//       end: endOfDay(date)
//     });
//     setDateRange('1');
//     setTimeUnit('minute');
//   }
// }, [selectedDate]);

// 이벤트 리스너
useEffect(() => {
  window.addEventListener('dateSelect', handleDateSelect);
  return () => {
    window.removeEventListener('dateSelect', handleDateSelect);
  };
}, [handleDateSelect]);
////////////

  const [localHrvData, setLocalHrvData] = useState(hrvHourData);


  // useEffect(() => {
  //   console.log('********************')
  //   console.log(dateRange)
  //   console.log('********************')
  // }, [dateRange])


  const fetchMemos = useCallback(async () => {
    if (!selectedUser || !dateWindow) return;
    try {

      //console.log('@@@@@@@@@@IN FETCHMEMOS@@@@@@@@@@@@')

      const timezoneOffset = new Date().getTimezoneOffset()
      const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1

      const newStartDate = addSeconds(subDays(dateWindow.end, 1), 0.001)
      const newEndDate = dateWindow.end

      const response = await axios.get('/api/getMemos', {
        params: {
          user_email: selectedUser,
          startDate: new Date(newStartDate.getTime() - offsetMs),
          endDate: new Date(newEndDate.getTime() - offsetMs)

        },
      });

      const memoData = response.data.reduce((acc: { [key: string]: Memo }, memo: any) => {
        if (memo.type === 'sleep') {
          const key = `sleep_${new Date(memo.timestamp_start).getTime()}`;
          acc[key] = {
            content: memo.memo,
            endTimestamp: new Date(memo.timestamp_end).getTime()
          };
        } else {
          const key = `${memo.type}_${new Date(memo.timestamp).getTime()}`;
          acc[key] = { content: memo.memo };
        }
        return acc;
      }, {});

      setMemos(memoData);
    } catch (error) {
      console.error('Error fetching memos:', error);
    }
  }, [selectedUser, dateWindow]);

  useEffect(() => {
    //console.log("[Debug] fetchMemos useEffect triggered. dateWindow:", dateWindow);
    if (dateWindow === null) return;
  
    if (dateWindow && selectedUser) {
      //console.log("[Debug] Calling fetchMemos with dateWindow:", dateWindow);
      fetchMemos();
    }
  }, [dateWindow, selectedUser, fetchMemos]);
  
  const saveMemo = async (memo: string) => {
    if (selectedData && selectedUser) {
      try {
        console.log('zzzzzzzzzzz ',selectedData, memo)
        if (selectedData.type === 'sleep') {
          console.log(`ha`)
          console.log(selectedUser)
          console.log(selectedData.type)
          console.log(selectedData.timestamp)
          await axios.post('/api/saveMemo', {
            user_email: selectedUser,
            dataType: selectedData.type,
            //timestamp: adjustTimeZoneAddNine(selectedData.timestamp),
            timestamp: selectedData.timestamp,
            end: selectedData.end,
            memo,
          });
        } else {
          await axios.post('/api/saveMemo', {
            user_email: selectedUser,
            dataType: selectedData.type,
            //timestamp: adjustTimeZoneAddNine(selectedData.timestamp),
            timestamp: selectedData.timestamp,
            memo,
          });
        }
        setMemos(prev => ({
          ...prev,
          [`${selectedData.type}_${selectedData.timestamp}`]: { content: memo }
        }));
      }  catch (error) {
        console.error('Error saving memo:', error);
      }
    }
    setMemoModalOpen(false);
  };


  const handleChartClick = (data: any, dataKey: string) => {
    console.log('in onmemoclick : ', data)
    if (dataKey === 'calorie') {
      const interval = 15 * 60 * 1000; // 15분을 밀리초로 표현
      const startOfInterval = Math.floor(data.timestamp / interval) * interval;
      setSelectedData({ ...data, type: dataKey, timestamp: startOfInterval });
    } else if (dataKey === 'sleep_stage') {
      // Sleep 데이터 클릭 처리
      const sleepItem = indexedSleepData.find(s => data.timestamp >= s.start && data.timestamp < s.end);
      if (sleepItem) {
        setSelectedData({ ...data, type: 'sleep', timestamp: sleepItem.start, end: sleepItem.end });
      }
    } else {
      setSelectedData({ ...data, type: dataKey });
    }
    setMemoModalOpen(true);
  };

  // useEffect(() => {
  //   console.log('초기 cached 설정!!!')
  //   const initializeCache = () => {
  //     let startDate: Date;
  //     if (initialDateWindow) {
  //       startDate = initialDateWindow.start;
  //     } else if (initialBpmData.length > 0) {
  //       startDate = new Date(initialBpmData[0].timestamp);
  //     } else if (dbStartDate) {
  //       startDate = dbStartDate;
  //     } else {
  //       console.error('No valid start date found for initialization');
  //       return;
  //     }

  //     const timezoneOffset = new Date().getTimezoneOffset()
  //     const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1

      
  //     startDate = new Date(startDate.getTime() + offsetMs)

      

  //     const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });

  //     const newCachedData: CachedDataType = {};
  //     for (let i = 0; i < 3; i++) {
  //       const currentWeekStart = addWeeks(weekStart, i);
  //       const weekKey = format(currentWeekStart, 'yyyy-MM-dd');

  //       newCachedData[weekKey] = {
  //         bpmData: initialBpmData.filter(d => isWithinInterval(new Date(new Date(d.timestamp).getTime() + offsetMs), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
  //         stepData: initialStepData.filter(d => isWithinInterval(new Date(new Date(d.timestamp).getTime() + offsetMs), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
  //         calorieData: initialCalorieData.filter(d => isWithinInterval(new Date(new Date(d.timestamp).getTime() + offsetMs), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
  //         sleepData: initialSleepData.filter(d => isWithinInterval(new Date(new Date(d.timestamp_start).getTime() + offsetMs), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
  //         hrvData: hrvHourData.filter(d => isWithinInterval(new Date(new Date(d.ds).getTime() + offsetMs), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
  //       };

  //     }
  //     setCachedData(newCachedData);

  //     const currentWeekKey = format(weekStart, 'yyyy-MM-dd');

  //     setBpmData(newCachedData[currentWeekKey].bpmData);
  //     setStepData(newCachedData[currentWeekKey].stepData);
  //     setCalorieData(newCachedData[currentWeekKey].calorieData);
  //     setSleepData(newCachedData[currentWeekKey].sleepData);
  //     setLocalHrvData(newCachedData[currentWeekKey].hrvData);

  //   };

  //   initializeCache();
  // }, [initialDateWindow, initialBpmData, initialStepData, initialCalorieData, initialSleepData, hrvHourData, dbStartDate]);

  useEffect(() => {
    if (dateWindow) {
      const loadData = async () => {
        const timezoneOffset = new Date().getTimezoneOffset()
        const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1

        const selectedDate = dateWindow.start
        
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'yyyy-MM-dd');

        let weekData: WeekData;
        if (cachedData[weekKey]) {

          weekData = cachedData[weekKey] as WeekData;

        } else {

          weekData = await fetchAdditionalData(weekStart, weekEnd) as WeekData;
          setCachedData(prev => ({ ...prev, [weekKey]: weekData }));
        }

        console.log('in multi weekData :::::, ', weekData)

        if (dateRange === '7') {
          //console.log('설마?')
          setBpmData(weekData.bpmData);  // 전체 주간 데이터 사용
          setStepData(weekData.stepData);
          setCalorieData(weekData.calorieData);
          setSleepData(weekData.sleepData);
          setLocalHrvData(weekData.hrvData);
        } else {

          const utcStartOfDay = new Date(startOfDay(selectedDate).getTime() - offsetMs)
          const utcEndOfDay = new Date(endOfDay(selectedDate).getTime() - offsetMs)

          setBpmData(weekData.bpmData.filter(d => {
            const timestamp = new Date(d.timestamp);
            return timestamp >= utcStartOfDay && timestamp <= utcEndOfDay;
          }));
          setStepData(weekData.stepData.filter(d => {
            const timestamp = new Date(d.timestamp);
            return timestamp >= utcStartOfDay && timestamp <= utcEndOfDay;
          }));
          setCalorieData(weekData.calorieData.filter(d => {
            const timestamp = new Date(d.timestamp);
            return timestamp >= utcStartOfDay && timestamp <= utcEndOfDay;
          }));
          setSleepData(weekData.sleepData.filter(d => {
            const timestamp_start = new Date(d.timestamp_start);
            return timestamp_start >= subDays(utcStartOfDay, 1) && timestamp_start <= utcEndOfDay;
          }));
          setLocalHrvData(weekData.hrvData.filter(d => {
            const ds = new Date(d.ds);
            return ds >= utcStartOfDay && ds <= utcEndOfDay;
          }));

        }};

        console.log(cachedData)

      loadData();
    }
  }, [dateWindow, cachedData, fetchAdditionalData]);



  const mapSleepStage = (stage: number | null): number => {
    switch(stage) {
      case 1: return -1;
      case 4: return -2;
      case 5: return -4;
      case 6: return -3;
      default: return 0;
    }
  };

  const getSleepStageTickLabel = (value: number): string => {
    switch (value) {
      case -1: return 'Awake';
      case -2: return 'Light';
      case -3: return 'REM';
      case -4: return 'Deep';
      default: return '';
    }
  };

  const sleepStageConfig = {
    0: { color: '#808080', label: 'Unused' },
    '-1': { color: '#FFA500', label: 'Awake' },
    '-2': { color: '#32CD32', label: 'Light' },
    '-3': { color: '#4169E1', label: 'REM' },
    '-4': { color: '#008080', label: 'Deep' },
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

  // useEffect(() => {
  //   // 초반 2/2개 생성, 무한 루프 X
  //   if (selectedDate) {
  //     const selectedDateObj = new Date(selectedDate);
  //     const startOfWeekDate = startOfWeek(selectedDateObj, { weekStartsOn: 1 }); // 월요일 시작
  //     const endOfWeekDate = endOfWeek(selectedDateObj, { weekStartsOn: 1 }); // 일요일 끝
  //     //console.log('---------------------------------???')
  //     setDateWindow({
  //       start: startOfDay(startOfWeekDate),
  //       end: endOfDay(endOfWeekDate)
  //     });
  //   }
  //   //console.log('in selectedDate ---->? ')
  // }, [selectedDate]);

  const processHourlyData = useCallback((data: any[], valueKey: string) => {

    const hourlyData = data.reduce((acc: any, item: any) => {

      const hourKey = startOfHour(new Date(item.timestamp)).getTime();

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
    //console.log('in fillEmptyHours allHours;;;', allHours, '*************')
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

  const moveDate = useCallback(async (direction: 'forward' | 'backward') => {
    //console.log('$$$$$$$$$$$$$$$$$$$$$$$$MoveDate$$$$$$$$$$$$$$$$$$$$$$$')
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

      //console.log('----------------------------------')
      const weeksToFetch: WeekRange[] = [];
      for (let i = 0; i < 3; i++) {
        const currentWeekStart = addWeeks(threeWeeksStart, i);
        const weekKey = format(currentWeekStart, 'yyyy-MM-dd');
        if (!cachedData[weekKey]) {
          weeksToFetch.push({ start: currentWeekStart, end: addWeeks(currentWeekStart, 1) });
        }

      }

      if (weeksToFetch.length > 0) {


        //console.log('------------> moveDate weeksToFetch : ',weeksToFetch)

        const weekStartFetch = new Date(weeksToFetch[0].start.getTime() - offsetMs)
        const weekEndFetch = new Date(weeksToFetch[0].end.getTime() - offsetMs)

        //console.log('------new start new end',weekStartFetch, weekEndFetch)

        Promise.all(weeksToFetch.map(week => 
          
          fetchAdditionalData(weekStartFetch, weekEndFetch)
        )).then(results => {
          const newCachedData = { ...cachedData };
          results.forEach((data, index) => {
            const weekKey = format(weeksToFetch[index].start, 'yyyy-MM-dd');
            newCachedData[weekKey] = data;
          });
          setCachedData(newCachedData);

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

  const indexData = useCallback((data: any[]) => {
    //console.log("Indexing data:", data); // 로그 추가
    //console.log('hoxy?')
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

  //console.log(cachedData)

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
      //const minutesSinceStart = Math.floor((adjustTimeZone(itemDate).getTime() - dayStart.getTime()) / (15 * 60 * 1000)) * 15;
      const minutesSinceStart = Math.floor((itemDate.getTime() - dayStart.getTime()) / (15 * 60 * 1000)) * 15;
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



  const formatDateForDisplay = (time: number) => {
    //const date = formatInTimeZone(new Date(time), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
    const date = new Date(time);
    //console.log(date);
    const date2 = formatInTimeZone(new Date(time), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
    //console.log('convert date ', date2)
    //console.log('convert date format ', format(date2, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00'))
    return format(date2, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00');
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

    //console.log(startDate)


    //console.log('기존 startDate : ', startDate , '기존 endDate : ', endDate)
    const timezoneOffset = new Date().getTimezoneOffset()
    const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1
    startDate = new Date(startDate.getTime() - offsetMs)
    endDate = new Date(endDate.getTime() - offsetMs)

    //console.log('변경 offsetms : startDate, endDate : ', startDate, endDate)
    //console.log(indexedBpmData)
    //console.log('22222222222222')

    const normalStartDate = startDate;
    const normalEndDate = endDate;

    let filteredData;
    //console.log(`in displayData --- timeunit : ${timeUnit}`)
    if (timeUnit === 'hour') {
      //console.log('in displayData timeunit === hour, 무한루프')
      //console.log('in timeUnit hour ; startDate: ', startDate, ' endDate: ', endDate, ' hourlyBpmData: ', hourlyBpmData, 'hourlyHrvData: ', hourlyHrvData)
      const filledBpmData = fillEmptyHours(hourlyBpmData, startDate, endDate, ['bpm']);
      const filledStepData = fillEmptyHours(hourlyStepData, startDate, endDate, ['step']);
      const filledCalorieData = fillEmptyHours(hourlyCalorieData, startDate, endDate, ['calorie']);
      const filledHrvData = fillEmptyHours(hourlyHrvData, startDate, endDate, ['hour_rmssd', 'hour_sdnn']);

      const validBpmValues = hourlyBpmData.filter(item => item.bpm !== null && !isNaN(item.bpm)).map(item => item.bpm);

      //console.log('hourlyBpmData : ', hourlyBpmData)

      const hourBpmAverage = validBpmValues.length > 0 ? validBpmValues.reduce((sum, value) => sum + value, 0) / validBpmValues.length : null;

      // console.log('------------hourBpmAverage-----------')
      // console.log(hourBpmAverage?.toFixed(2))
      // console.log('------------hourBpmAverage-----------')

      filteredData = filledBpmData.map((item, index) => ({
        ...item,
        //timestamp: addHours(new Date(item.timestamp), 1).getTime(),
        bpm_average: hourBpmAverage,
        step: filledStepData[index]?.step ?? 0,
        calorie: filledCalorieData[index]?.calorie ?? 0,
        hour_rmssd: filledHrvData[index]?.hour_rmssd ?? null,
        hour_sdnn: filledHrvData[index]?.hour_sdnn ?? null,
        hour_pred_bpm: predictHourData.find(p => new Date(p.ds).getTime() === item.timestamp)?.hour_pred_bpm ?? null
      }));
      console.log('in displayData filteredData : ', filteredData)

    } else {
      
      const allMinutes = eachMinuteOfInterval({ start: normalStartDate, end: normalEndDate });
      const aggregatedCalorieData = aggregateCalorieData(calorieData);

      const validBpmValues = bpmData.filter(item => item.value !== null && !isNaN(item.value)).map(item => item.value);
      const minuteBpmAverage = validBpmValues.length > 0 ? validBpmValues.reduce((sum, value) => sum + value, 0) / validBpmValues.length : null;

      // console.log('------------minuteBPpmAverage-----------')
      // console.log(minuteBpmAverage?.toFixed(2))
      // console.log('------------minuteBPpmAverage-----------')

      filteredData = allMinutes.map(minute => {
        //const adjustedAddNineMinute = adjustTimeZoneAddNine(minute);
        const adjustedAddNineMinute = minute;
        const timestamp = minute.getTime();
        const adjustTimestamp = adjustedAddNineMinute.getTime();

        const bpmItem = indexedBpmData[adjustTimestamp] ? indexedBpmData[adjustTimestamp][0] : null;
        const stepItem = indexedStepData[adjustTimestamp] ? indexedStepData[adjustTimestamp][0] : null;

        const calorieItem = aggregatedCalorieData.find(item => item.timestamp <= timestamp && timestamp < item.timestamp + 15 * 60 * 1000);
        const sleepItem = indexedSleepData.find(s => adjustTimestamp >= s.start && adjustTimestamp < s.end);

  
        const originalTimestamp = minute.getTime();
        const predItem = indexedPredictData[originalTimestamp];
  
        return {
          timestamp,
          bpm: bpmItem ? bpmItem.value : null,
          bpm_average: minuteBpmAverage,
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

    //console.log('filteredData ; ',filteredData)


    return filteredData;
  }, [timeUnit, dateRange, dateWindow, hourlyBpmData, hourlyStepData, hourlyCalorieData, hourlyHrvData, 
      indexedBpmData, indexedStepData, indexedCalorieData, indexedSleepData, indexedPredictData, 
      predictHourData, fillEmptyHours, bpmData]);


  const filteredData = useMemo(() => {

    if (!Array.isArray(displayData)) return [];

    if (!brushDomain) return displayData;

    if (Array.isArray(brushDomain) && brushDomain.length === 2) {
      //console.log('여기서?')
      return displayData.filter(
        item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
      );
    }

    //console.log('displayData ;; ', displayData)

    return displayData;
  }, [displayData, brushDomain]);



  // useEffect(() => {
  //   if (selectedDate) {
  //     const date = new Date(selectedDate);
  //     setDateWindow({
  //       start: startOfDay(date),
  //       end: endOfDay(date)
  //     });
  //     setDateRange('1');
  //     setTimeUnit('minute');
  //   }
  // }, [selectedDate]);

  // useEffect(() => {
  //   if (selectedDate) {
  //     const date = new Date(selectedDate);
  //     console.log("[Debug] Setting dateWindow from selectedDate:", date);
      
  //     // isInitialFetch를 사용하여 초기 fetch 표시
  //     isInitialFetch.current = true;
      
  //     fetchThreeWeeksData(date).then(() => {
  //       console.log("[Debug] After fetchThreeWeeksData, setting dateWindow");
  //       setDateWindow({
  //         start: startOfDay(date),
  //         end: endOfDay(date)
  //       });
  //       setDateRange('1');
  //       setTimeUnit('minute');
        
  //       // fetch 완료 후 플래그 재설정
  //       isInitialFetch.current = false;
  //     });
  //   }
  // }, [selectedDate, fetchThreeWeeksData]);

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      //console.log("[Debug] Setting dateWindow from selectedDate:", date);
      
      // 상태 업데이트를 한 번에 처리
      const updateState = async () => {
        const threeWeeksData = await fetchThreeWeeksData(date);
        //console.log("[Debug] After fetchThreeWeeksData, updating states");
        
        // 모든 상태 업데이트를 한 번에 배치로 처리
        ReactDOM.unstable_batchedUpdates(() => {
          setDateWindow({
            start: startOfDay(date),
            end: endOfDay(date)
          });
          setDateRange('1');
          setTimeUnit('minute');
        });
      };
  
      updateState();
    }
  }, [selectedDate]); 

  const handleBrushChange = useCallback((newBrushDomain: any) => {
    //console.log('is brushChange?', newBrushDomain)
    if (newBrushDomain && newBrushDomain.length === 2) {
      setBrushDomain(newBrushDomain);
      onBrushChange(newBrushDomain);
    } else {
      setBrushDomain(null);
      onBrushChange(null);
    }
  }, [onBrushChange]);



  const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
    if (active && payload && payload.length && label) {
      const date = new Date(formatInTimeZone(new Date(label as number), 'Asia/Seoul', 'yyyy-MM-dd HH:mm'));
      const currentChart = payload[0].dataKey as string;

      const timezoneOffset = new Date().getTimezoneOffset()
      const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1

      const uniquePayload = payload.filter((item, index, self) =>
        index === self.findIndex((t) => t.dataKey === item.dataKey)
      );


  
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: 'rgba(0,0,0)', fontWeight: 'bold' }}>
            {format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00')}
          </p>
          {uniquePayload.map((pld, index) => {

            if (pld.dataKey === currentChart || 
              ((currentChart === 'bpm' || currentChart === 'bpm_average') && 
               (pld.dataKey === 'min_pred_bpm' || pld.dataKey === 'hour_pred_bpm' || pld.dataKey === 'bpm_average'))) {
              let value = pld.value !== null ? 
                (pld.dataKey === 'step' || pld.dataKey === 'calorie' ? 
                  Number(pld.value).toFixed(0) : 
                  Number(pld.value).toFixed(2)) 
                : 'N/A';
              
              let displayName = pld.name;
              if (pld.dataKey === 'bpm_average') {
                displayName = 'BPM Average'; // 평균값 표시 이름 설정
              }

              let memoKey = `${pld.dataKey}_${date.getTime() - offsetMs}`;
  
              if (pld.dataKey === 'sleep_stage') {
                const sleepStage = pld.value as number;
                value = getSleepStageLabel(sleepStage);
                const sleepItem = indexedSleepData.find(s => date.getTime() - offsetMs >= s.start && date.getTime() - offsetMs < s.end);
                if (sleepItem) {
                  memoKey = `sleep_${sleepItem.start}`;
                }
              } else if (pld.dataKey === 'calorie') {
                const interval = 15 * 60 * 1000;
                const startOfInterval = (Math.floor(date.getTime() / interval) * interval) - offsetMs;
                memoKey = `${pld.dataKey}_${startOfInterval}`;
              }
  
              const memo = memos[memoKey];

  
              return (
                <React.Fragment key={`${pld.dataKey}-${index}`}>
                  <p style={{ color: pld.dataKey === 'sleep_stage' ? getSleepStageColor(pld.value as number) : pld.color }}>
                    {pld.dataKey === 'sleep_stage' ? `Sleep Stage: ${value}` : `${displayName}: ${value}`}
                  </p>
                  {memo && (
                    <p className="text-gray-600 italic">Memo: {typeof memo === 'string' ? memo : memo.content}</p>
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


  const checkSleepMemo = (timestamp: number): { hasMemo: boolean; isCenter: boolean; memo: string } => {
    for (const [key, memo] of Object.entries(memos)) {
      if (key.startsWith('sleep_')) {
        const startTimestamp = parseInt(key.split('_')[1]);
        const endTimestamp = memo.endTimestamp || startTimestamp + 60000; // 기본값으로 1분 설정
        
        if (timestamp >= startTimestamp && timestamp <= endTimestamp) {
          const centerTimestamp = startTimestamp + (endTimestamp - startTimestamp) / 2;
          const isCenter = Math.abs(timestamp - centerTimestamp) <= 30000; // 30초 이내면 중앙으로 간주
          return { hasMemo: true, isCenter, memo: memo.content };
        }
      }
    }
    return { hasMemo: false, isCenter: false, memo: '' };
  };


  const renderChart = (dataKey: string, color: string, yAxisLabel: string, ChartType: typeof LineChart | typeof BarChart = LineChart, additionalProps = {}) => {

    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%" style={{ backgroundColor: 'black' }} >
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
              //label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
              //tickFormatter={(value) => value.toFixed(1)}
              tickFormatter={(value) => 
                dataKey === 'sleep_stage' ? getSleepStageTickLabel(value) : value.toFixed(1)
              }
              domain={dataKey === 'sleep_stage' ? [-4.5, 0.5] : ['auto', 'auto']}
              ticks={dataKey === 'sleep_stage' ? [-4, -3, -2, -1] : undefined}
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
            ) : dataKey === 'sleep_stage' ? (
              <>
                {/* Background for sleep stages */}
                {/* {displayData.map((entry, index) => {
                  const sleepStart = entry.timestamp;
                  const sleepEnd = index < displayData.length - 1 ? displayData[index + 1].timestamp : entry.timestamp + 60000;
                  const hasMemo = memos[`sleep_${sleepStart}`] !== undefined;
                  return (
                    <ReferenceArea
                      key={`sleep-area-${index}`}
                      x1={sleepStart}
                      x2={sleepEnd}
                      y1={-3.5}
                      y2={0.5}
                      fill={getSleepStageColor(entry.sleep_stage)}
                      fillOpacity={hasMemo ? 0.5 : 0.6}
                    />
                  );
                })} */}
                {displayData.map((entry, index) => {
                  const sleepStart = entry.timestamp;
                  const sleepEnd = index < displayData.length - 1 ? displayData[index + 1].timestamp : entry.timestamp + 60000;
                  const hasMemo = memos[`sleep_${sleepStart}`] !== undefined;
                  return (
                    <ReferenceArea
                      key={`sleep-area-${index}`}
                      x1={sleepStart}
                      x2={sleepEnd}
                      y1={-4.5}
                      y2={0.5}
                      fill={getSleepStageColor(entry.sleep_stage)}
                      fillOpacity={hasMemo ? 0.5 : 0.6}
                    />
                  );
                })}
                {/* Sleep stage line */}
                {/* <Line
                  type="stepAfter"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  {...additionalProps}
                /> */}
                                <Line
                type="stepAfter"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={((props: any) => {
                  if (!props.payload || props.payload.timestamp === undefined) {
                    return null;
                  }
                  const { hasMemo, isCenter, memo } = checkSleepMemo(props.payload.timestamp);
                  if (hasMemo && isCenter) {
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={6}
                        fill="#FF4500"
                        stroke="black"
                        strokeWidth={2}
                      />
                    );
                  }
                  return null;
                }) as LineProps['dot']}
                label={((props: any) => {
                  if (!props.payload || props.payload.timestamp === undefined) {
                    return null;
                  }
                  const { hasMemo, isCenter } = checkSleepMemo(props.payload.timestamp);
                  if (hasMemo && isCenter) {
                    return (
                      <text
                        x={props.x}
                        y={props.y - 15}
                        fill="#FF4500"
                        fontSize={12}
                        textAnchor="middle"
                      >
                        M
                      </text>
                    );
                  }
                  return null;
                }) as LineProps['label']}
                {...additionalProps}
                />
                {/* Highlight areas with memos */}
                  {displayData.map((entry, index) => {
                    const hasMemo = memos[`sleep_${entry.timestamp}`] !== undefined;
                    if (hasMemo) {
                      const nextEntry = displayData[index + 1];
                      const endTimestamp = nextEntry ? nextEntry.timestamp : entry.timestamp + 60000;
                      return (
                        <ReferenceLine
                          key={`memo-highlight-${index}`}
                          x1={entry.timestamp}
                          x2={endTimestamp}
                          stroke="#FF4500"
                          strokeWidth={4}
                          strokeOpacity={0.5}
                        />
                      );
                    }
                    return null;
                  })}
                {/* Additional line for memo indicators */}
                {/* <Line
                type="stepAfter"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={((props: any) => {
                  if (!props.payload || props.payload.timestamp === undefined) {
                    return null;
                  }
                  const { hasMemo, isCenter, memo } = checkSleepMemo(props.payload.timestamp);
                  if (hasMemo && isCenter) {
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={6}
                        fill="#FF4500"
                        stroke="black"
                        strokeWidth={2}
                      />
                    );
                  }
                  return null;
                }) as LineProps['dot']}
                label={((props: any) => {
                  if (!props.payload || props.payload.timestamp === undefined) {
                    return null;
                  }
                  const { hasMemo, isCenter } = checkSleepMemo(props.payload.timestamp);
                  if (hasMemo && isCenter) {
                    return (
                      <text
                        x={props.x}
                        y={props.y - 15}
                        fill="#FF4500"
                        fontSize={12}
                        textAnchor="middle"
                      >
                        M
                      </text>
                    );
                  }
                  return null;aa
                }) as LineProps['label']} */}
              
              </>
            ) : ChartType === LineChart ? (
              <>
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
                        stroke="white"
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
            {dataKey === 'bpm' && (
              <Line
                type="monotone"
                dataKey="bpm_average"
                stroke="rgba(255, 170, 0)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="BPM Average"
                connectNulls
              />
            )}
            </>
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
                        stroke="white"
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
    { key: 'bpm', color: 'rgba(255, 20, 80)', label: 'BPM', type: LineChart },
    { key: 'step', color: 'rgba(70, 222, 47)', label: 'Steps', type: BarChart },
    { key: 'calorie', color: 'rgba(246, 132, 216)', label: 'Calories', type: BarChart },
  ];
  
  if (timeUnit === 'hour') {
    charts.push(
      { key: 'hour_rmssd', color: '#8884d8', label: 'RMSSD', type: LineChart },
      { key: 'hour_sdnn', color: '#82ca9d', label: 'SDNN', type: LineChart }
    );
  } else {
    charts.push({ key: 'sleep_stage', color: '#aaaaaa', label: 'Sleep Stage', type: LineChart })
  }

  return (
    <div className='bg-black p-4 rounded-lg shadow'>
      <div className="mb-4 flex items-center justify-between">
        <div>
          {[1, 2, 3].map(count => (
            <button
              key={count}
              onClick={() => setColumnCount(count)}
              className={`px-4 py-2 rounded ml-2 ${columnCount === count ? 'bg-blue-500 text-gray-300' : 'bg-gray-200 text-gray-500'}`}
            >
              {count} Column{count !== 1 ? 's' : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center">
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
            onClick={() => moveDate('backward')}
            className="px-2 py-1 bg-blue-500 text-white rounded mr-2 ml-4"
            disabled={!dateWindow || !dbStartDate || dateWindow.start <= dbStartDate}
          >
            ←
          </button>
          <button 
            onClick={() => moveDate('forward')}
            className="px-2 py-1 bg-blue-500 text-white rounded"
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
      {timeUnit === 'minute' && (
          <div className="w-full h-full mt-5">
            {/* <NoonSleepChart
              sleepData={sleepData}
              selectedDate={selectedDate}
              memos={memos}
              onMemoClick={(data: any) => {
                if (data && data.activePayload) {
                  handleChartClick(data.activePayload[0].payload, 'sleep');
                }
              }}
            /> */}
          <NoonSleepChart
            sleepData={sleepData}
            selectedDate={format(dateWindow?.end || new Date(), 'yyyy-MM-dd')}
            memos={memos}
            onMemoClick={(data: any) => {
              if (data && data.activePayload) {
                handleChartClick(data.activePayload[0].payload, 'sleep');
              }
            }}
          />
          </div>
        )}
        <MemoModal
          isOpen={memoModalOpen}
          onClose={() => setMemoModalOpen(false)}
          onSave={saveMemo}
          data={selectedData}
          existingMemo={selectedData ? (memos[`${selectedData.type}_${selectedData.timestamp}`] || '') : ''}
        />
    </div>
  );
};

export default MultiChart;


