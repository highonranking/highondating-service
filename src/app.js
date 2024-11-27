const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config(); 

app.use(
  cors({
    origin: `${process.env.CLIENT_URL}`,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const initializeSocket = require('./utils/socketService');
const messageRoutes = require('./routes/message');

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use('/api/messages', messageRoutes);


connectDB()
  .then(() => {
    console.log("Database connection established...");
   const server =  app.listen(7777, () => {
      console.log("Server is successfully listening on port 7777...");
    });
    initializeSocket(server);

  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });
