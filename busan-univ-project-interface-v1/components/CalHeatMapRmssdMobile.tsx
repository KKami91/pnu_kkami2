import React, { useEffect, useRef, useState } from 'react';
import CalHeatmap from 'cal-heatmap';
import 'cal-heatmap/cal-heatmap.css';
import { addDays, parseISO, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz';

interface HrvDayData {
    ds: string;
    day_rmssd: number;
}

interface RmssdCalHeatmapProps {
    hrvDayData: HrvDayData[];
}

interface ICalHeatmap {
    paint: (options: any) => void;
    on: (event: string, callback: (event: any) => void) => void;
    previous: () => void;
    next: () => void;
}

interface CalHeatmapData {
    t: number;
    v: number | null;
}

const RmssdCalHeatmap: React.FC<RmssdCalHeatmapProps> = ({ hrvDayData }) => {
    const calendarEl = useRef<HTMLDivElement>(null);
    const [cal, setCal] = useState<ICalHeatmap | null>(null);
    const [selectedData, setSelectedData] = useState<{ date: Date; rmssd: number | null } | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (calendarEl.current && hrvDayData.length > 0) {
            const newCal = new CalHeatmap() as ICalHeatmap;

            const adjustedData = hrvDayData.map(item => ({
                ...item,
                //ds: addDays(new Date(item.ds), 1).toISOString().split('T')[0]
                ds: format(parseISO(item.ds), 'yyyy-MM-dd')
            }));

            console.log(new Date(adjustedData[0].ds))


            newCal.paint({
                data: {
                    source: adjustedData,
                    x: 'ds',
                    y: 'day_rmssd',
                },
                date: {
                    start: new Date(adjustedData[0].ds),
                    
                },
                range: 1,
                domain: {
                    type: 'month',
                    padding: [10, 10, 10, 10],
                    label: { 
                        position: 'top',
                        text: (timestamp: number) => {
                            const date = new Date(formatInTimeZone(new Date(timestamp).getTime(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm'));
                            return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
                        },
                        offset: { x: 0, y: -10 }
                    }
                },
                subDomain: { type: 'xDay', radius: 2, width: 25, height: 25, label: 'D' },
                scale: {
                    color: {
                        type: 'threshold',
                        range: ['#f87171', '#fbbf24', '#4ade80', '#60a5fa'],
                        domain: [10, 20, 40],
                    }
                },
                itemSelector: calendarEl.current,
            });

            // 스타일 조정을 위한 CSS 추가
            const style = document.createElement('style');
            style.textContent = `
                .ch-domain-text {
                    font-size: 16px !important;
                    font-weight: bold !important;
                }
                .ch-subdomain-text {
                    font-size: 12px !important;
                }
            `;
            document.head.appendChild(style);

            newCal.on('click', (event: any) => {
                console.log('Click event:', event);
                if (event && event.target && (event.target as any).__data__) {
                    const data = (event.target as any).__data__ as CalHeatmapData;
                    if (data.v !== null) {
                        const date = new Date(formatInTimeZone(data.t as number, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'));
                        const rmssd = data.v;

                        setSelectedData({ date, rmssd });
                        setShowModal(true);
                    }
                }
            });

            setCal(newCal);
        }
    }, [hrvDayData]);

    const handlePrevious = () => {
        cal?.previous();
    };

    const handleNext = () => {
        cal?.next();
    };

    const getHealthStatus = (value: number | null) => {
        if (value === null) return '데이터 없음';
        if (value >= 40) return '건강';
        if (value >= 20) return '정상';
        if (value >= 10) return '관리 필요';
        return '전문의 상담';
    };

    const getBackgroundColorClass = (value: number | null) => {
        if (value === null) return 'bg-gray-400';
        if (value >= 40) return 'bg-blue-400';
        if (value >= 20) return 'bg-green-400';
        if (value >= 10) return 'bg-yellow-400';
        return 'bg-red-400';
    };

    return (
        <div className="p-4 bg-white text-black">
            <h2 className="text-xl font-bold mb-4">스트레스 지수</h2>
            <div className="flex justify-between mb-4">
                <button onClick={handlePrevious} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Previous
                </button>
                <button onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Next
                </button>
            </div>
            <div className="flex justify-center" ref={calendarEl}></div>
            <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center flex-col mr-2">
                    <span className='text-[18px]'>건강</span>
                    <div className="w-4 h-4 bg-blue-400 mt-2"></div>
                </div>
                <div className="flex items-center flex-col mr-2">
                    <span className='text-[18px]'>정상</span>
                    <div className="w-4 h-4 bg-green-400 mt-2"></div>
                </div>
                <div className="flex items-center flex-col">
                    <span className='text-[18px]'>관리 필요</span>
                    <div className="w-4 h-4 bg-yellow-400 mt-2"></div>
                </div>
                <div className="flex items-center flex-col">
                    <span className='text-[18px]'>전문의 상담</span>
                    <div className="w-4 h-4 bg-red-400 mt-2"></div>
                </div>
                {/* <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-400 mr-2"></div>
                    <span>없음</span>
                </div> */}
            </div>

            {showModal && selectedData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className={`${getBackgroundColorClass(selectedData.rmssd)} text-black p-8 rounded-lg`}>
                        <h3 className="text-2xl font-bold mb-4">스트레스 지수</h3>
                        <p className="mb-2">날짜: {selectedData.date.toLocaleDateString()}</p>
                        <p className="mb-2">스트레스 지수: {selectedData.rmssd !== null ? selectedData.rmssd.toFixed(2) : '데이터 없음'}</p>
                        <p className="mb-4">{getHealthStatus(selectedData.rmssd)}</p>
                        <button
                            className="mt-4 bg-gray-800 text-white px-4 py-2 rounded"
                            onClick={() => setShowModal(false)}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RmssdCalHeatmap;