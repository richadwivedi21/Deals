import multer from "multer";

import ItemToSell from "../models/SellModel.js";

// Create a multer instance with the storage configuration
const upload = multer({
  limits: {
    fileSize: 500 * 1024, // 500KB limit for each file
  },
});

const sellItem = async (req, res) => {
  try {
    // Use the upload middleware to handle image uploads
    upload.array("images", 3)(req, res, async (err) => {
      if (err) {
        console.error("Error uploading images:", err);
        return res.status(500).send("Error uploading images");
      }

      // Get the form data from the request body
      const {
        userToken,
        userName,
        itemName,
        itemCost,
        itemDescription,
        contactNumber,
        pickupLocation,
      } = req.body;
      const images = req.files;

      console.log("userToken:", userToken);
      console.log("userName:", userName);
      console.log("itemName:", itemName);
      console.log("itemCost:", itemCost);
      console.log("itemDescription:", itemDescription);
      console.log("contactNumber:", contactNumber);
      console.log("pickupLocation:", pickupLocation);
      console.log("images:", images);

      try {
        const item = new ItemToSell({
          userToken,
          userName,
          itemName,
          itemCost,
          itemDescription,
          contactNumber,
          pickupLocation,
          images,
        });
        console.log("Item to be saved to db : ", item);
        const result = await item.save();
        console.log("Item saved successfully", result);
        return res.status(200).send("Item uploaded successfully");
      } catch (err) {
        console.log(err);
        return res.status(500).send("Error uploading images");
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal server error");
  }
};

export { sellItem };