import { useSession } from "next-auth/react";
import { type FC } from "react";

type Props = {
  gameId: string;
}
export const SaveSnakeGame: FC<Props> = ({ gameId }) => {
  const { data: sessionData } = useSession();
  console.log({ 'saveGameDataSesh': sessionData });

  if (!sessionData?.user) return null;

  if (!sessionData?.user.address) {
    return (
      <div>
        Save Game With Your Face
      </div>
    )
  }

  return (
    <button 
      className="btn btn-primary"
    >
      Save Game
    </button>
  );
};

export default SaveSnakeGame;