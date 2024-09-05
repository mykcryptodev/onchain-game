import {
  Address,
  Avatar,
  EthBalance,
  Identity,
  Name,
} from '@coinbase/onchainkit/identity';
import { color } from '@coinbase/onchainkit/theme';
import {
  ConnectWallet,
  Wallet as WalletComponent,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
  WalletDropdownFundLink,
  WalletDropdownLink,
} from '@coinbase/onchainkit/wallet';
import { signOut, useSession } from 'next-auth/react';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import { defineChain } from 'thirdweb';
import { viemAdapter } from "thirdweb/adapters/viem";
import { useSetActiveWallet } from 'thirdweb/react';
import { createWalletAdapter } from 'thirdweb/wallets';
import { useAccount,useDisconnect, useSwitchChain, useWalletClient } from "wagmi";

import { thirdwebClient } from '~/config/thirdweb';
import usePrevious from '~/hooks/usePrevious';

type Props = {
  btnLabel?: string;
  withWalletAggregator?: boolean;
}
export function Wallet({ btnLabel, withWalletAggregator }: Props) {
  const { address } = useAccount();
  const previousAddress = usePrevious(address);
  const { data: sessionData } = useSession();

  const setActiveWallet = useSetActiveWallet();
  const { data: walletClient } = useWalletClient();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    const addressWasChanged = previousAddress !== address;
    const userConnectedForFirstTime = previousAddress === undefined && address !== undefined;
    const userHasSession = sessionData?.user !== undefined;
    if (
      addressWasChanged && 
      !userConnectedForFirstTime && 
      userHasSession
    ) {
      void signOut();
    }
  }, [address, disconnectAsync, previousAddress, sessionData]);

  useEffect(() => {
    const setActive = async () => {
      if (walletClient) {
        posthog.capture('connected wallet', {
          chainId: await walletClient.getChainId(),
          wallet: walletClient.constructor.name,
          address: walletClient.account.address,
        });
        // adapt the walletClient to a thirdweb account
        const adaptedAccount = viemAdapter.walletClient.fromViem({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          walletClient: walletClient as any, // accounts for wagmi/viem version mismatches
        });
        // create the thirdweb wallet with the adapted account
        const thirdwebWallet = createWalletAdapter({
          client: thirdwebClient,
          adaptedAccount,
          chain: defineChain(await walletClient.getChainId()),
          onDisconnect: async () => {
            await disconnectAsync();
          },
          switchChain: async (chain) => {
            await switchChainAsync({ chainId: chain.id });
          },
        });
        void setActiveWallet(thirdwebWallet);
      }
    };
    void setActive();
  }, [disconnectAsync, setActiveWallet, switchChainAsync, walletClient]);

  return (
    <div className="flex gap-2 items-center">
      <WalletComponent>
        <ConnectWallet withWalletAggregator={withWalletAggregator} text={btnLabel}>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className={color.foregroundMuted} />
            <EthBalance />
          </Identity>
          <WalletDropdownBasename />
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </WalletComponent>
      {address && (
        <>
          <WalletComponent>
            <WalletDropdown>
              <WalletDropdownFundLink />
              <WalletDropdownLink icon="wallet" href="https://wallet.coinbase.com">
                Wallet
              </WalletDropdownLink>
            </WalletDropdown>
          </WalletComponent>
        </>
      )}
    </div>
  );
}
