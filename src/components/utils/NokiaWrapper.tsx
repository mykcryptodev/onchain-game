import Image from 'next/image';
import React, { type FC, type ReactNode, useEffect, useRef, useState } from 'react';

type Props = {
  children: ReactNode;
  screenWidth: number;
  screenHeight: number;
  onButtonPress: (button: string) => void;
};

const Nokia3310Wrapper: FC<Props> = ({ children, screenWidth, screenHeight, onButtonPress }) => {
  const [scale, setScale] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  // Screen position and size (in percentages relative to the phone image)
  const screenTop = 21.5;
  const screenLeft = 19;
  const screenWidthPercent = 64;
  const screenHeightPercent = 27;

  const buttonLayout = [
    { label: '1', top: 62, left: 20, width: 18, height: 9 },
    { label: '2', top: 62, left: 41, width: 18, height: 9 },
    { label: '3', top: 62, left: 62, width: 18, height: 9 },
    { label: '4', top: 72, left: 20, width: 18, height: 9 },
    { label: '5', top: 72, left: 41, width: 18, height: 9 },
    { label: '6', top: 72, left: 62, width: 18, height: 9 },
    { label: '7', top: 82, left: 20, width: 18, height: 9 },
    { label: '8', top: 82, left: 41, width: 18, height: 9 },
    { label: '9', top: 82, left: 62, width: 18, height: 9 },
    { label: '*', top: 92, left: 20, width: 18, height: 9 },
    { label: '0', top: 92, left: 41, width: 18, height: 9 },
    { label: '#', top: 92, left: 62, width: 18, height: 9 },
    { label: 'up', top: 54, left: 41, width: 18, height: 6 },
    { label: 'down', top: 60, left: 41, width: 18, height: 6 },
    { label: 'left', top: 57, left: 35, width: 6, height: 6 },
    { label: 'right', top: 57, left: 59, width: 6, height: 6 },
  ];

  useEffect(() => {
    const updateScale = () => {
      if (contentRef.current && screenRef.current) {
        const contentWidth = contentRef.current.offsetWidth;
        const contentHeight = contentRef.current.offsetHeight;
        const screenWidth = screenRef.current.offsetWidth;
        const screenHeight = screenRef.current.offsetHeight;

        const scaleX = screenWidth / contentWidth;
        const scaleY = screenHeight / contentHeight;
        const newScale = Math.min(scaleX, scaleY) * 0.95; // 0.95 to add a small margin

        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div className="relative w-full h-full" style={{ aspectRatio: '1/2' }}>
      <Image
        src="/images/nokia.svg" 
        alt="Nokia 3310" 
        className="w-full h-full object-contain"
        layout="fill"
      />
      
      <div 
        ref={screenRef}
        className="absolute overflow-hidden"
        style={{
          top: `${screenTop}%`,
          left: `${screenLeft}%`,
          width: `${screenWidthPercent}%`,
          height: `${screenHeightPercent}%`,
        }}
      >
        <div className="w-full h-full p-1 box-border">
          <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
            <div 
              ref={contentRef}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center',
                width: `${screenWidth}px`,
                height: `${screenHeight}px`,
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      {buttonLayout.map((button) => (
        <button
          key={button.label}
          className="absolute bg-transparent"
          style={{
            top: `${button.top}%`,
            left: `${button.left}%`,
            width: `${button.width}%`,
            height: `${button.height}%`,
          }}
          onClick={() => onButtonPress(button.label)}
        />
      ))}
    </div>
  );
};

export default Nokia3310Wrapper;