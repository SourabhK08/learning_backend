import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandle.js";
import  jwt  from "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req,res,next) => {

    // like we can get token easily from cookies bcoz we set onto them in login & in mobile there is no cookie method so we get token from header
    try {
        const token = req.cookies?.accessToken || req.Header("Authorization")?.replace("Bearer ","")
    
        if (!token) {
            throw new ApiError(401,"Unthorized request")
        }
    
        const decodedInfoFromToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
       const user = await User.findById(decodedInfoFromToken?._id).select("-password -refreshToken")
    
       if(!user){
        throw new ApiError(401,'Invalid access token')
       }
    
       req.user = user
       next()
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid access token')
    }
})