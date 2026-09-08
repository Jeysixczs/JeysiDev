import { Router } from "express";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";

const router = Router();

// Max 5 submissions per 15 minutes per IP — enough for a real visitor,
// tight enough to blunt basic form-spam bots.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many messages sent. Please try again later." },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateBody(body) {
  const errors = {};
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();

  if (!name) errors.name = "Name is required.";
  else if (name.length > 100) errors.name = "Name is too long.";

  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";

  if (!message) errors.message = "Message is required.";
  else if (message.length < 10) errors.message = "Message should be at least 10 characters.";
  else if (message.length > 5000) errors.message = "Message is too long.";

  return { errors, clean: { name, email, message } };
}

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

router.post("/", contactLimiter, async (req, res) => {
  // Honeypot field: real users never fill this hidden input, bots often do.
  if (req.body.company) {
    return res.status(200).json({ message: "Message sent — I'll get back to you soon." });
  }

  const { errors, clean } = validateBody(req.body || {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please fix the highlighted fields.", errors });
  }

  const transport = getTransport();
  const recipient = process.env.CONTACT_TO_EMAIL || clean.email;

  try {
    if (transport) {
      await transport.sendMail({
        from: `"Portfolio Contact Form" <${process.env.SMTP_USER}>`,
        to: recipient,
        replyTo: clean.email,
        subject: `New portfolio message from ${clean.name}`,
        text: `From: ${clean.name} <${clean.email}>\n\n${clean.message}`,
      });
    } else {
      // No SMTP configured yet — log so the form is still testable locally.
      console.log("Contact form submission (SMTP not configured):", clean);
    }

    return res.status(200).json({ message: "Message sent — I'll get back to you soon." });
  } catch (err) {
    console.error("Failed to send contact email:", err);
    return res
      .status(502)
      .json({ message: "Couldn't send your message right now. Please try again shortly." });
  }
});

export default router;
