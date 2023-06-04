const express = require("express");
const cors = require("cors");
const graphqlHTTP = require("express-graphql").graphqlHTTP;
const supertest = require("supertest");
const mongoose = require("mongoose");
const UserModel = require("../model/userModel");
const MessageModel = require("../model/messageModel");
const schema = require("../graphql/schemas");
const resolvers = require("../graphql/resolvers");

require("dotenv").config();

const app = express();

app.use("/graphql", cors(), graphqlHTTP({
    schema: schema,
    rootValue: resolvers,
    graphiql: true,
}));

app.use("*", cors());
app.use(express.json());

const request = supertest(app);

const insertTestData = async () => {
    const username = "guest";
    const email = "guest@chatty.com";
    const password = "12345678";
    const insertGuestRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `
        mutation {
          register(request: {
            username: "${username}",
            email: "${email}",
            password: "${password}"
          }) {
            status, message, user {
              _id
              username
              email
              isAvatarImageSet
              avatarImage
            }
          }
        }`});
    const insertGuestResponse = await insertGuestRequest;
    if (!insertGuestResponse.body.data.register.status) {
        console.log("Insert guest data failed");
    }
};

const getUserInfo = async (username, password) => {
    const testRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `
            {
              login(request: {username: "${username}", password: "${password}"}) {
                status
                message
                user {
                  _id
                  username
                  email
                  isAvatarImageSet
                  avatarImage
                }
              }
            }
        `});
    const response = await testRequest;
    if (!response.body.data.login.status) {
        console.log("Guest login failed");
        return null;
    }
    return response.body.data.login.user;
};

beforeAll(async () => {
    console.log("Prepare for the test...");
    await mongoose.connect(process.env.TEST_MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    await insertTestData();
});

afterAll(async () => {
    await UserModel.collection.drop();
    await MessageModel.collection.drop();
});

test("testRegister", async () => {
    const username = "test";
    const email = "test@chatty.com";
    const password = "12345678";
    const testRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `
        mutation {
          register(request: {
            username: "${username}",
            email: "${email}",
            password: "${password}"
          }) {
            status, message, user {
              _id
              username
              email
              isAvatarImageSet
              avatarImage
            }
          }
        }`});
    const response = await testRequest;
    const registerResponse = response.body.data.register;
    expect(registerResponse.status).toBe(true);
    expect(registerResponse.message).toBe("SUCCESS");
    expect(registerResponse.user.username).toBe("test");
    expect(registerResponse.user.email).toBe("test@chatty.com");
    expect(registerResponse.user.isAvatarImageSet).toBe(false);
    expect(registerResponse.user.avatarImage).toBe("");
});

test("testLogin", async () => {
    const username = "test";
    const password = "12345678";
    const testRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `
            {
              login(request: {username: "${username}", password: "${password}"}) {
                status
                message
                user {
                  _id
                  username
                  email
                  isAvatarImageSet
                  avatarImage
                }
              }
            }
        `});
    const response = await testRequest;
    const loginResponse = response.body.data.login;
    expect(loginResponse.status).toBe(true);
    expect(loginResponse.message).toBe("SUCCESS");
    expect(loginResponse.user.username).toBe("test");
    expect(loginResponse.user.email).toBe("test@chatty.com");
    expect(loginResponse.user.isAvatarImageSet).toBe(false);
    expect(loginResponse.user.avatarImage).toBe("");
});

test("testSetAvatar", async () => {
    const guest = await getUserInfo("guest", "12345678");
    const avatarUri = "testAvatarUri";
    const testRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `
        mutation {
            setAvatar(request: {id: "${guest._id}",
            image: "${avatarUri}"}) {
              status, message, user {
                _id
                username
                email
                isAvatarImageSet
                avatarImage
              }
            }
          }`});
    const response = await testRequest;
    const setAvatarResponse = response.body.data.setAvatar;
    expect(setAvatarResponse.status).toBe(true);
    expect(setAvatarResponse.message).toBe("SUCCESS");
    expect(setAvatarResponse.user.username).toBe("guest");
    expect(setAvatarResponse.user.email).toBe("guest@chatty.com");
    expect(setAvatarResponse.user.isAvatarImageSet).toBe(true);
    expect(setAvatarResponse.user.avatarImage).toBe(avatarUri);
});

test("testGetAllUsers", async () => {
    const guest = await getUserInfo("guest", "12345678");
    const testRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `{
                getAllUsers(request: {id: "${guest._id}"}) {
                  status, message, users {
                    _id
                    username
                    email
                    isAvatarImageSet
                    avatarImage
                  }
                }
            }`});
    const response = await testRequest;
    const getAllUsersResponse = response.body.data.getAllUsers;
    expect(getAllUsersResponse.status).toBe(true);
    expect(getAllUsersResponse.message).toBe("SUCCESS");
    expect(getAllUsersResponse.users.length).toEqual(1);
    const actualUser = getAllUsersResponse.users[0];
    expect(actualUser.username).toBe("test");
    expect(actualUser.email).toBe("test@chatty.com");
    expect(actualUser.isAvatarImageSet).toBe(false);
    expect(actualUser.avatarImage).toBe("");
});

test("testGetMentionUsers", async () => {
    const guest = await getUserInfo("guest", "12345678");
    const mentionStarts = "te";
    const testRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `{
                getMentionUsers(request: {
                  id: "${guest._id}",
                  starts: "${mentionStarts}"
                }){
                  status, message, users {
                    _id
                    username
                    email
                    isAvatarImageSet
                    avatarImage
                  }
                }
              }`});
    const response = await testRequest;
    const getMentionUsersResponse = response.body.data.getMentionUsers;
    expect(getMentionUsersResponse.status).toBe(true);
    expect(getMentionUsersResponse.message).toBe("SUCCESS");
    expect(getMentionUsersResponse.users.length).toEqual(1);
    const actualUser = getMentionUsersResponse.users[0];
    expect(actualUser.username).toBe("test");
    expect(actualUser.email).toBe("test@chatty.com");
    expect(actualUser.isAvatarImageSet).toBe(false);
    expect(actualUser.avatarImage).toBe("");
});

test("testAddMessage", async () => {
    const fromUser = await getUserInfo("guest", "12345678");
    const toUser = await getUserInfo("test", "12345678");

    // add message
    const fromUserId = fromUser._id;
    const toUserId = toUser._id;
    const message = "the message of unit test";
    const testRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `
        mutation {
            addMessage(request: {
                from: "${fromUserId}",
                to: "${toUserId}",
                message: "${message}"
            }) {
                status
                message
            }
        }`});
    const response = await testRequest;
    const addMessageResponse = response.body.data.addMessage;
    expect(addMessageResponse.status).toBe(true);
    expect(addMessageResponse.message).toBe("Message added succesfully.");
});

test("testGetAllMessages", async () => {
    const fromUser = await getUserInfo("guest", "12345678");
    const toUser = await getUserInfo("test", "12345678");

    // get all message
    const testRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `{
                getAllMessages(
                  request: {
                    from: "${fromUser._id}",
                    to: "${toUser._id}", 
                  }) {
                  status
                  message
                  messages {
                    fromSelf
                    message
                    quote
                  }
                }
              }`});
    const response = await testRequest;
    const getAllMessagesResponse = response.body.data.getAllMessages;
    expect(getAllMessagesResponse.status).toBe(true);
    expect(getAllMessagesResponse.message).toBe("SUCCESS");
    expect(getAllMessagesResponse.messages.length).toEqual(1);
    const actualMessage = getAllMessagesResponse.messages[0];
    expect(actualMessage.fromSelf).toBe(true);
    expect(actualMessage.message).toBe("the message of unit test");
    expect(actualMessage.quote).toBe("");
});

test("testGetQuoteMessage", async () => {
    const fromUser = await getUserInfo("guest", "12345678");
    const toUser = await getUserInfo("test", "12345678");

    // get all message
    const getAllMessagesRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `{
                getAllMessages(
                  request: {
                    from: "${fromUser._id}",
                    to: "${toUser._id}", 
                  }) {
                  status
                  message
                  messages {
                    id
                    fromSelf
                    message
                    quote
                  }
                }
              }`});
    const getAllMessagesResponse = await getAllMessagesRequest;
    expect(getAllMessagesResponse.body.data.getAllMessages.status).toBe(true);
    expect(getAllMessagesResponse.body.data.getAllMessages.messages.length).toEqual(1);
    const quoteMessageId = getAllMessagesResponse.body.data.getAllMessages.messages[0].id;

    // add quote message
    const message = "quote pervious message";
    const testRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `
            mutation {
                addMessage(request: {
                    from: "${fromUser._id}",
                    to: "${toUser._id}",
                    message: "${message}"
                    quote: "${quoteMessageId}"
                }) {
                    status
                    message
                }
            }`});
    const response = await testRequest;
    const addMessageResponse = response.body.data.addMessage;
    expect(addMessageResponse.status).toBe(true);
    expect(addMessageResponse.message).toBe("Message added succesfully.");

    // get quote message
    const getQuoteRequest = request
        .post("/graphql")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
            query: `{
            getQuoteMessage(
            request: {
              id: "${quoteMessageId}"
            }) {
            status
            message
            quote {
              id,
              from,
              message,
              quote
            }
          }
        }`});
    const getQuoteMessagesResponse = await getQuoteRequest;
    expect(getQuoteMessagesResponse.body.data.getQuoteMessage.status).toBe(true);
    expect(getQuoteMessagesResponse.body.data.getQuoteMessage.message).toBe("SUCCESS");
    const actualQuoteMessage = getQuoteMessagesResponse.body.data.getQuoteMessage.quote;
    expect(actualQuoteMessage.id).toBe(quoteMessageId);
    expect(actualQuoteMessage.from).toBe(fromUser._id);
    expect(actualQuoteMessage.message).toBe("the message of unit test");
    expect(actualQuoteMessage.quote).toBe("");
});