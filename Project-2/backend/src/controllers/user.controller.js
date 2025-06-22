import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandle.js'
import uploadOnCloudinary from '../utils/Cloudinary.js';

const registerUser = asyncHandler( async(req,res) => {
     // steps to register user

     // get user details by frontend
     // appply validations - not null,required etc
     // check if user already exists ? - by username & email
     // check for imgs, check for avatar
     // upload them to cloudinary , check here also multer has uploaded avatar or not
     // create user object - make an db call ( enrty in db)
     // remove password & refresh token field from the response
     // check for user creation & return the response

     const {fullname,email,username,password} = req.body
     console.log("fullname",fullname);
     console.log("email",email);
     
    //  if(fullname === ''){
    //     throw new ApiError(400,'Full name is required')
    //  }

    if(
        [fullname,email,username,password].some((field) => field?.trim() === '')
    ){
        throw new ApiError(400,'All fields are required')
    }


    const existingUser = User.findOne({
        $or:[ {username},{email} ]
    })

    if (existingUser) {
        throw new ApiError(409,"User with this email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,'Avatar is required')
    }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if(!avatar){
        throw new ApiError(400,'Avatar file is required')
    }

  const user = await User.create({
        fullname,
        coverImage:coverImage?.url || '',
        avatar:avatar.url,
        password,
        email,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    ) // checking in db again that user created or not (by id ) & in select we are writing ky ky fields nhi chaiye

    if (!createdUser) {
        throw new ApiError(500,'Server err while registering user')
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,'User registered successfully')
    )
} )

export {registerUser}