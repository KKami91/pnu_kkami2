import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar } from "@/components/ui/calendar"
import { format, parse, startOfMonth, startOfDay, endOfDay, addHours, subHours } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import styles from './DayPicker.module.css';
import { SidebarSeparator } from './ui/sidebar';
import { Sidebar } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import axios from 'axios';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"


interface DataResult {
    collection: string;
    data: { _id: string; count: number }[];
  }

interface DayHrvData {
    ds: string;
    day_rmssd: number;
    day_sdnn: number;
}

interface DataAvailabilityCalendarProps {
    countData: DataResult[];
    selectedUser: string;
    heatmapDate: Date | null;
    hrvDayData: DayHrvData[];
    onDateChange: (date: Date) => void;
    dailyAnalysis: DayAnalysisData[];
}

interface LegendItem {
    color: string;
    label: string;
}

interface DayData {
    bpm: number;
    step: number;
    calorie: number;
    sleep: number;
}

interface AnalyData {
    meanBpm: number;
    sumStep: number;
    sumCalorie: number;
    sumSleep: number;
    sleepQuality: number;
  }

interface SleepData {
    timestamp_start: string;
    timestamp_end: string;
    type?: string;
    value: number;
  }

interface RawData {
bpm: Array<{ value: number; timestamp?: string }>;
step: Array<{ value: number; timestamp?: string }>;
calorie: Array<{ value: number; timestamp?: string }>;
sleep: Array<SleepData>;
timestamp: number;
}

interface CachedRawData {
[key: string]: RawData;  // key는 'userId_yyyy-MM-dd' 형식
}
  

interface DayAnalysisData {
  date: string;
  analysis: AnalyData;
}

const DataAvailabilityCalendar2: React.FC<DataAvailabilityCalendarProps> = ({ 
    countData, 
    selectedUser, 
    heatmapDate, 
    hrvDayData,
    onDateChange,
    dailyAnalysis,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);
    const [isOpen, setIsOpen] = useState(true);
    const [dateStatuses, setDateStatuses] = useState<{ [key: string]: 'warning' | 'success' }>({});
    const [mounted, setMounted] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [analysisDayData2, setAnalysisDayData2] = useState<AnalyData>({
        meanBpm: 0,
        sumStep: 0,
        sumCalorie: 0,
        sumSleep: 0,
        sleepQuality: 0,
      })
    const [dataCache, setDataCache] = useState<CachedRawData>({});
    const CACHE_DURATION = 10 * 60 * 1000;
    const getCacheKey = useCallback((user: string, date: string) => {
        return `${user}_${date}`;
    }, []);
    const [analysisHrvData, setAnalysisHrvData] = useState<DayHrvData[] | null>(null);


    // const fetchData = async (collection: string, user: string, startDate: Date, endDate: Date) => {
    //     try {
    //       //console.log('fetch함???')

    //       console.log('Is in DataCountCalendar2 ... fetchData........... ', user, startDate, endDate)
    
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
    //       //console.log(`In index ${collection} 걸린 시간 : ${fetchEnd - fetchStart} // ${startDate} ~ ${endDate}`)
    //       return response.data;
    //     } catch (error) {
    //       console.error(`Error fetching ${collection} data:`, error);
    //       throw error;
    //     }
    //   };

    // 데이터 조회를 위한 메모이제이션
    const getDataCountForDate = useMemo(() => {
        // countData를 날짜별로 미리 정리
        const dataMap = countData.reduce((acc, collection) => {
            collection.data.forEach(item => {
                if (!acc[item._id]) {
                    acc[item._id] = {};
                }
                acc[item._id][collection.collection] = item.count;
            });
            return acc;
        }, {} as Record<string, Record<string, number>>);

        // 클로저를 통해 dataMap 재사용
        return (date: Date) => {
            const dateString = format(date, 'yyyy-MM-dd');
            const dayData = dataMap[dateString] || {};
            return {
                bpm: dayData.bpm || 0,
                step: dayData.step || 0,
                calorie: dayData.calorie || 0,
                sleep: dayData.sleep || 0,
            };
        };
    }, [countData]);

    // 날짜 상태 계산 메모이제이션
    const calculateDateStatus = useCallback((date: Date) => {
        const data = getDataCountForDate(date);
        if (data.bpm < 1440 || data.calorie < 96) {
            return 'warning';
        }
        return 'success';
    }, [getDataCountForDate]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (heatmapDate && selectedUser) {
            // 멀티차트에 영향을 주지 않고 캘린더 데이터만 업데이트
            setCurrentMonth(startOfMonth(heatmapDate));
            setSelectedDate(heatmapDate);
            const dayData = getDataCountForDate(heatmapDate);
            console.log('??????????????????????????', dayData)
            setSelectedDayData(dayData);
        }
    }, [heatmapDate, selectedUser]);

    useEffect(() => {
        if (!selectedUser || !countData.length) return;

        const statuses: { [key: string]: 'warning' | 'success' } = {};
        const dates = countData[0].data.map(item => parse(item._id, 'yyyy-MM-dd', new Date()));
        
        dates.forEach(date => {
            const dateString = format(date, 'yyyy-MM-dd');
            statuses[dateString] = calculateDateStatus(date);
        });

        setDateStatuses(statuses);
    }, [countData, selectedUser]);

    // 컴포넌트가 처음 마운트될 때 실행
    useEffect(() => {
        if (selectedUser && !selectedDate && !heatmapDate) {
            // const adjustedData = hrvDayData.map(item => ({
            //     ...item,
            //     ds: format(formatInTimeZone(addHours(new Date(item.ds), 9), 'UTC', 'yyyy-MM-dd HH:mm:ssXXX'), 'yyyy-MM-dd')
            // }))
            
            // setAnalysisHrvData(adjustedData)
            
            // // console.log('??aaaaaaaaaaaa?',analysisHrvData)
            // // console.log('??bbbbbbbbbbbbb?',adjustedData)
            const lastDate = selectedDate || new Date();
            handleDateSelect(lastDate);
        }
    }, [selectedUser]);
    
    useEffect(() => {
        if (hrvDayData && hrvDayData.length > 0) {
            const adjustedData = hrvDayData.map(item => ({
                ...item,
                ds: format(formatInTimeZone(addHours(new Date(item.ds), 9), 'UTC', 'yyyy-MM-dd HH:mm:ssXXX'), 'yyyy-MM-dd')
            }));
            
            setAnalysisHrvData(adjustedData);
        }
    }, [hrvDayData, heatmapDate]);

    // useEffect(() => {
    //     console.log('analysisHrvData updated:', analysisHrvData);
    // }, [analysisHrvData]);


    // const getDataCountForDate = (date: Date) => {
    //     const dateString = format(date, 'yyyy-MM-dd');

    //     //console.log('!!!!!!!!!!!!', countData)


    //     const data = {
    //         bpm: countData.find((d) => d.collection === 'bpm')?.data.find((item) => 
    //             item._id === dateString
    //         )?.count || 0,
    //         step: countData.find((d) => d.collection === 'step')?.data.find((item) => 
    //             item._id === dateString
    //         )?.count || 0,
    //         calorie: countData.find((d) => d.collection === 'calorie')?.data.find((item) => 
    //             item._id === dateString
    //         )?.count || 0,
    //         sleep: countData.find((d) => d.collection === 'sleep')?.data.find((item) => 
    //             item._id === dateString
    //         )?.count || 0,
    //     };

    //     // console.log('in getDataCountForDate : ', countData)

    //     return data;
    // };

    // const handleDateSelect = (date: Date | undefined) => {
    // const handleDateSelect = (date: Date) => {
    //     if (!selectedUser) {
    //         return;
    //     }
        
    //     setSelectedDate(date);
    //     onDateChange(date);
    //     if (date) {
    //         setCurrentMonth(startOfMonth(date));
    //         const dayData = getDataCountForDate(date);
    //         setSelectedDayData(dayData);
    //     } else {
    //         setSelectedDayData(null);
    //     }
    // };
        // handleDateSelect 수정
        const handleDateSelect = useCallback((date: Date | undefined) => {
            if (!selectedUser || !date) return;
            
            setSelectedDate(date);
            const dayData = getDataCountForDate(date);
            setSelectedDayData(dayData);
            
            // 부모 컴포넌트에 날짜 변경 알림
            onDateChange(date);
            
            // 기존의 커스텀 이벤트도 유지
            const event = new CustomEvent('dateSelect', {
                detail: { date: format(date, 'yyyy-MM-dd') }
            });
            window.dispatchEvent(event);
        }, [selectedUser, onDateChange]);

    // const fetchDayData = useCallback(async (user: string, date: string): Promise<AnalyData> => {
    //     if (!selectedUser) return Promise.resolve({ meanBpm: 0, sumStep: 0, sumCalorie: 0, sumSleep: 0, sleepQuality: 0 });

    //     const cacheKey = getCacheKey(user, date);
    //     const now = Date.now()

    //     const cachedData = dataCache[cacheKey];
    //     let rawData: RawData;
    //     // console.log('in fetchDayData cache ', dataCache)
    //     // console.log('in fetchDayData cachedData ', cachedData)
    //     // console.log('in fetchDayData cacheKey ', cacheKey)
    //     if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
    //         //console.log('Using cached data for:', date);
    //         rawData = cachedData;
    //     } else {
    //         // 캐시가 없거나 만료된 경우 새로 fetch
    //         //console.log('Fetching new data for:', date);
    //         const startDate = startOfDay(new Date(date));
    //         const endDate = endOfDay(new Date(date));

    //         try {
    //             const [bpm, step, calorie, sleep] = await Promise.all([
    //                 fetchData('bpm', user, startDate, endDate),
    //                 fetchData('step', user, startDate, endDate),
    //                 fetchData('calorie', user, startDate, endDate),
    //                 fetchData('sleep', user, subHours(startDate, 12), subHours(endDate, 12)),
    //             ]);

    //             console.log('fetchDayData fetch 이후 sleep Data : ', sleep)

    //             // 새로운 데이터를 캐시에 저장
    //             rawData = {
    //                 bpm,
    //                 step,
    //                 calorie,
    //                 sleep,
    //                 timestamp: now
    //             };

    //             setDataCache(prevCache => ({
    //                 ...prevCache,
    //                 [cacheKey]: rawData
    //             }));

    //         } catch (error) {
    //             console.error('Error fetching day data:', error);
    //             return { meanBpm: 0, sumStep: 0, sumCalorie: 0, sumSleep: 0, sleepQuality: 0 };
    //         }
    //     }
    //     // 캐시된 데이터든 새로운 데이터든 분석 수행
    //     const calcBpm = rawData.bpm.reduce((sum: number, item: { value: number }) => 
    //         sum + (item.value || 0), 0) / (rawData.bpm.length || 1);
        
    //     const calcStep = rawData.step.reduce((sum: number, item: { value: number }) => 
    //         sum + (item.value || 0), 0);
        
    //     const calcCalorie = rawData.calorie.reduce((sum: number, item: { value: number }) =>
    //         sum + (item.value || 0), 0);
        
    //     //console.log('수면 raw data : ',rawData.sleep)
    //     const calcSleep = rawData.sleep.reduce((totalMinutes: number, item: SleepData) => {
    //         if (!item.timestamp_start || !item.timestamp_end) return totalMinutes;
            
    //         const startTime = new Date(item.timestamp_start);
    //         const endTime = new Date(item.timestamp_end);
    //         const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            
    //         return totalMinutes + durationMinutes;
    //     }, 0);

    //     const totalAwakeMinutes = rawData.sleep.reduce((totalMinutes: number, item: SleepData) => {
    //         if (!item.timestamp_start || !item.timestamp_end) return totalMinutes;

    //         let awakeStartTime: Date | null = null;
    //         let awakeEndTime: Date | null = null;

    //         if (item.value === 1) {
    //             awakeStartTime = new Date(item.timestamp_start);
    //             awakeEndTime = new Date(item.timestamp_end);
    //         }

    //         const awakeDurationMinutes = awakeStartTime && awakeEndTime ? (awakeEndTime.getTime() - awakeStartTime.getTime()) / (1000 * 60) : 0;

    //         return totalMinutes + awakeDurationMinutes;
    //     }, 0)

    //     //console.log('이 날짜의 뒤척인 시간 ? ', totalAwakeMinutes)
    //     //console.log('이 날짜의 총 수면 시간 : ', calcSleep)

    //     const calcSleepQuality = ((calcSleep - totalAwakeMinutes)/calcSleep) * 100

    //     console.log('@@@@@@@@@@@ : ',rawData.step)

    //     return {
    //         meanBpm: Number(calcBpm.toFixed(2)),
    //         sumStep: calcStep,
    //         sumCalorie: Number(calcCalorie.toFixed(2)),
    //         sumSleep: Number((calcSleep / 60).toFixed(1)),
    //         sleepQuality: Number(calcSleepQuality.toFixed(2))
    //     };
    // }, [handleDateSelect])

    // 사용자 변경 시 캐시 초기화
    // useEffect(() => {
    //     setDataCache({});
    // }, [selectedUser]);
    
    // useEffect(() => {
    //     // console.log('new analysisData - selectedDate', selectedDate)
    //     // console.log('new analysisData - selectedUser', selectedUser)
    //     if (selectedUser && selectedDate) {
    //     //console.log('---?')
    //     const selectedDateFormatString = format(selectedDate, 'yyyy-MM-dd')
    //     const fetchAnalysis = async () => {
    //         try {
    //             const DataCountFetchDataStartTime = performance.now()
    //             const data = await fetchDayData(selectedUser, selectedDateFormatString);
    //             const DataCountFetchDataEndTime = performance.now()
    //             console.log('In DataCountCalendar - fetchData 걸린 시간 : ', DataCountFetchDataEndTime - DataCountFetchDataStartTime)
    //             setAnalysisDayData2(data);
    //         } catch (error) {
    //             console.error('....', error)
    //         }
    //     } 
    //     fetchAnalysis()
    //     }
    // }, [selectedDate, selectedUser])

    // 분석 데이터 계산 메모이제이션
    const analyzeData = useMemo(() => {
        if (!selectedDate || !selectedUser) return null;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return dailyAnalysis.find(item => item.date === dateStr)?.analysis || null;
    }, [selectedDate, selectedUser, dailyAnalysis]);

    // 분석 데이터 표시 컴포넌트
    const AnalysisDisplay = React.memo(({ data }: { data: AnalyData }) => (
        <div className='grid grid-cols-1 gap-2'>
            <div className='flex justify-between'>
                <div className='ml-8 text-[16px]'>BPM 평균</div>
                <div className='mr-8 text-[16px]'>{data.meanBpm.toFixed(2)}</div>
            </div>
            <div className='flex justify-between'>
                <div className='ml-8 text-[16px]'>Step 합계</div>
                <div className='mr-8 text-[16px]'>{data.sumStep}</div>
            </div>
            <div className='flex justify-between'>
                <div className='ml-8 text-[16px]'>Calorie 합계</div>
                <div className='mr-8 text-[16px]'>{data.sumCalorie.toFixed(2)}</div>
            </div>
            <div className='flex justify-between'>
                <div className='ml-8 text-[16px]'>Sleep 합계</div>
                <div className='mr-8 text-[16px]'>{data.sumSleep} 시간</div>
            </div>
            <div className='flex justify-between'>
                <div className='ml-8 text-[16px]'>Sleep Quality</div>
                <div className='mr-8 text-[16px]'>{data.sleepQuality || 0} 점</div>
            </div>
            <div className='flex justify-between'>
                <div className='ml-8 text-[16px]'>RMSSD</div>
                <div className='mr-8 text-[16px]'>{analysisHrvData?.find(data => data.ds === selectedDateString)?.day_rmssd?.toFixed(2) || '0'}</div>
            </div>
            <div className='flex justify-between'>

                
                <div className='ml-8 text-[16px]'>SDNN</div>
                <div className='mr-8 text-[16px]'>{analysisHrvData?.find(data => data.ds === selectedDateString)?.day_sdnn?.toFixed(2) || '0'}</div>
            </div>
        </div>
    ));
    AnalysisDisplay.displayName = 'AnalysisDisplay'; 
    

    if (!mounted) {
        return (
            <Card className="w-full">
                <CardContent className="min-h-[300px]" />
            </Card>
        );
    }

    const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    return (
        <>
        {/* <div className={styles.calendar}> */}
            <Calendar 
                mode="single"
                selected={selectedDate}
                // onSelect={(date: Date) => {
                //     handleDateSelect(date);
                // }}
                onSelect={handleDateSelect}
                locale={ko}
                className={`p-0 flex items-center ${styles.calendar}`}
                modifiers={{
                    warning: (date: Date) => {
                        const data = getDataCountForDate(date);
                        const hasAnyData = data.bpm > 0 || data.step > 0 || data.calorie > 0 || data.sleep > 0;
                        return hasAnyData && data.bpm >= 0 && (data.bpm < 1440 - 60 || data.calorie < 96 - 4);
                    },
                    success: (date: Date) => {
                        const data = getDataCountForDate(date);
                        return data.bpm >= 0 && data.bpm > 1440 - 60 && data.calorie > 96 - 4;
                    }
                }}

                modifiersClassNames={{
                    warning: "[&]:after:absolute [&]:after:content-[''] [&]:after:w-1 [&]:after:h-1 [&]:after:bg-red-500 [&]:after:rounded-full [&]:after:bottom-[0.25rem] [&]:after:left-1/2 [&]:after:-translate-x-1/2 [&[aria-selected]]:after:bottom-[0.15rem]",
                    success: "[&]:after:absolute [&]:after:content-[''] [&]:after:w-1 [&]:after:h-1 [&]:after:bg-green-500 [&]:after:rounded-full [&]:after:bottom-[0.25rem] [&]:after:left-1/2 [&]:after:-translate-x-1/2 [&[aria-selected]]:after:bottom-[0.15rem]"
                }}
                classNames={{
                    day: "relative h-9 w-9 p-0 hover:bg-accent aria-selected:bg-transparent aria-selected:border-2 aria-selected:border-blue-500",
                    day_today: "font-bold",
                }}

                styles={{
                    day: {
                        position: 'relative'
                    }
                }}

                disabled={(date: Date) => {
                    const data = getDataCountForDate(date);
                    return data.bpm === 0 && data.step === 0 && data.calorie === 0 && data.sleep === 0;
                }}
                
                month={currentMonth}
                onMonthChange={setCurrentMonth}

            />
            {/* </div> */}
        <SidebarSeparator className="mx-0 border-b" />
        {selectedDayData && (
            <>                 
            <div className='text-base grid place-items-center'>
                {selectedDate && format(selectedDate, 'yyyy년 MM월 dd일')}
            </div>
            
                
                {analyzeData && <AnalysisDisplay data={analyzeData} />}
                <SidebarSeparator className="mx-0 border-b" />

                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger className='flex items-center gap-2 w-full justify-center text-[12px] text-white/70 hover:text-white'>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                    데이터 개수
                    </CollapsibleTrigger>
                    <CollapsibleContent className='space-y-2 pt-2'>
                    <div className='grid grid-cols-1 gap-2'>
                        <div className='flex justify-between'>
                            <div className='ml-8 text-[16px]'>BPM</div>
                            <div className={`mr-8 text-[16px] ${selectedDayData.bpm < 1440 - 60 ? 'text-red-500' : ''}`}>{selectedDayData.bpm} 개</div>
                        </div>
                        <div className='flex justify-between'>
                            <div className='ml-8 text-[16px]'>Step</div> 
                            <div className='mr-8 text-[16px]'>{selectedDayData.step} 개</div>
                        </div>
                        <div className='flex justify-between'>
                            <div className='ml-8 text-[16px]'>Calorie</div> 
                            <div className={`mr-8 text-[16px] ${selectedDayData.calorie < 96 - 4 ? 'text-red-500' : ''}`}>{selectedDayData.calorie} 개</div>
                        </div>
                        {/* <div className='mr-8 mb-2 flex justify-end text-[12px]'> /96</div> */}
                        <div className='flex justify-between mb-2'>
                            <div className='ml-8 text-[16px]'>Sleep</div> 
                            <div className='mr-8 text-[16px]'>{selectedDayData.sleep} 개</div>
                        </div>
                    </div>  
                    </CollapsibleContent>
                </Collapsible>

            </>
        )}

        <div></div>
        </>
      );

}
DataAvailabilityCalendar2.displayName = 'DataAvailabilityCalendar2';
export default DataAvailabilityCalendar2;