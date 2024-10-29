import React from 'react';
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
  const getDataCountForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
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

  const hasWarning = (type: 'bpm' | 'calorie', value: number) => {
    if (type === 'bpm') return value < 1440 - 60;
    if (type === 'calorie') return value < 96 - 4;
    return false;
  };

  const events = React.useMemo(() => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const events = [];

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
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
        <span className="font-medium">{value}</span>
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

  return (
    <Card className="w-[850px]">
      <CardHeader>
        <CardTitle>Data Availability (BPM/Steps/Calories/Sleep)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.calendarWrapper}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 800 }}
          views={['month']}
          defaultView={Views.MONTH}
          eventPropGetter={eventStyleGetter}
          components={components}
          messages={{
            next: "▶",
            previous: "◀",
            today: "오늘",
          }}
        />
        </div>
        <div className="mt-4 flex justify-center space-x-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-sm">BPM</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span className="text-sm">Steps</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span className="text-sm">Calories</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span className="text-sm">Sleep</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataAvailabilityCalendar;

