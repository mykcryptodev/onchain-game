import { FrameMetadata } from '@coinbase/onchainkit/frame';
import { type AppType } from "next/app";
import Head from 'next/head';
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react";

import Layout from "~/components/utils/Layout";
import { APP_DESCRIPTION, APP_NAME, APP_URL } from "~/constants";
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
      if (process.env.NODE_ENV === 'development') posthog.debug() // debug mode in development
    },
  })
}

const pageTitle = `Play ${APP_NAME}`;
const pageDescription = APP_DESCRIPTION;
const pageUrl = APP_URL;
const imageUrl = `${APP_URL}/images/og.gif`;

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" href="/favicon.ico" />

        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={imageUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={imageUrl} />
        <FrameMetadata
          buttons={[
            {
              action: 'link',
              label: '🐍 Play Snake',
              target: pageUrl,
            },
          ]}
          image={{
            src: imageUrl,
            aspectRatio: '1.91:1'
          }}
        />
      </Head>
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
    </>
  );
};

export default api.withTRPC(MyApp);
