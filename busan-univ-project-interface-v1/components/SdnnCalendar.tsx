import React, { useState } from 'react';
import CalendarHeatmap, { ReactCalendarHeatmapValue, Props as CalendarProps } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { startOfYear, endOfYear, format, parseISO } from 'date-fns';

interface HrvDayData {
    ds: string;
    day_rmssd: number;
    day_sdnn: number;
}

interface SdnnCalendarProps {
    hrvDayData: HrvDayData[];
}

const SdnnCalendar: React.FC<SdnnCalendarProps> = ({ hrvDayData }) => {
    // Assuming the data is for the current year. Adjust if needed.
    const [selectedData, setSelectedData] = useState<{ date: string; sdnn: number } | null>(null);
    const currentYear = new Date().getFullYear();
    const startDate = startOfYear(new Date(currentYear, 0, 1));
    const endDate = endOfYear(new Date(currentYear, 11, 31));

    const calendarData: ReactCalendarHeatmapValue<string>[] = hrvDayData.map(item => ({
        date: item.ds.slice(0, 10),
        count: item.day_sdnn
    }));

    const getColorClass = (value: number | null) => {
        if (value === null) return 'color-empty';
        if (value >= 50) return 'color-blue-400';
        if (value >= 30) return 'color-green-400';
        if (value >= 20) return 'color-yellow-400';
        if (value > 0) return 'color-red-400';
        return 'color-empty';
    };

    const getBackgroundColorClass = (value: number | null) => {
        if (value === null) return 'color-empty';
        if (value >= 50) return 'bg-blue-400 text-black py-8 px-24 text-xl rounded-lg';
        if (value >= 30) return 'bg-green-400 text-black py-8 px-24 text-xl rounded-lg';
        if (value >= 20) return 'bg-yellow-400 text-black py-8 px-24 text-xl rounded-lg';
        if (value > 0) return 'bg-red-400 text-black py-8 px-24 text-xl rounded-lg';
        return 'color-empty'; 
    };

    const getHealthy = (value: number | null) => {
        if (value === null) return 'color-empty';
        if (value >= 50) return '건강';
        if (value >= 30) return '정상';
        if (value >= 20) return '관리 필요';
        if (value > 0) return '전문의 상담';
        return 'color-empty'; 
    };

    const handleClick: CalendarProps<string>['onClick'] = (value) => {
        if (value) {
            setSelectedData({ date: value.date, sdnn: value.count });
        }
    };

    return (
        <div className="p-4 bg-gray-900 text-white">
            <h2 className="text-xl font-bold mb-4">Sdnn Calendar Heatmap ({currentYear})</h2>
            <CalendarHeatmap
                startDate={startDate}
                endDate={endDate}
                values={calendarData}
                classForValue={(value) => {
                    if (!value) {
                        return 'color-empty';
                    }
                    // console.log(`Date: ${value.date}, Sdnn: ${value.count}, Class: ${getColorClass(value.count)}`);
                    return getColorClass(value.count);
                }}
                titleForValue={(value) => {
                    if (!value) {
                        return 'No data';
                    }
                    return `Date: ${value.date}, Sdnn: ${value.count.toFixed(2)}`;
                }}
                onClick={handleClick}
                showWeekdayLabels={true}
                gutterSize={1}
            />
            <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-400 mr-2"></div>
                    <span>건강 (50+)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-400 mr-2"></div>
                    <span>정상 (30-50)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-400 mr-2"></div>
                    <span>관리 필요 (20-30)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-400 mr-2"></div>
                    <span>전문의 상담 (0-20)</span>
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 mr-2"></div>
                    <span>데이터 없음</span>
                </div>
            </div>
            {selectedData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    {/* <div className="bg-white text-black p-4 rounded-lg"> */}
                    <div className={getBackgroundColorClass(selectedData.sdnn)}>
                        <h3 className="text-lg font-bold mb-2">SDNN 정보</h3>
                        <p>날짜: {selectedData.date}</p>
                        <p>SDNN: {selectedData.sdnn.toFixed(2)}</p>
                        <p>{getHealthy(selectedData.sdnn)}</p>
                        <button
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => setSelectedData(null)}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
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

export default SdnnCalendar;