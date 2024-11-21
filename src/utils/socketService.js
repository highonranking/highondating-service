const socketIO = require('socket.io');

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*',
    },
  });

  global.io = io; // Making io available globally for emitting events

  io.on('connection', (socket) => {

    // Join rooms for user-to-user or group communication
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    // Handle typing indicators
    socket.on('typing', ({ roomId, userId }) => {
      socket.to(roomId).emit('user_typing', { userId });
    });

    socket.on('disconnect', () => {
    });
  });

  return io;
};

module.exports = initializeSocket;
