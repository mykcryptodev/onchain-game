import React, { type FC, type ReactNode, useMemo } from 'react';

type Props = {
  children: ReactNode;
  screenWidth: number;
  screenHeight: number;
};

const GameBoyWrapper: FC<Props> = ({ children, screenWidth, screenHeight }) => {
  const dimensions = useMemo(() => {
    // Base dimensions for the GameBoy
    const baseWidth = 400;
    const baseHeight = 650;
    const baseScreenWidth = 320;
    const baseScreenHeight = 288;

    // Calculate scale based on the larger dimension
    const scaleX = screenWidth / baseScreenWidth;
    const scaleY = screenHeight / baseScreenHeight;
    const scale = Math.max(scaleX, scaleY);

    // Calculate new dimensions
    const newWidth = baseWidth * scale;
    const newHeight = baseHeight * scale;

    // Calculate sizes for other elements
    const logoSize = Math.max(16, Math.min(24, newWidth / 20));
    const buttonSize = Math.max(48, Math.min(64, newWidth / 8));

    return {
      width: newWidth,
      height: newHeight,
      scale,
      logoSize,
      buttonSize,
      screenContainerWidth: screenWidth + 32 * scale,
      screenContainerHeight: screenHeight + 32 * scale
    };
  }, [screenWidth, screenHeight]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div 
        className="relative bg-gray-200 rounded-[30px] shadow-xl flex flex-col items-center justify-start p-8"
        style={{ 
          width: `${dimensions.width}px`, 
          height: `${dimensions.height}px`,
        }}
      >
        {/* GameBoy body */}
        <div className="w-full h-full bg-gray-300 rounded-[20px] p-4 flex flex-col items-center justify-start">
          {/* Screen area */}
          <div 
            className="bg-gray-800 rounded-[10px] mb-6 p-2 flex items-center justify-center"
            style={{ width: `${dimensions.screenContainerWidth}px`, height: `${dimensions.screenContainerHeight}px` }}
          >
            <div className="w-full h-full bg-[#8bac0f] rounded-[5px] flex items-center justify-center overflow-hidden">
              {/* Game content */}
              {children}
            </div>
          </div>
          
          {/* logo */}
          <div 
            className="font-bold italic text-blue-600 mb-6"
            style={{ fontSize: `${dimensions.logoSize}px` }}
          >
            ONCHAIN SNAKE
          </div>
          
          {/* Controls */}
          <div className="w-full flex justify-between mb-6">
            {/* D-pad */}
            <div 
              className="bg-gray-400 rounded-full relative"
              style={{ width: `${dimensions.buttonSize * 1.5}px`, height: `${dimensions.buttonSize * 1.5}px` }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="bg-gray-600 flex items-center justify-center"
                  style={{ width: `${dimensions.buttonSize * 1.2}px`, height: `${dimensions.buttonSize * 1.2}px` }}
                >
                  <div 
                    className="bg-gray-500 rounded-full"
                    style={{ width: `${dimensions.buttonSize}px`, height: `${dimensions.buttonSize}px` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* A and B buttons */}
            <div className="flex space-x-4">
              <label 
                htmlFor="base_color_modal"
                className="bg-red-500 rounded-full shadow-md flex items-center justify-center text-white font-bold"
                style={{ width: `${dimensions.buttonSize}px`, height: `${dimensions.buttonSize}px` }}
              >
                B
              </label>
              <button 
                className="bg-red-500 rounded-full shadow-md flex items-center justify-center text-white font-bold"
                style={{ width: `${dimensions.buttonSize}px`, height: `${dimensions.buttonSize}px` }}
              >
                A
              </button>
            </div>
          </div>
          
          {/* Start and Select buttons */}
          <div className="flex space-x-8">
            <div 
              className="bg-gray-500 rounded-full transform -rotate-12"
              style={{ width: `${dimensions.buttonSize * 0.8}px`, height: `${dimensions.buttonSize * 0.25}px` }}
            ></div>
            <div 
              className="bg-gray-500 rounded-full transform -rotate-12"
              style={{ width: `${dimensions.buttonSize * 0.8}px`, height: `${dimensions.buttonSize * 0.25}px` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoyWrapper;