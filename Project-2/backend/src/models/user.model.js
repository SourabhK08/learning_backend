import mongoose, { Schema } from "mongoose";

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      index: true, // for optimized searching in db
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      index: true,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, // cloudinary URL
      required:true
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref:'Video'
        }
    ],
    password: {
      type: String,
      required: [true,"Password is required"],
    },
    refreshToken:{
        type:String
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {  // dont pass callbackk () => {} like this it will create prblm we can't access this keyword in this but in normal function we can access this keyword
    
    if(!this.isModified('password')) return next(); // this will only encrpt pswd when this field is modified 

    this.password = bcrypt.hash(this.password,10)
    next()
})

// now implementing pswd check

userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password,this.password)  // ("string from user input value",encrypted password) , it will return T/F 
}

// generating access token

userSchema.methods.generateAccessToken = function () {
   return jwt.sign(
        {
            //paylaod ==> key(name):value from database

            _id:this._id,
            username:this.username,
            email:this.email,
            fullName:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            //paylaod ==> key(name):value from database

            _id:this._id,
          
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);
