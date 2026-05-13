import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";

const registerUser = asyncHandler(async (req, res) =>{
    // Get the User Data From the Frontend.
    const { username, email, password } = req.body;
    console.log(req.body);
    console.log(email, password);
    // const { username, email, password } = req.body;
    // console.log(req.body);
    // console.log(email, password);
    // Validate the User Data.
    // Check if the User Already Exists. - username or email.
    // Check for image upload and save the image to the server or cloud storage.
    // Upload the image cloudinary and get the URL.
    // create a new user object with the data and the image URL.
    // remove the password from the user object before sending the response.
    // check for user creation.
    // return the response.
    res.status(201).json({
        success: true,
        message: "User Registered Successfully",
        data: req.body
    });
})

export { 
    registerUser
};