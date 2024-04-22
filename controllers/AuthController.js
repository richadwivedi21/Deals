import nodemailer from "nodemailer";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import "dotenv/config.js";
import dns from "dns";
import bcrypt from "bcryptjs";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASSWORD,
  },
});

const isEmailValid = async (email) => {
  const emailParts = email.split("@");
  const domain = emailParts[1];
  const addresses = await dns.promises.resolveMx(domain);
  if (addresses && addresses.length !== 0) return true;
  else return false;
};

const hashPassword = (pass) => {
  const saltRounds = 10;
  const hash = bcrypt.hashSync(pass, saltRounds);
  return hash;
};

const sendVerificationMail = async (verificationToken, email) => {
  // const verificationLink = `https://dorm-deals-frontend.vercel.app/verify-email?token=${verificationToken}`;
  const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;
  let status = false;
  let mailOptions = {
    from: "richadwivedi811@gmail.com", // Replace with your admin email address
    to: email,
    subject: "Verify your email",
    text: `Click the following link to verify your email: ${verificationLink}`,
  };

  await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error(error);
    } else {
      console.log("Email sent: " + info.response);
      status = true;
    }
  });

  return status;
};

const signup = async (req, res) => {
  const { name, email, password } = req.body;
  console.log(req.body);

  // Check if the email is valid
  if (!isEmailValid(email)) {
    console.log("Email domain does not exist or cannot receive emails.");
    return res.status(401).send({
      message: "Email domain does not exist or cannot receive emails.",
      errorName: "Invalid email",
    });
  }

  // Check if a user with the same email already exists
  const existingUser = await User.findOne({ email });

  // if (existingUser) {
  //   console.log("Existing User");
  //   return res.status(400).send({
  //     message: "User already exists. Please login.",
  //     errorName: "Existing user",
  //   });
  // }

  const hashedPassword = hashPassword(password);

  // Generate a verification token
  const verificationToken = jwt.sign({ email }, process.env.SECRET_KEY, {
    expiresIn: "1d", // Token expires in 1 day
  });

  // Create a new user with the verification token
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    isVerified: false,
    verificationToken,
  });

  await newUser.save();

  try {
    const status = sendVerificationMail(verificationToken, email);
    if (!status) {
      throw new Error("Email verification failed");
    }
    res.send({
      message: "Signup successful. Please check your email for verification.",
    });
  } catch (err) {
    res.status(500).send({ message: "Signup failed. Please try again later." });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    // No such user found
    console.log("User does not exist");
    return res.status(400).send({
      message: "User does not exist. Please signup.",
      errorName: "User does not exist",
    });
  }

  if (!existingUser.isVerified) {
    // Unverified user
    console.log("User is not verified");
    return res.status(400).send({
      message: "User is not verified. Please verify.",
      errorName: "User is not verified",
    });
  }

  const checkPassword = bcrypt.compareSync(password, existingUser.password);

  if (!checkPassword) {
    // Incorrect password
    console.log("Password is incorrect");
    return res.status(400).send({
      message: "Password is incorrect. Please try again.",
      errorName: "Password is incorrect",
    });
  }

  // Login successful
  console.log("Login successful");
  console.log(existingUser);
  res.status(200).send({
    message: "Login successful.",
    token: existingUser.verificationToken,
    name: existingUser.name,
  });
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    // Verify the token and find the user
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findOne({ email: decoded.email });
    if (user) {
      user.isVerified = true;
      await user.save();
      res.send({ message: "Email verification successful." });
    } else {
      res
        .status(404)
        .send({ message: "Invalid token. Email verification failed." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Email verification failed." });
  }
};

export { signup, login, verifyEmail };
