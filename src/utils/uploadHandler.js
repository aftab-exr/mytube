import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';



// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

// Upload an image
const uploadOnCloudinary = async (localFilepath) => {
    try {
        if (!localFilepath) return null;
        const result = await cloudinary.uploader.upload(localFilepath, {
            resource_type: "auto"
        })
        // Delete the local file after upload        
        fs.unlinkSync(localFilepath);
        return result;
    } catch (error) {
        fs.unlinkSync(localFilepath); // Ensure local file is deleted even if upload fails
        throw error;
    }
}

export default uploadOnCloudinary;