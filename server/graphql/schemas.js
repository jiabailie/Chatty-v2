const { buildSchema } = require("graphql");

module.exports = buildSchema(`
type User {
  _id: String
  username: String!
  email: String!
  isAvatarImageSet: Boolean!
  avatarImage: String
}
type DisplayMessage {
  id: String
  fromSelf: Boolean!
  message: String!
  quote: String
}
type QuoteMessage {
  id: String
  from: String!
  message: String!
  quote: String
}
type UserResponse {
  status: Boolean!
  message: String!
  user: User
}
input GetAllUsersRequest {
  id: String!
}
input GetMentionUsersRequest {
  id: String!
  starts: String!
}
input LoginRequest {
  username: String!
  password: String!
}
type GetUsersResponse {
  status: Boolean!
  message: String!
  users: [User]
}
input RegisterRequest {
  username: String!
  email: String!
  password: String!
}
input SetAvatarRequest {
  id: String!
  image: String!
}
input AddMessageRequest {
  from: String!
  to: String!
  message: String!
  quote: String
}
type AddMessageResponse {
  status: Boolean!
  message: String!
}
input GetAllMessageRequest {
  from: String!
  to: String!
}
type GetAllMessageResponse {
  status: Boolean!
  message: String!
  messages: [DisplayMessage]
}
input GetQuoteMessageRequest {
  id: String!
}
type GetQuoteMessageResponse {
  status: Boolean!
  message: String!
  quote: QuoteMessage
}
type Query {
  login(request: LoginRequest!): UserResponse
  getAllUsers(request: GetAllUsersRequest!): GetUsersResponse
  getMentionUsers(request: GetMentionUsersRequest!): GetUsersResponse
  getAllMessages(request: GetAllMessageRequest!): GetAllMessageResponse
  getQuoteMessage(request: GetQuoteMessageRequest!): GetQuoteMessageResponse
}
type Mutation {
  register(request: RegisterRequest!): UserResponse
  setAvatar(request: SetAvatarRequest!): UserResponse
  addMessage(request: AddMessageRequest!): AddMessageResponse
}
`);