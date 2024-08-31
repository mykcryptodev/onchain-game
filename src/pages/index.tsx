import { Name } from "@coinbase/onchainkit/identity";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";

import SignIn from "~/components/Wallet/SignIn";
import { APP_DESCRIPTION, APP_NAME } from "~/constants";
import { api } from "~/utils/api";

export default function Home() {
  return (
    <>
      <Head>
        <title>{APP_NAME}</title>
        <meta name="description" content={APP_DESCRIPTION} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight">
            {APP_NAME}
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl"
              href="https://create.t3.gg/en/usage/first-steps"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">First Steps →</h3>
              <div className="text-lg">
                Just the basics - Everything you need to know to set up your
                database and authentication.
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl"
              href="https://create.t3.gg/en/introduction"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Documentation →</h3>
              <div className="text-lg">
                Learn more about Create T3 App, the libraries it uses, and how
                to deploy it.
              </div>
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2">
            <SignIn />
            <AuthShowcase />
          </div>
        </div>
      </main>
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();
  const { address } = useAccount();

  const { data: secretMessage } = api.secret.getSecretMessage.useQuery({
    address: address ?? '',
  }, { 
    enabled: sessionData?.user !== undefined && address !== undefined,
  });

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center">
        {sessionData?.user && <span>Logged in as <Name address={sessionData.user.address} /></span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
    </div>
  );
}
