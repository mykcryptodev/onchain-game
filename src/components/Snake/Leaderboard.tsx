import { Name } from "@coinbase/onchainkit/identity";
import { type FC,useEffect, useState } from "react";
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { base } from "viem/chains";

import { thirdwebClient } from "~/config/thirdweb";
import { SNAKE_LEADERBOARD } from "~/constants/addresses";
import { getLeaderboard } from "~/thirdweb/84532/0x5decd7c00316f7b9b72c8c2d8b4e2d7e5a886259";

type Props = {
  className?: string;
}

type Leaderboard = {
  player: string;
  score: bigint;
  ipfsCid: string;
  timestamp: bigint;
}[];

export const Leaderboard: FC<Props> = ({ className }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [leaderboard, setLeaderboard] = useState<Leaderboard>();
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const onchainData = await getLeaderboard({
          contract: getContract({
            client: thirdwebClient,
            address: SNAKE_LEADERBOARD,
            chain: baseSepolia,
          }),
        });
        console.log({ onchainData });
        setLeaderboard([...onchainData]);
      } catch (e) {
        console.error("Error fetching leaderboard:", e);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchLeaderboard();
  }, []);

  if (isLoading) return (
    <div className="loading loading-spinner" />
  );

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {leaderboard?.map(
        ({ player, score, ipfsCid }, i) => 
      (
        <div key={ipfsCid} className="flex items-center gap-4 justify-between w-full">
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