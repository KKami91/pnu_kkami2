import React, { useEffect, useRef, useState } from 'react';
import CalHeatmap from 'cal-heatmap';
import 'cal-heatmap/cal-heatmap.css';
import { addHours, addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz';

interface HrvDayData {
    ds: string;
    day_sdnn: number;
}

interface SdnnCalHeatmapProps {
    hrvDayData: HrvDayData[];
    startDate: Date;
}

interface ICalHeatmap {
    paint: (options: any) => void;
    on: (event: string, callback: (event: any) => void) => void;
    previous: () => void;
    next: () => void;
    destroy: () => void;
}

interface CalHeatmapData {
    t: number;
    v: number | null;
}

const DATE_SELECT_EVENT = 'dateSelect';

const SdnnCalHeatmap: React.FC<SdnnCalHeatmapProps> = ({ hrvDayData, startDate }) => {
    const calendarEl = useRef<HTMLDivElement>(null);
    const [cal, setCal] = useState<ICalHeatmap | null>(null);
    const [selectedData, setSelectedData] = useState<{ date: Date; sdnn: number | null } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [range, setRange] = useState(1);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; date: Date; sdnn: number | null } | null>(null);

    const timezoneOffset = new Date().getTimezoneOffset();
    const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1;

    const updateRange = () => {
        //console.log(window)
        // if (window.matchMedia('(min-width: 2160px)').matches) {
        //     setRange(5)
        // } else if (window.matchMedia('(min-width: 1536px)').matches) {
        //     setRange(4);  // 2xl
        // } else if (window.matchMedia('(min-width: 1280px)').matches) {
        //     setRange(3);  // xl
        // } else if (window.matchMedia('(min-width: 1024px)').matches) {
        //     setRange(2);  // lg
        // } else {
        //     setRange(1);  // md and smaller
        // }
        if (window.matchMedia('(min-width: 1720px)').matches) {
            
            setRange(4);  
        } else if (window.matchMedia('(min-width: 1280px)').matches) {
            
            setRange(3);  
        } else if (window.matchMedia('(min-width: 1024px)').matches) {
            
            setRange(2);  
        } else if (window.matchMedia('(min-width: 900px)').matches) {
            setRange(1);  
        } else {
            setRange(0);
        }
    };

    useEffect(() => {
        updateRange();
        window.addEventListener('resize', updateRange);
        return () => window.removeEventListener('resize', updateRange);
    }, []);

    useEffect(() => {
        if (calendarEl.current && hrvDayData.length > 0) {
            //const newCal = new CalHeatmap() as ICalHeatmap;

            if (cal) {
                cal.destroy();
            }

            const newCal = new CalHeatmap() as ICalHeatmap;

            const adjustedData = hrvDayData.map(item => ({
                ...item,
                //ds: addDays(new Date(item.ds), 1).toISOString().split('T')[0]
                //ds: new Date(new Date(item.ds).getTime() + offsetMs).toISOString().split('T')[0]
                //ds: format(parseISO(item.ds), 'yyyy-MM-dd')
                ds: format(formatInTimeZone(addHours(new Date(item.ds), 9), 'UTC', 'yyyy-MM-dd HH:mm:ssXXX'), 'yyyy-MM-dd')
            }));

            newCal.paint({
                data: {
                    source: adjustedData,
                    x: 'ds',
                    y: 'day_sdnn',
                },
                date: {
                    //start: new Date(adjustedData[0].ds),
                    start: startDate,
                },
                range: range,
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
                    font-size: 18px !important;
                    font-weight: bold !important;
                }
                .ch-subdomain-text {
                    font-size: 12px !important;
                }
                .cal-heatmap-container {
                    display: flex;
                    justify-content: center;
                    margin: 0 auto;
                }
            `;
            document.head.appendChild(style);

            newCal.on('click', (event: any) => {
                console.log('Click event:', event);
                if (event && event.target && (event.target as any).__data__) {
                    const data = (event.target as any).__data__ as CalHeatmapData;
                    if (data.v !== null) {
                        const date = new Date(data.t);
                        const sdnn = data.v;
                        
                        setSelectedData({ date, sdnn });
                        //setShowModal(true);


                        const customEvent = new CustomEvent(DATE_SELECT_EVENT, {
                            detail: { date, sdnn }
                        });
                        window.dispatchEvent(customEvent)

                    } else {
                        // 데이터가 없는 경우 처리
                        //console.log('No data available for this date');
                        // 선택적: 사용자에게 알림 표시
                        //alert('이 날짜에 대한 데이터가 없습니다.');
                    }
                }
            });

            newCal.on('mouseover', (event: any) => {
                if (event && event.target && (event.target as any).__data__ && (event.target as any).__data__.v !== null) {
                    const data = (event.target as any).__data__ as CalHeatmapData;
                    const date = new Date(formatInTimeZone(data.t as number, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'));
                    const sdnn = data.v;
                    const rect = event.target.getBoundingClientRect();
                    
                    setTooltip({ 
                        x: rect.left + window.scrollX, 
                        y: rect.top + window.scrollY, 
                        date, 
                        sdnn 
                    });
                } else {
                    setTooltip(null);
                }
            });

            newCal.on('mouseout', () => {
                setTooltip(null);
            });

            setCal(newCal);
        }
    }, [hrvDayData, range, startDate]);

    const handlePrevious = () => {
        cal?.previous();
    };

    const handleNext = () => {
        cal?.next();
    };

    const getHealthStatus = (value: number | null) => {
        if (value === null) return '데이터 없음';
        if (value >= 50) return '건강';
        if (value >= 30) return '정상';
        if (value >= 20) return '관리 필요';
        return '전문의 상담';
    };

    const getBackgroundColorClass = (value: number | null) => {
        if (value === null) return 'bg-gray-400';
        if (value >= 50) return 'bg-blue-400';
        if (value >= 30) return 'bg-green-400';
        if (value >= 20) return 'bg-yellow-400';
        return 'bg-red-400';
    };

    return (
        <div className="p-4 bg-gray-900 text-white">
            <h2 className="text-xl font-bold mb-4">Daily SDNN</h2>
            {/* <div className="flex justify-between mb-4">
                <button onClick={handlePrevious} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Previous
                </button>
                <button onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Next
                </button>
            </div> */}
            {tooltip && (
                <div
                    style={{
                        position: 'fixed',
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y - 40}px`,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '5px',
                        borderRadius: '5px',
                        zIndex: 1000,
                        pointerEvents: 'none',
                    }}
                >
                    <p>{format(tooltip.date, 'yyyy-MM-dd')}</p>
                    <p>SDNN: {tooltip.sdnn !== null ? tooltip.sdnn.toFixed(2) : 'N/A'}</p>
                </div>
            )}
            <div className="flex justify-center" ref={calendarEl} style={{ height: '200px', width: '100%' }}></div>
            <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center flex-col mr-2">
                    <span>건강 (50+)</span>
                    <div className="w-4 h-4 bg-blue-400 mt-2"></div>
                    
                </div>
                <div className="flex items-center flex-col mr-2">
                    <span>정상 (30-50)</span>
                    <div className="w-4 h-4 bg-green-400 mt-2"></div>
                    
                </div>
                <div className="flex items-center flex-col">
                    <span>관리 필요 (20-30)</span>
                    <div className="w-4 h-4 bg-yellow-400 mt-2"></div>
                    
                </div>
                <div className="flex items-center flex-col">
                    <span>전문의 상담 (0-10)</span>
                    <div className="w-4 h-4 bg-red-400 mt-2"></div>
                    
                </div>
                <div className="flex items-center flex-col">
                    <span>데이터 없음</span>
                    <div className="w-4 h-4 bg-gray-400 mt-2"></div>
                    
                </div>
            </div>

            {/* {showModal && selectedData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className={`${getBackgroundColorClass(selectedData.sdnn)} text-black p-8 rounded-lg`}>
                        <h3 className="text-2xl font-bold mb-4">SDNN 정보</h3>
                        <p className="mb-2">날짜: {selectedData.date.toLocaleDateString()}</p>
                        <p className="mb-2">SDNN: {selectedData.sdnn !== null ? selectedData.sdnn.toFixed(2) : '데이터 없음'}</p>
                        <p className="mb-4">{getHealthStatus(selectedData.sdnn)}</p>
                        <button
                            className="mt-4 bg-gray-800 text-white px-4 py-2 rounded"
                            onClick={() => setShowModal(false)}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )} */}
        </div>
    );
};

export default SdnnCalHeatmap;