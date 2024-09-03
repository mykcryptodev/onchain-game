import { type NextPage } from "next";
import { useRouter } from "next/router";

import { api } from "~/utils/api";

const CreateSnakeGame: NextPage = () => {
  const router = useRouter();
  const { mutateAsync: create } = api.snake.create.useMutation();

  const handleCreate = async () => {
    const { id } = await create();
    void router.push(`/snake/${id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Create Snake Game</h1>
      <button
        className="btn btn-primary"
        onClick={() => handleCreate()}
      >
        Create Game
      </button>
    </div>
  );
};

export default CreateSnakeGame;
