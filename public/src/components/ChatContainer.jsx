import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import Logout from "./Logout";
import ChatInput from "./ChatInput";
import axios from "axios";
import { graphqlHost } from "../utils/ApiRoutes";
import { v4 as uuidv4 } from "uuid";

export default function ChatContainer({ currentChat, socket }) {
  const scrollRef = useRef();
  const [messages, setMessages] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);

  useEffect(() => {
    (async () => {
      if (currentChat) {
        const currentUser = await JSON.parse(localStorage.getItem("chatty-user"));
        const getAllMessageQuery = `{
          getAllMessages(
            request: {
              from: "${currentUser._id}",
              to: "${currentChat._id}", 
            }) {
            status
            message
            messages {
              fromSelf
              message
              quote
            }
          }
        }`;
        const { data } = await axios({
          url: graphqlHost,
          method: "POST",
          data: {
            query: getAllMessageQuery
          }
        });
        setMessages(data.data.getAllMessages.messages);
      }
    })();
  }, [currentChat]);
  const handleSendMessage = async (message) => {
    const data = await JSON.parse(localStorage.getItem("chatty-user"));
    const addMessageQuery = `
    mutation {
      addMessage(request: {
      from: "${data._id}",
      to: "${currentChat._id}",
      message: "${message}"
      }) {
        status
        message
      }
    }
    `;
    await axios({
      url: graphqlHost,
      method: "POST",
      data: {
        query: addMessageQuery
      }
    });
    socket.current.emit("send-msg", {
      to: currentChat._id,
      from: data._id,
      message: message,
    });

    const msgs = [...messages];
    msgs.push({ fromSelf: true, message: message });
    setMessages(msgs);
  };
  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-receive", (msg) => {
        setArrivalMessage({ fromSelf: false, message: msg });
      });
    }
  }, [socket]);
  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img src={`data:image/svg+xml;base64,${currentChat.avatarImage}`} alt="avatar" />
          </div>
          <div className="username">
            <h3>
              {currentChat.username}
            </h3>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages">
        {
          messages.map((message) => {
            return (
              <div ref={scrollRef} key={uuidv4()}>
                <div className={`message ${message.fromSelf ? "sended" : "received"}`}>
                  <div className="content">
                    <p>
                      {message.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
      <ChatInput handleSendMessage={handleSendMessage} />
    </Container >
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.5rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #00aa00;
      }
    }
    .received {
      justify-content: flex-start;
      .content {
        background-color: #9900ff;
      }
    }
  }
`;