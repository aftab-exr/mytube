import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";
import { apiError } from "../utils/apiError.js";
import uploadOnCloudinary from "../utils/uploadHandler.js";
import { apiResponse } from "../utils/apiResponse.js";

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
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || ""
    });
    
    // remove the password from the user object before sending the response.
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    // check for user creation.
    if (!createdUser) {
        throw new apiError("Failed to Create User", 500);
    }
    // return the response.
    return res.staus(201).json(
        new apiResponse(201, "User Registered Successfully", createdUser)
    )
})

export { 
    registerUser
};