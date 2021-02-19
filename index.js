const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const util = require("./lib/util");
const bodyParser = require("body-parser");

// Import routes
const userRoute = require("./routes/user");
const postRoute = require("./routes/post");
const commentRoute = require("./routes/comment");
const searchRoute = require("./routes/query");
const permissionsRoute = require("./routes/permissions");
const ingredientRoute = require("./routes/ingredient");
const contactRoute = require("./routes/contact");
const avatarRoute = require("./routes/avatar");

// Imports from .env
dotenv.config();
const port = process.env.PORT;

// Connect to database
mongoose.connect(
  process.env.DB_CONNECT,
  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false },
  () => util.log("connected to database")
);

// Hide express is running
app.use((req, res, next) => {
  res.setHeader("X-Powered-By", "OpenSauce/API");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type, authorization,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Methods", "*");
  next();
});

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route Middlewares:
app.use("/user", userRoute);
app.use("/posts", postRoute);
app.use("/comment", commentRoute);
app.use("/search", searchRoute);
app.use("/admin/users/", permissionsRoute);
app.use("/ingredient", ingredientRoute);
app.use("/contact", contactRoute);
app.use("/avatar/", avatarRoute);
app.use("/uploads/", express.static("uploads"));

// sets port to port defined in env and outputs success message to console
app.listen(port, () => util.log(`Server Online on port ${port}`));
