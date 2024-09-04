type ChooseColorsProps = {
  userColors: string[];
  isLoading: boolean;
  selectedColor: string;
  snakeColorUpdater: React.Dispatch<React.SetStateAction<string>>;
};

export default function ChooseSnakeColors({
  userColors,
  isLoading,
  selectedColor,
  snakeColorUpdater,
}: ChooseColorsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center">
        ...loading colors
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {userColors.length > 0 ? (
        userColors.map((color) => (
          <div key={color} className="flex gap-2">
            <button
              onClick={() => snakeColorUpdater(color)}
              className={`badge badge-lg ${color === selectedColor ? 'badge-primary' : 'badge-outline'}`}
            >
              <div 
                className="rounded-full h-3.5 w-3.5 mr-2"
                style={{ backgroundColor: color }}
              />
              {color}
            </button>
          </div>
        ))
      ) : (
        <div>No Owned BaseColors</div>
      )}
    </div>
  );
}
