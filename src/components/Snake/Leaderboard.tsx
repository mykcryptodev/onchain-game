import { Name } from "@coinbase/onchainkit/identity";
import { type FC } from "react";
import { base } from "viem/chains";

import { api } from "~/utils/api";

type Props = {
  className?: string;
}

export const Leaderboard: FC<Props> = ({ className }) => {
  const { data: leaderboard, isLoading } = api.snake.getLeaderboard.useQuery(undefined, {
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  if (isLoading) return (
    <div className="loading loading-spinner mx-auto" />
  );

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {leaderboard?.map(
        ({ player, score }, i) => 
      (
        <div key={i} className="flex items-center gap-4 justify-between w-full">
          <div className="flex items-center gap-1">
            <span>{i + 1}</span>
            <Name address={player} className={`${className} font-normal mt-0`} chain={base} />
          </div>
          <div>{score.toString()}</div>
        </div>
      ))}
    </div>
  )
};

export default Leaderboard;