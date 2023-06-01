const GraphQLSchema = require("graphql").GraphQLSchema;
const GraphQLObjectType = require("graphql").GraphQLObjectType;
const GraphQLBoolean = require("graphql").GraphQLBoolean;
const GraphQLList = require("graphql").GraphQLList;
const GraphQLNonNull = require("graphql").GraphQLNonNull;
const GraphQLID = require("graphql").GraphQLID;
const GraphQLString = require("graphql").GraphQLString;
const GraphQLInt = require("graphql").GraphQLInt;
const GraphQLDate = require("graphql-date");
const User = require("../../model/userModel");

const userType = new GraphQLObjectType({
    name: "user",
    fields: function() {
        return {
            _id: {
                type: GraphQLString
            },
            username: {
                type: GraphQLString
            },
            email: {
                type: GraphQLString
            },
            password: {
                type: GraphQLString
            },
            isAvatarImageSet: {
                type: GraphQLBoolean
            },
            avatarImage: {
                type: GraphQLString
            },
        }
    }
});

const userQueryType = new GraphQLObjectType({
    name: "userQuery",
    fields: function() {
        return {
            login: {
                type: userType,
                args: {
                    username: {
                        name: "username",
                        type: GraphQLString
                    },
                    password: {
                        name: "password",
                        type: GraphQLString
                    }
                },
                resolve: function (root, params) {
                    
                }
            }
        };
    }
});