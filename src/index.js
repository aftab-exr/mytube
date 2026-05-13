import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config(
    {
        path: "./.env",
        debug: "true"
    }
);

connectDB()
.then(() => {
    app.get("/", (req, res) => {
        res.send("Hello World!");
    });
})
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`SERVER STARTED ON PORT http://localhost:${process.env.PORT}`);
    });
})
.catch((error) => {
    console.error("ERROR STARTING SERVER: ", error);
    process.exit(1);
});