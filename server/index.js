const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./restful/routes/userRoutes");
const messageRoutes = require("./restful/routes/messageRoutes");

const graphqlHTTP = require("express-graphql").graphqlHTTP;
const { buildSchema } = require("graphql");

const app = express();
const socket = require("socket.io");
require("dotenv").config();

// graphql start
const schema = buildSchema(`
  type RandomDie {
    numSides: Int!
    rollOnce: Int!
    roll(numRolls: Int!): [Int]
  }
  input MessageInput {
    content: String
    author: String
  }
  type Message {
    id: ID!
    content: String
    author: String
  }
  type Query {
    hello: String
    rollDice(numDice: Int!, numSides: Int): [Int]
    getDie(numSides: Int): RandomDie
    getMessage(id: ID!): Message
  }
  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
  }
`);

class RandomDie {
    constructor(numSides) {
        this.numSides = numSides
    }

    rollOnce() {
        return 1 + Math.floor(Math.random() * this.numSides)
    }

    roll({ numRolls }) {
        var output = []
        for (var i = 0; i < numRolls; i++) {
            output.push(this.rollOnce())
        }
        return output
    }
}

class Message {
    constructor(id, { content, author }) {
        this.id = id
        this.content = content
        this.author = author
    }
}

var fakeDatabase = {}

const resolvers = {
    hello: () => {
        return "Hello world!";
    },
    rollDice: ({ numDice, numSides }) => {
        var output = []
        for (var i = 0; i < numDice; i++) {
            output.push(1 + Math.floor(Math.random() * (numSides || 6)))
        }
        return output
    },
    getDie: ({ numSides }) => {
        return new RandomDie(numSides || 6)
    },
    getMessage: ({ id }) => {
        if (!fakeDatabase[id]) {
            throw new Error("no message exists with id " + id)
        }
        return new Message(id, fakeDatabase[id])
    },
    createMessage: ({ input }) => {
        // Create a random id for our "database".
        var id = require("crypto").randomBytes(10).toString("hex")

        fakeDatabase[id] = input
        return new Message(id, input)
    },
    updateMessage: ({ id, input }) => {
        if (!fakeDatabase[id]) {
            throw new Error("no message exists with id " + id)
        }
        // This replaces all old data, but some apps might want partial update.
        fakeDatabase[id] = input
        return new Message(id, input)
    },
};

app.use("/graphql", cors(), graphqlHTTP({
    schema: schema,
    rootValue: resolvers,
    graphiql: true,
}));
// graphql end

app.use("*", cors());
app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/message", messageRoutes);

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("DB Connection Successfull");
}).catch((err) => {
    console.log(err.message);
});

const server = app.listen(process.env.PORT, () => {
    console.log(`Server Started on Port ${process.env.PORT}`);
});

const io = socket(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("msg-receive", data.message);
        }
    });
});