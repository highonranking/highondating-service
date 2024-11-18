const socketIO = require('socket.io');

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*',
    },
  });

  global.io = io; // Making io available globally for emitting events

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join rooms for user-to-user or group communication
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    // Handle typing indicators
    socket.on('typing', ({ roomId, userId }) => {
      socket.to(roomId).emit('user_typing', { userId });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = initializeSocket;
