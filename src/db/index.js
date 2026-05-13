import mongoose from "mongoose";
import { DB_NAME } from "../constents.js";

const connectDB = async () => {
    try {
        // We add /${DB_NAME} to the end of the URI so it creates the right database
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`\n MONGODB CONNECTED! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB CONNECTION ERROR: ", error);
        process.exit(1);
    }
}

export default connectDB;