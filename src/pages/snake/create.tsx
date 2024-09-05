import { type NextPage } from "next";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import posthog from "posthog-js";

import CreateGame from "~/components/Snake/Create";
import SignInWithEthereum from "~/components/Wallet/SignIn";

const CreateSnakeGame: NextPage = () => {
  const router = useRouter();
  const { data: sessionData } = useSession();

  const handlePlayAsGuest = async () => {
    posthog.capture('play as guest');
    if (!sessionData?.user) {
      return await signIn("guest", { callbackUrl: "/snake/play-guest" });
    }
    return router.push("/snake/play-guest");
  };

  return (
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
          <SignInWithEthereum 
            btnLabel="Sign In"
          />
        </div>
      )}
    </div>
  );
};

export default CreateSnakeGame;
