import { type Card, type Hand,type Player } from "@prisma/client";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { type FC,useMemo } from "react";

import { api } from "~/utils/api";

type Props = {
  hand?: Hand & {
    cards: Card[];
  };
  players: Player[];
  gameId: string;
  onAction: (action: "hit" | "stand") => void;
};
export const HandComponent: FC<Props> = ({ hand, gameId, players, onAction }) => {
  const userPlayer = players.find((player) => player.id === hand?.playerId);
  const { data: session } = useSession();
  const { mutateAsync: hit } = api.game.hit.useMutation();
  const { mutateAsync: stand } = api.game.stand.useMutation();

  const isPlayerHand = useMemo(() => {
    return session?.user?.id === userPlayer?.userId;
  }, [session?.user?.id, userPlayer?.userId]);

  if (!hand) return null;
  const handValue = hand.cards.reduce((acc, card) => {
    let cardValue = 0;
    if (card.value === "ACE") {
      cardValue = acc + 11 > 21 ? 1 : 11;
    } else if (["JACK", "QUEEN", "KING"].includes(card.value)) {
      cardValue = 10;
    } else {
      cardValue = parseInt(card.value);
    }
    return acc + cardValue;
  }, 0);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {hand.cards.map((card) => (
          <div key={card.id} className="flex gap-2">
            <Image
              key={card.id}
              src={card.image}
              alt={card.code}
              width={64}
              height={96}
              className="w-16"
            />
          </div>
        ))}
      </div>
      {isPlayerHand && hand.status === 'active' && (
        <div className="flex gap-2">
          <button 
            className="btn btn-ghost"
            onClick={async () => {
              await hit({ id: gameId });
              onAction("hit");
            }}>
              Hit
          </button>
          <button 
            className="btn btn-ghost"
            onClick={async () => {
              await stand({ id: gameId });
              onAction("stand");
            }}>
              Stand
          </button>
        </div>
      )}
      <div>
        {!isNaN(handValue) && handValue}
      </div>
    </div>
  );
};

export default HandComponent;
