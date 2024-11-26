import React, { useEffect, useRef, useState } from 'react';
import CalHeatmap from 'cal-heatmap';
import 'cal-heatmap/cal-heatmap.css';
import { addHours, addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

interface HrvDayData {
    ds: string;
    day_rmssd: number;
}

interface RmssdCalHeatmapProps {
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

const RmssdCalHeatmap: React.FC<RmssdCalHeatmapProps> = ({ hrvDayData, startDate }) => {
    const calendarEl = useRef<HTMLDivElement>(null);
    const [cal, setCal] = useState<ICalHeatmap | null>(null);
    const [selectedData, setSelectedData] = useState<{ date: Date; rmssd: number | null } | null>(null);
    //const [showModal, setShowModal] = useState(false);
    const [range, setRange] = useState(1);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; date: Date; rmssd: number | null } | null>(null);



    const timezoneOffset = new Date().getTimezoneOffset();
    const offsetMs = ((-540 - timezoneOffset) * 60 * 1000) * -1;

    const updateRange = () => {

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
                day_rmssd: item.day_rmssd === null ? undefined : item.day_rmssd,
                ds: format(formatInTimeZone(addDays(addHours(new Date(item.ds), 9), 1), 'UTC', 'yyyy-MM-dd HH:mm:ssXXX'), 'yyyy-MM-dd')
            }));

            newCal.paint({
                data: {
                    source: adjustedData,
                    x: 'ds',
                    y: 'day_rmssd',
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
                            //const date = new Date(timestamp);
                            const date = new Date(formatInTimeZone(new Date(timestamp).getTime(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm'));
                            //console.log('in newCal date : ', date)
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
                if (event && event.target && (event.target as any).__data__) {
                    const data = (event.target as any).__data__ as CalHeatmapData;

                    if (data.v !== null) {
                        const date = new Date(data.t);
                        const rmssd = data.v;
                        
                        setSelectedData({ date, rmssd });
                        //setShowModal(true);

                        const customEvent = new CustomEvent(DATE_SELECT_EVENT, {
                            detail: { date, rmssd }
                        });
                        window.dispatchEvent(customEvent)

                    }
                }
            });

            newCal.on('mouseover', (event: any) => {
                if (event && event.target && (event.target as any).__data__ && (event.target as any).__data__.v !== null) {
                    const data = (event.target as any).__data__ as CalHeatmapData;

                    const date = new Date(formatInTimeZone(data.t as number, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'));

                    const rmssd = data.v;
                    const rect = event.target.getBoundingClientRect();
                    
                    setTooltip({ 
                        x: rect.left + window.scrollX, 
                        y: rect.top + window.scrollY, 
                        date, 
                        rmssd 
                    });
                } else {
                    setTooltip(null)
                }
            });

            newCal.on('mouseout', () => {
                setTooltip(null);
            });

            setCal(newCal);
        }
    }, [hrvDayData, range, startDate]);

    return (
        <div className="p-4 bg-gray-900 text-white">
            <h2 className="text-xl font-bold mb-4">Daily RMSSD</h2>

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
                    <p>RMSSD: {tooltip.rmssd !== null ? tooltip.rmssd.toFixed(2) : 'N/A'}</p>
                </div>
            )}
            <div className="flex justify-center" ref={calendarEl} style={{ height: '200px', width: '100%' }}></div>
            <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center flex-col mr-2">
                    <span>건강 (40+)</span>
                    <div className="w-4 h-4 bg-blue-400 mt-2"></div>
                    
                </div>
                <div className="flex items-center flex-col mr-2">
                    <span>정상 (20-40)</span>
                    <div className="w-4 h-4 bg-green-400 mt-2"></div>
                    
                </div>
                <div className="flex items-center flex-col">
                    <span>관리 필요 (10-20)</span>
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

        </div>
    );
};

export default RmssdCalHeatmap;