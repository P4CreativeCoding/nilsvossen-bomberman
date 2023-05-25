let socket;

function preload() {
  socket = io.connect("bombermanbackend.nilsvossen.de");
}
let map = [
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

function initTexture() {
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[0].length; j++) {
      if (map[i][j] === " ") {
        map[i][j] = Math.floor(Math.random() * grass.length);
      }
    }
  }
}

let tileSize = 40;

let players;

let explodedBombs = [];

let grass = [];
let grass1;
let grass2;
let grass3;
let grass4;
let grass5;

let explosion = [];
let explosion1;
let explosion2;
let explosion3;

let stone;

function setup() {
  let canvas = createCanvas(map.length * tileSize, map[0].length * tileSize);
  canvas.parent("canvas");
  frameRate(30);

  grass1 = loadImage("textures/grass1.png");
  grass2 = loadImage("textures/grass2.png");
  grass3 = loadImage("textures/grass3.png");
  grass4 = loadImage("textures/grass4.png");
  grass5 = loadImage("textures/grass5.png");
  grass = [grass1, grass2, grass3, grass4, grass5];

  explosion1 = loadImage("textures/explosion1.png");
  explosion2 = loadImage("textures/explosion2.png");
  explosion3 = loadImage("textures/explosion3.png");
  explosion = [explosion1, explosion2, explosion3];

  stone = loadImage("textures/stone.png");

  initTexture();
  socket.emit("joinGame");

  // Listen for the player's initial position.
  socket.on("playerJoined", function (data) {
    console.log("playerjoined");
    players = data;
  });

  // Listen for player movement updates.
  socket.on("playerMoved", function (data) {
    players = data;
  });

  socket.on("currentPlayers", function (players) {
    // Initialize all players
  });

  socket.on("newPlayer", function (playerData) {
    // Initialize a new player
  });

  socket.on("playerDisconnected", function (playersArray) {
    // Remove a disconnected player
    players = playersArray;
  });

  socket.on("bombPlaced", function (data) {
    players = data;
  });

  socket.on("bombExploded", function (data) {
    players = data[0];
    explodedBombs.push({
      bomb: data[1],
      timestamp: new Date().getTime(),
    });
    console.log(explodedBombs);
    console.log(data[1]);
    setTimeout(() => {
      explodedBombs = explodedBombs.filter(
        (explodedBomb) =>
          !(
            explodedBomb.bomb.x === data[1].x &&
            explodedBomb.bomb.y === data[1].y
          )
      );
    }, 1000); // Explosion lasts for 1 second
  });
}

function drawExplosions() {
  explodedBombs.forEach((explodedBomb) => {
    let bomb = explodedBomb.bomb;
    let explosionStartTime = explodedBomb.timestamp;
    let elapsed = new Date().getTime() - explosionStartTime; // Time since the explosion started
    let explosionDuration = 1000; // The explosion lasts for 1 second

    // If the explosion is still ongoing
    if (elapsed < explosionDuration) {
      let alpha = 255 * ((explosionDuration - elapsed) / explosionDuration); // Calculate alpha value directly

      if (bomb) {
        let directions = [
          [0, 1],
          [1, 0],
          [0, -1],
          [-1, 0],
        ]; // right, down, left, up
        for (let d = 0; d < directions.length; d++) {
          let dx = directions[d][0];
          let dy = directions[d][1];
          for (let i = 0; i <= 3; i++) {
            let x = bomb.x + i * dx;
            let y = bomb.y + i * dy;
            if (x >= 0 && x < map.length && y >= 0 && y < map[0].length) {
              if (map[y][x] === "X") {
                break; // if a wall is encountered, stop drawing in this direction
              } else {
                push();
                tint(255, alpha);
                image(
                  explosion[Math.floor(Math.random() * explosion.length)],
                  x * tileSize,
                  y * tileSize,
                  tileSize,
                  tileSize
                );
                pop();
                //fill(255, 0, 0, alpha); // Set fill color with the calculated alpha
                //rect(x * tileSize, y * tileSize, tileSize, tileSize);
              }
            }
          }
        }
      }
    }
  });
}

function drawMap() {
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
      if (map[i][j] === "X") {
        image(stone, i * tileSize, j * tileSize, tileSize, tileSize);
      } else {
        //fill(255);
        image(grass[map[i][j]], i * tileSize, j * tileSize, tileSize, tileSize);
      }
      //rect(i * tileSize, j * tileSize, tileSize, tileSize);
    }
  }
}

function drawPlayers() {
  if (players) {
    for (let id in players) {
      if (id === socket.id) {
        fill(255, 0, 0);
      } else {
        fill(0, 255, 0);
      }
      rect(
        players[id].x * tileSize + tileSize / 4,
        players[id].y * tileSize + tileSize / 4,
        tileSize / 2,
        tileSize / 2
      );
    }
  }
}

function drawBombs() {
  for (let id in players) {
    if (players[id].bomb) {
      let elapsed = new Date().getTime() - players[id].bomb.timestamp;
      let timeLeft = 3000 - elapsed; // 5000 ms (5 sec) is the total time before the bomb explodes
      let frequency = Math.floor(elapsed / (timeLeft / 5 + 50)); // The less time left, the faster the frequency

      // If the remainder of frequency divided by 2 equals to 0, set color to gray, otherwise red.
      if (frequency % 2 === 0) {
        fill(128, 128, 128); // Gray color
      } else {
        fill(255, 0, 0); // Red color
      }

      rect(
        players[id].bomb.x * tileSize + tileSize / 4,
        players[id].bomb.y * tileSize + tileSize / 4,
        tileSize / 2,
        tileSize / 2
      );
    }
  }
}

function draw() {
  clear();
  drawMap();
  drawExplosions();
  drawBombs();
  drawPlayers();
}

function keyPressed() {
  if (keyCode === UP_ARROW) {
    socket.emit("move", "up");
  } else if (keyCode === DOWN_ARROW) {
    socket.emit("move", "down");
  } else if (keyCode === RIGHT_ARROW) {
    socket.emit("move", "right");
  } else if (keyCode === LEFT_ARROW) {
    socket.emit("move", "left");
  } else if (keyCode === 32) {
    //Spacebar
    socket.emit("placeBomb");
  }
}
