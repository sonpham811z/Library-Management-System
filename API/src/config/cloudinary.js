const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Multer storage that uploads directly to Cloudinary */
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'library/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }],
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits:  { fileSize: 3 * 1024 * 1024 }, // 3 MB
});

module.exports = { cloudinary, uploadAvatar };
