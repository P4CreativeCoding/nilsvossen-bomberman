let socket;

function preload() {
  socket = io.connect("http://localhost:8080");
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

let tileSize = 40;

let players;

let explodedBombs = [];

function setup() {
  let canvas = createCanvas(map.length * tileSize, map[0].length * tileSize);
  canvas.parent("canvas");
  frameRate(30);

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
    players = data;
    explodedBombs.push({
      bomb: data.bomb,
      timestamp: new Date().getTime(),
    });
    setTimeout(() => {
      explodedBombs = explodedBombs.filter(
        (explodedBomb) =>
          !(
            explodedBomb.bomb.x === data.bomb.x &&
            explodedBomb.bomb.y === data.bomb.y
          )
      );
    }, 1000); // Explosion lasts for 1 second
  });
}

function drawExplosions() {
  fill(255, 0, 0); // Red color
  explodedBombs.forEach((explodedBomb) => {
    let bomb = explodedBomb.bomb;
    if (bomb) {
      // Add this line
      for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
          if (dx === 0 || dy === 0) {
            // only in four directions
            let x = bomb.x + dx;
            let y = bomb.y + dy;
            if (x >= 0 && x < map.length && y >= 0 && y < map[0].length) {
              rect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
          }
        }
      }
    } // And this line
  });
}

function drawMap() {
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
      if (map[i][j] === "X") {
        fill(100, 100, 100);
      } else {
        fill(255);
      }
      rect(i * tileSize, j * tileSize, tileSize, tileSize);
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
      let timeLeft = 5000 - elapsed; // 5000 ms (5 sec) is the total time before the bomb explodes
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
