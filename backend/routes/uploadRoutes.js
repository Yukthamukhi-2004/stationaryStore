const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const multer = require("multer");

// Use memory storage so we can pass the buffer straight to Supabase
const upload = multer({ storage: multer.memoryStorage() });

const BUCKET_NAME = "product-images";

/**
 * POST /upload
 * Uploads an image file to Supabase Storage.
 * Expects multipart/form-data with field "image".
 * Returns { url: "https://..." }
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const ext = req.file.originalname.split(".").pop() || "jpg";
    const productId = req.body.productId || "temp";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `products/${productId}/${safeName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    res.status(201).json({ url: urlData.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
