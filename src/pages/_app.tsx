import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react";

import Layout from "~/components/utils/Layout";
import { env } from "~/env";
import OnchainProviders from "~/providers/OnchainProviders";
import { api } from "~/utils/api";

import '@coinbase/onchainkit/styles.css';
import "~/styles/globals.css";

if (typeof window !== 'undefined' && env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'always',
    loaded: (posthog) => {
      if (env.NODE_ENV === 'development') posthog.debug() // debug mode in development
    },
  })
}

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <PostHogProvider client={posthog}>
      <SessionProvider session={session}>
        <OnchainProviders>
          <Layout>
            <Component {...pageProps} />
          </Layout>
          <div id="portal" />
        </OnchainProviders>
      </SessionProvider>
    </PostHogProvider>
  );
};

export default api.withTRPC(MyApp);
