import Image from "next/image";
import { type FC } from "react";

type Props = {
  score: number;
}

export const Share: FC<Props> = ({ score }) => {
  const shareText = encodeURIComponent(
    `I just scored ${score} in onchain snake! 🐍 Can you beat that?` + '\n\n' +
    'https://onchainsnake.xyz'
  );
  const xShareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;
  const wcShareUrl = `https://warpcast.com/~/compose?text=${shareText}`;

  const handleShare = (platform: string) => {
    if (platform === 'x') {
      return window.open(xShareUrl, '_blank');
    }
    return window.open(wcShareUrl, '_blank');;
  }

  const shareButtons = [
    {
      image: '/images/x.svg',
      platform: 'x',
    },
    {
      image: '/images/warpcast.png',
      platform: 'warpcast',
    }
  ]

  return (
    <div className="flex items-center gap-2">
      {shareButtons.map(({ image, platform }) => (
        <button
          key={platform}
          onClick={() => handleShare(platform)}
          className="btn btn-sm btn-ghost"
        >
          <Image
            src={image}
            alt={platform}
            width={24}
            height={24}
            className="rounded"
          />
        </button>
      ))}
    </div>
  )
};

export default Share;