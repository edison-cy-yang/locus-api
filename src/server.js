const ENV = require("./environment");
const PORT = process.env.PORT || 8080;
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const morgan = require("morgan");
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// PG database client/connection setup
const db = require("./db/index");

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan("dev"));
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Separated Routes for each Resource
const usersRoutes = require("./routes/users");
const imagesRoutes = require("./routes/images");
const categoriesRoutes = require("./routes/categories");

// Mount all resource routes
app.use("/api/users", usersRoutes(db));
app.use("/api/images", imagesRoutes(db));
app.use("/api/categories", categoriesRoutes(db));

// Home page
app.get("/", (req, res) => {
  res.json("{hello: world}");
});


io.on("connection", socket => {
  console.log("a user connected :D");

  let chatRoom;

  //When user requests to join the room
  socket.on('room', (room) => {
    socket.join(room.roomId);
    chatRoom = room.roomId;
    io.sockets.in(chatRoom).emit('new person', room.name);

    io.of('/').in(chatRoom).clients((err, clients) => {
      console.log("number of people in room" + clients.length);
    })
  });

  //When a message is sent
  socket.on("chat message", msg => {
    io.sockets.in(chatRoom).emit("chat message", msg);
  });

  //When a user leaves the room
  socket.on("leave", (name) => {
    socket.leave(chatRoom);
    io.sockets.in(chatRoom).emit('someone left', name);
  });

  //When a user is disconnected
  socket.on("disconnect", () => {
    console.log(`user disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}, in ${ENV}`);
});

