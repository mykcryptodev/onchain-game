import { useRouter } from "next/router";
import { type FC } from "react";

import { api } from "~/utils/api";

type Props = {
  btnLabel?: string;
  onClick?: () => void;
}
const CreateSnakeGame: FC<Props> = ({ btnLabel, onClick }) => {
  const router = useRouter();
  const { mutateAsync: create } = api.snake.create.useMutation();

  const handleCreate = async () => {
    const { id } = await create();
    console.log("about to push to", `/snake/${id}`);
    void router.push(`/snake/${id}`, undefined, { shallow: true });
    console.log("pushed to", `/snake/${id}`);
  }

  return (
    <button
      className="btn btn-primary"
      onClick={() => {
        void onClick?.();
        void handleCreate()
      }}
    >
      {btnLabel ?? "Create Game"}
    </button>
  );
};

export default CreateSnakeGame;
