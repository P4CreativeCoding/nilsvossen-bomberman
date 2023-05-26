const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();

const server = http.createServer(app);
const io = socketIo(server);

let players = {};

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

function initPlayer() {
  let position = getRandomPosition();
  while (map[position.x][position.y] === "X") {
    position = getRandomPosition();
  }
  return position;
}
function getRandomPosition() {
  return {
    x: Math.floor(Math.random() * map.length),
    y: Math.floor(Math.random() * map[0].length),
  };
}

function explodeBomb(bomb) {
  let directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ]; // right, down, left, up
  for (let id in players) {
    // Check if player exists
    if (players[id]) {
      for (let d = 0; d < directions.length; d++) {
        let dx = directions[d][0];
        let dy = directions[d][1];
        for (let i = 0; i <= 3; i++) {
          let x = bomb.x + i * dx;
          let y = bomb.y + i * dy;
          if (x >= 0 && x < map.length && y >= 0 && y < map[0].length) {
            if (map[y][x] === "X") {
              break; // if a wall is encountered, stop checking in this direction
            } else if (
              players[id] &&
              players[id].x === x &&
              players[id].y === y
            ) {
              delete players[id]; // if a player is encountered, remove the player and keep checking in this direction
            }
          }
        }
      }
    }
  }
}

io.on("connection", (socket) => {
  console.log("New player connected", socket.id);
  let startingPosition = initPlayer();
  players[socket.id] = {
    x: startingPosition.x,
    y: startingPosition.y,
  };
  io.emit("playerJoined", players);

  socket.on("disconnect", () => {
    console.log("Player disconnected", socket.id);
    delete players[socket.id];
    // emit a message to all other sockets to remove this player
    io.emit("playerDisconnected", players);
  });

  socket.on("move", (direction) => {
    let player = players[socket.id];
    if (!player) {
      return;
    }

    // Store intended new positions
    let newX = player.x;
    let newY = player.y;

    if (direction === "up" && player.y > 0) {
      newY--;
    } else if (direction === "down" && player.y < map[0].length - 1) {
      newY++;
    } else if (direction === "right" && player.x < map.length - 1) {
      newX++;
    } else if (direction === "left" && player.x > 0) {
      newX--;
    }

    // Check if there's a block, bomb or another player at the new position
    if (map[newX][newY] === "X") {
      return; // If there's a block, do not move
    }

    for (let id in players) {
      let otherPlayer = players[id];
      if (
        (otherPlayer.x === newX && otherPlayer.y === newY) ||
        (otherPlayer.bomb &&
          otherPlayer.bomb.x === newX &&
          otherPlayer.bomb.y === newY)
      ) {
        return; // If there's a bomb or another player, do not move
      }
    }

    // If there's no block, bomb or player, update player position
    player.x = newX;
    player.y = newY;

    io.emit("playerMoved", players);
  });

  socket.on("placeBomb", () => {
    console.log("placed");
    if (players[socket.id] && !players[socket.id].bomb) {
      let bomb = {
        x: players[socket.id].x,
        y: players[socket.id].y,
        owner: socket.id,
        timestamp: new Date().getTime(),
      };
      players[socket.id].bomb = bomb;
      io.emit("bombPlaced", players);
      setTimeout(() => {
        try {
          explodeBomb(bomb);
        } catch (error) {
          console.log("error when bomb explodes");
        }
        if (players[socket.id]) {
          delete players[socket.id].bomb;
        }
        io.emit("bombExploded", [players, bomb]);
      }, 3000);
    }
  });
});

server.listen(8080, () => {
  console.log("Server is running on port 8080");
});
