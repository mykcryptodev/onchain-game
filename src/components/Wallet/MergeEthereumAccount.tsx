import { getCsrfToken, signIn, useSession } from 'next-auth/react';
import { type FC, useState } from 'react';
import { SiweMessage } from 'siwe';
import { useAccount, useSignMessage } from 'wagmi';

type Props = {
  btnLabel?: string;
}
const MergeEthereumAccount: FC<Props> = ({ btnLabel }) => {
  const { data: sessionData } = useSession();
  const { signMessageAsync } = useSignMessage();
  const account = useAccount();
  const [isLinking, setIsLinking] = useState(false);

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
        statement: `Link User: ${sessionData.user.id}`,
        nonce,
      }).prepareMessage();

      const signature = await signMessageAsync({ message });

      // await linkEthereumAddress({ message, signature, address: account.address });
      const response = await signIn("ethereum", {
        message,
        signature,
        address: account.address,
        redirect: false,
      });
      console.log('response:', response);
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
      {btnLabel ?? 'Merge Ethereum Account'}
    </button>
  );
};

export default MergeEthereumAccount;