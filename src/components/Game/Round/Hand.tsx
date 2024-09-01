import { type Card, type Hand } from "@prisma/client";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { type FC,useMemo } from "react";

import { api } from "~/utils/api";

type Props = {
  hand?: Hand & {
    cards: Card[];
  };
  gameId: string;
  onAction: (action: "hit" | "stand") => void;
};
export const HandComponent: FC<Props> = ({ hand, gameId, onAction }) => {
  const { data: session } = useSession();
  const { mutateAsync: hit } = api.game.hit.useMutation();
  const { mutateAsync: stand } = api.game.stand.useMutation();

  const isPlayerHand = useMemo(() => {
    return session?.user?.id === hand?.playerId;
  }, [session?.user?.id, hand?.playerId]);

  if (!hand) return null;
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
    </div>
  );
};

export default HandComponent;
