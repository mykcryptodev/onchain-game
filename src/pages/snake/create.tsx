import { type NextPage } from "next";

import CreateGame from "~/components/Snake/Create";

const CreateSnakeGame: NextPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Create Snake Game</h1>
      <CreateGame btnLabel="Create Game" />
    </div>
  );
};

export default CreateSnakeGame;
