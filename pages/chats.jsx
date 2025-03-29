import ChatboxFeed from "@/components/ChatboxFeed";
import { useAuth } from "@/context/authContext";

function chats() {
  const { user } = useAuth();
  if (!user) {
    return <h1>Login First</h1>;
  }
  return <ChatboxFeed />;
}

export default chats;
