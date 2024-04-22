import User from "../models/UserModel.js";
import ItemToSell from "../models/SellModel.js";

const ProfileDetails = async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.body.token,
    }).exec();
    return res.status(200).send(user);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal server error");
  }
};

const ItemsListedByUser = async (req, res) => {
  try {
    const items = await ItemToSell.aggregate([
      {
        $match: {
          userToken : req.body.token
        }
      },
      {
        $project: {
          itemName: 1,
          itemCost: 1,
          userName: 1,
          image: { $arrayElemAt: ["$images", 0] }
        }
      }
    ]);
    return res.status(200).send(items);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal server error");
  }
  
};

export { ProfileDetails, ItemsListedByUser };