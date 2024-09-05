import Head from "next/head";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useAccount } from "wagmi";

import CreateGame from "~/components/Snake/Create";
import { Wallet } from "~/components/Wallet";
import SignInWithEthereum from "~/components/Wallet/SignIn";
import { APP_DESCRIPTION, APP_NAME } from "~/constants";

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


  return (
    <>
      <Head>
        <title>{APP_NAME}</title>
        <meta name="description" content={APP_DESCRIPTION} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Create Snake Game</h1>
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