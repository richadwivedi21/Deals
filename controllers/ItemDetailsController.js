import ItemToSell from "../models/SellModel.js";

const ItemDetailsController = async (req, res) => {
  try {
    const item = await ItemToSell.findById(req.body.id);
    console.log({item});
    return res.status(200).send(item);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal server error");
  }
};

export { ItemDetailsController };