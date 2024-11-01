import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './BigCalendar.module.css'


interface DataResult {
  collection: string;
  data: { _id: string; count: number }[];
}

const locales = {
  'ko': ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface DataAvailabilityCalendarProps {
  countData: DataResult[];
}


const DataAvailabilityCalendar: React.FC<DataAvailabilityCalendarProps> = ({ countData }) => {
  const [calendarHeight, setCalendarHeight] = useState(800);

  // 창 크기 변경 감지 및 캘린더 높이 조정
  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector('.sidebar-content');
      if (sidebar) {
        const sidebarHeight = sidebar.clientHeight;
        const newHeight = Math.max(400, sidebarHeight - 200); // 최소 높이 400px 보장
        setCalendarHeight(newHeight);
      }
    };

    handleResize(); // 초기 실행
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // const [startDate, setStartDate] = useState<any>(null);
  // const [endDate, setEndDate] = useState<any>(null);
  const getDataCountForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');

    // console.log('in DataCountCalendar ;', countData[0].data.)

    // setStartDate(countData[0])
    
    return {
      bpm: countData.find((d) => d.collection === 'bpm')?.data.find((item) => 
        format(parseISO(item._id), 'yyyy-MM-dd') === dateString
      )?.count || 0,
      step: countData.find((d) => d.collection === 'step')?.data.find((item) => 
        format(parseISO(item._id), 'yyyy-MM-dd') === dateString
      )?.count || 0,
      calorie: countData.find((d) => d.collection === 'calorie')?.data.find((item) => 
        format(parseISO(item._id), 'yyyy-MM-dd') === dateString
      )?.count || 0,
      sleep: countData.find((d) => d.collection === 'sleep')?.data.find((item) => 
        format(parseISO(item._id), 'yyyy-MM-dd') === dateString
      )?.count || 0,
    };
  };

  // const hasWarning = (type: 'bpm' | 'calorie', value: number) => {
  //   if (type === 'bpm') return value < 1440 - 60;
  //   if (type === 'calorie') return value < 96 - 4;
  //   return false;
  // };

  // console.log('%%%%%%%%%%%%%%%%')
  // console.log(getDataCountForDate)
  // console.log('%%%%%%%%%%%%%%%%')

  const getDateRange = React.useMemo(() => {
    const allDates = countData.flatMap(collection => 
      collection.data.map(item => new Date(item._id).getTime())
    );

    if (allDates.length === 0) {
      // 데이터가 없는 경우 현재 달을 기준으로 범위 설정
      const today = new Date();
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
      };
    }

    return {
      start: new Date(Math.min(...allDates)),
      end: new Date(Math.max(...allDates))
    };
  }, [countData]);

  const events = React.useMemo(() => {
    const today = new Date();
    // const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    // const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const { start, end } = getDateRange;
    const events = [];

    //console.log(startDate, endDate)

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const counts = getDataCountForDate(new Date(date));
      if (Object.values(counts).some(count => count > 0)) {
        events.push({
          id: format(date, 'yyyy-MM-dd'),
          title: '',
          start: new Date(date),
          end: new Date(date),
          allDay: true,
          counts,
        });
      }
    }
    return events;
  }, [countData]);

  const eventStyleGetter = () => ({
    style: {
      backgroundColor: 'transparent',
      border: 'none',
      margin: '0',
      padding: '0',
    },
  });

  const DataBox = ({ 
    label, 
    value, 
    warningThreshold,
    type
  }: { 
    label: string; 
    value: number; 
    warningThreshold?: number;
    type: 'bpm' | 'step' | 'calorie' | 'sleep';
  }) => {
    const needsWarning = warningThreshold ? value < warningThreshold : false;
    
    const getBackgroundColor = () => {
      switch(type) {
        case 'bpm':
          //return needsWarning ? 'bg-red-200' : 'bg-blue-200';
          return 'bg-gray-400';
        case 'step':
          return 'bg-green-400';
        case 'calorie':
          //return needsWarning ? 'bg-red-200' : 'bg-yellow-200';
          return 'bg-yellow-400';
        case 'sleep':
          return 'bg-blue-400';
        default:
          return 'bg-gray-400';
      }
    };

    return (
      <div className={`px-1.5 py-0.5 rounded-md ${getBackgroundColor()} text-xs flex items-center justify-between gap-1`}>
        <span className="font-bold">{value}</span>
        {needsWarning && <AlertCircle className="h-4 w-4 text-red-800 " />}
      </div>
    );
  };

  const components = {
    event: ({ event }: { event: any }) => {
      const counts = event.counts;
      
      return (
        <div className="grid grid-rows-4 gap-1 p-1 text-black">
          <DataBox 
            label="BPM" 
            value={counts.bpm} 
            warningThreshold={1440 - 60}
            type="bpm"
          />
          <DataBox 
            label="Steps" 
            value={counts.step}
            type="step"
          />
          <DataBox 
            label="Calories" 
            value={counts.calorie} 
            warningThreshold={96 - 4}
            type="calorie"
          />
          <DataBox 
            label="Sleep" 
            value={counts.sleep}
            type="sleep"
          />
        </div>
      );
    },
  };

  // 높이 설정 useEffect 추가
  useEffect(() => {
    const cells = document.querySelectorAll('.rbc-month-row');
    cells.forEach(cell => {
      (cell as HTMLElement).style.height = '250px'; // 원하는 높이로 설정
    });
  }, [events]);

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Data Availability</CardTitle>
      </CardHeader>
      <CardContent>
        {/* <div className={`${styles.calendarWrapper} overflow-hidden`}> */}
        <div className={styles.calendarWrapper}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ 
              height: calendarHeight,
              minHeight: '400px',
              maxHeight: '800px'
            }}
            views={['month']}
            defaultView={Views.MONTH}
            eventPropGetter={eventStyleGetter}
            components={components}
            messages={{
              next: "▶",
              previous: "◀",
              today: "Today",
            }}
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span className="text-xs">BPM</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span className="text-xs">Steps</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span className="text-xs">Calories</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span className="text-xs">Sleep</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataAvailabilityCalendar;

