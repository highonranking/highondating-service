const express = require("express");
const userRouter = express.Router();
const mongoose = require("mongoose");

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills location";

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAFE_DATA);

    res.json({
      message: "Data fetched successfully",
      data: connectionRequests,
    });
  } catch (err) {
    req.statusCode(400).send("ERROR: " + err.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);


    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.json({ data });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser.location) {
      throw new Error("User location is not set.");
    }

    const { coordinates } = loggedInUser.location;
   
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const loggedInUserDetails = await User.findById(loggedInUser._id).select("skills");
    const loggedInUserSkills = loggedInUserDetails.skills || [];

    const users = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates },
          distanceField: "distance",
          maxDistance: 10000, 
          spherical: true,
        },
      },
      {
        $match: {
          $and: [
            { _id: { $nin: Array.from(hideUsersFromFeed).map((id) => new mongoose.Types.ObjectId(id)) } },
            { _id: { $ne: loggedInUser._id } },
          ],
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          photoUrl: 1,
          age: 1,
          gender: 1,
          about: 1,
          location: 1,
          skills: 1,
          address:1,
          matchingSkills: {
            $size: {
              $setIntersection: [loggedInUserSkills, "$skills"],
            },
          },
        },
      },
      { $match: { matchingSkills: { $gte: 3 } } }, 
      { $sort: { matchingSkills: -1 } }, 
      { $skip: skip }, 
      { $limit: limit },
    ]);

    res.json({ data: users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// WIP

// userRouter.get("/feed", userAuth, async (req, res) => {
//   try {
//     const loggedInUser = req.user;

//     const cacheKey = `feed:${loggedInUser._id}:${req.query.page || 1}`;
//     const cachedFeed = await redis.get(cacheKey);
//     if (cachedFeed) {
//       return res.json(JSON.parse(cachedFeed));
//     }

//     const page = parseInt(req.query.page) || 1;
//     let limit = parseInt(req.query.limit) || 10;
//     limit = Math.min(limit, 50);
//     const skip = (page - 1) * limit;

//     const matchingScores = await UserMatchingScore.find({
//       user1: loggedInUser._id,
//       matchingScore: { $gte: 3 },
//     })
//       .sort({ matchingScore: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate("user2", USER_SAFE_DATA);

//     const feed = matchingScores.map((entry) => entry.user2);

//     await redis.set(cacheKey, JSON.stringify(feed), "EX", 600);

//     res.json({ data: feed });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// userRouter.put("/user/skills", userAuth, async (req, res) => {
//   try {
//     const loggedInUser = req.user;
//     const { skills } = req.body;

//     if (!Array.isArray(skills)) {
//       return res.status(400).send({ message: "Skills must be an array" });
//     }

//     loggedInUser.skills = skills;
//     await loggedInUser.save();

//     await updateSkillIndex(loggedInUser._id, skills);

//     res.json({ message: "Skills updated successfully" });
//   } catch (err) {
//     res.status(400).send({ message: err.message });
//   }
// });


module.exports = userRouter;
