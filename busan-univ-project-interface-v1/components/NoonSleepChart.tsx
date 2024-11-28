import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea, Line } from 'recharts';
import { format, addHours, startOfDay, addDays, subDays } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

interface SleepEntry {
  timestamp: string;
  end: string;
  timestamp_start: string;
  timestamp_end: string;
  value: number;
  sleep_stage?: number;
}



interface Memo {
  content: string;
  endTimestamp?: number;
}

interface MemoMap {
  [key: string]: Memo;
}

interface SleepStageConfig {
  [key: string]: {
    color: string;
    label: string;
  };
}

interface SleepStats {
  totalSleep: number;
  deepSleep: number;
  lightSleep: number;
  remSleep: number;
  awake: number;
}

interface NoonSleepChartProps {
  sleepData: SleepEntry[];
  selectedDate: string;
  memos: MemoMap;
  onMemoClick: (data: any) => void;
}

interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: {
        timestamp_start: number;
        timestamp_end: number;
        sleep_stage?: number;
        value: number;
      };
    }>;
    label?: string | number;
    coordinate?: { x: number; y: number };
  }
  

const NoonSleepChart: React.FC<NoonSleepChartProps> = ({ 
  sleepData, 
  selectedDate,
  memos,
  onMemoClick 
}) => {
  
  const mapSleepStage = (stage: number): number => {
    switch(stage) {
        case 1: return -1;
        case 4: return -2;
        case 5: return -4;
        case 6: return -3;
        default: return 0;
      }
  };

  const sleepStageConfig: SleepStageConfig = {
    0: { color: '#808080', label: 'Unused' },
    '-1': { color: '#FFA500', label: 'Awake' },
    '-2': { color: '#32CD32', label: 'Light' },
    '-3': { color: '#4169E1', label: 'REM' },
    '-4': { color: '#008080', label: 'Deep' },
  };

  
//   const noonToNoonData = useMemo(() => {
//     if (!selectedDate || !sleepData.length) return [];
  
//     const selectedDay = new Date(selectedDate);
//     // 전날 정오부터 당일 정오까지
//     const noonToday = subDays(addHours(startOfDay(selectedDay), 12), 1);
//     const noonTomorrow = subDays(addHours(startOfDay(addDays(selectedDay, 1)), 12), 1);
  
//     const timezoneOffset = new Date().getTimezoneOffset();
//     const offsetMs = ((-540 - timezoneOffset) * 60 * 1000);
  
//     console.log('Time range:', {
//       noonToday: noonToday.toISOString(),
//       noonTomorrow: noonTomorrow.toISOString()
//     });
  
//     const filtered = sleepData.filter(entry => {
//       const timestamp = new Date(entry.timestamp_start);
//       return timestamp >= noonToday && timestamp < noonTomorrow;
//     }).map(entry => ({
//       ...entry,
//       // timestamp를 숫자로 변환
//       timestamp_start: new Date(entry.timestamp_start).getTime(),
//       timestamp_end: new Date(entry.timestamp_end).getTime(),
//       sleep_stage: mapSleepStage(entry.value)
//     }));
  
//     console.log('Filtered and processed data:', filtered);
//     return filtered;
//   }, [sleepData, selectedDate]);
const noonToNoonData = useMemo(() => {
    if (!selectedDate || !sleepData.length) return [];

    const selectedDay = new Date(selectedDate);
    // 전날 정오부터 당일 정오까지의 범위 설정
    const noonToday = subDays(addHours(startOfDay(selectedDay), 12), 1);
    const noonTomorrow = subDays(addHours(startOfDay(addDays(selectedDay, 1)), 12), 1);

    const timezoneOffset = new Date().getTimezoneOffset();
    const offsetMs = ((-540 - timezoneOffset) * 60 * 1000);

    // 해당 기간에 걸치는 모든 수면 데이터 필터링
    const filtered = sleepData.filter(entry => {
    const startTime = new Date(entry.timestamp_start);
    const endTime = new Date(entry.timestamp_end);
    // 수면 구간이 표시 기간과 조금이라도 겹치면 포함
    return (startTime < noonTomorrow && endTime > noonToday);
    }).map(entry => ({
    ...entry,
    timestamp: new Date(entry.timestamp_start).getTime(),
    end: new Date(entry.timestamp_end).getTime(),
    timestamp_start: new Date(entry.timestamp_start).getTime(),
    timestamp_end: new Date(entry.timestamp_end).getTime(),
    sleep_stage: mapSleepStage(entry.value)
    }));


    return filtered;
}, [sleepData, selectedDate]);

  const sleepStats = useMemo((): SleepStats => {
    const stats: SleepStats = {
      totalSleep: 0,
      deepSleep: 0,
      lightSleep: 0,
      remSleep: 0,
      awake: 0
    };


    noonToNoonData.forEach((item) => {
      const start = new Date(item.timestamp_start);
      const end = new Date(item.timestamp_end);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);

      console.log(stats)

      if (item.sleep_stage !== undefined) {
        switch (item.sleep_stage) {
          case -4:
            stats.deepSleep += duration;
            break;
          case -2:
            stats.lightSleep += duration;
            break;
          case -3:
            stats.remSleep += duration;
            break;
          case -1:
            stats.awake += duration;
            break;
        }
        stats.totalSleep += duration;
      }
    });

    

    return stats;
  }, [noonToNoonData]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, coordinate }) => {

    if (active && payload && payload.length > 0) {
      const mouseX = coordinate?.x ?? 0;
      const currentTime = new Date(mouseX);
      const data = payload[0].payload;
      const stage = data.sleep_stage;
      
      // stage가 undefined인 경우 처리
      const stageKey = (stage?.toString() || '0') as keyof typeof sleepStageConfig;
      const stageInfo = sleepStageConfig[stageKey] || { color: '#808080', label: 'Unknown' };
      
      // 현재 시점의 시간 포맷
      const currentTimeStr = format(currentTime, 'HH:mm');
      // 구간의 시작/종료 시간 포맷
      const startTime = format(new Date(data.timestamp_start), 'yyyy-MM-dd HH:mm:ss');
      const endTime = format(new Date(data.timestamp_end), 'yyyy-MM-dd HH:mm:ss');
      
    //   // 수면 구간의 지속 시간 계산
    //   const durationMinutes = 
    //     (data.timestamp_end - data.timestamp_start) / (1000 * 60);
    //   const hours = Math.floor(durationMinutes / 60);
    //   const minutes = Math.round(durationMinutes % 60);

      // 지속 시간 계산을 분 단위의 소수점까지 포함하도록 수정
      const durationMinutes = 
      (data.timestamp_end - data.timestamp_start) / (1000 * 60);
        
      // formatDuration 함수 사용
      const duration = formatDuration(durationMinutes);


      
      return (
        <div className="bg-white/85 p-3 border border-gray-300 rounded shadow">
          <div className="font-semibold border-b border-gray-200 pb-2 mb-2 text-gray-600">
            수면 정보
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">수면 구간:</span>
              <span className="font-medium text-gray-600">{startTime} ~ {endTime}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">지속 시간:</span>
              <span className="font-medium text-gray-600">
                {/* {hours > 0 ? `${hours}시간 ` : ''}{minutes}분 */}
                {duration}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-2 border-t border-gray-200 mt-2">
              <span className="text-gray-600">수면 단계:</span>
              <span 
                className="font-medium"
                style={{ color: stageInfo.color }}
              >
                {stageInfo.label}
              </span>
            </div>
            {memos[`sleep_${data.timestamp_start}`] && (
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="text-gray-600 mb-1">메모:</div>
                <div className="text-sm italic text-gray-600">
                  {memos[`sleep_${data.timestamp_start}`].content}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const formatDuration = (minutes: number): string => {
    // 시간 계산
    const hours = Math.floor(minutes / 60);
    // 분 계산 (소수점 포함)
    const minutesDecimal = minutes % 60;
    // 온전한 분
    const mins = Math.floor(minutesDecimal);
    // 소수점 분을 초로 변환 (60을 곱하여 초로 변환)
    const seconds = Math.round((minutesDecimal - mins) * 60);
  
    let result = '';
    if (hours > 0) {
      result += `${hours}시간 `;
    }
    if (mins > 0) {
      result += `${mins}분 `;
    }
    if (seconds > 0) {
      result += `${seconds}초`;
    }
    // 모든 값이 0인 경우
    if (result === '') {
      result = '0분';
    }
  
    return result.trim();
  };

  console.log('sleep Data Check',noonToNoonData)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className='text-xl text-center'>Sleep Analysis (12 to 12)</CardTitle>
        <div></div>
        <div className='text-center text-gray-500 text-sm'>
            {(() => {
                if (!selectedDate) return null;
                
                const selectedDay = new Date(selectedDate);
                const noonToday = subDays(addHours(startOfDay(selectedDay), 12), 1);
                const noonTomorrow = subDays(addHours(startOfDay(addDays(selectedDay, 1)), 12), 1);

                return (
                <div className='flex items-center justify-center gap-2'>
                    <span>{format(noonToday, 'yyyy-MM-dd HH:mm')}</span>
                    <span>~</span>
                    <span>{format(noonTomorrow, 'yyyy-MM-dd HH:mm')}</span>
                </div>
                );
            })()}
        </div>
        <div className="grid grid-cols-5 gap-4 text-sm mt-2">
          <div className="text-center">
            <div className="font-semibold">Total Sleep</div>
            <div>{formatDuration(sleepStats.totalSleep)}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Deep</div>
            <div>{formatDuration(sleepStats.deepSleep)}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Light</div>
            <div>{formatDuration(sleepStats.lightSleep)}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">REM</div>
            <div>{formatDuration(sleepStats.remSleep)}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Awake</div>
            <div>{formatDuration(sleepStats.awake)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={noonToNoonData} 
            onClick={onMemoClick}
            onMouseMove={(e) => {
                if (e.activeTooltipIndex !== undefined) {
                setActiveIndex(e.activeTooltipIndex);
                }
            }}
            onMouseLeave={() => {
                setActiveIndex(null);
            }}
            >
            
                <XAxis 
                    dataKey="timestamp_start"
                    type="number"
                    scale="time"
                    // domain을 정오부터 다음날 정오까지로 고정
                    domain={[
                    () => {
                        const selectedDay = new Date(selectedDate);
                        return subDays(addHours(startOfDay(selectedDay), 12), 1).getTime();
                    },
                    () => {
                        const selectedDay = new Date(selectedDate);
                        return subDays(addHours(startOfDay(addDays(selectedDay, 1)), 12), 1).getTime();
                    }
                    ]}
                    ticks={Array.from({ length: 13 }, (_, i) => {
                    const selectedDay = new Date(selectedDate);
                    const baseTime = subDays(addHours(startOfDay(selectedDay), 12), 1);
                    return addHours(baseTime, i * 2).getTime(); // 2시간 간격으로 눈금 표시
                    })}
                    tickFormatter={(time) => format(new Date(time), 'HH:mm')}
                />
              <YAxis
                domain={[-4.5, 0.5]}
                ticks={[-4, -3, -2, -1]}
                tickFormatter={(value) => {
                  const key = value.toString() as keyof typeof sleepStageConfig;
                  return sleepStageConfig[key]?.label || '';
                }}
              />
                <Line
                    type="stepAfter"
                    dataKey="sleep_stage"
                    stroke="none"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                />
            <Tooltip 
                content={<CustomTooltip />}
                wrapperStyle={{ zIndex: 100 }}
                cursor={{
                stroke: '#666',
                strokeWidth: 1,
                strokeDasharray: '5 5'
                }}
            />
            {Object.entries(sleepStageConfig).map(([stage, config]) => (
                <ReferenceLine 
                key={stage}
                y={Number(stage)}
                stroke={config.color}
                strokeDasharray="3 3"
                />
            ))}
            {noonToNoonData.map((entry, index) => (
                <ReferenceArea
                radius={[6,6,6,6]}
                key={entry.timestamp_start}
                x1={entry.timestamp_start}
                x2={entry.timestamp_end}
                y1={(entry.sleep_stage ?? 0) - 0.4}
                y2={(entry.sleep_stage ?? 0) + 0.4}
                //fill={sleepStageConfig[(entry.sleep_stage?.toString() || '0')].color}
                fill={
                  entry.value === 1 && entry.timestamp_end - entry.timestamp_start >= 20 * 60 * 1000
                    ? 'red'
                    : sleepStageConfig[(entry.sleep_stage?.toString() || '0')].color
                }
                fillOpacity={activeIndex === index ? 0.8 : 0.6}
                stroke={activeIndex === index ? sleepStageConfig[(entry.sleep_stage?.toString() || '0')].color : undefined}
                strokeWidth={activeIndex === index ? 2 : 0}
                />
            ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoonSleepChart;