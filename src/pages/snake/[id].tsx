import { type GetServerSideProps, type NextPage } from 'next';
import React, { useCallback, useEffect, useState } from 'react';

import { api } from '~/utils/api';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE: { x: number; y: number }[] = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_FOOD = { x: 15, y: 15 };

type Direction = typeof INITIAL_DIRECTION;
type Food = typeof INITIAL_FOOD;


export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;

  return {
    props: {
      id,
    },
  };
};

interface Props {
  id: string;
}
const SnakeGame: NextPage<Props> = ({ id }) => {
  const { mutate: recordMove } = api.snake.recordMove.useMutation();
  const [snake, setSnake] = useState<typeof INITIAL_SNAKE>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Food>(INITIAL_FOOD);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    const newSnake = [...snake];
    const head = { ...newSnake[0] } as typeof newSnake[0];
    head.x = (newSnake[0]?.x ?? 0) + direction.x;
    head.y = (newSnake[0]?.y ?? 0) + direction.y;

    // Check collision with walls
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameOver(true);
      return;
    }

    // Check collision with self
    if (newSnake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
      setGameOver(true);
      return;
    }

    newSnake.unshift(head);

    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
      setScore(prevScore => prevScore + 1);
      setFood(generateFood(newSnake));
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snake, direction, food, gameOver]);

  const generateFood = useCallback((snakeBody: typeof INITIAL_SNAKE) => {
    let newFood: Food;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (gameOver) return;

    const handleRecordMove = (direction: 'up' | 'down' | 'left' | 'right') => {
      recordMove({ 
        id,
        move: {
          direction,
          x: snake[0]?.x ?? 0,
          y: snake[0]?.y ?? 0,
          currentScore: score,
        }
      });
    }
    switch (e.key) {
      case 'ArrowUp':
        setDirection(prev => prev.y !== 1 ? { x: 0, y: -1 } : prev);
        handleRecordMove('up');
        break;
      case 'ArrowDown':
        setDirection(prev => prev.y !== -1 ? { x: 0, y: 1 } : prev);
        handleRecordMove('down');
        break;
      case 'ArrowLeft':
        setDirection(prev => prev.x !== 1 ? { x: -1, y: 0 } : prev);
        handleRecordMove('left');
        break;
      case 'ArrowRight':
        setDirection(prev => prev.x !== -1 ? { x: 1, y: 0 } : prev);
        handleRecordMove('right');
        break;
    }
  }, [gameOver, id, recordMove, score, snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(INITIAL_FOOD);
    setGameOver(false);
    setScore(0);
  };

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, 100);
    return () => clearInterval(gameLoop);
  }, [moveSnake]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleKeyPress(e as unknown as React.KeyboardEvent<HTMLDivElement>);
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Snake Game</h1>
      <div className="relative" style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
        <div className="absolute inset-0 border-2 border-gray-300">
          {snake.map((segment, index) => (
            <div
              key={index}
              className="absolute bg-green-500"
              style={{
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            />
          ))}
          <div
            className="absolute bg-red-500"
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />
        </div>
      </div>
      <div className="mt-4 text-xl">Score: {score}</div>
      {gameOver && (
        <div className="mt-4">
          <p className="text-2xl font-bold text-red-600">Game Over!</p>
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={resetGame}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default SnakeGame;