import "../styles/globals.css";
import { ReactElement, ReactNode, useState } from "react";
import type { AppProps } from "next/app";
import { NextPage } from "next";
import { RecoilRoot, useRecoilValue } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DefaultLayout from "../components/layouts/DefaultLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { selectedUserState } from "@/state/useState";
import dynamic from 'next/dynamic';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const BubbleChat = dynamic(
  () => import('flowise-embed-react').then((mod) => mod.BubbleChat),
  { 
    ssr: false,
    loading: () => null
  }
);

function ChatWrapper() {
  const selectedEmail = useRecoilValue(selectedUserState);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <BubbleChat
      chatflowid="f2866a89-adb8-4a52-b9e0-534b2be3e064"
      apiHost="https://flowise-6pxd.onrender.com"
      theme={{ 
        chatWindow: { 
          poweredByTextColor: "#fff", 
          welcomeMessage: "사용자 데이터 분석 챗봇입니다. (사용 예시 : 사용자 정보, YYYY년 MM월 DD일 HH시 (BPM, Step, Calorie, Sleep) 데이터를 알려줘) ",
          backgroundColor: "#192231",
          height: '600px',
          width: '400px',
          fontSize: '14px',
          messageStyles: {
            default: {
              backgroundColor: '#2D3748',
              color: '#fff',
            },
            user: {
              backgroundColor: '#4A5568',
              color: '#fff',
            }
          }
        }
      }}
      chatflowConfig={{
        systemMessage: selectedEmail ? `현재 선택된 사용자: ${selectedEmail}` : '사용자를 선택하지 않음..',
      }}
      onError={(error) => {
        console.error('Flowise Chat Error:', error);
        setIsLoading(false);
      }}
      onResponse={(response) => {
        console.log('Flowise Response:', response);
        setIsLoading(false);
      }}
      onLoading={(loading) => {
        setIsLoading(loading);
        console.log('Loading state:', loading);
      }}
      isStreaming={false}
    />
  );
}

function MyApp({ Component, pageProps, router }: AppPropsWithLayout) {
  const queryClient = new QueryClient();

  const isPageWithoutLayout = (componentName: string) => {
    return ['HeatmapCharts', 'Page', 'TempPage'].includes(componentName);
  };

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