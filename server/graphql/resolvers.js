const User = require("../model/userModel");
const Message = require("../model/messageModel");
const bcrypt = require("bcrypt");

class GetUsersResponse {
    constructor(status, message, users) {
        this.status = status;
        this.message = message;
        this.users = users;
    }
}

class UserResponse {
    constructor(status, message, user) {
        this.status = status;
        this.message = message;
        this.user = user;
    }
}

class AddMessageResponse {
    constructor(status, message) {
        this.status = status;
        this.message = message;
    }
}

class GetAllMessageResponse {
    constructor(status, message, messages) {
        this.status = status;
        this.message = message;
        this.messages = messages;
    }
}

class GetQuoteMessageResponse {
    constructor(status, message, quote) {
        this.status = status;
        this.message = message;
        this.quote = quote;
    }
}

module.exports = {
    login: async ({ request }) => {
        try {
            const { username, password } = request;
            const user = await User.findOne({ username });
            if (!user) {
                return new UserResponse(false, "Incorrect username or password", null);
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return new UserResponse(false, "Incorrect username or password", null);
            }

            delete user.password;
            return new UserResponse(true, "SUCCESS", user);
        } catch (err) {
            return new UserResponse(false, err.message, null);
        }
    },
    getAllUsers: async ({ request }) => {
        try {
            const users = await User.find({ _id: { $ne: request.id } }).select([
                "_id", "username", "email", "isAvatarImageSet", "avatarImage",
            ]);
            return new GetUsersResponse(true, "SUCCESS", users);
        } catch (err) {
            return new GetUsersResponse(false, err.message, null);
        }
    },
    getMentionUsers: async ({ request }) => {
        try {
            const users = await User.find({
                $and: [
                    { _id: { $ne: request.id } },
                    { username: { $regex: "^" + request.starts } }
                ]
            }).select([
                "_id", "username", "email", "isAvatarImageSet", "avatarImage",
            ]);
            return new GetUsersResponse(true, "SUCCESS", users);
        } catch (err) {
            return new GetUsersResponse(false, err.message, null);
        }
    },
    register: async ({ request }) => {
        try {
            const { username, email, password } = request;
            const usernameCheck = await User.findOne({ username });
            if (usernameCheck) {
                return new UserResponse(false, "Username already used", null);
            }

            const emailCheck = await User.findOne({ email });
            if (emailCheck) {
                return new UserResponse(false, "Email already used", null);
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                email, username, password: hashedPassword, isAvatarImageSet: false,
            });
            delete user.password;
            return new UserResponse(true, "SUCCESS", user);
        } catch (err) {
            return new UserResponse(false, err.message, null);
        }
    },
    setAvatar: async ({ request }) => {
        try {
            const userId = request.id;
            const avatarImage = request.image;
            const user = await User.findByIdAndUpdate(userId, {
                isAvatarImageSet: true,
                avatarImage,
            });
            delete user.password;
            user.isAvatarImageSet = true;
            user.avatarImage = avatarImage;
            return new UserResponse(true, "SUCCESS", user);
        } catch (err) {
            return new UserResponse(false, err.message, null);
        }
    },
    addMessage: async ({ request }) => {
        try {
            const { from, to, message, quote } = request;
            const data = await Message.create({
                message: { text: message, quote: quote, },
                users: [from, to],
                sender: from,
            })
            if (data) {
                return new AddMessageResponse(true, "Message added succesfully.");
            }
            return new AddMessageResponse(false, "Failed to add message to the data base.");
        } catch (err) {
            return new AddMessageResponse(false, err.message);
        }
    },
    getAllMessages: async ({ request }) => {
        try {
            const { from, to } = request;
            const messages = await Message.find({
                users: {
                    $all: [from, to],
                }
            }).sort({ updatedAt: 1 });
            const projectMessages = messages.map((msg) => {
                return {
                    id: msg._id,
                    fromSelf: msg.sender.toString() === from,
                    message: msg.message.text,
                    quote: (msg.message.quote ? msg.message.quote : ""),
                }
            });
            return new GetAllMessageResponse(true, "SUCCESS", projectMessages);
        } catch (err) {
            return new GetAllMessageResponse(false, err.message, null);
        }
    },
    // be more flexible to handle the multiple level quote
    // this service will use 2 apis to process the quote
    // then the frontend can control the levels of displaying the quote 
    getQuoteMessage: async ({ request }) => {
        try {
            const message = await Message.findOne({
                _id: request.id
            });
            if (message) {
                const quote = {
                    id: message._id,
                    from: message.sender.toString(),
                    message: message.message.text,
                    quote: (message.message.quote ? message.message.quote : ""),
                };
                return new GetQuoteMessageResponse(true, "SUCCESS", quote);
            }
            return new GetQuoteMessageResponse(false, "Message does not exist.", null);
        } catch (err) {
            return new GetQuoteMessageResponse(false, err.message, null);
        }
    },
};