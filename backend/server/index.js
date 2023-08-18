import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(express.json());
app.use(cors());
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary"; // Import cloudinary here
const router=express.Router();



cloudinary.config({
  cloud_name: "dyvkthle9",
  api_key: "273963298599377",
  api_secret: "nFkS4gH76NrBPp_9DvLsnWJzh1U",
});
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
const Upload = async(file,picturePath) => {
  console.log(picturePath);
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
    
    use_filename:true,
    public_id: "picshare_uploads/" + picturePath,
      unique_filename:false,
    
  });
  
  return res;
}
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const handler = async (req, res) => {
  try {
    
    await runMiddleware(req, res, upload.single("picture"));
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const picturepath=req.file.originalname;
    const cldRes = await Upload(dataURI,picturepath);
    res.json(cldRes);
  } catch (error) {
    console.log(error);
    res.send({
      message: error.message,
    });
  }
};

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), async(req,res)=>{
  console.log(req.file.path);
} ,register);
app.post("/posts", verifyToken, handler,  async(req,res)=>{
  console.log(req.body);
},createPost);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => console.log(`${error} did not connect`));
