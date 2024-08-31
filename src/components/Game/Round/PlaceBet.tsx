import { type FC } from "react";

import { api } from "~/utils/api";

type Props = { 
  id: string;
  onBetPlaced: () => void;
};
export const PlaceBet: FC<Props> = ({ id, onBetPlaced }) => {
  const { mutateAsync: placeBet } = api.game.placeBet.useMutation();

  return (
    <button
      className="btn"
      onClick={async () => {
        await placeBet({ id, bet: 1 });
        onBetPlaced();
      }}
    >
      Place Bet
    </button>
  );
}

export default PlaceBet;