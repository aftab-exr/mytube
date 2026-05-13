import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true}, // Video description
    videoUrl: {type: String, required: true}, //Cloudinary URL for the video file
    thumbnail: {type: String, required: true}, //Cloudinary URL for the video thumbnail
    duration: {type: Number, required: true}, // Duration in seconds
    views: {type: Number, default: 0},
    isPublished: {type: Boolean, default: false},
    owner: {type: Schema.Types.ObjectId, ref: "User", required: true}, // Reference to User model
    
},{timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);