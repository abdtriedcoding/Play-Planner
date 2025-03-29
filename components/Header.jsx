import { useState } from "react";
import { Dialog, Popover } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Modal from "react-modal";
import Link from "next/link";
import { useAuth } from "@/context/authContext";
import { toast } from "sonner";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-40%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#Afd3e2",
  },
};

export default function Header() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalIsOpen, setIsOpen] = useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-sky-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo Section */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
                PlayPlanner
              </span>
            </Link>

            {/* Desktop Navigation */}
            <Popover.Group className="hidden lg:flex items-center space-x-8">
              {user && (
                <>
                  <Link
                    href="/sendRequests"
                    className="relative flex items-center text-sm font-medium text-slate-700 hover:text-sky-600 transition-colors"
                  >
                    Sent Requests
                  </Link>

                  <Link
                    href="/recieveRequests"
                    className="relative flex items-center text-sm font-medium text-slate-700 hover:text-sky-600 transition-colors"
                  >
                    Received Requests
                  </Link>

                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-slate-700 hover:text-sky-600 transition-colors"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/events"
                    className="text-sm font-medium text-slate-700 hover:text-sky-600 transition-colors"
                  >
                    Events
                  </Link>

                  <Link
                    href="/chats"
                    className="text-sm font-medium text-slate-700 hover:text-sky-600 transition-colors"
                  >
                    Chats
                  </Link>

                  <Link
                    href="/feed"
                    className="text-sm font-medium text-slate-700 hover:text-sky-600 transition-colors"
                  >
                    Victory Feed
                  </Link>
                </>
              )}
            </Popover.Group>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="h-10 w-10 rounded-full border-2 border-sky-100 flex items-center justify-center bg-sky-500 text-zinc-600">
                    {user.photoURL ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.photoURL}
                        alt={user.displayName}
                      />
                    ) : (
                      <span className="text-lg font-bold">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        toast("Logged out successfully", {
                          style: { background: "#2196F3", color: "white" },
                        });
                      } catch (error) {
                        toast.error("Logout failed. Please try again.", {
                          style: { background: "#F44336", color: "white" },
                        });
                      }
                    }}
                    className="flex items-center rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-100 hover:shadow-md hover:from-sky-500 hover:to-blue-600 transition-all"
                  >
                    Logout
                    <ChevronDownIcon className="ml-2 h-4 w-4 text-white/80" />
                  </button>
                </>
              ) : (
                <button
                  onClick={openModal}
                  className="hidden lg:flex items-center rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-100 hover:shadow-md hover:from-sky-500 hover:to-blue-600 transition-all"
                >
                  Login
                  <ChevronDownIcon className="ml-2 h-4 w-4 text-white/80" />
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="lg:hidden rounded-lg p-2 text-slate-700 hover:bg-sky-50"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <Dialog
          as="div"
          className="lg:hidden"
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-white shadow-xl transition-transform">
            <div className="flex items-center justify-between px-6 h-16 border-b border-sky-100">
              <Link href="/" className="text-lg font-bold text-sky-600">
                PlayPlanner
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-8">
              <div className="flow-root">
                <div className="space-y-4">
                  {user && (
                    <>
                      <Link
                        href="/sendRequests"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-sky-50"
                      >
                        <span className="text-slate-700">Sent Requests</span>
                      </Link>
                      <Link
                        href="/recieveRequests"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-sky-50"
                      >
                        <span className="text-slate-700">
                          Received Requests
                        </span>
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-3 block text-slate-700 rounded-lg hover:bg-sky-50"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/events"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-3 block text-slate-700 rounded-lg hover:bg-sky-50"
                      >
                        Events
                      </Link>
                      <Link
                        href="/chats"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-3 block text-slate-700 rounded-lg hover:bg-sky-50"
                      >
                        Chats
                      </Link>
                      <Link
                        href="/feed"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-3 block text-slate-700 rounded-lg hover:bg-sky-50"
                      >
                        Victory Feed
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {!user && (
                <button
                  onClick={async () => {
                    try {
                      await loginWithGoogle();
                      setMobileMenuOpen(false);
                      toast.success("Successfully logged in!", {
                        style: { background: "#4CAF50", color: "white" },
                      });
                    } catch (error) {
                      toast.error("Login failed. Please try again.", {
                        style: { background: "#F44336", color: "white" },
                      });
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
                >
                  <span>Login with Google</span>
                </button>
              )}
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>

      {/* Auth Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Authentication Modal"
      >
        <div className="p-8 max-w-md">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">
            Welcome to <span className="text-sky-600">PlayPlanner</span>
          </h2>

          <button
            onClick={async () => {
              try {
                await loginWithGoogle();
                closeModal();
                toast.success("Successfully logged in!", {
                  style: { background: "#4CAF50", color: "white" },
                });
              } catch (error) {
                toast.error("Login failed. Please try again.", {
                  style: { background: "#F44336", color: "white" },
                });
              }
            }}
            className="w-full flex items-center justify-center space-x-3 rounded-lg bg-white border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 transition-colors"
          >
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcIFnSSCcbH_MmKhlhnTBW2tjOyMTcThEUcg&usqp=CAU"
              className="h-5 w-5"
              alt="Google Logo"
            />
            <span>Continue with Google</span>
          </button>
        </div>
      </Modal>
    </>
  );
}
