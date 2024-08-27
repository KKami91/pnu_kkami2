import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { startOfYear, endOfYear, format, parseISO } from 'date-fns';

interface HrvDayData {
    ds: string;
    day_rmssd: number;
    day_sdnn: number;
}

interface RmssdCalendarProps {
    hrvDayData: HrvDayData[];
}

const RmssdCalendar: React.FC<RmssdCalendarProps> = ({ hrvDayData }) => {
    // Assuming the data is for the current year. Adjust if needed.
    const currentYear = new Date().getFullYear();
    const startDate = startOfYear(new Date(currentYear, 0, 1));
    const endDate = endOfYear(new Date(currentYear, 11, 31));

    const calendarData = hrvDayData.map(item => ({
        date: item.ds.slice(0, 10),
        count: item.day_rmssd
    }));

    const getColorClass = (value: number | null) => {
        if (value === null) return 'color-empty';
        if (value >= 40) return 'color-blue-400';
        if (value >= 20) return 'color-green-400';
        if (value >= 10) return 'color-yellow-400';
        if (value > 0) return 'color-red-400';
        return 'color-empty';
    };

    console.log('Calendar Data:', calendarData);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    return (
        <div className="p-4 bg-gray-900 text-white">
            <h2 className="text-xl font-bold mb-4">RMSSD Calendar Heatmap ({currentYear})</h2>
            <CalendarHeatmap
                startDate={startDate}
                endDate={endDate}
                values={calendarData}
                classForValue={(value) => {
                    if (!value) {
                        return 'color-empty';
                    }
                    console.log(`Date: ${value.date}, RMSSD: ${value.count}, Class: ${getColorClass(value.count)}`);
                    return getColorClass(value.count);
                }}
                titleForValue={(value) => {
                    if (!value) {
                        return 'No data';
                    }
                    return `Date: ${value.date}, RMSSD: ${value.count.toFixed(2)}`;
                }}
                showWeekdayLabels={true}
                gutterSize={1}
            />
            <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-400 mr-2"></div>
                    <span>건강 (40+)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-400 mr-2"></div>
                    <span>정상 (20-40)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-400 mr-2"></div>
                    <span>관리 필요 (10-20)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-400 mr-2"></div>
                    <span>전문의 상담 (0-10)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 mr-2"></div>
                    <span>데이터 없음</span>
                </div>
            </div>
            <style jsx global>{`
                .react-calendar-heatmap .color-empty { fill: #e5e7eb; }
                .react-calendar-heatmap .color-blue-400 { fill: #60a5fa; }
                .react-calendar-heatmap .color-green-400 { fill: #4ade80; }
                .react-calendar-heatmap .color-yellow-400 { fill: #fbbf24; }
                .react-calendar-heatmap .color-red-400 { fill: #f87171; }
                .react-calendar-heatmap text {
                    font-size: 10px;
                    fill: #e5e7eb;
                }
                .react-calendar-heatmap rect:hover {
                    stroke: #ffffff;
                    stroke-width: 1px;
                }
            `}</style>
        </div>
    );
};

export default RmssdCalendar;