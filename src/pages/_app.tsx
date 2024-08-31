import { GeistSans } from "geist/font/sans";
import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import Layout from "~/components/utils/Layout";
import OnchainProviders from "~/providers/OnchainProviders";
import { api } from "~/utils/api";

import '@coinbase/onchainkit/styles.css';
import "~/styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <OnchainProviders>
        <div className={GeistSans.className}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
          <div id="portal" />
        </div>
      </OnchainProviders>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
