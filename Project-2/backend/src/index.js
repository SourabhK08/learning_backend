
import mongoose from "mongoose";
import {DB_NAME}  from "./constants.js";
import express from "express";
import connectDb from "./db/index.js";
import dotenv from 'dotenv'

dotenv.config(
    {
        path:'./env'
    }
)
connectDb()

//(() => {})();  iife syntax immediately executed function

// remember 2 things while connecting DB

// 1. use aysnc await bcoz db takes time in processing req
// 2. use try catch block to handle errs easily

/*

    FIRST APPROACH

const app = express()(async () => {
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
  }
})();
*/






