const socketIO = require('socket.io');

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*',
    },
  });

  global.io = io; 

  io.on('connection', (socket) => {

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('typing', ({ roomId, userId }) => {
      socket.to(roomId).emit('user_typing', { userId });
    });

    socket.on('disconnect', () => {
    });
  });

  return io;
};

module.exports = initializeSocket;
