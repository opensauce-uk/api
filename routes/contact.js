const router = require("express").Router();
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  console.log(req.body, req.params, req.query);
  if (
    !req.body.first ||
    !req.body.last ||
    !req.body.email ||
    !req.body.message ||
    !req.body.reason
  ) {
    return res.status(400).send({ error: "Missing field" });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: process.env.EMAIL_SECURE, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const sender = await transporter.sendMail({
    from: `System User <system@opensauce.uk>`,
    to: "contact@opensauce.uk",
    subject: `[CONTACT] ${req.body.reason || "No Reason provided"}`,
    text: `Name: ${req.body.first} ${req.body.last}\n\nEmail: ${req.body.email}\n\nMessage:\n${req.body.message}`,
  });

  return res.status(200).send({ message: "Sent contact email!" });
});

module.exports = router;
