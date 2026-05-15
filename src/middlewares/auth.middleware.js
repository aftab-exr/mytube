import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";
import { apiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") || req.body?.accessToken || req.query?.accessToken
    
        if (!token) {
            throw new apiError(401, "Unauthorized")
        }
    
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decoded?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new apiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401, "Invalid Access Token")
    }
});