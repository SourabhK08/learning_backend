import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandle.js";
import uploadOnCloudinary from "../utils/Cloudinary.js";
import jwt from "jsonwebtoken";

// making this fn here bcoz it is use many times

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // saving refrsh token into db
    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false, // it will not validate other required fields directly save
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong in generating tokens");
  }
};

const options = {
  httpOnly: true,
  secure: true, // bcoz modifiable by server side only not from frontend (readonly)
};

const registerUser = asyncHandler(async (req, res) => {
  // steps to register user

  // get user details by frontend
  // appply validations - not null,required etc
  // check if user already exists ? - by username & email
  // check for imgs, check for avatar
  // upload them to cloudinary , check here also multer has uploaded avatar or not
  // create user object - make an db call ( enrty in db)
  // remove password & refresh token field from the response
  // check for user creation & return the response

  const { fullname, email, username, password } = req.body;
  console.log("fullname", fullname);
  console.log("email", email);

  //  if(fullname === ''){
  //     throw new ApiError(400,'Full name is required')
  //  }

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  console.log("req.body==", req.body);
  console.log("req.files==", req.files);
  console.log("exsisting user ==", existingUser);

  // const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }
  console.log("avatarLocalPath--", avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    coverImage: coverImage?.url || "",
    avatar: avatar.url,
    password,
    email,
    username: username?.toLowerCase(),
  });

  console.log("user --", user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // checking in db again that user created or not (by id ) & in select we are writing ky ky fields nhi chaiye

  if (!createdUser) {
    throw new ApiError(500, "Server err while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // steps to login user

  // 1 take values from frontend ( req -> body)
  // 2 apply validations based on username or email
  // 3 find the user
  // 4 paswd check
  // 5 access & refresh token generate
  // 6 send them as a secure cookies

  console.log("req.body==", req.body);

  const { username, email, password } = req.body;

  console.log("loin username--", username);
  console.log("loin pswd--", password);

  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const userFoundInDb = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!userFoundInDb) {
    throw new ApiError(404, "User doesn't exist");
  }

  // note User -> is db object which has db methods and which we make methods in model has to be accessed using "user"

  const isPasswordValid = await userFoundInDb.isPasswordCorrect(password);

  console.log("isPasswordValid", isPasswordValid);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    userFoundInDb._id
  );

  // now we want to give data to user so we have 2 options

  // 1 update the value and send bcoz in uper user we got some extra fields by using findOne and empty refreshtoken
  // 2 again db call (if not expensive opr)

  const loggedInUser = await User.findById(userFoundInDb._id).select(
    "-password -refreshToken"
  );

  // sending cookies

  return (
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, {
          user: loggedInUser,
          refreshToken,
          accessToken,
        })
      ),
    "User Logged in successfully"
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true, // bocz we get new updated values in return response
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken; // browser / mobile
  console.log("incomingRefreshToken", incomingRefreshToken);

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Access");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    console.log("decodedToken", decodedToken);

    const user = await User.findById(decodedToken?._id);

    console.log("user", user);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  console.log("old-", oldPassword);
  console.log("new-", newPassword);

  const user = await User.findById(req.user?._id);

  console.log("user", user);

  const checkPasswordIsCorrect = await user.isPasswordCorrect(oldPassword);

  console.log("checkPasswordIsCorrect", checkPasswordIsCorrect);

  if (!checkPasswordIsCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword; // setting new value of pswd
  await user.save({ validateBeforeSave: false }); // saving values in db

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const updatedAvatar = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    { new: true }
  ).select("-password");

  // IMPLEMENT FEATURE OF DELETING OLD IMAGE WHICH IS ON CLOUDINARY AFTER SETTING UP NEW ONE

  // MAKE A UTILITY FUNCTION

  return res
    .status(200)
    .json(new ApiResponse(200, updatedAvatar, "Avatar updated successfully"));
});

// same for cover image

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  // aggregation pipelines ==>>> User.aggregate( [ { 1 pipeline },{ 2 pipeline} ..... ] ) remember always returns an array

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions", // models in db always stores in lowercase & plural(..s)
        localField: "_id",
        foreignField: "channel",
        as: "subscribers", // kis kis ne mujhe subscribe kra h
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo", // meine kis kis ko subscribe kiya h
      },
    },
    {
      // this pipeline will add all new data into prev one so that we can share data at once

      $addFields: {
        subscribersCount: {
          $size: "$subscribers", // $ => bcoz it's field here
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },

        // this is for frontend we are sending like a flag subscribed / follow means user has subscribed or not

        isSubscribed: {
          $cond: {
            if: {
              // jo apne pas document aya h subscribers usme mai hoon ya nhi

              // in operator calculates , it can take array / object

              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        // it gives projection that all values are not shown, only selected values are given
        // 1 -> shown , 0 -> hidden

        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  console.log("channel aggreagate result ", channel);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists");
  }

  return res.status(200).json(
    new ApiResponse(200, channel[0], "User channel fetched successfully") // sending object to frontend not array( only 1 value at 0th index)
  );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  //req.user?._id  => this will return us string then automatically mongoose will convert this into ObjectId of mongoDb

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id), // in aggregation pipelines code will go directly so we have to convert this
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",

        // till now we get docs and now we want to find who is the owner of the video

        // nested pipeline || we can use populate method also

        pipeline: [
          {
            // we are in video model
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",

              // from this we got all user data so we need to give some data as a response
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },

          // this is done for sending response bcoz we got array as res and sending obj to frontend

          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  getUserChannelProfile,
  getWatchHistory,
};
