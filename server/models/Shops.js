const mongoose = require("mongoose");

const shopSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    shopOrigin: String,
    accessToken: String,
    isAppInstalled:Boolean,
    created_at: String,
    updated_at: String
})
module.exports = mongoose.model("Shops", shopSchema);
