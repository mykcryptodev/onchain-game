import { type FC } from "react";

import { api } from "~/utils/api";

type Props = {
  gameId: string;
  onRoundEnded: () => void;
};
export const EndRound: FC<Props> = ({ gameId, onRoundEnded }) => {
  const { mutateAsync: endRound } = api.game.endRound.useMutation();
  return (
    <button
      className="btn"
      onClick={async () => {
        await endRound({ id: gameId });
        onRoundEnded();
      }}
    >
      End Round
    </button>
  );
}

export default EndRound;