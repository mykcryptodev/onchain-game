type ChooseColorsProps = {
  userColors: string[];
  isLoading: boolean;
  snakeColorUpdater: React.Dispatch<React.SetStateAction<string>>;
};

export default function ChooseSnakeColors({
  userColors,
  isLoading,
  snakeColorUpdater,
}: ChooseColorsProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gray-100 pt-10">
        ...loading colors
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 pt-10">
      <h1 className="mb-4 text-center text-xl font-bold">Your BaseColors</h1>
      {userColors.length > 0 ? (
        userColors.map((color) => (
          <div key={color} className="flex flex-row gap-2">
            <div
              onClick={() => snakeColorUpdater(color)}
              className="h-6 w-6"
              style={{
                backgroundColor: color,
              }}
            />
            <span>{color}</span>
          </div>
        ))
      ) : (
        <div>No Owned BaseColors</div>
      )}
    </div>
  );
}
