import React, { useEffect, useState } from 'react';
import { Calendar } from "@/components/ui/calendar"
import { format, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import styles from './DayPicker.module.css';
import { SidebarSeparator } from './ui/sidebar';
import { Sidebar } from 'lucide-react';

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

const DataAvailabilityCalendar2: React.FC<DataAvailabilityCalendarProps> = ({ countData, selectedUser, heatmapDate }) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);
    const [dateStatuses, setDateStatuses] = useState<{ [key: string]: 'warning' | 'success' }>({});
    const [mounted, setMounted] = useState(false);

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



    // useEffect(() => {
    //     setSelectedDate(undefined);
    //     setSelectedDayData(null);
    // }, [selectedUser]);

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
            const dayData = getDataCountForDate(date);
            setSelectedDayData(dayData);
        } else {
            setSelectedDayData(null);
        }
    };

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
                        return data.bpm > 0 && (data.bpm < 1440 - (1440 * 0.1) || data.calorie < 96 - (96 * 0.1));
                    },
                    success: (date: Date) => {
                        const data = getDataCountForDate(date);
                        return data.bpm > 0 && data.bpm > 1440 - (1440 * 0.1) && data.calorie > 96 - (96 * 0.1);
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

            />
            {/* </div> */}
        {/* <SidebarSeparator className="mx-0 border-b" /> */}
        {selectedDayData && (
            <> 
                    <div className='text-base grid place-items-center'>
                        {selectedDate && format(selectedDate, 'yyyy년 MM월 dd일')}
                    </div>


                    <div className='grid grid-cols-1 gap-2'>
                        <div className='flex justify-between'>
                            <div className='ml-8 text-[16px]'>BPM</div> 
                            <div className='mr-8 text-[16px]'>{selectedDayData.bpm}</div>
                        </div>
                        {/* <div className='mr-8 mb-2 flex justify-end text-[12px]'> /1440</div> */}
                        <div className='flex justify-between'>
                            <div className='ml-8 text-[16px]'>Step</div> 
                            <div className='mr-8 text-[16px]'>{selectedDayData.step}</div>
                        </div>
                        <div className='flex justify-between'>
                            <div className='ml-8 text-[16px]'>Calorie</div> 
                            <div className='mr-8 text-[16px]'>{selectedDayData.calorie}</div>
                        </div>
                        {/* <div className='mr-8 mb-2 flex justify-end text-[12px]'> /96</div> */}
                        <div className='flex justify-between mb-2'>
                            <div className='ml-8 text-[16px]'>Sleep</div> 
                            <div className='mr-8 text-[16px]'>{selectedDayData.sleep}</div>
                        </div>
                    </div>
            </>
        )}
        <SidebarSeparator className="mx-0 border-b" />
        <div></div>
        </>
      );

}

export default DataAvailabilityCalendar2;