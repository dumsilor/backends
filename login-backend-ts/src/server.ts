import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("DB Connected");
  })
  .catch((err) => {
    console.log(err);
  });

const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,
    token: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const User = mongoose.model("user", userSchema);

const generateToken = (user: any) => {
  const token = jwt.sign(
    {
      username: user.username,
      email: user.email,
    },
    process.env.PRIVATE_KEY!,
    { expiresIn: "1h" }
  );
  user.token = token;
  return user;
};

app.get("/", (req, res) => {
  res.send("Server Wroking");
});

app.post(
  "/login",
  asyncHandler(async (req, res) => {
    // const user = sample_user.filter((user) => user.email === req.body.email);
    // res.send(user);
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      console.log("No User Exists! Please register!");
    } else if (!user.password) {
      console.log("User password is missing!");
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Password does not match");
      } else {
        console.log("Password matches");
        res.send(generateToken(user));
      }
    }
  })
);

app.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      username,
      email,
      password: hashPassword,
    });
    newUser.save();
    res.send("User Created");
  })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is listening to PORT ${PORT}`);
});
