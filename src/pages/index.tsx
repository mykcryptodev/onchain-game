import Head from "next/head";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import posthog from "posthog-js";
import React from 'react';
import { useAccount } from "wagmi";

import CreateGame from "~/components/Snake/Create";
import { Wallet } from "~/components/Wallet";
import SignInWithEthereum from "~/components/Wallet/SignIn";
import { APP_DESCRIPTION, APP_NAME, APP_URL } from "~/constants";
import { env } from "~/env";

export default function Home() {
  const router = useRouter();
  const { address } = useAccount();
  const { data: sessionData } = useSession();

  const handlePlayAsGuest = async () => {
    posthog.capture('play as guest');
    if (!sessionData?.user) {
      return await signIn("guest", { callbackUrl: "/snake/play-guest" });
    }
    return router.push("/snake/play-guest");
  };

  // Define meta tag content
  const pageTitle = `Play ${APP_NAME}`;
  const pageDescription = APP_DESCRIPTION;
  const pageUrl = APP_URL;
  const imageUrl = "/images/og.gif";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph tags */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={imageUrl} />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={imageUrl} />
      </Head>
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Play {APP_NAME}</h1>
        {sessionData?.user.address ? (
          <CreateGame btnLabel="Play Snake" />
        ) : (
          <div className="flex flex-col gap-2">
            <button
              className="btn btn-primary"
              onClick={handlePlayAsGuest}
            >
              Play as Guest
            </button>
            {!address ? (
              <div className="flex items-center gap-2">
                <Wallet btnLabel="Login" />
                <Wallet btnLabel="Sign Up" />
              </div>
            ) : (
              <SignInWithEthereum 
                btnLabel="Sign In"
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}