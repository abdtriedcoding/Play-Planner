import { useState } from "react";
import ChatBox from "./ChatBox";
import ChatMiniCard from "./ChatMiniCard";
import { useChat } from "@/context/chatContext";
import { useChatIds } from "@/hooks/useChatIds";
import Spinner from "./Spinner";

function ChatboxFeed() {
  const { chatIds, isLoading } = useChatIds();
  const [searchQuery, setSearchQuery] = useState("");
  const { chatRoom } = useChat();
  const filteredChatIds = chatIds?.filter((chatId) =>
    chatId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-w-full rounded border min-h-screen lg:grid lg:grid-cols-3">
      {/* Chat List Section */}
      <div
        className={`border-r border-gray-300 lg:col-span-1 bg-white ${
          chatRoom ? "hidden lg:block" : "block"
        }`}
      >
        {/* Search Bar */}
        <div className="mx-3 my-3">
          <div className="relative text-gray-600">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2">
              <svg
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="h-6 w-6 text-gray-300"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input
              type="search"
              className="block w-full rounded bg-gray-100 py-2 pl-10 outline-none text-sky-700 font-semibold"
              name="search"
              placeholder="Search Chats"
              required
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {/* Chat List */}
        <div className="h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] overflow-y-auto">
          <ul className="min-h-[100px]">
            <h2 className="my-2 mb-2 ml-2 text-lg font-semibold text-sky-700">
              All Chats
            </h2>

            {isLoading ? (
              <li className="text-center p-3">
                <Spinner />
              </li>
            ) : filteredChatIds?.length > 0 ? (
              filteredChatIds.map((e, key) => (
                <ChatMiniCard chatId={e} key={key} />
              ))
            ) : (
              <li className="text-center p-3 text-gray-500">No chats found.</li>
            )}
          </ul>
        </div>
      </div>

      <div
        className={`${chatRoom ? "block" : "hidden lg:block"} lg:col-span-2`}
      >
        <ChatBox />
      </div>
    </div>
  );
}

export default ChatboxFeed;
