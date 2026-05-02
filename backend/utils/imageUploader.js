const cloudinary = require("cloudinary").v2;

exports.uploadImageToCloudinary = async (file, folder) => {
  try {
    if (!file || !file.tempFilePath) {
      throw new Error("File or tempFilePath missing");
    }

    const options = {
      folder,
      resource_type: "auto",
    };

    const result = await cloudinary.uploader.upload(
      file.tempFilePath,
      options
    );

    return result;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    return {
      secure_url:
        "https://via.placeholder.com/800x450?text=Upload+Failed",
    };
  }
};