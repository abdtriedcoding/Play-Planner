// import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { UserAuthProvider } from "@/context/authContext";
import { ChatProvider } from "@/context/chatContext";
import "@/styles/globals.css";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }) {
  return (
    <UserAuthProvider>
      <ChatProvider>
        <Header />
        <Component {...pageProps} />
        <Toaster position="bottom-right" richColors closeButton expand={true} />
        {/* <Footer /> */}
      </ChatProvider>
    </UserAuthProvider>
  );
}
