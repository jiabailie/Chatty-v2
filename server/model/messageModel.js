const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        message: {
            text: {
                type: String,
                required: true,
            },
            quote: {
                type: String,
                require: false,
            }
        },
        users: Array,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Message", messageSchema);