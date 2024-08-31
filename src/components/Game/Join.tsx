import { type FC } from "react";

import { api } from "~/utils/api";

type Props = { 
  id: string;
  onJoined: () => void;
};
export const JoinGame: FC<Props> = ({ id, onJoined }) => {
  const { mutateAsync: joinGame } = api.game.join.useMutation();

  return (
    <button
      className="btn"
      onClick={async () => {
        await joinGame({ id });
        onJoined();
      }}
    >
      Join Game
    </button>
  );
}

export default JoinGame;