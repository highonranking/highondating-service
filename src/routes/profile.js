const express = require("express");
const profileRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;

    res.send(user);
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid Edit Request");
    }

    const loggedInUser = req.user;

    const { location } = req.body;
    console.log("Location from body:", location);

    if (location) {
      const { coordinates } = location;
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        throw new Error("Invalid location format. Coordinates must be an array with two numbers.");
      }
      const lon = parseFloat(coordinates[0]);  
      const lat = parseFloat(coordinates[1]);     
    
      console.log("lat:", lat);
      console.log("lon:", lon);
    
      if (isNaN(lat) || isNaN(lon)) {
        throw new Error("Invalid location format. Latitude and longitude must be numbers.");
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error("Invalid location values. Latitude must be between -90 and 90, and longitude between -180 and 180.");
      }
    
      req.user.location = {
        type: "Point",
        coordinates: [lon, lat] 
      };
    }
    if (req.body.address) {
      if (typeof req.body.address !== "string" || req.body.address.length > 500) {
        throw new Error("Invalid address format. It must be a string and under 500 characters.");
      }
      loggedInUser.address = req.body.address;
    }


    if (req.body.skills) {
      if (!Array.isArray(req.body.skills)) {
        throw new Error("Skills must be an array.");
      }

      const skillCount = req.body.skills.length;
      if (skillCount < 3 || skillCount > 5) {
        throw new Error("Skills must contain at least 3 and at most 5 items.");
      }
    }

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();

    res.json({
      message: `${loggedInUser.firstName}, your profile updated successfuly`,
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

module.exports = profileRouter;
