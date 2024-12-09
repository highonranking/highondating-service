const initializeSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: `${process.env.CLIENT_URL}`,
      methods: ['GET', 'POST'],
    },
  });

  io.on("connection", (socket) => {

    socket.on("join_room", (user1Id, user2Id) => {
      const roomId = [user1Id, user2Id].sort().join("_");
      socket.join(roomId);
    });

    socket.on("new_message", (message) => {
      const { senderId, receiverId } = message;
      const roomId = [senderId, receiverId].sort().join("_");
      io.to(roomId).emit("new_message", message);
    });

    socket.on("leave_room", (user1Id, user2Id) => {
      const roomId = [user1Id, user2Id].sort().join("_");
      socket.leave(roomId);
      console.log(`User ${socket.id} left room: ${roomId}`);
    });

    socket.on("disconnect", () => {
    });
  });

  return io;
};

module.exports = initializeSocket;
