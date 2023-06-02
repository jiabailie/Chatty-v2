import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { graphqlHost, host } from "../utils/ApiRoutes";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import ChatContainer from "../components/ChatContainer";
import { io } from "socket.io-client";

function Chat() {
    const socket = useRef();
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [currentUser, setCurrentUser] = useState(undefined);
    const [currentChat, setCurrentChat] = useState(undefined);
    useEffect(() => {
        (async () => {
            if (!localStorage.getItem("chatty-user")) {
                navigate("/login");
            } else {
                setCurrentUser(await JSON.parse(localStorage.getItem("chatty-user")));
            }
        })();
    }, [navigate]);

    useEffect(() => {
        if (currentUser) {
            socket.current = io(host);
            socket.current.emit("add-user", currentUser._id);
        }
    }, [currentUser]);

    useEffect(() => {
        (async () => {
            if (currentUser) {
                if (currentUser.isAvatarImageSet) {
                    const getAllUsersQuery = `
                    {
                        getAllUsers(request: {id: "${currentUser._id}"}) {
                          status, message, users {
                            _id
                            username
                            email
                            isAvatarImageSet
                            avatarImage
                          }
                        }
                    }
                    `;
                    const { data } = await axios({
                        url: graphqlHost,
                        method: "POST",
                        data: {
                            query: getAllUsersQuery
                        }
                    });
                    setContacts(data.data.getAllUsers.users);
                } else {
                    navigate('/setAvatar');
                }
            }

        })();
    }, [currentUser, navigate]);

    const handleChatChange = (chat) => {
        setCurrentChat(chat);
    };

    return (
        <Container>
            <div className="container">
                <Contacts contacts={contacts} currentUser={currentUser} changeChat={handleChatChange} />
                {
                    currentChat === undefined ?
                        (<Welcome />) :
                        (<ChatContainer currentChat={currentChat} socket={socket} />)
                }
            </div>
        </Container>
    );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #ffffff;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000077;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;

export default Chat;