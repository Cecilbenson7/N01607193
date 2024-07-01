/*
    Name: Cecil Benson
    ID: N01607193
*/
require("dotenv").config();
const express = require("express");
const { create } = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Handlebars
const hbs = create({ extname: "hbs", defaultLayout: "main" });
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // Corrected destination directory
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.urlencoded({ extended: true })); // handle normal forms -> url encoded
app.use(express.json()); // Handle raw json data

// Routes
app.get("/", (req, res) => {
    res.render("home"); // Renders views/home.hbs
  });
  

app.get("/upload", (req, res) => {
  res.render("upload"); // Renders the upload form
});

app.post("/upload", upload.single("file"), (req, res) => {
  // Handle file upload logic
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.send(`File uploaded successfully: ${req.file.path}`);
});

// Fetch single random file
app.get("/fetch-single", (req, res) => {
  let upload_dir = path.join(__dirname, "uploads");
  let uploads = fs.readdirSync(upload_dir);

  if (uploads.length == 0) {
    return res.status(503).send({ message: "No images" });
  }

  let index = Math.floor(Math.random() * uploads.length);
  let randomImage = uploads[index];

  res.sendFile(path.join(upload_dir, randomImage));
});

// Render single file upload form
app.get("/single", (req, res) => {
  res.render("single");
});

// Fetch multiple random files
app.get("/fetch-multiple", (req, res) => {
  let upload_dir = path.join(__dirname, "uploads");
  let uploads = fs.readdirSync(upload_dir);

  if (uploads.length == 0) {
    return res.status(503).send({ message: "No images" });
  }

  const numberOfImages = parseInt(req.query.num) || 5;
  let randomImages = [];

  for (let i = 0; i < numberOfImages; i++) {
    let index = Math.floor(Math.random() * uploads.length);
    randomImages.push(uploads[index]);
  }

  res.send(randomImages.map((image) => path.join(upload_dir, image)));
});
app.get("/upload-multiple", (req, res) => {
    res.render("upload-multiple");
  });
  
  app.post("/upload-multiple", upload.array("files", 100), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    const filePaths = req.files.map((file) => file.path);
    res.status(200).send(`Files uploaded successfully: ${filePaths.join(", ")}`);
  });
  

// Fetch all files in the gallery
app.get("/fetch-all", (req, res) => {
  let upload_dir = path.join(__dirname, "uploads");
  let uploads = fs.readdirSync(upload_dir);

  if (uploads.length == 0) {
    return res.status(503).send({ message: "No images" });
  }

  res.send(uploads.map((image) => path.join(upload_dir, image)));
});

// Render gallery page with all images
app.get("/gallery", (req, res) => {
  let upload_dir = path.join(__dirname, "uploads");
  let uploads = fs.readdirSync(upload_dir);

  res.render("gallery", { images: uploads });
});

// Fetch paginated files
app.get("/fetch-all-pagination/pages/:index", (req, res) => {
  const ITEMS_PER_PAGE = parseInt(req.query.items_per_page) || 10;
  const pageIndex = parseInt(req.params.index);

  if (isNaN(pageIndex) || pageIndex < 1) {
    return res.status(400).send("Invalid page index.");
  }

  const allFiles = fs.readdirSync(path.join(__dirname, "uploads"));
  const totalItems = allFiles.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (pageIndex > totalPages) {
    return res.status(404).send("Page not found.");
  }

  const startIndex = (pageIndex - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pageItems = allFiles.slice(startIndex, endIndex);

  const response = {
    page: pageIndex,
    totalPages: totalPages,
    files: pageItems.map((image) => path.join(__dirname, "uploads", image)),
  };

  res.json(response);
});

// Render gallery with pagination
app.get("/gallery-pagination", (req, res) => {
  res.render("gallery-pagination");
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).send("Route not found");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
