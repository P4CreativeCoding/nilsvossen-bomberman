const express = require("express");
const http = require("http");
const { start } = require("repl");
const socketIo = require("socket.io");

const app = express();

app.use(express.static(__dirname + "/public"));

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
  for (let id in players) {
    let xDistance = Math.abs(players[id].x - bomb.x);
    let yDistance = Math.abs(players[id].y - bomb.y);
    // A player should be removed if they are within the blast radius on either axis
    if (xDistance <= 3 && yDistance == 0) {
      // Player is within blast radius horizontally
      delete players[id];
    } else if (yDistance <= 3 && xDistance == 0) {
      // Player is within blast radius vertically
      delete players[id];
    }
  }

  // Notify all players about the explosion
  io.emit("bombExploded", bomb);
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
    if (!players[socket.id].bomb) {
      let bomb = {
        x: players[socket.id].x,
        y: players[socket.id].y,
        owner: socket.id,
        timestamp: new Date().getTime(), // Store the time when the bomb is placed
      };
      players[socket.id].bomb = bomb;
      io.emit("bombPlaced", players);
      setTimeout(() => {
        explodeBomb(bomb);
        delete players[socket.id]?.bomb;
        io.emit("bombExploded", players);
      }, 5000);
    }
  });
});

server.listen(8080, () => {
  console.log("Server is running on port 8080");
});
