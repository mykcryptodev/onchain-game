import { type FC } from "react";

import { api } from "~/utils/api";

type Props = { 
  id: string;
  position: number;
  onJoined: () => void;
};
export const JoinGame: FC<Props> = ({ id, onJoined, position }) => {
  const { mutateAsync: joinGame } = api.game.join.useMutation();

  return (
    <button
      className="btn"
      onClick={async () => {
        await joinGame({ id, position });
        onJoined();
      }}
    >
      Join Game
    </button>
  );
}

export default JoinGame;