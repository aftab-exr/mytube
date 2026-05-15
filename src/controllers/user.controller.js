// Importing the required modules and models.
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";
import { apiError } from "../utils/apiError.js";
import uploadOnCloudinary from "../utils/uploadHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

// Generate Access Token and Refresh Token for the User.
const generateTokens = async (userId) => {
    // Implementation for generating tokens
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new apiError("Failed to Generate Tokens", 500);
    }
};

// Register User Controller.
const registerUser = asyncHandler(async (req, res) =>{
    // Get the User Data From the Frontend.
    const { fullName, username, email, password } = req.body;
    
    // Validate the User Data.
    if (!fullName || !username || !email || !password) {
        throw new apiError("All Fields are Required", 400);
    }

    // Check if the User Already Exists. - username or email.
    const existedUser = await User.findOne({
        $or: [{username: username}, {email: email}]
    });
    if (existedUser) { throw new apiError("User Already Exists", 409); }

    // Check for image upload and save the image to the server or cloud storage.
    const avartarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path || null;
    if (!avartarLocalPath) {
        throw new apiError("Avatar Image is Required", 400);
    }

    // Upload the image cloudinary and get the URL.
    const avatar = await uploadOnCloudinary(avartarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new apiError("Failed to Upload Avatar Image", 500);
    }

    // create a new user object with the data and the image URL.
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatarUrl: avatar.secure_url,
        coverImage: coverImage?.secure_url || ""
    });
    
    // remove the password from the user object before sending the response.
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    // check for user creation.
    if (!createdUser) {
        throw new apiError("Failed to Create User", 500);
    }
    // return the response.
    return res.status(201).json(
        new apiResponse(201, "User Registered Successfully", createdUser)
    )
})

// Login User Controller.
const loginUser = asyncHandler(async (req, res) => {
    // Get the User Data From the Frontend.
    const { username, email, password } = req.body;
    // We can login with either username or email.
    if (!(username || email)) {
        throw new apiError("Username or Email is Required", 400);
    }
    // So we will check for both username and email in the database.

    const user =await User.findOne({
        $or: [{username},{email}]
    });

    if (!user) { throw new apiError("User Not Found", 404); }
    // And we will also check for the password.
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) { throw new apiError("Password is Invalid", 404); }
    
    // Generate Access Token and Refresh Token for the User.
    const { accessToken, refreshToken } = await generateTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    // And we will send cookie with the refresh token to the client.
    const cookieOptions = {
        httpOnly: true,
        secure: true
    };
    // return Response
    return res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new apiResponse(
            200, 
            "User Logged In Successfully",
            { 
                user: loggedInUser, accessToken, refreshToken
            }
        )
    )
})

// Logout User Controller.
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    // Clear the cookies.
    const cookieOptions = {
        httpOnly: true,
        secure: true
    };
    return res.status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
        new apiResponse(200, "User Logged Out Successfully")
    )
})

// Refresh Access Token Controller.
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Get the Refresh Token from the cookies or headers or body or query.
    const incomingRefreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "") || req.body?.refreshToken || req.query?.refreshToken

    // Check if the Refresh Token is valid.
    if (!incomingRefreshToken) {
        throw new apiError(401, "Unauthorized")
    }
    try {
        // Verify the Refresh Token.
        const decoded =  jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        // Check if the user exists in the database.
        const user = await User.findById(decoded?._id);
    
        // If the user does not exist, return an error.
        if (!user) {
            throw new apiError(401, "Unauthorized")
        }
        // Check if the Refresh Token is the same as the one in the database.
        if (user.refreshToken !== incomingRefreshToken) {
            throw new apiError(401, "Unauthorized")
        }
    
        // Generate a new Access Token for the user.
        const cookieOptions = {
            httpOnly: true,
            secure: true   
        };
    
        const { accessToken, refreshToken } = await generateTokens(user._id);
    
        return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new apiResponse(200, "Access Token Refreshed Successfully")
         )
        } catch (error) {
            throw new apiError(401, "Unauthorized")
        }
    })

// Change Current Password Controller.
const changeCurrentPassword = asyncHandler(async (req, res) =>{
    // Get the User Data From the Frontend.
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    // Check if the old password is correct.
    if (!isPasswordCorrect){ throw new apiError("Old Password is Incorrect", 400); }
    // Update the password.
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    // Return the response.
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            "Password Changed Successfully",
            {}
        )
    )
})

// Get Current User Controller.
const getCurrentUser = asyncHandler(async (req, res) =>{
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            "Current User Fetched Succesfully",
            req.user
        )
    )
})

// Update User Profile Controller.
const updateUserProfile = asyncHandler(async (req, res) => {
    // Get the User Data From the Frontend.
    const { fullName, username, email } = req.body;
    // Validate the User Data.
    if (!fullName || !username || !email) { throw new apiError("All Fields are Required", 400); }
    // Update the user profile in the database.
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                username: username.toLowerCase(),
                email
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    // Check if the user is updated successfully.
    if (!user) {
        throw new apiError("Failed to Update User Profile", 500);
    }

    // Return the response.
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            "User Profile Updated Successfully",
            user
        )
    )
})

// Update User Avatar Controller.
const updateUserAvatar = asyncHandler(async (req, res) => {
    // Get the User Data From the Frontend.
    const avatarLocalPath = req.file?.path
    // Validate the User Data.
    if (!avatarLocalPath) { throw new apiError("Avatar Image is Required", 400); }
    // Upload the image cloudinary and get the URL.
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) { throw new apiError("Failed to Upload Avatar Image", 500); }
    // Update the user avatar in the database.
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    // Check if the user is updated successfully.
    if (!user) {
        throw new apiError("Failed to Update User Avatar", 500);
    }
    // Return the response.
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            "User Avatar Updated Successfully",
            user
        )
    )
})

// Update User Cover Image Controller.
const updateUserCoverImage = asyncHandler(async (req, res) => {
    // Get the User Data From the Frontend.
    const coverImageLocalPath = req.file?.path
    // Validate the User Data.
    if (!coverImageLocalPath) { throw new apiError("Cover Image is Required", 400); }
    // Upload the image cloudinary and get the URL.
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) { throw new apiError("Failed to Upload Cover Image", 500); }
    // Update the user cover image in the database.
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    // Check if the user is updated successfully.
    if (!user) {
        throw new apiError("Failed to Update User Cover Image", 500);
    }
    // Return the response.
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            "User Cover Image Updated Successfully",
            user
        )
    )

})

// Exporting the controllers.
export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserProfile,
    updateUserAvatar,
    updateUserCoverImage
};