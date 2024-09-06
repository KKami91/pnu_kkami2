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
  const getLayout = Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {getLayout(<Component {...pageProps} />)}
        </ThemeProvider>
        <BubbleChat
          chatflowid="54afc871-7024-4b9e-80c0-238d1793e992"
          apiHost="https://flowise-6pxd.onrender.com"
          theme={{ chatWindow: { poweredByTextColor: "#fff" } }}
        />
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default MyApp;

{/* <BubbleChat
chatflowid="1352afdb-1933-4a3f-88ea-b55d560ea805"
apiHost="https://flowise-6pxd.onrender.com"
https://xbqbhszemiywwwucjnex.supabase.co
theme={{ chatWindow: { poweredByTextColor: "#fff" } }}
/> */}