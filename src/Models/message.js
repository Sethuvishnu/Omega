import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    text: String,
    uid: String,
    username: String,
    photoURL: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Message = mongoose.model("Message", messageSchema);

export default Message;