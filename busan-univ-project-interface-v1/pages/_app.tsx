import "../styles/globals.css";
import { ReactElement, ReactNode } from "react";
import type { AppProps } from "next/app";
import { NextPage } from "next";
import dynamic from 'next/dynamic';

import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import DefaultLayout from "../components/layouts/DefaultLayout";
import { ThemeProvider } from "@/components/theme-provider";

const BubbleChat = dynamic(
  () => import('flowise-embed-react').then((mod) => mod.BubbleChat),
  { 
    ssr: false,
    loading: () => null 
  }
);

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
        {!isHeatmapCharts && typeof window !== 'undefined' && (
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
