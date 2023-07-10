const initTexture = require("./sketch.js");

// Tests that all empty spaces in the map are replaced with a random grass texture index
// Tests that function does not throw an error when map is empty
it("test_empty_map", () => {
  map = [];
  expect(() => initTexture()).not.toThrow();
});

// Tests that function does not throw an error when map is not a 2D array
it("test_non_2d_array", () => {
  map = [1, 2, 3];
  expect(() => initTexture()).not.toThrow();
});

// Tests that function does not modify non-empty spaces in the map
it("test_non_empty_spaces_not_modified", () => {
  let originalMap = JSON.parse(JSON.stringify(map));
  initTexture();
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[0].length; j++) {
      if (originalMap[i][j] !== " ") {
        expect(map[i][j]).toBe(originalMap[i][j]);
      }
    }
  }
});

// Tests that all grass texture indices are integers
it("test_grass_texture_indices_are_integers", () => {
  initTexture();
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[0].length; j++) {
      if (typeof map[i][j] === "number") {
        expect(Number.isInteger(map[i][j])).toBe(true);
      }
    }
  }
});

// Tests that all grass texture indices are within the range of available textures
it("test_grass_texture_indices_within_range", () => {
  initTexture();
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[0].length; j++) {
      if (typeof map[i][j] === "number") {
        expect(map[i][j]).toBeGreaterThanOrEqual(0);
        expect(map[i][j]).toBeLessThan(grass.length);
      }
    }
  }
});
