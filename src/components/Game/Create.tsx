import { type FC } from "react";

import { api } from "~/utils/api";

const CreateGame: FC = () => {
  const { mutateAsync: createGame } = api.game.create.useMutation();
  return (
    <button
      onClick={async () => {
        const game = await createGame({
          name: "My Game",
        });
        console.log({ game });
      }}
    >
      Create Game
    </button>
  );
};

export default CreateGame;