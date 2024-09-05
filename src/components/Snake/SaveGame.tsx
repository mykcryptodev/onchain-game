import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FC,useEffect,useState } from "react";
import { useAccount } from "wagmi";

import { Portal } from "~/components/utils/Portal";
import { Wallet } from "~/components/Wallet";
import MergeEthereumAccount from "~/components/Wallet/MergeEthereumAccount";
import { api } from "~/utils/api";

type Props = {
  gameId: string;
}
export const SaveSnakeGame: FC<Props> = ({ gameId }) => {
  const { address } = useAccount();
  const { data: sessionData } = useSession();
  const tabs = ['Connect Wallet', 'Verify Wallet'] as readonly string[];
  const [activeTab, setActiveTab] = useState<string>(tabs[0]!);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSaved, setHasSaved] = useState<boolean>(false);
  const { mutateAsync: saveGame } = api.snake.saveGame.useMutation();

  useEffect(() => {
    if (!address) return;
    setActiveTab('Verify Wallet');
  }, [address]);

  const handleSave = async () => {
    // capture the click event
    posthog.capture('save game', { 
      userAddress: sessionData?.user.address,
      userId: sessionData?.user.id,
      gameId,
    });
    setIsLoading(true);
    try {
      await saveGame({ id: gameId });
      setHasSaved(true);
    } catch (e) {
      console.error('Error saving game:', e);
    } finally {
      // wait 2.5 seconds then set isLoading to False
      setTimeout(() => {
        setIsLoading(false);
      }, 4500);
    }
  }

  if (!sessionData?.user.address) {
    return (
      <>
        <label htmlFor="connect_modal" className="btn">Add score to leaderboard</label>
        <Portal>
          <input type="checkbox" id="connect_modal" className="modal-toggle" />
          <div className="modal" role="dialog">
            <div className="modal-box">
              <h3 className="font-bold text-xl mb-4">Add score to leaderboard</h3>
              <p className="text-center max-w-xs mx-auto">A one-time verification of your wallet is required to publish your score</p>
              <label htmlFor="connect_modal" className="absolute top-4 right-4 btn btn-ghost btn-circle btn-xs">
                &times;
              </label>
              <ul className="steps w-full mb-4">
                {tabs.map((tab, i) => (
                  <li 
                    key={i} 
                    className={`step ${i <= tabs.indexOf(activeTab) ? 'step-primary' : ''}`}
                  >
                    <button
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  </li>
                ))}
              </ul>
              {activeTab === 'Connect Wallet' && (
                <div className="w-full justify-center flex gap-2">
                  <Wallet btnLabel="Create Wallet" withWalletAggregator={false} />
                  <Wallet btnLabel="Connect Wallet" withWalletAggregator={true} />
                </div>
              )}
              {activeTab === 'Verify Wallet' && (
                <div className="w-full justify-center flex">
                  <MergeEthereumAccount btnLabel="Verify Wallet" />
                </div>
              )}
            </div>
          </div>
        </Portal>
      </>
    );
  }

  if (!sessionData?.user.address) {
    return (
      <MergeEthereumAccount btnLabel="Save game with your face" />
    )
  }

  if (hasSaved) {
    return (
      <div className="flex flex-col">
        <button 
          className="btn"
          disabled
        >
          Score saved!
        </button>
        <span className="text-xs opacity-50">Updates can take a few minutes</span>
      </div>
    );
  }

  return (
    <button 
      className="btn"
      disabled={isLoading}
      onClick={handleSave}
    >
      {isLoading && (
        <div className="loading loading-spinner" />
      )}
      Add score to leaderboard
    </button>
  );
};

export default SaveSnakeGame;