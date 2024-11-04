import "../styles/globals.css";

import { ReactElement, ReactNode } from "react";
import type { AppProps } from "next/app";
import { NextPage } from "next";

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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {getLayout(<Component {...pageProps} />)}
        </ThemeProvider>
        {!isHeatmapCharts && (  // HeatmapCharts가 아닐 때만 BubbleChat 표시
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
