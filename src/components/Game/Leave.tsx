import { type FC } from "react";

import { api } from "~/utils/api";

type Props = { 
  id: string;
  onLeft: () => void;
};
export const LeaveGame: FC<Props> = ({ id, onLeft }) => {
  const { mutateAsync: leaveGame } = api.game.leave.useMutation();

  return (
    <button
      className="btn"
      onClick={async () => {
        await leaveGame({ id });
        onLeft();
      }}
    >
      Leave Game
    </button>
  );
}

export default LeaveGame;