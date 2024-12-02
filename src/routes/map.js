const express = require("express");
const { userAuth } = require("../middlewares/auth"); 
const mapRouter = express.Router();
const axios = require("axios");

const KRUTIM_API_KEY = process.env.KRUTIM_API_KEY;

mapRouter.get("/getAddress", userAuth, async (req, res) => {
    try {
      const { lat, lon } = req.query;
  
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required." });
      }
  
      const response = await axios.get(
        `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lon}&api_key=${KRUTIM_API_KEY}`
      );
  
      const address = response.data.results?.[0]?.formatted_address || "Address not found";
  
      req.user.address = address; 
      req.user.location = {
        type: "Point",
        coordinates: [parseFloat(lon), parseFloat(lat)],
      };
      await req.user.save();
  
      res.status(200).json({ address });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch address. Please try again later." });
    }
  });
  

module.exports = mapRouter;
