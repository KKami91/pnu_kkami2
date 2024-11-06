import React, { useEffect, useState, useCallback } from 'react';
import { Calendar } from "@/components/ui/calendar"
import { format, parse, startOfMonth, startOfDay, endOfDay } from 'date-fns';
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

interface DataAvailabilityCalendarProps {
    countData: DataResult[];
    selectedUser: string;
    heatmapDate: Date | null;
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
  }

interface SleepData {
    timestamp_start: string;
    timestamp_end: string;
    type?: string;
    stage: number;
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
  

const DataAvailabilityCalendar2: React.FC<DataAvailabilityCalendarProps> = ({ countData, selectedUser, heatmapDate }) => {
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
      })
    const [dataCache, setDataCache] = useState<CachedRawData>({});
    const CACHE_DURATION = 10 * 60 * 1000;
    const getCacheKey = useCallback((user: string, date: string) => {
        return `${user}_${date}`;
    }, []);


    const fetchData = async (collection: string, user: string, startDate: Date, endDate: Date) => {
        try {
          console.log('fetch함???')
    
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

    const calculateDateStatus = (date: Date) => {
        const data = getDataCountForDate(date);

        if (data.bpm < 1440 || data.calorie < 96) {
            return 'warning';
        }
        return 'success';
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (heatmapDate && selectedUser) {
            // 멀티차트에 영향을 주지 않고 캘린더 데이터만 업데이트
            setCurrentMonth(startOfMonth(heatmapDate));
            setSelectedDate(heatmapDate);
            const dayData = getDataCountForDate(heatmapDate);
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
            const lastDate = selectedDate || new Date();
            handleDateSelect(lastDate);
        }
    }, [selectedUser]);


    const getDataCountForDate = (date: Date) => {
        const dateString = format(date, 'yyyy-MM-dd');


        const data = {
            bpm: countData.find((d) => d.collection === 'bpm')?.data.find((item) => 
                item._id === dateString
            )?.count || 0,
            step: countData.find((d) => d.collection === 'step')?.data.find((item) => 
                item._id === dateString
            )?.count || 0,
            calorie: countData.find((d) => d.collection === 'calorie')?.data.find((item) => 
                item._id === dateString
            )?.count || 0,
            sleep: countData.find((d) => d.collection === 'sleep')?.data.find((item) => 
                item._id === dateString
            )?.count || 0,
        };

        return data;
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (!selectedUser) {
            return;
        }
        
        setSelectedDate(date);
        if (date) {
            setCurrentMonth(startOfMonth(date));
            const dayData = getDataCountForDate(date);
            setSelectedDayData(dayData);
        } else {
            setSelectedDayData(null);
        }
    };

    const fetchDayData = useCallback(async (user: string, date: string): Promise<AnalyData> => {
        if (!selectedUser) return Promise.resolve({ meanBpm: 0, sumStep: 0, sumCalorie: 0, sumSleep: 0 });

        const cacheKey = getCacheKey(user, date);
        const now = Date.now()

        const cachedData = dataCache[cacheKey];
        let rawData: RawData;
        console.log('in fetchDayData cache ', dataCache)
        console.log('in fetchDayData cachedData ', cachedData)
        console.log('in fetchDayData cacheKey ', cacheKey)
        if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
            console.log('Using cached data for:', date);
            rawData = cachedData;
        } else {
            // 캐시가 없거나 만료된 경우 새로 fetch
            console.log('Fetching new data for:', date);
            const startDate = startOfDay(new Date(date));
            const endDate = endOfDay(new Date(date));

            try {
                const [bpm, step, calorie, sleep] = await Promise.all([
                    fetchData('bpm', user, startDate, endDate),
                    fetchData('step', user, startDate, endDate),
                    fetchData('calorie', user, startDate, endDate),
                    fetchData('sleep', user, startDate, endDate),
                ]);

                // 새로운 데이터를 캐시에 저장
                rawData = {
                    bpm,
                    step,
                    calorie,
                    sleep,
                    timestamp: now
                };

                setDataCache(prevCache => ({
                    ...prevCache,
                    [cacheKey]: rawData
                }));

            } catch (error) {
                console.error('Error fetching day data:', error);
                return { meanBpm: 0, sumStep: 0, sumCalorie: 0, sumSleep: 0 };
            }
        }
        // 캐시된 데이터든 새로운 데이터든 분석 수행
        const calcBpm = rawData.bpm.reduce((sum: number, item: { value: number }) => 
            sum + (item.value || 0), 0) / (rawData.bpm.length || 1);
        
        const calcStep = rawData.step.reduce((sum: number, item: { value: number }) => 
            sum + (item.value || 0), 0);
        
        const calcCalorie = rawData.calorie.reduce((sum: number, item: { value: number }) =>
            sum + (item.value || 0), 0);
        
        const calcSleep = rawData.sleep.reduce((totalMinutes: number, item: SleepData) => {
            if (!item.timestamp_start || !item.timestamp_end) return totalMinutes;
            
            const startTime = new Date(item.timestamp_start);
            const endTime = new Date(item.timestamp_end);
            const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            
            return totalMinutes + durationMinutes;
        }, 0);

        return {
            meanBpm: Number(calcBpm.toFixed(2)),
            sumStep: calcStep,
            sumCalorie: Number(calcCalorie.toFixed(2)),
            sumSleep: Number((calcSleep / 60).toFixed(1)),
        };
    }, [handleDateSelect])

    // 사용자 변경 시 캐시 초기화
    // useEffect(() => {
    //     setDataCache({});
    // }, [selectedUser]);
    
    useEffect(() => {
        console.log('new analysisData - selectedDate', selectedDate)
        console.log('new analysisData - selectedUser', selectedUser)
        if (selectedUser && selectedDate) {
        console.log('---?')
        const selectedDateFormatString = format(selectedDate, 'yyyy-MM-dd')
        const fetchAnalysis = async () => {
            try {
            const data = await fetchDayData(selectedUser, selectedDateFormatString);
            setAnalysisDayData2(data);
            } catch (error) {
            console.error('....', error)
            }
        } 
        fetchAnalysis()
        }
    }, [selectedDate, selectedUser])

    if (!mounted) {
        return (
            <Card className="w-full">
                <CardContent className="min-h-[300px]" />
            </Card>
        );
    }

    return (
        <>
        {/* <div className={styles.calendar}> */}
            <Calendar 
                mode="single"
                selected={selectedDate}
                onSelect={(date: Date) => {
                    handleDateSelect(date);
                }}
                locale={ko}
                className={`p-0 ${styles.calendar}`}
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
                
                <div className='grid grid-cols-1 gap-2'>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>BPM 평균</div>
                        <div className='mr-8 text-[16px]'>{analysisDayData2.meanBpm}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>Step 합계</div>
                        <div className='mr-8 text-[16px]'>{analysisDayData2.sumStep}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>Calorie 합계</div>
                        <div className='mr-8 text-[16px]'>{analysisDayData2.sumCalorie}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>Sleep 합계</div>
                        <div className='mr-8 text-[16px]'>{analysisDayData2.sumSleep} 시간</div>
                    </div>
                </div>
                <SidebarSeparator className="mx-0 border-b" />

                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger className='flex items-center gap-2 w-full justify-center text-[12px] text-white/70 hover:text-white'>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                    데이터 갯수
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

export default DataAvailabilityCalendar2;