import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("response of clouidnary",response);
    
    console.log(
      "FIle has been uploaded on cloudinary successfully & response URL is - ",
      response.url
    );

    fs.unlinkSync(localFilePath)

    return response;
    
  } catch (error) {
   console.error("❌ Cloudinary upload error:", error.message || error);

    try {
      fs.unlink(localFilePath);
    } catch (unlinkError) {
      console.error("⚠️ Failed to delete local file after upload error:", unlinkError.message);
    }

    return null;
  }
};

export default uploadOnCloudinary