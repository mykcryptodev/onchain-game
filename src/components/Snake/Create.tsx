import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FC } from "react";

import { api } from "~/utils/api";

type Props = {
  btnLabel?: string;
  onClick?: () => void;
}
const CreateSnakeGame: FC<Props> = ({ btnLabel, onClick }) => {
  const { data: sessionData } = useSession();
  const router = useRouter();
  const { mutateAsync: create } = api.snake.create.useMutation();

  const handleCreate = async () => {
    // capture the click event
    posthog.capture('create game', { 
      userAddress: sessionData?.user.address,
      userId: sessionData?.user.id,
    });
    const { id } = await create();
    void router.push(`/snake/${id}`, undefined, { shallow: true });
  }

  return (
    <button
      className="btn btn-primary"
      onClick={() => {
        void onClick?.();
        void handleCreate();
      }}
    >
      {btnLabel ?? "Create Game"}
    </button>
  );
};

export default CreateSnakeGame;
