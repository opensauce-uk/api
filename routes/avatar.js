const multer = require("multer");
const router = require("express").Router();
const bunny = require("bunnycdn-storage").default;
const ImgProxy = require("@jsmonday/imgproxy");
const bent = require("bent");
const getBuffer = bent("buffer");
const auth = require("./verifyToken");
const User = require("../model/User");
const util = require("../lib/util");
const cdn = new bunny(
  process.env.BUNNY_API_KEY,
  process.env.BUNNY_STORAGE_ZONE
);
const fs = require("fs");

const upload = multer({ dest: "uploads/" });
const proxy = new ImgProxy({
  key: process.env.IMGPROXY_KEY,
  salt: process.env.IMGPROXY_SALT,
  url: process.env.IMGPROXY_URL,
});

function delete_file(file) {
  setTimeout(() => {
    fs.unlink(file, (err) => {
      if (err) {
        console.error(err);
      }
      util.debug(`Deleted file ${file}`);
    });
  }, 60000);
}
router.post("/upload", auth, upload.single("photo"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send({ error: "no image sent!" });
  // Resize image
  const resized = proxy
    .image(`${process.env.SERVER}/uploads/${file.filename}`)
    .width(250)
    .height(250)
    .resizeType("fit")
    .extension("png");
  const resized_url = resized.get();

  // Download resized
  let buffer = await getBuffer(resized_url);
  fs.writeFile(`uploads/${req.user.username}.png`, buffer, () => null);
  // Upload to CDN
  cdn.delete(`avatars/${req.user.username}.png`).catch(() => null);
  cdn.upload(
    `uploads/${req.user.username}.png`,
    `avatars/${req.user.username}.png`
  ).catch(() => null);
  // Update DB entry
  await User.findByIdAndUpdate(req.user._id, {
    avatar: `https://cdn.opensauce.uk/avatars/${req.user.username}.png`,
  });
  // Delete files
  delete_file(`uploads/${file.filename}`);
  delete_file(`uploads/${req.user.username}.png`);
  return res.status(200).send({ message: "Uploaded avatar" });
});

module.exports = router;
