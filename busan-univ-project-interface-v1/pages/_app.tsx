import "../styles/globals.css";
import { ReactElement, ReactNode } from "react";
import type { AppProps } from "next/app";
import { NextPage } from "next";
import { useRouter } from 'next/router';

import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import DefaultLayout from "../components/layouts/DefaultLayout";
import { ThemeProvider } from "@/components/theme-provider";

import { BubbleChat } from "flowise-embed-react";

///////////////////////////////////
// Layout
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
///////////////////////////////////

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();

  // 라우트 경로를 사용하여 HeatmapCharts 페이지인지 확인
  const isHeatmapCharts = router.pathname === '/heatmap-charts';

  // HeatmapCharts 페이지일 경우 레이아웃을 적용하지 않음
  const getLayout = isHeatmapCharts
    ? (page: ReactElement) => page
    : Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {getLayout(<Component {...pageProps} />)}
        </ThemeProvider>
        {/* BubbleChat은 HeatmapCharts 페이지가 아닐 때만 렌더링 */}
        {!isHeatmapCharts && (
          <BubbleChat
            chatflowid="1352afdb-1933-4a3f-88ea-b55d560ea805"
            apiHost="https://flowise-6pxd.onrender.com"
            theme={{ chatWindow: { poweredByTextColor: "#fff" } }}
          />
        )}
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default MyApp;
