// ChatBox.js (Modified)
import { useAuth } from "@/context/authContext";
import { useChat } from "@/context/chatContext";
import { useMessages } from "@/hooks/useMessages";
import { useState, useRef, useEffect } from "react";
import { useSendMessage } from "@/hooks/useSendMessage";
import Spinner from "./Spinner";
import EventForm from "./EventForm"; // Import the EventForm component

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  try {
    const date =
      typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid Time";
  }
};

export default function ChatBox() {
  const { user } = useAuth();
  const { chatRoom, opponentUser, setChatRoom, setOpponentUser } = useChat();
  const { messages, isLoading: messagesLoading } = useMessages(chatRoom?.id);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { sendMessage } = useSendMessage();

  // New state for controlling the visibility of the EventForm
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!chatRoom || !opponentUser) {
    return (
      <div className="lg:col-span-2 bg-sky-50">
        <div className="w-full h-[100vh] flex items-center justify-center text-gray-500 text-lg">
          Select a chat to start messaging
        </div>
      </div>
    );
  }

  const onSendMessage = async () => {
    if (input.trim() === "") return;
    setIsSending(true);
    try {
      await sendMessage({
        chatId: chatRoom.id,
        message: input.trim(),
        uid: user.uid,
      });
      setInput("");
      scrollToBottom();
    } catch (error) {
      alert(error.message);
    }
    setIsSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  // Function to open the event form
  const handleOpenEventForm = () => {
    setIsEventFormOpen(true);
  };

  // Function to close the event form
  const handleCloseEventForm = () => {
    setIsEventFormOpen(false);
  };

  return (
    <div className="lg:col-span-2 bg-sky-50 h-screen flex flex-col">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="relative flex items-center border-b border-gray-300 p-3 bg-white">
          <button
            onClick={() => {
              setChatRoom(null);
              setOpponentUser(null);
            }}
            className="lg:hidden mr-2 text-sky-600 hover:text-sky-800"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>

          <div className="flex justify-between w-full">
            <div className="gap-1 flex items-center">
              <div className="h-10 w-10 rounded-full border-2 border-sky-100 flex items-center justify-center bg-sky-500 text-zinc-600">
                <span className="text-lg font-bold">
                  {opponentUser.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="ml-2 block font-semibold text-sky-700 capitalize">
                {opponentUser?.email.split("@")[0]}
              </span>
            </div>
            {/* Schedule Match Button */}
            <div>
              <button
                onClick={handleOpenEventForm}
                className="bg-sky-500 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded"
              >
                Schedule Match
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <ul className="space-y-2">
            {messagesLoading ? (
              <div className="flex justify-center items-center h-full">
                <Spinner />
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map((message) => {
                if (message.sender === "system") {
                  return (
                    <li key={message.id} className="flex justify-center">
                      <div className="relative max-w-xl rounded-full px-4 py-2 text-white shadow bg-sky-500">
                        <span className="block">{message.message}</span>
                        <span className="text-xs text-sky-100 mt-1 block text-right">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                    </li>
                  );
                }

                const isSender = message.sender === user.uid;

                return (
                  <li
                    key={message.id}
                    className={`flex justify-${isSender ? "end" : "start"}`}
                  >
                    <div
                      className={`relative max-w-xl rounded px-4 py-2 text-gray-700 shadow ${
                        isSender ? "bg-sky-100" : "bg-white"
                      }`}
                    >
                      <span className="block">{message.message}</span>
                      <span className="text-xs text-gray-500 mt-1 block text-right">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="text-center text-gray-500">
                No messages yet. Start the conversation!
              </li>
            )}
            <div ref={messagesEndRef} />
          </ul>
        </div>

        {/* Input Area */}
        <div className="flex w-full items-center justify-between border-t border-gray-300 p-3 bg-white">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Message"
            className="mx-3 block w-full rounded-full bg-sky-100 py-2 pl-4 outline-none focus:text-gray-700 text-sky-700 font-semibold"
            name="message"
            required
          />

          {!isSending ? (
            <button
              onClick={onSendMessage}
              type="button"
              aria-label="Send Message"
            >
              <svg
                className="h-5 w-5 origin-center rotate-90 transform text-sky-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          ) : (
            <Spinner />
          )}
        </div>
      </div>
      {/* Conditionally render the EventForm */}
      {isEventFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-xl shadow-lg rounded-md bg-white">
            <EventForm
              chatId={chatRoom.id}
              teamAId={user.uid} // Current user's team ID
              teamBId={opponentUser.uid} // Opponent's team ID
              onClose={handleCloseEventForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}
