import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { api } from "~/utils/api";

export const PlaySnakeGuest: NextPage = () => {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const { mutateAsync: createSnakeGame } = api.snake.create.useMutation();

  useEffect(() => {
    if (!sessionData?.user) {
      return;
    }
    const createAndGoToGame = async () => {
      const { id } = await createSnakeGame();
      void router.push(`/snake/${id}`);
    }
    void createAndGoToGame();
  }, [createSnakeGame, router, sessionData]);

  return (
    <div className="items-center flex justify-center w-full">
      <div className="loading loading-spinner loading-lg" />
    </div>
  );
};

export default PlaySnakeGuest;