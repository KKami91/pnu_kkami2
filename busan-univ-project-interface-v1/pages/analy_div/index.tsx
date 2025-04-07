import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import axios from 'axios'
import MultiChart from '../../components/MultiChart4';
import { SkeletonLoader } from '../../components/SkeletonLoaders3';
import {
  Check,
  ChevronDown,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible"
import CombinedHrvHeatmap from '../../components/CombinedHrvHeatmap';
import { formatInTimeZone } from 'date-fns-tz';
import { format, addDays, startOfDay, endOfDay, subDays, addHours } from 'date-fns';
import DataAvailabilityCalendar2 from '../../components/DataCountCalendar2'
import { ArrowRightIcon } from '../../components/ui/ArrowRight';
import InputBox from '@/components/WriteInputBox';
import SearchMemoData from '@/components/SearchMemo';
import { ScrollArea } from "@/components/ui/scroll-area";

// 전역상태
import { useRecoilState, useRecoilValue } from 'recoil';
import { selectedUserState, analysisDataState } from '@/state/useState';

// html2canvas
import html2canvas from 'html2canvas';
import { Card } from '@/components/ui/card';
{/* <CaptureContainer>

</CaptureContainer> */}

interface DataResult {
  collection: string;
  data: { _id: string; count: number }[];
}



const users = ['hswchaos@gmail.com', 'subak63@gmail.com', '27hyobin@gmail.com', 'skdlove1009@gmail.com', 'sueun4701@gmail.com', 'psy.suh.hg@gmail.com']
//const API_URL = 'https://heart-rate-app11-hotofhe3yq-du.a.run.app'
const API_URL = 'http://15.164.213.20:8080'

const LoadingSpinner = () => (
  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2">
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
  </div>
)

interface AdditionalData {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  sleepData: any[];
  hrvData: any[];
}

interface DataItem {
  ds: string;
  timestamp: string;
  timestamp_start: string;
  timestamp_end: string;
  type?: string;
  value?: string;
  bpm?: number;
  step?: number;
  calorie?: number;
  rmssd?: number;
  sdnn?: number;
  min_pred_bpm: number | null;
  pred_rmssd?: number;
}

interface UserData {
  user_email: string;
  user_name: string;
  user_gender: string;
  user_height: string;
  user_weight: string;
  user_smoke: string;
  user_birth: string;
}

interface UserInfoDisplayProps {
  selectedUser: string;
  users2: UserData[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserInfoSectionProps {
  selectedUser: string;
  users2: UserData[];
}

interface AnalyData {
  meanBpm: number;
  sumStep: number;
  sumCalorie: number;
  sumSleep: number;
  sleepQuality: number;
}

interface DayAnalysisData {
  date: string;
  analysis: AnalyData;
}

interface SleepData {
  timestamp_start: string;
  timestamp_end: string;
  type?: string;
  value: number;
}

interface DayHrvData {
  ds: string;
  day_rmssd: number;
  day_sdnn: number;
}

Page.getLayout = (page: React.ReactElement) => page;

export default function Page() {
  // const [selectedUser, setSelectedUser] = useState('');
  // 전역
  const [selectedUser, setSelectedUser] = useRecoilState(selectedUserState)
  const [message, setMessage] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const [dataError, setDataError] = useState<Error | null>(null);

  const isDataValid = useRef(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // 분석 새창 로딩
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [firstSelectDate, setFirstSelectDate] = useState(true);

  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [saveDates, setSaveDates] = useState<string[]>([]);

  const [bpmData, setBpmData] = useState<DataItem[]>([]);
  const [stepData, setStepData] = useState<DataItem[]>([]);
  const [calorieData, setCalorieData] = useState<DataItem[]>([]);
  const [sleepData, setSleepData] = useState<DataItem[]>([]);
  const [firstDate, setFirstDate] = useState<any[]>([]);

  const [predictMinuteData, setPredictMinuteData] = useState<any[]>([]);
  const [predictHourData, setPredictHourData] = useState<any[]>([]);

  const [viewMode, setViewMode] = useState<'combined' | 'multi' | 'echarts'>('multi');

  const [hrvHourData, setHrvHourData] = useState<DayHrvData[]>([]);
  const [hrvDayData, setHrvDayData] = useState<any[]>([]);

  const [initialDateWindow, setInitialDateWindow] = useState<{ start: Date; end: Date } | null>(null);

  const multiChartRef = useRef<HTMLDivElement>(null);

  const [countData, setCountData] = useState<DataResult[]>([]);

  const [heatmapSelectedDate, setHeatmapSelectedDate] = useState<Date | null>(null);

  const analysisData = useRecoilValue(analysisDataState);

  const [dailyAnalysis, setDailyAnalysis] = useState<DayAnalysisData[]>([]);

  const [analysisHrvData, setAnalysisHrvData] = useState<DayHrvData[] | null>(null);

  const [userInfoData, setUserInfoData] = useState<UserData | null>(null);

  const [analysisResult, setAnalysisResult] = useState<string>('');
  

  const scrollToMultiChart = useCallback(() => {
    if (multiChartRef.current) {
      multiChartRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const { globalStartDate, globalEndDate } = useMemo(() => {
    const allDates = [...bpmData, ...stepData, ...calorieData].map(item => new Date(item.timestamp).getTime());
    return {
      globalStartDate: allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date(),
      globalEndDate: allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date()
    };
  }, [bpmData, stepData, calorieData]);

  const [dbStartDate, setDbStartDate] = useState<Date | null>(null);
  const [dbEndDate, setDbEndDate] = useState<Date | null>(null);


  const fetchDataRanges = async (user: string) => {
    try {
      const collections = ['bpm', 'step', 'calorie'];
      const ranges = await Promise.all(collections.map(async (collection) => {
        const response = await axios.get('/api/getDataRange', {
          params: { collection, user_email: user }
        });
        return response.data;
      }));

      const allStartDates = ranges.map((r) => new Date(r.startDate).getTime());
      const allEndDates = ranges.map((r) => new Date(r.endDate).getTime());

      const dbStartDate = new Date(Math.min(...allStartDates));
      const dbEndDate = addDays(new Date(Math.max(...allEndDates)), 3);

      setDbStartDate(dbStartDate);
      setDbEndDate(dbEndDate);

    } catch (error) {
      console.error('Error fetching data ranges:', error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchDataRanges(selectedUser);
    }
  }, [selectedUser]);

  const fetchData = async (collection: string, user: string, startDate: Date, endDate: Date) => {
    try {

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
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const handleBrushChange = (domain: [number, number] | null) => {
    //console.log("Brush domain changed2:", domain);
  };





  const fetchHrvData = useCallback(async (user: string, start: Date, end: Date) => {
    try {

      const utcStart = formatInTimeZone(start, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      const utcEnd = formatInTimeZone(end, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

      const response = await axios.get(`${API_URL}/feature_hour_div2/${user}/${new Date(utcStart).getTime()}/${new Date(utcEnd).getTime()}`);

      if (response.data && response.data.hour_hrv) {
        return response.data.hour_hrv.map((item: any) => ({
          ...item,
          ds: formatInTimeZone(new Date(item.ds), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        }));
      }
      return [];

    } catch (error) {
      return [];
    }
  }, [API_URL]);

  const fetchAdditionalData = useCallback((startDate: Date, endDate: Date): Promise<AdditionalData> => {
    if (!selectedUser) return Promise.resolve({ bpmData: [], stepData: [], calorieData: [], sleepData: [], hrvData: [] });

    return Promise.all([
      fetchData('bpm', selectedUser, startDate, endDate),
      fetchData('step', selectedUser, startDate, endDate),
      fetchData('calorie', selectedUser, startDate, endDate),
      fetchData('sleep', selectedUser, startDate, endDate),
      fetchHrvData(selectedUser, startDate, endDate),
    ])
      .then(([bpm, step, calorie, sleep, hrv]) => {

      const processedBpmData = bpm.map((item: DataItem) => ({
        ...item,
        timestamp: formatInTimeZone(new Date(item.timestamp), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      }));

      const processedStepData = step.map((item: DataItem) => ({
        ...item,
        timestamp: formatInTimeZone(new Date(item.timestamp), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      }));

      const processedCalorieData = calorie.map((item: DataItem) => ({
        ...item,
        timestamp: formatInTimeZone(new Date(item.timestamp), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      }));

      const processedSleepData = sleep.map((item: DataItem) => ({
        ...item,
        timestamp_start: formatInTimeZone(new Date(item.timestamp_start), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        timestamp_end: formatInTimeZone(new Date(item.timestamp_end), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      }));

      const processedHrvData = hrv.map((item: DataItem) => ({
        ...item,
        timestamp: formatInTimeZone(new Date(item.ds), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      }));

      return {
        bpmData: processedBpmData,
        stepData: processedStepData,
        calorieData: processedCalorieData,
        sleepData: processedSleepData,
        hrvData: processedHrvData,
      };
    })
    .catch((error) => {
      console.error('Error fetching additional data:', error);
      return { bpmData: [], stepData: [], calorieData: [], sleepData: [], hrvData: [] };
    });
  }, [selectedUser, fetchData, fetchHrvData]);
  
  

  // const fetchPredictionData = async (user: string) => {
  //   try {
  //     const [minuteResponse, hourResponse] = await Promise.all([
  //       axios.get(`${API_URL}/predict_minute_div/${user}`),
  //       axios.get(`${API_URL}/predict_hour_div/${user}`)
  //     ]);

  //     console.log('In fetchPredictionData : ', minuteResponse);

  //     const minutePredictions = minuteResponse.data.min_pred_bpm || [];
  //     const hourPredictions = hourResponse.data.hour_pred_bpm || [];

  //     console.log('In fetchPredictionData : ', minutePredictions);

  //     setPredictMinuteData(minutePredictions);
  //     setPredictHourData(hourPredictions);
  //   } catch (error) {
  //     setPredictMinuteData([]);
  //     setPredictHourData([]);
  //   }
  // }

  const fetchPredictionData = async (user: string) => {
    try {
      const [minuteResponse, hourResponse] = await Promise.all([
        axios.get('api/getPredBpm', { params: { user_email: user, collection: 'min_pred_bpm'} }),
        axios.get('api/getPredBpm', { params: { user_email: user, collection: 'hour_pred_bpm'} }),
      ]);

      console.log('In fetchPredictionData : ', minuteResponse);

      const minutePredictions = minuteResponse.data || [];
      const hourPredictions = hourResponse.data || [];

      console.log('In fetchPredictionData : ', minutePredictions);

      setPredictMinuteData(minutePredictions);
      setPredictHourData(hourPredictions);
    } catch (error) {
      setPredictMinuteData([]);
      setPredictHourData([]);
    }
  }

  /////
//   useEffect(() => {

//     if (selectedUser && !selectedDate) {
//       console.log('------------------------------------->>>>>>>> ', hrvDayData.map(item => ({
//         ...item,
//         ds: format(formatInTimeZone(addHours(new Date(item.ds), 9), 'UTC', 'yyyy-MM-dd HH:mm:ssXXX'), 'yyyy-MM-dd')
//     })))
//         const adjustedData = hrvDayData.map(item => ({
//             ...item,
//             ds: format(formatInTimeZone(addHours(new Date(item.ds), 9), 'UTC', 'yyyy-MM-dd HH:mm:ssXXX'), 'yyyy-MM-dd')
//         }))
//         console.log('<<<<<<<-----------------2222', adjustedData)
//         console.log('<<<<<<<-----------------4444444', analysisHrvData)
//         setAnalysisHrvData(adjustedData)
//         console.log('<<<<<<<-----------------', adjustedData)
//         console.log('<<<<<<<----------------3333333-', analysisHrvData)
//         // console.log('??aaaaaaaaaaaa?',analysisHrvData)
//         // console.log('??bbbbbbbbbbbbb?',adjustedData)
//         const lastDate = selectedDate || new Date();
        
//     }
// }, [selectedUser]);
////

  const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = e.target.value
    setSelectedUser(user)
    setSelectedDate('')
    setSaveDates([])
    if (user) {
      setIsLoadingUser(true)
      setIsInitialLoading(true)
      try {
        const [responseDay, userFirstDate, countDataResponse] = await Promise.all([
          axios.get(`${API_URL}/feature_day_div2/${user}`),
          axios.get(`${API_URL}/get_start_dates/${user}`),
          axios.get('/api/getCountData', { params: { user_email: user }},)
        ])

        console.log('in index get start date : ',userFirstDate)


        const dayHrvData = responseDay.data.day_hrv as DayHrvData[];

        await fetchPredictionData(user)

        console.log('in handleUserSelect responseDay.data.day_hrv ---> ', responseDay.data.day_hrv)
        

        const userStartDate = userFirstDate.data.start_date;
  
        setFirstDate([userStartDate]);

      
        setHrvDayData(dayHrvData);
        console.log('in handleUserSelecte hrvDayData ---> ', dayHrvData)

        const adjustedData = dayHrvData.map(item => ({
          ...item,
          ds: format(formatInTimeZone(addHours(new Date(item.ds), 9), 'UTC', 'yyyy-MM-dd HH:mm:ssXXX'), 'yyyy-MM-dd')
        }))
        console.log('in handleUserSelecte222 adjustedData ---> ', adjustedData)

        
        setAnalysisHrvData(adjustedData)
        console.log('in handleUserSelecte222 analysisHrvData ---> ', analysisHrvData)

        setCountData(countDataResponse.data);

      } catch (error) {
        setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoadingUser(false);
      }
    }
  }

useEffect(() => {
  console.log('후 ', analysisHrvData)
}, [selectedDate])

const handleSelection = (email: string) => {
  const event = {
    target: {
      value: email
    }
  } as React.ChangeEvent<HTMLSelectElement>
  
  handleUserSelect(event)
}

const [users2, setUsers2] = useState<UserData[]>([]);

useEffect(() => {
  const fetchUsers = async () => {
    try {
      await axios.post(`${API_URL}/user_data`);
      try {
        const response = await axios.get(`/api/getUserInfo`);
        console.log(response.data)
        setUsers2(response.data)
      } catch (error) {
        console.error(error)
      }     
    } catch (error) {
      console.error('error fetch user:', error);
    }
  };
  fetchUsers();
}, []);

function NavUser() {
  const { isMobile } = useSidebar()
  return (
    <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="grid flex-1 text-left text-sm leading-tight ml-10">
              <span className="truncate text-center text-base">
                {selectedUser || "계정 선택"}
              </span>
            </div>
            <ArrowRightIcon />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width 100%] min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="start"
          sideOffset={4}
        >
          <DropdownMenuLabel>사용자 계정 선택</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* <ScrollArea className="max-h-[calc(100vh-16rem)] overflow-y-auto"> */}
          
          <ScrollArea className="h-[500px] overflow-y-auto">

          {users2.map((user) => (
            <DropdownMenuItem
              key={user.user_email}
              onClick={() => handleSelection(user.user_email)}
              className="cursor-pointer"
            >
              <Check
                className={`mr-2 h-4 w-4 ${
                  selectedUser === user.user_email ? "opacity-100" : "opacity-0"
                }`}
              />
              {user.user_email} ({user.user_name})
            </DropdownMenuItem>
          ))}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
  )
}

const handleDateChange = (date: Date) => {
  setSelectedDate(format(date, 'yyyy-MM-dd'));
};

const formatBirth = (user_birth: string) => {
  const nowDate = new Date()
  const userBirth = new Date(user_birth)
  let age = nowDate.getFullYear() - userBirth.getFullYear()
  const subMonth = nowDate.getMonth() - userBirth.getMonth()
  if (subMonth < 0 || (subMonth === 0 && nowDate.getDate() < userBirth.getDate())) {
    age = age - 1;
  }
  return <div>{Number.isNaN(age) ? '정보 없음' : age}</div>
}




function UserInfoDisplay({ 
  selectedUser, 
  users2,
  isOpen,
  onOpenChange
}: UserInfoDisplayProps) {
  const selectedUserInfo = useMemo(() => 
    users2.find(user => user.user_email === selectedUser),
    [users2, selectedUser]
  );
  if (selectedUserInfo) {
    setUserInfoData(selectedUserInfo);
  }

  if (!selectedUser || !selectedUserInfo) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
    <CollapsibleTrigger className='flex items-center gap-2 w-full justify-center text-[12px] text-white/70 hover:text-white'>
    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
    사용자 정보
    </CollapsibleTrigger>
    <CollapsibleContent className='space-y-2 pt-2'>
    <div className='grid grid-cols-1 gap-2'>
        <div className='flex justify-between'>
            <div className='ml-8 text-[16px]'>이름</div> 
            <div className='mr-8 text-[16px]'>{selectedUserInfo.user_name}</div>
        </div>
        <div className='flex justify-between'>
            <div className='ml-8 text-[16px]'>나이</div> 
            <div className='mr-8 text-[16px]'>
              {userInfoData?.user_birth ? formatBirth(userInfoData.user_birth) : '정보 없음'}
            </div>
        </div>
        <div className='flex justify-between'>
            <div className='ml-8 text-[16px]'>성별</div>
            <div className='mr-8 text-[16px]'> {selectedUserInfo.user_gender}</div>
        </div>
        <div className='flex justify-between'>
            <div className='ml-8 text-[16px]'>키</div> 
            <div className='mr-8 text-[16px]'>{selectedUserInfo.user_height === '정보 없음' ? '정보 없음' : `${selectedUserInfo.user_height}cm`}</div>
        </div>
        <div className='flex justify-between'>
            <div className='ml-8 text-[16px]'>몸무게</div> 
            <div className='mr-8 text-[16px]'>{selectedUserInfo.user_weight === '정보 없음' ? '정보 없음' : `${selectedUserInfo.user_weight}kg`}</div>
        </div>
    </div>  
    </CollapsibleContent>
</Collapsible>
  )
}

const MemoizedSeparator = React.memo(function MemoizedSeparator() {
  return <SidebarSeparator className="mx-0 border-b" />;
})

const UserInfoSection = React.memo(function UserInfoSection({
  selectedUser,
  users2
}: UserInfoSectionProps){
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(true);
  if (!selectedUser) return null;
  return (
    <>
      <MemoizedSeparator />
      <MemoizedUserInfoDisplay
        selectedUser={selectedUser}
        users2={users2}
        isOpen={isUserInfoOpen}
        onOpenChange={setIsUserInfoOpen}
      />
    </>
  )
})

const MemoizedDataAvailabilityCalendar = React.memo(DataAvailabilityCalendar2);
const MemoizedInputBox = React.memo(InputBox);

const MemoizedUserInfoDisplay = React.memo(UserInfoDisplay, (prevProps, nextProps) => {
  return (
    prevProps.selectedUser === nextProps.selectedUser &&
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.users2 === nextProps.users2
  );
});

const MemoizedNavUser = React.memo(NavUser, (prevProps, nextProps) => {
  // NavUser는 props가 없으므로 단순 React.memo만으로도 충분
  return true;
});

const fetchDataForCalc = async (collection: string, user: string, startDate: Date, endDate: Date) => {
  try {
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
    return response.data;
  } catch (error) {
    console.error(error)
    throw error;
  }
}



function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  console.log('--APPSIDEBAR--')
  console.log(selectedDate)
  console.log('--APPSIDEBAR--')
  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <MemoizedNavUser/>
      </SidebarHeader>
      <SidebarContent>
        <MemoizedSeparator />
        <MemoizedDataAvailabilityCalendar
        countData={countData}
        selectedUser={selectedUser}
        heatmapDate={heatmapSelectedDate}
        hrvDayData={hrvDayData}
        onDateChange={handleDateChange}
        dailyAnalysis={dailyAnalysis}
        />

      <UserInfoSection selectedUser={selectedUser} users2={users2} />
      {selectedUser && (
        <>
          <MemoizedSeparator />
          <MemoizedInputBox selectedDate={selectedDate} selectedUser={selectedUser} />
        </>
      )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

const shouldRenderMultiChart = useMemo(() => {
  return (
    !isDataLoading &&
    selectedUser &&
    selectedDate &&
    countData.length > 0 &&
    !error &&
    isDataValid.current
  );
}, [isDataLoading, selectedUser, selectedDate, countData, error]);

const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
    <h3 className="text-red-800 font-medium">데이터를 불러오는 중 오류가 발생했습니다</h3>
    <p className="text-red-600 text-sm mt-1">{error.message}</p>
  </div>
);

const userBPMImage = async (userEmail: string) => {
  try {
    setIsAnalysisLoading(true);
    const response = await axios.post(
      `${API_URL}/user_analysis_bpm/${userEmail}`,
      {},
      {
        responseType: "blob",
      }
    );
    const url = URL.createObjectURL(response.data);
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<html>
          <head>
            <title>${selectedUser} BPM Analysis</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
            <body class="m-0 bg-gray-100 p-4 overflow-auto">
              <div class="flex justify-center">
                <img src="${url}" alt="${selectedUser} Analysis BPM" class="w-auto"/>
              </div>
            </body>
        </html>`
      );
      newWindow.document.close();
    }
  } catch (error) {
    console.error("error : ", error);
  } finally {
    setIsAnalysisLoading(false);
  }
}

const userSleepImage = async (userEmail: string) => {
  try {
    setIsAnalysisLoading(true);
    const response = await axios.post(
      `${API_URL}/user_analysis_sleep/${userEmail}`,
      {},
      {
        responseType: "blob",
      }
    );
    const url = URL.createObjectURL(response.data);
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<html>
          <head>
            <title>${selectedUser} Sleep Analysis</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
            <body class="m-0 bg-gray-100 p-4 overflow-auto">
              <div class="flex justify-center">
                <img src="${url}" alt="${selectedUser} Analysis Sleep" class="w-auto"/>
              </div>
            </body>
        </html>`
      );
      newWindow.document.close();
    }
  } catch (error) {
    console.error("error : ", error);
  } finally {
    setIsAnalysisLoading(false);
  }
}

const userStepImage = async (userEmail: string) => {
  try {
    setIsAnalysisLoading(true);
    const response = await axios.post(
      `${API_URL}/user_analysis_step/${userEmail}`,
      {},
      {
        responseType: "blob",
      }
    );
    const url = URL.createObjectURL(response.data);
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<html>
          <head>
            <title>${selectedUser} step Analysis</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
            <body class="m-0 bg-gray-100 p-4 overflow-auto">
              <div class="flex justify-center">
                <img src="${url}" alt="${selectedUser} Analysis step" class="w-auto"/>
              </div>
            </body>
        </html>`
      );
      newWindow.document.close();
    }
  } catch (error) {
    console.error("error : ", error);
  } finally {
    setIsAnalysisLoading(false);
  }
}

// 테스트 스크린샷 //
interface AnalysisResponse {
  analysis: string;
  imageData?: string;
  error?: string;
}

//const { GoogleGenerativeAI } = require("@google/generative-ai");


const analyzeFullDashboard = async (): Promise<AnalysisResponse> => {
  try {
    const dashboardElement = document.querySelector<HTMLElement>('#dashboard-container');
    
    if (!dashboardElement) {
      throw new Error('대시보드 요소를 찾을 수 없습니다.');
    }

    const canvas = await html2canvas(dashboardElement);
    const imageData: string = canvas.toDataURL('image/png');

    try {
      const response = await axios.post('/api/analyzeImage', {
        image: imageData
      });
      
      return { 
        analysis: response.data.analysis,
        imageData: imageData
      };
    } catch (error) {
      console.error('Gemini 분석 중 에러:', error);
      throw error;
    }
  }
  catch (error) {
    console.error(error);
    return { 
      analysis: '', 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    };
  }
}

// const CaptureButton = () => {
//   const handleCapture = async () => {
//     try {
//       const { analysis: imageData, error } = await analyzeFullDashboard();
      
//       if (error) {
//         console.error(error);
//         return;
//       }

//       const newWindow = window.open('', '_blank');
//       if (newWindow) {
//         newWindow.document.write(`
//           <html>
//             <head>
//               <title>캡처된 이미지</title>
//               <style>
//                 body {
//                   margin: 0;
//                   padding: 20px;
//                   background: #f5f5f5;
//                   display: flex;
//                   justify-content: center;
//                   align-items: center;
//                   min-height: 100vh;
//                 }
//                 img {
//                   max-width: 100%;
//                   height: auto;
//                   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//                   border-radius: 8px;
//                 }
//               </style>
//             </head>
//             <body>
//               <img src="${imageData}" alt="Captured Dashboard" />
//             </body>
//           </html>
//         `);
//         newWindow.document.close();
//       }
//     } catch (err) {
//       console.error('캡처 중 에러 발생:', err);
//     }
//   };

//   return (
//     <button
//       onClick={handleCapture}
//       className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
//     >
//       화면 캡처
//     </button>
//   );
// };

const CaptureButton = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCapture = async () => {
    try {
      setIsAnalyzing(true);
      const { analysis, error } = await analyzeFullDashboard();
      
      if (error) {
        console.error(error);
        return;
      }

      setAnalysisResult(analysis); // 분석 결과를 상태에 저장

    } catch (err) {
      console.error('캡처 및 분석 중 에러 발생:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <button
      onClick={handleCapture}
      disabled={isAnalyzing}
      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
    >
      {isAnalyzing ? (
        <>
          <span className="mr-2">분석 중...</span>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </>
      ) : (
        '대시보드 분석'
      )}
    </button>
  );
};

const calculateDailyData = useCallback(async (date: string) => {
  try {
    const startDate = startOfDay(new Date(date));
    const endDate = endOfDay(new Date(date));
    
    const data = await fetchAdditionalData(startDate, endDate);
    
    // 데이터 계산
    const meanBpm = data.bpmData.reduce((sum, item) => sum + item.value, 0) / data.bpmData.length;
    const sumStep = data.stepData.reduce((sum, item) => sum + item.value, 0);
    const sumCalorie = data.calorieData.reduce((sum, item) => sum + item.value, 0);
        
    
    const sumSleep = data.sleepData.reduce((totalMinutes: number, item: SleepData) => {
        if (!item.timestamp_start || !item.timestamp_end) return totalMinutes;
        const startTime = new Date(item.timestamp_start);
        const endTime = new Date(item.timestamp_end);
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
        return totalMinutes + durationMinutes;
    }, 0);

    const totalAwakeMinutes = data.sleepData.reduce((totalMinutes: number, item: SleepData) => {
      if (!item.timestamp_start || !item.timestamp_end) return totalMinutes;
      let awakeStartTime: Date | null = null;
      let awakeEndTime: Date | null = null;
      if (item.value === 1) {
          awakeStartTime = new Date(item.timestamp_start);
          awakeEndTime = new Date(item.timestamp_end);
      }
      const awakeDurationMinutes = awakeStartTime && awakeEndTime ? (awakeEndTime.getTime() - awakeStartTime.getTime()) / (1000 * 60) : 0;
      return totalMinutes + awakeDurationMinutes;
  }, 0)
    const sleepQuality = ((sumSleep - totalAwakeMinutes)/sumSleep) * 100
    // ... 기타 계산

    const analysisData: AnalyData = {
      meanBpm,
      sumStep,
      sumCalorie,
      sumSleep: Number((sumSleep / 60).toFixed(1)), // 수면 데이터 계산 필요
      sleepQuality: Number(sleepQuality.toFixed(2))
    };

    setDailyAnalysis(prev => {
      const exists = prev.find(item => item.date === date);
      if (exists) {
        return prev.map(item => 
          item.date === date ? { ...item, analysis: analysisData } : item
        );
      }
      return [...prev, { date, analysis: analysisData }];
    });

    return analysisData;
  } catch (error) {
    console.error('Error calculating daily data:', error);
    return null;
  }
}, [fetchAdditionalData]);

const handleDateSelect = useCallback(async (event: Event) => {
  const customEvent = event as CustomEvent<{ date: string }>;
  const { date } = customEvent.detail;

  try {
    setIsDataLoading(true);
    setDataError(null);

    if (!selectedUser) {
      throw new Error('사용자가 선택되지 않았습니다.');
    }

    const selectedDate = new Date(date);
    setHeatmapSelectedDate(selectedDate);
    setSelectedDate(format(selectedDate, 'yyyy-MM-dd'));

    await calculateDailyData(format(selectedDate, 'yyyy-MM-dd'));

    isDataValid.current = true;
  } catch (error) {
    setDataError(error as Error);
    isDataValid.current = false;
  } finally {
    setIsDataLoading(false);
    setFirstSelectDate(false);
  }
}, [selectedUser, calculateDailyData]);

useEffect(() => {
  window.addEventListener('dateSelect', handleDateSelect);
  return () => {
    window.removeEventListener('dateSelect', handleDateSelect);
  };
}, [handleDateSelect]);

const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';



// 현재 선택된 날짜의 분석 데이터를 가져오는 useMemo 추가
const currentDayAnalysis = useMemo(() => {
  if (!selectedDate) return null;
  
  return dailyAnalysis.find(item => item.date === selectedDate)?.analysis;
}, [selectedDate, dailyAnalysis]);





return (
<div id='dashboard-container'>
  <SidebarProvider>
  
    <AppSidebar />
    <SidebarInset>
      <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 z-50">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="ml-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              { selectedUser &&
                <BreadcrumbPage>{selectedUser}</BreadcrumbPage>
              }
              {isLoadingUser && <LoadingSpinner />}
              { selectedUser &&
                <div className="flex items-center">
                  {/* <ArrowRightIcon /> */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-sm bg-blue-500 text-white rounded px-3.5 py-1.5 ml-2 flex items-center">
                        Analysis Options
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => userBPMImage(selectedUser)}>
                        BPM Analysis
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => userSleepImage(selectedUser)}>
                        Sleep Analysis
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => userStepImage(selectedUser)}>
                        Step Analysis
                      </DropdownMenuItem>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

              }
              {isAnalysisLoading  && <LoadingSpinner />}
            </BreadcrumbItem>
          </BreadcrumbList>          
        </Breadcrumb>
        </div>

          <div>
            <CaptureButton />
          </div>

        <div className="mr-4">
          <SearchMemoData selectedUser={selectedUser}/>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="auto-rows-min gap-4 md:grid-cols-5">
          {hrvDayData.length > 0 && (
            <div className="mt-8">
              <CombinedHrvHeatmap hrvDayData={hrvDayData} firstDate={firstDate} />
            </div>            
          )}
            {isLoading || isDataLoading ? (
              <SkeletonLoader viewMode={viewMode} columns={1} />
            ) : dataError ? (
              <ErrorFallback error={dataError} />
            ) : shouldRenderMultiChart ? (
              <div className="grid-cols-1 md:grid-cols-2 gap-4">
                <div ref={multiChartRef}>
                  {/* <div id='dashboard-container'> */}
                  <MultiChart
                    selectedUser={selectedUser}
                    bpmData={bpmData}
                    stepData={stepData}
                    calorieData={calorieData}
                    sleepData={sleepData}
                    predictMinuteData={predictMinuteData}
                    predictHourData={predictHourData}
                    hrvHourData={hrvHourData}
                    globalStartDate={globalStartDate}
                    globalEndDate={globalEndDate}
                    onBrushChange={handleBrushChange}
                    fetchAdditionalData={fetchAdditionalData}
                    fetchHrvData={fetchHrvData}
                    initialDateWindow={initialDateWindow}
                    selectedDate={selectedDate}
                    dbStartDate={dbStartDate}
                    dbEndDate={dbEndDate}
                    scrollToMultiChart={scrollToMultiChart}
                  />
                  {/* </div> */}
                </div>
              <div className="flex gap-4">
              <Card className='w-[300px]'>
                <div className='grid grid-cols-1 gap-2'>
                      <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>이름</div> 
                        <div className='mr-8 text-[16px]'>{userInfoData?.user_name}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>나이</div> 
                        <div className='mr-8 text-[16px]'>
                          {userInfoData?.user_birth ? formatBirth(userInfoData.user_birth) : '정보 없음'}
                        </div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>성별</div>
                        <div className='mr-8 text-[16px]'> {userInfoData?.user_gender}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>키</div> 
                        <div className='mr-8 text-[16px]'>{userInfoData?.user_height === '정보 없음' ? '정보 없음' : `${userInfoData?.user_height}cm`}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>몸무게</div> 
                        <div className='mr-8 text-[16px]'>{userInfoData?.user_weight === '정보 없음' ? '정보 없음' : `${userInfoData?.user_weight}kg`}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>BPM 평균</div>
                        <div className='mr-8 text-[16px]'>{currentDayAnalysis?.meanBpm.toFixed(2)}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>Step 합계</div>
                        <div className='mr-8 text-[16px]'>{currentDayAnalysis?.sumStep}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>Calorie 합계</div>
                        <div className='mr-8 text-[16px]'>{currentDayAnalysis?.sumCalorie.toFixed(2)}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>Sleep 합계</div>
                        <div className='mr-8 text-[16px]'>{currentDayAnalysis?.sumSleep} 시간</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>Sleep Quality</div>
                        <div className='mr-8 text-[16px]'>{currentDayAnalysis?.sleepQuality || 0} 점</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>RMSSD</div>
                        <div className='mr-8 text-[16px]'>{analysisHrvData?.find(data => data.ds === selectedDateString)?.day_rmssd?.toFixed(2) || '0'}</div>
                    </div>
                    <div className='flex justify-between'>
                        <div className='ml-8 text-[16px]'>SDNN</div>
                        <div className='mr-8 text-[16px]'>{analysisHrvData?.find(data => data.ds === selectedDateString)?.day_sdnn?.toFixed(2) || '0'}</div>
                    </div>
                </div>
              </Card>
              {/* 분석 결과 Card */}
              <Card className='flex-1 h-fit'>
              <div className='p-4'>
                <h3 className='text-lg font-semibold mb-4'>대시보드 분석 결과</h3>
                <ScrollArea className='h-[400px]'>
                  {analysisResult ? (
                    <div className='text-sm whitespace-pre-wrap pr-4'>
                      {analysisResult}
                    </div>
                  ) : (
                    <div className='text-gray-500 text-sm'>
                      대시보드 분석 버튼을 클릭하여 분석을 시작하세요.
                    </div>
                  )}
                </ScrollArea>
              </div>
            </Card>
            </div>
              </div>
            ) : (
              <div></div>
      )}
        </div>
      </div>
    </SidebarInset>
    
  </SidebarProvider>
  </div>
  );
}