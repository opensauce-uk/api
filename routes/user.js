const router = require("express").Router();
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  registerValidation,
  loginValidation,
  passwordValidation,
  userChangeValidation,
} = require("../validation");
const auth = require("./verifyToken");
const blacklist = require("../lib/blacklist.json");
const util = require("../lib/util");
require("dotenv").config();
// Create user
router.post("/register", async (req, res) => {
  // Validation
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });
  if (blacklist.usernames.includes(req.body.username)) {
    return res
      .status(403)
      .send({ error: "The username you entered has been blacklisted" });
  }
  // Checking if username is already in the database
  const usernameExist = await User.findOne({ username: req.body.username });
  if (usernameExist) {
    return res.status(409).send({
      error: "Sorry the username already is taken.",
      userExist: true,
    });
  }

  // Checking if email is already in the database
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) {
    return res.status(409).send({
      error: "Sorry the email is already being used.",
      emailExist: true,
    });
  }

  // Password Hashing
  const salt = await bcrypt.genSalt(10);
  const hpass = await bcrypt.hash(req.body.password, salt);

  const d = new Date();
  const epoch = d.getTime();

  const user = new User({
    // Data that is recieved from the body of the post
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    password: hpass,
    created_at: epoch,
  });

  try {
    const newUser = await user.save();
    await util.sendRegisterEmail(user);
    return res.status(201).send({
      message: "Successfully created user",
      user: user._id,
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// login
router.post("/login", async (req, res) => {
  // Validation
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // Checking if username is in the database
  const user = await User.findOne({ username: req.body.username });
  if (!user) {
    res.status(404).send({
      error: "The username you entered does not exist.",
      userExist: false,
    });
  }

  // If user doesn't exist?
  if (!user) res.status(404).send("The user does not exist!");
  // Checking if password is correct
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) {
    return res.status(401).send({
      error: "The password you entered wasn't correct",
      validPassword: false,
    });
  }

  // Create & assign a token
  const token = jwt.sign(
    {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      favorites: user.favorites,
      avatar: user.avatar,
      biography: user.bio,
      role: user.role,
    },
    process.env.TOKEN_SECRET
  );

  res.header("Authorization", token);

  res.status(200).send({ message: "Login Successful" });
});

router.put("/password/change", auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  const { error } = passwordValidation(req.body);
  if (error) {
    return res.status(400).send({ error: error.details[0].message });
  }
  const salt = await bcrypt.genSalt(10);
  const hpass = await bcrypt.hash(req.body.new_password, salt);

  const doc = await User.findByIdAndUpdate(req.user._id, { password: hpass });

  res.status(200).send({ message: "Password Changed Successfully" });
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  return res.json({
    id: user._id,
    username: user.username,
    name: user.name,
    email: user.email,
    date: user.date,
    favorites: user.favorites,
    avatar: user.avatar,
    biography: user.biography,
    role: user.role,
    permissions: user.permissions,
  });
});

router.get("/get/:username", async (req, res) => {
  if (!req.params.username) {
    return res.status(400).send({ error: "Username wasn't provided" });
  }
  const user = await User.findOne({ username: req.params.username });
  if (!user) {
    return res
      .status(404)
      .send({ error: "Could not find username in database!" });
  }
  return res.json({
    id: user._id,
    username: user.username,
    name: user.name,
    created_at: user.created_at,
    email: user.email,
    avatar: user.avatar,
    biography: user.biography,
    favorites: user.favorites,
    role: user.role,
  });
});

router.put("/edit", auth, async (req, res) => {
  const { error } = userChangeValidation(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });
  let biography;
  let favorites;
  let avatar;

    biography = await User.findByIdAndUpdate(req.user._id, {
    biography: req.body.biography,
  });
  if (req.body.favorites) {
    favorites = await User.findByIdAndUpdate(req.user._id, {
      favorites: req.body.favorites,
    });
  }

  return res.status(200).send({ message: "Updated user" });
});

// Exports the file as a module
module.exports = router;
