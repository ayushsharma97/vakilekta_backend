const cloudinary = require('../config/cloudinary.js')

const getUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: 'profiles',
      },
      process.env.CLOUDINARY_API_SECRET
    );
    res.json({
      timestamp,
      signature,
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder: 'profiles',
    });
  } catch (err) {
    res.status(500).json({ message: 'Signature generation failed' });
  }
};

const uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'advocate_profiles',
          public_id: req.user ? `user_${req.user.id}` : `user_${Date.now()}`,
          overwrite: true,
          transformation: [
            { width: 500, height: 500, crop: 'fill' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
}

const uploadBannerProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'vakilekta_banners',
          public_id: `user_${Date.now()}`,
          overwrite: true,
          transformation: [
            { width: 500, height: 500, crop: 'fill' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
}

module.exports = { getUploadSignature, uploadProfile, uploadBannerProfile }
