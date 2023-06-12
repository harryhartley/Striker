import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from 'next-themes'
import Head from "next/head";
import { SEO } from "~/components/site/SEO";
import { LayoutWrapper } from "~/components/site/LayoutWrapper";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider {...pageProps}>
      <ThemeProvider attribute='class' defaultTheme={'system'}>
        <Head>
          <meta content='width=device-width, initial-scale=1' name='viewport' />
        </Head>
        <SEO />
      <LayoutWrapper>
        <Component {...pageProps} />
      </LayoutWrapper>
      </ThemeProvider>
    </ClerkProvider>
  )
};

export default api.withTRPC(MyApp);
