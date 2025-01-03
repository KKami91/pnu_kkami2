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
import { format, addDays } from 'date-fns';
import DataAvailabilityCalendar2 from '../../components/DataCountCalendar2'
import { ArrowRightIcon } from '../../components/ui/ArrowRight';
import InputBox from '@/components/WriteInputBox';
import SearchMemoData from '@/components/SearchMemo';
import { ScrollArea } from "@/components/ui/scroll-area";

// 전역상태
import { useRecoilState } from 'recoil';
import { selectedUserState } from '@/state/useState';

interface DataResult {
  collection: string;
  data: { _id: string; count: number }[];
}


const users = ['hswchaos@gmail.com', 'subak63@gmail.com', '27hyobin@gmail.com', 'skdlove1009@gmail.com', 'sueun4701@gmail.com', 'psy.suh.hg@gmail.com']
const API_URL = 'https://heart-rate-app11-hotofhe3yq-du.a.run.app'

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

  const [hrvHourData, setHrvHourData] = useState<any[]>([]);
  const [hrvDayData, setHrvDayData] = useState<any[]>([]);

  const [initialDateWindow, setInitialDateWindow] = useState<{ start: Date; end: Date } | null>(null);

  const multiChartRef = useRef<HTMLDivElement>(null);

  const [countData, setCountData] = useState<DataResult[]>([]);

  const [heatmapSelectedDate, setHeatmapSelectedDate] = useState<Date | null>(null);

  console.log(new Date('2024-11-19T12:00:00'))

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

      isDataValid.current = true;

    } catch (error) {
      setDataError(error as Error);
      isDataValid.current = false;
    } finally {
      setIsDataLoading(false);
      setFirstSelectDate(false);
    }
}, [selectedUser]);

  useEffect(() => {
    window.addEventListener('dateSelect', handleDateSelect);
    return () => {
      window.removeEventListener('dateSelect', handleDateSelect);
    };
  }, [handleDateSelect]);

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
  

  const fetchPredictionData = async (user: string) => {
    try {
      const [minuteResponse, hourResponse] = await Promise.all([
        axios.get(`${API_URL}/predict_minute_div/${user}`),
        axios.get(`${API_URL}/predict_hour_div/${user}`)
      ]);

      const minutePredictions = minuteResponse.data.min_pred_bpm || [];
      const hourPredictions = hourResponse.data.hour_pred_bpm || [];

      setPredictMinuteData(minutePredictions);
      setPredictHourData(hourPredictions);
    } catch (error) {
      setPredictMinuteData([]);
      setPredictHourData([]);
    }
  }


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

        await fetchPredictionData(user)

        const userStartDate = userFirstDate.data.start_date;
  
        setFirstDate([userStartDate]);
        setHrvDayData(responseDay.data.day_hrv);
        setCountData(countDataResponse.data);

      } catch (error) {
        setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoadingUser(false);
      }
    }
  }

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
            <div className='mr-8 text-[16px]'>{formatBirth(selectedUserInfo.user_birth)}</div>
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

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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

return (
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
                </div>
              </div>
            ) : (
              <div></div>
      )}
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
  );
}