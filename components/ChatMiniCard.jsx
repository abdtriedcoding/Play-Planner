import { useAuth } from "@/context/authContext";
import { useChat } from "@/context/chatContext";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useRTDBUserDetails } from "@/hooks/useRTDBUserDetails";
import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  try {
    const date =
      typeof timestamp === "number" ? new Date(timestamp) : timestamp.toDate();
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid Time";
  }
};

export default function ChatMiniCard({ chatId }) {
  const { user: authUser } = useAuth();
  const { chatRoom, isLoading: isChatRoomLoading } = useChatRoom(chatId);
  const { setChatRoom, setOpponentUser } = useChat();
  const [opponentId, setOpponentId] = useState(null);

  useEffect(() => {
    if (authUser?.uid && chatRoom) {
      const opponent =
        chatRoom.uid1 === authUser.uid ? chatRoom.uid2 : chatRoom.uid1;
      setOpponentId(opponent);
    }
  }, [authUser, chatRoom]);

  const { user: opponentUser, isLoading: isUserLoading } = useUser(opponentId);
  const { user: presenceStatus, isLoading: isPresenceLoading } =
    useRTDBUserDetails(opponentId);

  const isLoading =
    isChatRoomLoading || isUserLoading || isPresenceLoading || !opponentUser;

  return (
    <div
      onClick={() => {
        if (chatRoom && opponentUser) {
          setChatRoom(chatRoom);
          setOpponentUser(opponentUser);
        }
      }}
      className="flex cursor-pointer items-center border-b border-gray-300 px-3 py-2 text-sm transition duration-150 ease-in-out hover:bg-sky-50 focus:outline-none"
    >
      {isLoading ? (
        <div className="flex w-full items-center">
          <div className="animate-pulse h-10 w-10 rounded-full bg-gray-300"></div>
          <div className="w-full pb-2">
            <div className="flex justify-between">
              <span className="ml-2 block font-semibold text-gray-600">
                Loading...
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-sky-100 flex items-center font-bold justify-center bg-sky-500 text-zinc-600">
            {opponentUser.email.charAt(0).toUpperCase()}
          </div>
          <div className="w-full pb-2">
            <div className="flex justify-between">
              <span className="ml-2 block font-semibold text-sky-700 capitalize">
                {opponentUser?.email.split("@")[0]}
              </span>
              <span className="ml-2 block text-sm text-gray-600">
                LastSeen: {formatTimestamp(presenceStatus?.lastSeen)}
              </span>
            </div>
            {presenceStatus && (
              <div className="flex gap-[1px] items-center justify-start px-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    presenceStatus.isOnline ? "bg-green-600" : "bg-red-600"
                  }`}
                ></div>
                <span className="ml-2 block text-sm text-gray-600">
                  {presenceStatus?.isOnline ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
