import { type FC } from "react";

import { api } from "~/utils/api";

type Props = {
  gameId: string;
  onDealerPlayed: () => void;
};
export const DealerPlay: FC<Props> = ({ onDealerPlayed, gameId }) => {
  const { mutateAsync: dealerPlay } = api.game.dealerPlay.useMutation();
  return (
    <button
      className="btn"
      onClick={async () => {
        await dealerPlay({ id: gameId });
        onDealerPlayed();
      }}
    >
      Dealer Play
    </button>
  );
}

export default DealerPlay;