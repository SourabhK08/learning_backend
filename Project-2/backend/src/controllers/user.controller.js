import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandle.js";
import uploadOnCloudinary from "../utils/Cloudinary.js";


// making this fn here bcoz it is use many times

const generateAccessAndRefreshTokens = async(userId) => {
  try {
    const user = await User.findById(userId)

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    // saving refrsh token into db
    user.refreshToken = refreshToken
  await user.save(
      {
        validateBeforeSave:false  // it will not validate other required fields directly save
      }
    )

    return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,'Something went wrong in generating tokens')
  }
}


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
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  coverImageLocalPath = req.files.coverImage[0].path
}

let avatarLocalPath;
if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
  avatarLocalPath = req.files.avatar[0].path
}
console.log("avatarLocalPath--",avatarLocalPath);

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

  console.log("user --",user);
  
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

const loginUser = asyncHandler(async(req,res) => {

  // steps to login user

  // 1 take values from frontend ( req -> body)
  // 2 apply validations based on username or email
  // 3 find the user
  // 4 paswd check
  // 5 access & refresh token generate
  // 6 send them as a secure cookies

  const {username,email,password} = req.body

  if(!username || !email){
    throw new ApiError(400,'Username or Email is required')
  }

  if(!password){
    throw new ApiError(400,'Password is required')
  }

const userFoundInDb =  await User.findOne({
    $or:[{username},{email}]
  })

  if(!userFoundInDb){
    throw new ApiError(404,"User doesn't exist")
  }

  // note User -> is db object which has db methods and which we make methods in model has to be accessed using "user"

  const isPasswordValid = userFoundInDb.isPasswordCorrect(password);

  if(!isPasswordValid){
    throw new ApiError(401,'Password is incorrect')
  }

 const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(userFoundInDb._id)

 // now we want to give data to user so we have 2 options

 // 1 update the value and send bcoz in uper user we got some extra fields by using findOne and empty refreshtoken
// 2 again db call (if not expensive opr)

  const loggedInUser = await User.findById(userFoundInDb._id).select("-password -refreshToken")

  // sending cookies

  const options = {
    httpOnly:true,
    secure:true,  // bcoz modifiable by server side only not from frontend (readonly)
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(new ApiResponse(200,{
    user:loggedInUser,refreshToken,accessToken,
  })),
  'User Logged in successfully'
})

const logoutUser = asyncHandler( async (req,res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },{
        new:true  // bocz we get new updated values in return response
      }
  )

  const options = {
    httpOnly:true,
    secure:true,  // bcoz modifiable by server side only not from frontend (readonly)
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},'User logged out successfully'))
})
export { registerUser,loginUser,logoutUser };
