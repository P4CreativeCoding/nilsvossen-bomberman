const initPlayer = require("./server");
const map = [
  [" ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
  [" ", "X", "X", " ", "X", "X", " ", "X", "X", " "],
  [" ", "X", "X", " ", "X", "X", " ", "X", "X", " "],
  [" ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
  [" ", "X", "X", " ", "X", "X", " ", "X", "X", " "],
  [" ", "X", "X", " ", "X", "X", " ", "X", "X", " "],
  [" ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
  [" ", "X", "X", " ", "X", "X", " ", "X", "X", " "],
  [" ", "X", "X", " ", "X", "X", " ", "X", "X", " "],
  [" ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
];
// Tests that initPlayer function returns an object with x and y properties
it("test_returns_object_with_x_and_y_properties", () => {
  const result = initPlayer();
  expect(result).toHaveProperty("x");
  expect(result).toHaveProperty("y");
});

// Tests that the initPlayer function returns a position that is not an X on the map
it("test_returned_position_not_X", () => {
  const position = initPlayer();
  expect(map[position.x][position.y]).not.toBe("X");
});

// Tests that the initPlayer function returns a different position each time it is called
it("test_returns_different_position_each_time", () => {
  const positions = [];
  for (let i = 0; i < 10; i++) {
    const position = initPlayer();
    expect(positions).not.toContainEqual(position);
    positions.push(position);
  }
});
