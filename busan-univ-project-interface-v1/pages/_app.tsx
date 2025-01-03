// import "../styles/globals.css";

// import { ReactElement, ReactNode } from "react";
// import type { AppProps } from "next/app";
// import { NextPage } from "next";

// import { RecoilRoot } from "recoil";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// import DefaultLayout from "../components/layouts/DefaultLayout";
// import { ThemeProvider } from "@/components/theme-provider";

// import { BubbleChat } from "flowise-embed-react";

// import { useRecoilValue } from "recoil";
// import { selectedUserState } from "@/state/useState";

// ///////////////////////////////////
// // Layout
// export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
//   getLayout?: (page: ReactElement) => ReactNode;
// };

// type AppPropsWithLayout = AppProps & {
//   Component: NextPageWithLayout;
// };
// ///////////////////////////////////

// const queryClient = new QueryClient();


// function MyApp({ Component, pageProps }: AppPropsWithLayout) {
//   const isPageWithoutLayout = (componentName: string) => {
//     return ['HeatmapCharts', 'Page', 'TempPage'].includes(componentName);
//   };

//   // BubbleChat을 제외할 페이지만 별도로 체크
//   const isHeatmapCharts = Component.name === 'HeatmapCharts';

//   const getLayout = isPageWithoutLayout(Component.name)
//     ? (page: ReactElement) => page
//     : Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

//   // --- 기존 --- 
//   // const getLayout = Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

//   const selectedEmail = useRecoilValue(selectedUserState);

//   return (
//     <RecoilRoot>
//       <QueryClientProvider client={queryClient}>
//         <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
//           {getLayout(<Component {...pageProps} />)}
//         </ThemeProvider>
//         {!isHeatmapCharts && (  // HeatmapCharts가 아닐 때만 BubbleChat 표시
//           <BubbleChat
//             chatflowid="f2866a89-adb8-4a52-b9e0-534b2be3e064"
//             apiHost="https://flowise-6pxd.onrender.com"
//             //chatflowid="1352afdb-1933-4a3f-88ea-b55d560ea805"
//             //apiHost="https://flowise-6pxd.onrender.com"
//             theme={{ chatWindow: { poweredByTextColor: "#fff" } }}
//             chatflowConfig={{
//               // 시스템 메시지나 초기 상태를 설정
//               systemMessage: selectedEmail ? `현재 선택된 사용자: ${selectedEmail}` : undefined,
//               // 또는
//               predefinedMessages: selectedEmail ? [`사용자 ${selectedEmail}의 정보를 조회해주세요`] : []
//             }}
//           />
//         )}
//       </QueryClientProvider>
//     </RecoilRoot>
//   );
// }

// export default MyApp;




import "../styles/globals.css";
import { ReactElement, ReactNode } from "react";
import type { AppProps } from "next/app";
import { NextPage } from "next";
import { RecoilRoot, useRecoilValue } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DefaultLayout from "../components/layouts/DefaultLayout";
import { ThemeProvider } from "@/components/theme-provider";
//import { BubbleChat } from "flowise-embed-react";
// import { selectedUserState } from "@/states/userState";
import { selectedUserState } from "@/state/useState";
import dynamic from 'next/dynamic';
///////////////////////////////////
// Layout
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
///////////////////////////////////

const BubbleChat = dynamic(
  () => import('flowise-embed-react').then((mod) => mod.BubbleChat),
  { 
    ssr: false,  // SSR 비활성화
    loading: () => null // 로딩 중에 표시할 컴포넌트
  }
);


function ChatWrapper() {
  const selectedEmail = useRecoilValue(selectedUserState);

  return (
    <BubbleChat
      chatflowid="f2866a89-adb8-4a52-b9e0-534b2be3e064"
      apiHost="https://flowise-6pxd.onrender.com"
      theme={
        { 
          chatWindow: { 
            poweredByTextColor: "#fff", 
            welcomeMessage: "사용자 데이터 분석 챗봇입니다. (사용 예시 : 사용자 정보, YYYY년 MM월 DD일 HH시 (BPM, Step, Calorie, Sleep) 데이터를 알려줘) "
          }
        }
      }
      chatflowConfig={{
        systemMessage: selectedEmail ? `현재 선택된 사용자: ${selectedEmail}` : '사용자를 선택하지 않음..',
        //predefinedMessages: selectedEmail ? [`Selected user email: ${selectedEmail}`] : [],
      }}
      
    />
  );
}

// AppContent 컴포넌트: RecoilRoot 내부에서 상태를 사용
function MyApp({ Component, pageProps, router }: AppPropsWithLayout) {
  const queryClient = new QueryClient();

  const isPageWithoutLayout = (componentName: string) => {
    return ['HeatmapCharts', 'Page', 'TempPage'].includes(componentName);
  };

  // BubbleChat을 제외할 페이지만 별도로 체크
  const isHeatmapCharts = Component.name === 'HeatmapCharts';

  const getLayout = isPageWithoutLayout(Component.name)
    ? (page: ReactElement) => page
    : Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem 
          disableTransitionOnChange
        >
          {getLayout(<Component {...pageProps} />)}
          {!isHeatmapCharts && <ChatWrapper />}
        </ThemeProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}



export default MyApp;