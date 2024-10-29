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
  //checkDataExistence: checkDataExistenceFromServer
}) => {

  //console.log(`in multi initialDateWindow ... ${initialDateWindow}`)

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
  const [memos, setMemos] = useState<{ [key: string]: Memo }>({});

  // heatmap
  const [heatmapSelectedDate, setHeatmapSelectedDate] = useState<Date | null>(null);


  const [cachedData, setCachedData] = useState<CachedDataType>({});


  const timezoneOffset = new Date().getTimezoneOffset()
  const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1


  const fetchThreeWeeksData = useCallback(async (selectedDate: Date) => {
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const previousWeekStart = subWeeks(selectedWeekStart, 1);
    const nextWeekStart = addWeeks(selectedWeekStart, 1);

    const weeksToFetch = [previousWeekStart, selectedWeekStart, nextWeekStart];
    const newCachedData = { ...cachedData };

    await Promise.all(weeksToFetch.map(async (weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      //console.log(`in fetchThreeWeeksData -- ${weekStart} ~ ${weekEnd}`)

      if (!newCachedData[weekKey]) {
        const weekData = await fetchAdditionalData(weekStart, weekEnd);
        newCachedData[weekKey] = weekData;
      }
    }));

    setCachedData(newCachedData);

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const currentWeekKey = format(selectedWeekStart, 'yyyy-MM-dd');
    
    const filteredBpmData = newCachedData[currentWeekKey].bpmData.filter(d => format(new Date(d.timestamp), 'yyyy-MM-dd') === selectedDateStr);
    const filteredStepData = newCachedData[currentWeekKey].stepData.filter(d => format(new Date(d.timestamp), 'yyyy-MM-dd') === selectedDateStr);
    const filteredCalorieData = newCachedData[currentWeekKey].calorieData.filter(d => format(new Date(d.timestamp), 'yyyy-MM-dd') === selectedDateStr);
    const filteredSleepData = newCachedData[currentWeekKey].sleepData.filter(d => format(new Date(d.timestamp_start), 'yyyy-MM-dd') === selectedDateStr);
    const filteredHrvData = newCachedData[currentWeekKey].hrvData.filter(d => format(new Date(d.ds), 'yyyy-MM-dd') === selectedDateStr);
  


    //console.log('33333333333333333333333333',filteredBpmData)

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
  console.log(`히트맵에서 선택된 날짜: ${date}`);
  
  const selectedDate = new Date(date);
  const newStart = startOfDay(selectedDate);
  const newEnd = endOfDay(selectedDate);

  setTimeout(scrollToMultiChart, 10);

  setDateWindow({ start: newStart, end: newEnd });
  setDateRange('1'); // 
  setTimeUnit('minute'); // 분 단위로 설정 (필요에 따라 조정)

  
  await fetchThreeWeeksData(selectedDate);
  
}, [fetchThreeWeeksData, scrollToMultiChart]);

useEffect(() => {
  window.addEventListener('dateSelect', handleDateSelect);
  return () => {
    window.removeEventListener('dateSelect', handleDateSelect);
  };
}, [handleDateSelect]);
////////////

  const [localHrvData, setLocalHrvData] = useState(hrvHourData);


  useEffect(() => {
    if (dateWindow === null) return ;
    //console.log('in fetchMemos ; dateWindow: ', dateWindow.start, '~~~', dateWindow.end)

    if (dateWindow && selectedUser) {
      fetchMemos();
      //console.log('useEffect memo ------->>>>>',memos, '----', dateWindow.start, '~~~', dateWindow.end)
    }
  }, [dateWindow, selectedUser]);


  const fetchMemos = async () => {
    if (!selectedUser || !dateWindow) return;
    try {
      console.log('@@@@@@@@@@@fetchMemos@@@@@@@@@@@')
      console.log(dateWindow.start , dateWindow.end)
      console.log(formatInTimeZone(dateWindow.start, 'UTC', 'yyyy-MM-dd HH:mm:ss'), formatInTimeZone(dateWindow.end, 'UTC', 'yyyy-MM-dd HH:mm:ss'))
      console.log(format(new Date(dateWindow.start), 'yyyy-MM-dd HH:mm:ss'), format(new Date(dateWindow.end), 'yyyy-MM-dd HH:mm:ss'))
      console.log('@@@@@@@@@@@fetchMemos@@@@@@@@@@@')
      const response = await axios.get('/api/getMemos', {
        params: {
          user_email: selectedUser,
          // startDate: dateWindow.start.toISOString(),
          // endDate: dateWindow.end.toISOString()
          startDate: new Date(format(dateWindow.start, 'yyyy-MM-dd HH:mm:ss')),
          endDate: new Date(format(dateWindow.end, 'yyyy-MM-dd HH:mm:ss'))
        },
      });
  
      console.log('Raw memo data from server:', response.data);
  
      const memoData = response.data.reduce((acc: { [key: string]: Memo }, memo: any) => {
        if (memo.type === 'sleep') {
          const key = `sleep_${new Date(memo.timestamp_start).getTime()}`;
          acc[key] = {
            content: memo.memo,
            endTimestamp: new Date(memo.timestamp_end).getTime()
          };
          //console.log(`Added sleep memo with key: ${key}, value: ${memo.memo}, end: ${memo.timestamp_end}`);
        } else {
          const key = `${memo.type}_${new Date(memo.timestamp).getTime()}`;
          acc[key] = { content: memo.memo };
          //console.log(`Added other memo with key: ${key}, value: ${memo.memo}`);
        }
        return acc;
      }, {});
  
      //console.log('Processed memo data:', memoData);
      setMemos(memoData);
    } catch (error) {
      console.error('Error fetching memos:', error);
    }
  };
  
  const saveMemo = async (memo: string) => {
    if (selectedData && selectedUser) {
      try {
        //console.log('zzzzzzzzzzz ',selectedData)
        if (selectedData.type === 'sleep') {
          //console.log(`ha`)
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

  useEffect(() => {
    //console.log('초기 cached 설정!!!')
    const initializeCache = () => {
      let startDate: Date;
      if (initialDateWindow) {
        startDate = initialDateWindow.start;
      } else if (initialBpmData.length > 0) {
        //startDate = adjustTimeZone(new Date(initialBpmData[0].timestamp));
        startDate = new Date(initialBpmData[0].timestamp);
      } else if (dbStartDate) {
        startDate = dbStartDate;
      } else {
        console.error('No valid start date found for initialization');
        return;
      }

      const timezoneOffset = new Date().getTimezoneOffset()
      const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1

      // console.log('test offset startDate : ', new Date(startDate.getTime() - offsetMs))

      // console.log('startDate getTime()', startDate.getTime())
      // console.log('offsetMs : ', offsetMs)
      // console.log('plus', startDate.getTime() + offsetMs)
      // console.log('plus', new Date(startDate.getTime() + offsetMs))
      // console.log('minus', startDate.getTime() - offsetMs)
      // console.log('minus', new Date(startDate.getTime() - offsetMs))
      // console.log('in initalizecache part : ',startDate)
      
      startDate = new Date(startDate.getTime() + offsetMs)

      

      const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
      //console.log(`^^^^^^^^^^^^^weekStart: ${weekStart} ^^^^^^^^^`)
      
      const threeWeeksEnd = addWeeks(weekStart, 2);
      
      //console.log(`in initializeCache ... ------`)

      const newCachedData: CachedDataType = {};
      for (let i = 0; i < 3; i++) {
        const currentWeekStart = addWeeks(weekStart, i);
        //console.log(`^^^^^^^^^^^^^currentWeekStart: ${currentWeekStart} ^^^^^^^^^`)
        const weekKey = format(currentWeekStart, 'yyyy-MM-dd');
        //console.log(`^^^^^^^^^^^^^weekKey: ${weekKey} ^^^^^^^^^`)
        newCachedData[weekKey] = {
          bpmData: initialBpmData.filter(d => isWithinInterval(new Date(new Date(d.timestamp).getTime() + offsetMs), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
          stepData: initialStepData.filter(d => isWithinInterval(new Date(new Date(d.timestamp).getTime() + offsetMs), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
          calorieData: initialCalorieData.filter(d => isWithinInterval(new Date(new Date(d.timestamp).getTime() + offsetMs), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
          sleepData: initialSleepData.filter(d => isWithinInterval(new Date(new Date(d.timestamp_start).getTime() + offsetMs), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
          hrvData: hrvHourData.filter(d => isWithinInterval(new Date(new Date(d.ds).getTime() + offsetMs), { start: currentWeekStart, end: addWeeks(currentWeekStart, 1) })),
        };
        //console.log(`newCachedData[weekKey] -------------^^^^^^ ${JSON.stringify(newCachedData[weekKey])}`)
      }
      setCachedData(newCachedData);

      // Set initial data for display
      const currentWeekKey = format(weekStart, 'yyyy-MM-dd');

      setBpmData(newCachedData[currentWeekKey].bpmData);
      setStepData(newCachedData[currentWeekKey].stepData);
      setCalorieData(newCachedData[currentWeekKey].calorieData);
      setSleepData(newCachedData[currentWeekKey].sleepData);
      setLocalHrvData(newCachedData[currentWeekKey].hrvData);

    };

    initializeCache();
  }, [initialDateWindow, initialBpmData, initialStepData, initialCalorieData, initialSleepData, hrvHourData, dbStartDate]);

  useEffect(() => {
    if (dateWindow) {
      const loadData = async () => {
        const timezoneOffset = new Date().getTimezoneOffset()
        const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1
        //const offsetMs = timezoneOffset * 60 * 1000
        
        

        //const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        //const selectedDate = fromZonedTime(dateWindow.start, localTimezone);

        const selectedDate = dateWindow.start
        
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'yyyy-MM-dd');

        
        // console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
        // console.log('dateWindow.start getTime()', dateWindow.start.getTime())
        // console.log('dateWindow.start', dateWindow.start)
        // console.log('dateWindow.start toisostring', dateWindow.start.toISOString())
        // console.log('selectedDate getTime()', selectedDate.getTime())
        // console.log('selectedDate', selectedDate)
        // console.log('selectedDate toisostring', selectedDate.toISOString())
        // console.log('selectedDate getTime()', fromZonedTime(dateWindow.start, 'Asia/Seoul').getTime())
        // console.log('selectedDate', selectedDate)
        // console.log('selectedDate toisostring', selectedDate.toISOString())
        // console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
  
        //console.log(`weekKey: ${weekKey}`);
        //console.log(`dateWindow: ${dateWindow.start} ~ ${dateWindow.end}`);
  
        let weekData: WeekData;
        if (cachedData[weekKey]) {
          //console.log("Using cached data for:", weekKey);
          weekData = cachedData[weekKey] as WeekData;
          // console.log('-----------------weekKey--------------', weekKey)
          // console.log('-----------------weekData--------------', weekData)
        } else {
          //console.log("Fetching new data for:", weekKey);
          //console.log('in if문 ...... weekStart, weekEnd ', weekStart, ' ~ ', weekEnd)
          weekData = await fetchAdditionalData(weekStart, weekEnd) as WeekData;
          setCachedData(prev => ({ ...prev, [weekKey]: weekData }));
        }

        //console.log('in loadData -----> weekData -----> ', weekData)
        //console.log('in loadData -----> weekData -----> weekStart ----> weekEnd', weekStart, '~~', weekEnd)
  
        if (dateRange === '7') {
          //console.log('설마?')
          setBpmData(weekData.bpmData);  // 전체 주간 데이터 사용
          setStepData(weekData.stepData);
          setCalorieData(weekData.calorieData);
          setSleepData(weekData.sleepData);
          setLocalHrvData(weekData.hrvData);
        } else {
          // 선택된 날짜의 데이터만 필터링
          const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
          //console.log('in dateWindow weekdata part ; after format', selectedDateStr)
          //console.log('??? 1일치만인데')
          // setBpmData(weekData.bpmData.filter(d => format(new Date(d.timestamp), 'yyyy-MM-dd') === selectedDateStr));
          // //console.log('in dateWindow weekdata part ; after bpm', weekData.bpmData.filter(d => format(new Date(d.timestamp), 'yyyy-MM-dd') === selectedDateStr))
          // setStepData(weekData.stepData.filter(d => format(new Date(d.timestamp), 'yyyy-MM-dd') === selectedDateStr));
          // //console.log('in dateWindow weekdata part ; after step')
          // setCalorieData(weekData.calorieData.filter(d => format(new Date(d.timestamp), 'yyyy-MM-dd') === selectedDateStr));
          // //console.log('in dateWindow weekdata part ; after cal')
          // setSleepData(weekData.sleepData.filter(d => format(new Date(d.timestamp_start), 'yyyy-MM-dd') === selectedDateStr));
          // //console.log('in dateWindow weekdata part ; after sleep')
          // setLocalHrvData(weekData.hrvData.filter(d => format(new Date(d.ds), 'yyyy-MM-dd') === selectedDateStr));
          // //console.log('in dateWindow weekdata part ; after hrv')

          
          
          const utcStartOfDay = new Date(startOfDay(selectedDate).getTime() - offsetMs)
          const utcEndOfDay = new Date(endOfDay(selectedDate).getTime() - offsetMs)
          
          // console.log(weekData.bpmData)
          
          // console.log('selectedDate : ', selectedDate)
          // console.log('selectedDateStr : ', selectedDateStr)
          // console.log('utcStartOfDay iso : ', utcStartOfDay.toISOString())
          // console.log('utcStartOfDay : ', utcStartOfDay)
          // console.log('utcEndOfDay iso : ', utcEndOfDay.toISOString())
          // console.log('utcEndOfDay : ', utcEndOfDay)

          // console.log('!!!!!!!!!!', weekData.bpmData.filter(d => {
          //   const timestamp = new Date(d.timestamp);
          //   return timestamp >= utcStartOfDay && timestamp <= utcEndOfDay;
          // }))

          // console.log('^^^^^^ TEST1 ^^^^^^')
          // const testTimestamp = 1729090800000
          // console.log('original testTimestamp : ', testTimestamp)
          // console.log('new Date testTimestamp : ', new Date(testTimestamp))
          // console.log('new Date testTimestamp toisostring : ', new Date(testTimestamp).toISOString())
          // console.log('new Date getTime : ', new Date(testTimestamp).getTime())
          // console.log('new Date new Date getTime toisostring : ', new Date(new Date(testTimestamp).getTime()).toISOString())
          // console.log('^^^^^^^^^^^^^^^^^^')

          // console.log('^^^^^^ TEST2 ^^^^^^')
          // const newDateTestTimestamp = new Date(testTimestamp)
          // const newDateTestTimestampToISOString = newDateTestTimestamp.toISOString();
          // const newDateTestTimestampGetTime = newDateTestTimestamp.getTime();
          // const newDateNewDateTestTimestampGetTimeToISOString = new Date(newDateTestTimestampGetTime).toISOString();
          // console.log('original testTimestamp : ', testTimestamp)
          // console.log('newDateTestTimestamp : ', newDateTestTimestamp)
          // console.log('newDateTestTimestampToISOString : ', newDateTestTimestampToISOString)
          // console.log('newDateTestTimestampGetTime : ', newDateTestTimestampGetTime)
          // console.log('newDateNewDateTestTimestampGetTimeToISOString : ', newDateNewDateTestTimestampGetTimeToISOString)
          // console.log('^^^^^^^^^^^^^^^^^^')

          // console.log('!!!!!!!!!!', new Date(weekData.bpmData.filter(d => {
          //   const timestamp = new Date(d.timestamp);
          //   return timestamp >= utcStartOfDay && timestamp <= utcEndOfDay;
          // })[0].timestamp).toISOString())
          // console.log('!!!!!!!!!!', new Date(weekData.bpmData.filter(d => {
          //   const timestamp = new Date(d.timestamp);
          //   return timestamp >= utcStartOfDay && timestamp <= utcEndOfDay;
          // })[0].timestamp).getTime())


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
            return timestamp_start >= utcStartOfDay && timestamp_start <= utcEndOfDay;
          }));
          setLocalHrvData(weekData.hrvData.filter(d => {
            const ds = new Date(d.ds);
            return ds >= utcStartOfDay && ds <= utcEndOfDay;
          }));


          // console.log('LLLLLLLLoad DDDDDDDDData')
          // console.log(weekData.bpmData.filter(d => {
          //   const timestamp_start = new Date(d.timestamp);
          //   return timestamp_start >= utcStartOfDay && timestamp_start <= utcEndOfDay;
          // }))
          // console.log('LLLLLLLLoad DDDDDDDDData')

          // console.log('!!!!!!!!!!', weekData.bpmData.filter(d => {
          //   const timestamp = new Date(d.timestamp);
          //   return timestamp >= startOfSelectedDate && timestamp <= endOfSelectedDate;
          // }))

          // setBpmData(weekData.bpmData.filter(d => {
          //   const timestamp = new Date(d.timestamp);
          //   return timestamp >= startOfSelectedDate && timestamp <= endOfSelectedDate;
          // }));
          // setStepData(weekData.stepData.filter(d => {
          //   const timestamp = new Date(d.timestamp);
          //   return timestamp >= startOfSelectedDate && timestamp <= endOfSelectedDate;
          // }));
          // setCalorieData(weekData.calorieData.filter(d => {
          //   const timestamp = new Date(d.timestamp);
          //   return timestamp >= startOfSelectedDate && timestamp <= endOfSelectedDate;
          // }));
          // setSleepData(weekData.bpmData.filter(d => {
          //   const timestamp_start = new Date(d.timestamp);
          //   return timestamp_start >= startOfSelectedDate && timestamp_start <= endOfSelectedDate;
          // }));
          // setLocalHrvData(weekData.hrvData.filter(d => {
          //   const ds = new Date(d.ds);
          //   return ds >= startOfSelectedDate && ds <= endOfSelectedDate;
          // }));
        }};

        console.log(cachedData)
        //console.log(`dateWindow .. ${dateWindow.start} ~ ${dateWindow.end}`)
  
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
      //console.log('---------------------------------???')
      setDateWindow({
        start: startOfDay(startOfWeekDate),
        end: endOfDay(endOfWeekDate)
      });
    }
    //console.log('in selectedDate ---->? ')
  }, [selectedDate]);

  const processHourlyData = useCallback((data: any[], valueKey: string) => {
    // if (valueKey === 'bpm') {
    //   console.log('--------------processHourlyData before process data :', valueKey , data)
    // }
    
    const hourlyData = data.reduce((acc: any, item: any) => {
      //console.log('@@@@@@@before startOfHour ----> new Date(item.timestamp)', new Date(item.timestamp));
      //console.log('@@@@@@@before startOfHour ----> new Date(item.timestamp)', new Date(item.timestamp).getTime());
      const hourKey = startOfHour(new Date(item.timestamp)).getTime();
      //console.log('@@@@@@@after startOfHour ----> startOfHour(new Date(item.timestamp))', startOfHour(new Date(item.timestamp)));
      //console.log('@@@@@@@after startOfHour ----> startOfHour(new Date(item.timestamp))', startOfHour(new Date(item.timestamp)).getTime());
      //console.log('In ProcessHourlyData ; item.timestamp ;; ', item.timestamp,' ----> ', hourKey, '---->' , valueKey ,' -----> ' ,item.value)
      //console.log(acc[hourKey])
      if (!acc[hourKey]) {
        acc[hourKey] = { timestamp: hourKey, values: [], sum: 0, count: 0 };
      }
      acc[hourKey].values.push(item.value);
      acc[hourKey].sum += item.value;
      acc[hourKey].count += 1;
      return acc;
    }, {});

    //console.log('in processHoulryData ', valueKey, '----??', hourlyData)

    // console.log('마지막 리턴 값 in processHoulryData ', valueKey, '----??', Object.values(hourlyData).map((item: any) => ({
    //   timestamp: item.timestamp,
    //   [valueKey]: valueKey === 'bpm' ? item.sum / item.count : item.sum
    // })))

    return Object.values(hourlyData).map((item: any) => ({
      timestamp: item.timestamp,
      [valueKey]: valueKey === 'bpm' ? item.sum / item.count : item.sum
    }));
  }, []);


  // console.log('')
  // console.log(bpmData)
  // console.log('')
  const hourlyBpmData = useMemo(() => processHourlyData(bpmData, 'bpm'), [bpmData, processHourlyData]);
  const hourlyStepData = useMemo(() => processHourlyData(stepData, 'step'), [stepData, processHourlyData]);
  const hourlyCalorieData = useMemo(() => processHourlyData(calorieData, 'calorie'), [calorieData, processHourlyData]);

  // console.log('11')
  // console.log(localHrvData)
  // console.log('11')

  const hourlyHrvData = useMemo(() => {
    return localHrvData.map(item => ({
      timestamp: new Date(item.ds).getTime(),
      hour_rmssd: item.hour_rmssd,
      hour_sdnn: item.hour_sdnn
    }));
  }, [localHrvData]);

  // console.log('')
  // console.log(hourlyHrvData)
  // console.log('')


  const fillEmptyHours = useCallback((data: any[], start: Date, end: Date, keys: string[]) => {
    // console.log('in fillEmptyHours ;;;', data, '*************')
    // console.log('in fillEmptyHours start end;;;', start, ' ~~ ',end, '*************')
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
  

      //console.log('in moveDate prevWinodw : ', prevWindow.start , '~~', prevWindow.end)

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

      //console.log('in moveDate new Start & new End: ', newStart, '~~', newEnd )
  
      const weekStart = startOfWeek(newStart, { weekStartsOn: 1 });

      //console.log('in moveDate weekStart : ', weekStart)

      const threeWeeksStart = subWeeks(weekStart, 1);

      //console.log('in moveDate threeWeeksStart : ', threeWeeksStart)

      const threeWeeksEnd = addWeeks(weekStart, 1);
  
      // Check if we need to fetch new data
      console.log('----------------------------------')
      const weeksToFetch: WeekRange[] = [];
      for (let i = 0; i < 3; i++) {
        const currentWeekStart = addWeeks(threeWeeksStart, i);
        const weekKey = format(currentWeekStart, 'yyyy-MM-dd');
        if (!cachedData[weekKey]) {
          weeksToFetch.push({ start: currentWeekStart, end: addWeeks(currentWeekStart, 1) });
        }
        // console.log('in moveDate currentWeekStart : ', currentWeekStart)
        // console.log('in moveDate weekKey : ', weekKey)
      }
      //console.log(`weeksToFetch.length : ${weeksToFetch.length}`)
      if (weeksToFetch.length > 0) {
        // Fetch data for missing weeks

        //console.log('-------------in weeksToFetch.length>0-----------')
        
        Promise.all(weeksToFetch.map(week => 
          fetchAdditionalData(week.start, week.end)
        )).then(results => {
          const newCachedData = { ...cachedData };
          results.forEach((data, index) => {
            const weekKey = format(weeksToFetch[index].start, 'yyyy-MM-dd');
            newCachedData[weekKey] = data;
          });
          setCachedData(newCachedData);
  

          //console.log('is timeunit 7days in moveDate, newCachedData111111111111111: ', newCachedData)


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
        const currentWeekKey = format(weekStart, 'yyyy-MM-dd');
        // console.log('^^^^^^^^^^^^^^^^^^^')
        // console.log('in moveDate newCachedData',cachedData)
        // console.log('in moveDate currentWeekKey',currentWeekKey)
        // console.log('in moveDate cachedData[currentWeekKey].bpmData',cachedData[currentWeekKey].bpmData)
        // console.log('^^^^^^^^^^^^^^^^^^^')
        //console.log('moveDate before setBpmData...')
        setBpmData(cachedData[currentWeekKey].bpmData);
        setStepData(cachedData[currentWeekKey].stepData);
        setCalorieData(cachedData[currentWeekKey].calorieData);
        setSleepData(cachedData[currentWeekKey].sleepData);
        setLocalHrvData(cachedData[currentWeekKey].hrvData);
        // if (dateRange === '7') {
        //   console.log('moveDate before setBpmData...')
        //   setBpmData(cachedData[currentWeekKey].bpmData);
        //   setStepData(cachedData[currentWeekKey].stepData);
        //   setCalorieData(cachedData[currentWeekKey].calorieData);
        //   setSleepData(cachedData[currentWeekKey].sleepData);
        //   setLocalHrvData(cachedData[currentWeekKey].hrvData);
        // } else {
        //   const tempKeyStr = format(newStart, 'yyyy-MM-dd');
        //   console.log('???????')
        //   setBpmData(cachedData[currentWeekKey].bpmData.filter(d => 
        //     format(new Date(d.timestamp), 'yyyy-MM-dd') === tempKeyStr
        //   ));
        //   setStepData(cachedData[currentWeekKey].stepData.filter(d => 
        //     format(new Date(d.timestamp), 'yyyy-MM-dd') === tempKeyStr
        //   ));
        //   setCalorieData(cachedData[currentWeekKey].calorieData.filter(d => 
        //     format(new Date(d.timestamp), 'yyyy-MM-dd') === tempKeyStr
        //   ));
        //   setSleepData(cachedData[currentWeekKey].sleepData.filter(d => 
        //     format(new Date(d.timestamp), 'yyyy-MM-dd') === tempKeyStr
        //   ));
        //   setLocalHrvData(cachedData[currentWeekKey].hrvData.filter(d => 
        //     format(new Date(d.timestamp), 'yyyy-MM-dd') === tempKeyStr
        //   ));
        // }

      }

      //console.log('is in moveDate ; start : , end : ', newStart, ';;;;;', newEnd)
      //console.log('$$$$$$$$$$$$$$$$$$$$$$$$MoveDate$$$$$$$$$$$$$$$$$$$$$$$')
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


  // console.log('')
  // console.log(sleepData)
  // console.log('')

  const indexedSleepData = useMemo(() => {
    // console.log('----------in indexedSleepData--------')
    // console.log(sleepData.map(item => ({
    //   start: new Date(item.timestamp_start).getTime(),
    //   end: new Date(item.timestamp_end).getTime(),
    //   value: item.value
    // })))
    // console.log('----------in indexedSleepData--------')
    return sleepData.map(item => ({
      start: new Date(item.timestamp_start).getTime(),
      end: new Date(item.timestamp_end).getTime(),
      value: item.value
    }));
  }, [sleepData]);
  // console.log('2222')
  // console.log(sleepData)
  // console.log('2222')

  console.log(cachedData)

  const indexedPredictData = useMemo(() => {
    // console.log('hoxy22')
    // console.log(predictMinuteData.reduce((acc: { [key: number]: any }, item) => {
    //   const timestamp = new Date(item.ds).getTime();
    //   acc[timestamp] = item;
    //   return acc;
    // }, {}))
    // console.log('hoxy22')
    return predictMinuteData.reduce((acc: { [key: number]: any }, item) => {
      // console.log('--------------predict minute reduce------------')
      // console.log(item.ds)
      // console.log(new Date(item.ds));
      // console.log('--------------predict minute reduce------------')
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


// ///////////////// 테스트 부분 ///////////////////
//     const startInKST = startOfDay(dateWindow.end);
//     const endInKST = endOfDay(dateWindow.end);
    
//     // KST를 UTC로 변환 (9시간 차이)
//     startDate = subHours(startInKST, 9);
//     endDate = subHours(endInKST, 9);
// //////////////////////////////////////////////////





    //console.log('기존 startDate : ', startDate , '기존 endDate : ', endDate)
    const timezoneOffset = new Date().getTimezoneOffset()
    const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1
    startDate = new Date(startDate.getTime() - offsetMs)
    endDate = new Date(endDate.getTime() - offsetMs)


    //console.log(`Date range: ${startDate} to ${endDate}`);
    //console.log(`in displayData startDate ~ endDate---> ${startDate} ~ ${endDate}`)

    const normalStartDate = startDate;
    const normalEndDate = endDate;

    //console.log(`in displayData normalStartDate ~ normalEndDate---> ${normalStartDate} ~ ${normalEndDate}`)

    let filteredData;
    //console.log(`in displayData --- timeunit : ${timeUnit}`)
    if (timeUnit === 'hour') {
      //console.log('in displayData timeunit === hour, 무한루프')
      //console.log('in timeUnit hour ; startDate: ', startDate, ' endDate: ', endDate, ' hourlyBpmData: ', hourlyBpmData, 'hourlyHrvData: ', hourlyHrvData)
      const filledBpmData = fillEmptyHours(hourlyBpmData, startDate, endDate, ['bpm']);
      const filledStepData = fillEmptyHours(hourlyStepData, startDate, endDate, ['step']);
      const filledCalorieData = fillEmptyHours(hourlyCalorieData, startDate, endDate, ['calorie']);
      const filledHrvData = fillEmptyHours(hourlyHrvData, startDate, endDate, ['hour_rmssd', 'hour_sdnn']);

      // const filledBpmData = fillEmptyHours(hourlyBpmData, startDate, endDate, ['bpm'])
      // .map(item => ({
      //   ...item,
      //   timestamp: item.timestamp + timezoneOffset
      // }));
      // const filledStepData = fillEmptyHours(hourlyStepData, startDate, endDate, ['step'])
      // .map(item => ({
      //   ...item,
      //   timestamp: item.timestamp + timezoneOffset
      // }));
      // const filledCalorieData = fillEmptyHours(hourlyCalorieData, startDate, endDate, ['calorie'])
      // .map(item => ({
      //   ...item,
      //   timestamp: item.timestamp + timezoneOffset
      // }));
      // const filledHrvData = fillEmptyHours(hourlyHrvData, startDate, endDate, ['hour_rmssd', 'hour_sdnn'])
      // .map(item => ({
      //   ...item,
      //   timestamp: item.timestamp + timezoneOffset
      // }));

      //console.log('in displayData ; in timeunit hour ; filledBpmData ; ', filledBpmData)

      filteredData = filledBpmData.map((item, index) => ({
        ...item,
        //timestamp: addHours(new Date(item.timestamp), 1).getTime(),
        step: filledStepData[index]?.step ?? 0,
        calorie: filledCalorieData[index]?.calorie ?? 0,
        hour_rmssd: filledHrvData[index]?.hour_rmssd ?? null,
        hour_sdnn: filledHrvData[index]?.hour_sdnn ?? null,
        hour_pred_bpm: predictHourData.find(p => new Date(p.ds).getTime() === item.timestamp)?.hour_pred_bpm ?? null
      }));


    } else {
      
      const allMinutes = eachMinuteOfInterval({ start: normalStartDate, end: normalEndDate });
      const aggregatedCalorieData = aggregateCalorieData(calorieData);
      
      // console.log('!!!!!!!!!!!!!!!!!!!!!!!!! In DisplayData !!!!!!!!!!!!!!!!!!!')
      // console.log(indexedSleepData)
      // //console.log('.....indexedSleepData.find(s => adjustTimestamp >= s.start && adjustTimestamp < s.end)', indexedSleepData.find(s => adjustTimestamp >= s.start && adjustTimestamp < s.end))
      // console.log('!!!!!!!!!!!!!!!!!!!!!!!!! In DisplayData !!!!!!!!!!!!!!!!!!!')

      filteredData = allMinutes.map(minute => {
        //const adjustedAddNineMinute = adjustTimeZoneAddNine(minute);
        const adjustedAddNineMinute = minute;
        const timestamp = minute.getTime();
        const adjustTimestamp = adjustedAddNineMinute.getTime();

        // console.log('!!!!!!!!!!!!!!!!!!!!!!!!! In DisplayData !!!!!!!!!!!!!!!!!!!')
        // console.log(indexedSleepData)
        // console.log('.....indexedSleepData.find(s => adjustTimestamp >= s.start && adjustTimestamp < s.end)', indexedSleepData.find(s => adjustTimestamp >= s.start && adjustTimestamp < s.end))
        // console.log('!!!!!!!!!!!!!!!!!!!!!!!!! In DisplayData !!!!!!!!!!!!!!!!!!!')
  
        const bpmItem = indexedBpmData[adjustTimestamp] ? indexedBpmData[adjustTimestamp][0] : null;
        const stepItem = indexedStepData[adjustTimestamp] ? indexedStepData[adjustTimestamp][0] : null;
        //const calorieItem = indexedCalorieData[adjustTimestamp] ? indexedCalorieData[adjustTimestamp][0] : null;
        const calorieItem = aggregatedCalorieData.find(item => item.timestamp <= timestamp && timestamp < item.timestamp + 15 * 60 * 1000);
        const sleepItem = indexedSleepData.find(s => adjustTimestamp >= s.start && adjustTimestamp < s.end);

        // console.log('##########################')
        // console.log('sleepItem : ', sleepItem)
        // console.log('##########################')
  
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

    //console.log('in displayData, filteredData ; ', filteredData)

    return filteredData;
  }, [timeUnit, dateRange, dateWindow, hourlyBpmData, hourlyStepData, hourlyCalorieData, hourlyHrvData, 
      indexedBpmData, indexedStepData, indexedCalorieData, indexedSleepData, indexedPredictData, 
      predictHourData, fillEmptyHours]);


  const filteredData = useMemo(() => {
    // displayData가 undefined이거나 배열이 아닌 경우 빈 배열 반환

    //console.log('-------? filteredData ;')

    if (!Array.isArray(displayData)) return [];

    //console.log('------------ first if ')
    //console.log('is brushDomain? ', brushDomain)

    // brushDomain이 없으면 전체 displayData 반환
    if (!brushDomain) return displayData;

    //console.log('------------ second if ')

    // brushDomain이 유효한 경우에만 필터링 적용
    if (Array.isArray(brushDomain) && brushDomain.length === 2) {
      //console.log('여기서?')
      return displayData.filter(
        item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
      );
    }



    //console.log('@@@@in filteredData --> displayData ; ', displayData)

    // 기본적으로 전체 displayData 반환
    return displayData;
  }, [displayData, brushDomain]);



  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setDateWindow({
        start: startOfDay(date),
        end: endOfDay(date)
      });
      setDateRange('1');
      setTimeUnit('minute');
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
    if (active && payload && payload.length) {
      //formatInTimeZone(new Date(time), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
      //const date = new Date(label as number);
      const date = new Date(formatInTimeZone(new Date(label as number), 'Asia/Seoul', 'yyyy-MM-dd HH:mm'));
      const currentChart = payload[0].dataKey as string;
  
      // Remove duplicates from payload
      const uniquePayload = payload.filter((item, index, self) =>
        index === self.findIndex((t) => t.dataKey === item.dataKey)
      );
  
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
            {format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00')}
          </p>
          {uniquePayload.map((pld, index) => {
            if (pld.dataKey === currentChart || (currentChart === 'bpm' && (pld.dataKey === 'min_pred_bpm' || pld.dataKey === 'hour_pred_bpm'))) {
              let value = pld.value !== null ? 
                (pld.dataKey === 'step' || pld.dataKey === 'calorie' ? 
                  Number(pld.value).toFixed(0) : 
                  Number(pld.value).toFixed(2)) 
                : 'N/A';
              
              let memoKey = `${pld.dataKey}_${date.getTime()}`;
  
              if (pld.dataKey === 'sleep_stage') {
                const sleepStage = pld.value as number;
                value = getSleepStageLabel(sleepStage);
                const sleepItem = indexedSleepData.find(s => date.getTime() >= s.start && date.getTime() < s.end);
                if (sleepItem) {
                  memoKey = `sleep_${sleepItem.start}`;
                }
              } else if (pld.dataKey === 'calorie') {
                const interval = 15 * 60 * 1000;
                const startOfInterval = Math.floor(date.getTime() / interval) * interval;
                memoKey = `${pld.dataKey}_${startOfInterval}`;
              }
  
              const memo = memos[memoKey];
  
              return (
                <React.Fragment key={`${pld.dataKey}-${index}`}>
                  <p style={{ color: pld.dataKey === 'sleep_stage' ? getSleepStageColor(pld.value as number) : pld.color }}>
                    {pld.dataKey === 'sleep_stage' ? `Sleep Stage: ${value}` : `${pld.name}: ${value}`}
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

  // 메모의 시작 시간과 종료 시간을 파싱하는 함수
// 메모의 시간 범위를 파싱하는 함수
// const parseMemoTimeRange = (memoValue: string): [number, number] | null => {
//   const match = memoValue.match(/(\d{4}) (\d{2}:\d{2}) ~ (\d{2}:\d{2})/);
//   //console.log('$$$$$$$', memoValue, '&&&&&&&', match)
//   if (match) {
//     const [_, dateStr, startTime, endTime] = match;
//     const month = parseInt(dateStr.substring(0, 2)) - 1; // JavaScript의 월은 0-indexed
//     const day = parseInt(dateStr.substring(2, 4));
    
//     const startDate = new Date(2024, month, day);
//     const endDate = new Date(2024, month, day);
    
//     const [startHour, startMinute] = startTime.split(':').map(Number);
//     const [endHour, endMinute] = endTime.split(':').map(Number);
    
//     startDate.setHours(startHour, startMinute, 0, 0);
//     endDate.setHours(endHour, endMinute, 0, 0);
    
//     //console.log(`Parsed memo: Start - ${startDate}, End - ${endDate}`);
//     return [startDate.getTime(), endDate.getTime()];
//   }
//   //console.log(`Failed to parse memo: ${memoValue}`);
//   return null;
// };

  // useEffect(() => {
  //   //console.log('Current memos:', memos);
  // }, [memos]);

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
  
    //console.log('Rendering chart for dataKey:', dataKey);
    //console.log('Display data:', displayData);
    //console.log('Memos:', memos);
  
    // 메모가 있는 sleep 데이터 확인
    //const sleepMemosCount = Object.keys(memos).filter(key => key.startsWith('sleep_')).length;
    //console.log('Number of sleep memos:', sleepMemosCount);


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
            ) : dataKey === 'sleep_stage' ? (
              <>
                {/* Background for sleep stages */}
                {displayData.map((entry, index) => {
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
                      fillOpacity={hasMemo ? 0.5 : 0.2}
                    />
                  );
                })}
                {/* Sleep stage line */}
                <Line
                  type="stepAfter"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
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
              />
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

