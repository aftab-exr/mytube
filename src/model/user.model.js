import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new Schema({
    username: {type: String, required: true, unique: true},
    fullName: {type: String, required: true}, // You MUST send this from Postman now!
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}, 
    watchHistory: [{type: Schema.Types.ObjectId, ref: "Video"}],
    avatarUrl: {type: String}, // Removed required: true temporarily
    coverImage: {type: String}, 
    refreshToken: {type: String} 
}, {timestamps: true});

// Fixed Hash password hook
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
    
});

userSchema.methods.isPasswordCorrect = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            fullName: this.fullName,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRATION}
    )
};

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRATION}
    )
};

export const User = mongoose.model("User", userSchema);