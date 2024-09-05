import { type GetServerSideProps, type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import React, { type FC, useCallback, useEffect, useRef, useState } from "react";
import { zeroAddress } from "viem";
import { useAccount } from "wagmi";

import ChooseSnakeColors from "~/components/Snake/ChooseSnakeColors";
import CreateSnakeGame from "~/components/Snake/Create";
import { Leaderboard } from "~/components/Snake/Leaderboard";
import SaveSnakeGame from "~/components/Snake/SaveGame";
import NokiaWrapper from "~/components/utils/NokiaWrapper";
import { Portal } from "~/components/utils/Portal";
import { api } from "~/utils/api";

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE: { x: number; y: number }[] = [{ x: 0, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_FOOD = { x: 15, y: 15 };

type Direction = typeof INITIAL_DIRECTION;
type Food = typeof INITIAL_FOOD;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;

  return {
    props: {
      initialGameId: id,
    },
  };
};

interface Props {
  initialGameId: string;
}

const SnakeGame: NextPage<Props> = ({ initialGameId }) => {
  const router = useRouter();
  const [id, setId] = useState<string>(initialGameId);
  useEffect(() => {
    // Update gameId when the route changes
    const handleRouteChange = (url: string) => {
      const newGameId = url.split('/').pop();
      if (
        newGameId !== undefined && 
        newGameId !== id && 
        newGameId !== 'play-guest' &&
        newGameId !== 'create' &&
        newGameId !== ''
      ) {
        setId(newGameId);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { data: sessionData } = useSession();
  const { address } = useAccount();

  const { data: userColorsData, isLoading: loadingUserColors } =
    api.nfts.getOwnedBaseColors.useQuery(
      {
        address: address ?? zeroAddress,
      },
      {
        enabled: !!address,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    );
  const { mutate: recordMove } = api.snake.recordMove.useMutation();
  const [snake, setSnake] = useState<typeof INITIAL_SNAKE>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Food>(INITIAL_FOOD);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [userColors, setUserColors] = useState<string[]>([]);
  const [snakeColor, setSnakeColor] = useState<string>("#808080");
  const directionQueue = useRef<Direction[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const startGame = () => {
    setGameStarted(true);
  }

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(INITIAL_FOOD);
    setGameOver(false);
    setScore(0);
    directionQueue.current = [];
  };

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    // Process the next direction from the queue
    if (directionQueue.current.length > 0) {
      const nextDirection = directionQueue.current.shift();
      if (nextDirection) setDirection(nextDirection);
    }

    const newSnake = [...snake];
    const head = { ...newSnake[0] } as (typeof newSnake)[0];
    head.x = (newSnake[0]?.x ?? 0) + direction.x;
    head.y = (newSnake[0]?.y ?? 0) + direction.y;

    // Check collision with walls
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      setGameOver(true);
      recordMove({
        id,
        action: {
          label: "died",
          x: head.x,
          y: head.y,
          currentScore: score,
          length: snake.length,
        },
        gridSize: GRID_SIZE,
      });
      return;
    }

    // Check collision with self
    if (
      newSnake
        .slice(1)
        .some((segment) => segment.x === head.x && segment.y === head.y)
    ) {
      setGameOver(true);
      recordMove({
        id,
        action: {
          label: "died",
          x: head.x,
          y: head.y,
          currentScore: score,
          length: snake.length,
        },
        gridSize: GRID_SIZE,
      });
      return;
    }

    newSnake.unshift(head);

    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
      recordMove({
        id,
        action: {
          label: "eat",
          x: head.x,
          y: head.y,
          currentScore: score + 1,
          length: snake.length + 1,
        },
        gridSize: GRID_SIZE,
      });
      setScore((prevScore) => prevScore + 1);
      setFood(generateFood(newSnake));
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snake, direction, food, gameOver, id, recordMove, score]);

  const generateFood = useCallback((snakeBody: typeof INITIAL_SNAKE) => {
    let newFood: Food;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      snakeBody.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y,
      )
    );
    return newFood;
  }, []);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      if (gameOver) return;

      const handleRecordMove = (
        label: "up" | "down" | "left" | "right" | "eat" | "died",
      ) => {
        recordMove({
          id,
          action: {
            label,
            x: snake[0]?.x ?? 0,
            y: snake[0]?.y ?? 0,
            currentScore: score,
            length: snake.length,
          },
          gridSize: GRID_SIZE,
        });
      };

      const getNextDirection = (key: string): Direction | null => {
        switch (key) {
          case "ArrowUp":
          case "w":
            return { x: 0, y: -1 };
          case "ArrowDown":
          case "s":
            return { x: 0, y: 1 };
          case "ArrowLeft":
          case "a":
            return { x: -1, y: 0 };
          case "ArrowRight":
          case "d":
            return { x: 1, y: 0 };
          default:
            return null;
        }
      };

      const nextDirection = getNextDirection(e.key);
      if (nextDirection) {
        const currentDirection =
          directionQueue.current.length > 0
            ? directionQueue.current[directionQueue.current.length - 1]
            : direction;

        // Prevent 180-degree turns
        if (
          nextDirection.x !== -currentDirection!.x ||
          nextDirection.y !== -currentDirection!.y
        ) {
          directionQueue.current.push(nextDirection);
          handleRecordMove(
            e.key.toLowerCase().replace("arrow", "") as
              | "up"
              | "down"
              | "left"
              | "right",
          );
        }
      }
    },
    [gameOver, id, recordMove, score, snake, direction],
  );

  useEffect(() => {
    setUserColors(userColorsData?.nfts?.map((nft) => nft.name) ?? []);
  }, [userColorsData]);

  useEffect(() => {
    if (gameStarted) {
      const gameLoop = setInterval(moveSnake, 100);
      return () => clearInterval(gameLoop);
    }
  }, [gameStarted, moveSnake]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  console.log({ userColors });

  const StartGame: FC = () => {
    return (
      <div className="w-full h-full grid place-content-center">
        <div className="font-mono text-black flex flex-col gap-2 mx-auto min-w-[250px] mt-2">
          <div className="font-bold text-center">Controls</div>
          <div className="flex flex-col sm:hidden justify-center">
            <div className="flex w-full justify-between items-center text-sm gap-2">
              <div>2 = Up,</div><div>8 = Down,</div><div>4 = Left,</div><div>6 = Right</div>
            </div>
          </div>
          <div className="sm:flex sm:flex-col hidden justify-center">
            <div className="flex w-full justify-between items-center text-sm">
              <div>&#8593; / W</div><div>Up</div>
            </div>
            <div className="flex w-full justify-between items-center text-sm">
              <div>&#8595; / S</div><div>Down</div>
            </div>
            <div className="flex w-full justify-between items-center text-sm">
              <div>&#8592; / A</div><div>Left</div>
            </div>
            <div className="flex w-full justify-between items-center text-sm">
              <div>&#8594; / D</div><div>Right</div>
            </div>
          </div>
        </div>
        <div className="font-bold text-center font-mono mt-8">Leaderboard</div>
        <Leaderboard className="font-mono overflow-y-scroll max-h-[155px]" />
        <button onClick={startGame} className="btn btn-primary mt-2">
          Start Game
        </button>
        {/* <div className="sm:hidden flex flex-col font-mono text-black text-center my-6">
          <div className="font-bold">Tip</div>
          <div>Tapping the numbers with your thumbs makes the game easier to play!</div>
        </div> */}
        
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center">
      <NokiaWrapper
        onButtonPress={(btnLabel) => {
          if (btnLabel === 'home') {
            return document.getElementById('base_color_modal')?.click();
          }
          if (btnLabel === 'voicemail') {
            const prefixAudio = new Audio('/audio/prefix.wav');
            const voicemailAudio = new Audio('/audio/voicemail.mp3');
            prefixAudio.addEventListener('ended', () => {
              void voicemailAudio.play();
            });
            void prefixAudio.play();
          }
          const keyMap = {
            down: "ArrowDown",
            up: "ArrowUp",
            left: "ArrowLeft",
            right: "ArrowRight",
          };

          const keydownEvent = new KeyboardEvent("keydown", {
            key: keyMap[btnLabel as "down" | "up" | "left" | "right"],
          });
          window.dispatchEvent(keydownEvent);
          // Vibrate the phone if the vibrate API is supported
          if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
          }
        }}
        screenWidth={GRID_SIZE * CELL_SIZE}
        screenHeight={GRID_SIZE * CELL_SIZE}
      >
        <div
          className="relative"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {gameStarted ? (
            <>
              <code className="absolute text-xs left-2 top-2">score: {score}</code>
              <div className="absolute inset-0 border-2 border-[#98E15F] rounded-lg">
                {snake.map((segment, index) => (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      left: segment.x * CELL_SIZE,
                      top: segment.y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: snakeColor,
                    }}
                  />
                ))}
                <div
                  className="absolute bg-gray-600"
                  style={{
                    left: food.x * CELL_SIZE,
                    top: food.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                />
              </div>
            </>
          ) : (
            <StartGame />
          )}
          {gameOver && (
            <div className="flex h-full items-center w-full absolute">
              <div className="flex flex-col items-center justify-center w-full gap-2">
                <p className="text-2xl font-bold text-red-600">Game Over!</p>
                <Leaderboard 
                  className="font-mono overflow-y-scroll max-h-[155px] w-full px-4"
                />
                <div className="grid grid-rows-2 gap-2">
                  <SaveSnakeGame gameId={id} />
                  <CreateSnakeGame
                    btnLabel="Play Again"
                    onClick={() => {
                      posthog.capture('play again', { 
                        userAddress: sessionData?.user.address,
                        userId: sessionData?.user.id,
                      });
                      void resetGame();
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </NokiaWrapper>
      <Portal>
        <input type="checkbox" id="base_color_modal" className="modal-toggle" />
          <div className="modal modal-bottom" role="dialog">
            <div className="modal-box max-w-md mx-auto">
              <h3 className="font-bold text-xl mb-2">Select Snake Color</h3>
              <p className="mb-4 text-sm">Select a color from your Base Colors collection to customize your snake</p>
              <label htmlFor="base_color_modal" className="absolute top-4 right-4 btn btn-ghost btn-circle btn-xs">
                &times;
              </label>
              <ChooseSnakeColors
                selectedColor={snakeColor}
                userColors={userColors}
                isLoading={loadingUserColors}
                snakeColorUpdater={setSnakeColor}
              />
            </div>
          </div>
      </Portal>
    </div>
  );
};

export default SnakeGame;
