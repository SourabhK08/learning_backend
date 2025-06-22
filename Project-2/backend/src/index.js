import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import connectDb from "./db/index.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
  path: "./env",
});

connectDb()
  .then(() => {
    app.on("error", (err) => {
      console.log("err while connecting from express", err);
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed!!", err);
  });

//(() => {})();  iife syntax immediately executed function

// remember 2 things while connecting DB

// 1. use aysnc await bcoz db takes time in processing req
// 2. use try catch block to handle errs easily

/*

    FIRST APPROACH

const app = express()

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    app.on("error", (err) => {
      console.log("err while connecting from express", err);
    });

    app.listen(process.env.PORT,() => {
        console.log(`Server is running on ${process.env.PORT}`);
        
    })
  } catch (error) {
    console.log("Error:", error);
    throw error;
  }
})();
*/
