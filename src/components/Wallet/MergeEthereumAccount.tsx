import { getCsrfToken, useSession } from 'next-auth/react';
import { type FC, useState } from 'react';
import { SiweMessage } from 'siwe';
import { useAccount, useSignMessage } from 'wagmi';

import { APP_NAME } from '~/constants';
import { api } from '~/utils/api';

const MergeEthereumAccount: FC = () => {
  const { data: sessionData } = useSession();
  const { signMessageAsync } = useSignMessage();
  const account = useAccount();
  const [isLinking, setIsLinking] = useState(false);
  const { mutateAsync: linkEthereumAddress } = api.user.linkEthereumAddress.useMutation();

  console.log('game sesh', sessionData);
  const handleLinkAddress = async () => {
    if (!account.address || !sessionData?.user) return;
    setIsLinking(true);

    try {
      const nonce = await getCsrfToken();

      const message = new SiweMessage({
        domain: document.location.host,
        address: account.address,
        chainId: account.chainId,
        uri: document.location.origin,
        version: '1',
        statement: `Link Ethereum account with ${APP_NAME}`,
        nonce,
      }).prepareMessage();

      const signature = await signMessageAsync({ message });

      await linkEthereumAddress({ message, signature, address: account.address });
    } catch (e) {
      console.error('Error linking address:', e);
    } finally {
      setIsLinking(false);
    }
  };

  if (!sessionData?.user) return null;

  return (
    <button
      onClick={handleLinkAddress}
      className="btn"
      disabled={isLinking}
    >
      {isLinking && (
        <div className="loading loading-spinner" />
      )}
      Merge Ethereum Account
    </button>
  );
};

export default MergeEthereumAccount;