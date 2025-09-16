import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { StudyHub } from "./components/StudyHub";
import { AdminDashboard } from "./components/AdminDashboard";
import { useState } from "react";

export default function App() {
  const [currentView, setCurrentView] = useState<"hub" | "admin">("hub");
  const isAdmin = useQuery(api.admin.isAdmin);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-primary">Study Hub</h2>
          <Authenticated>
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView("hub")}
                  className={`px-3 py-1 rounded text-sm ${
                    currentView === "hub"
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Study Hub
                </button>
                <button
                  onClick={() => setCurrentView("admin")}
                  className={`px-3 py-1 rounded text-sm ${
                    currentView === "admin"
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Admin
                </button>
              </div>
            )}
          </Authenticated>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4">
        <Content currentView={currentView} />
      </main>
      <Toaster />
    </div>
  );
}

function Content({ currentView }: { currentView: "hub" | "admin" }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const isAdmin = useQuery(api.admin.isAdmin);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Unauthenticated>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Study Hub</h1>
            <p className="text-xl text-secondary">Sign in to book study tables</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {currentView === "admin" && isAdmin ? (
          <AdminDashboard />
        ) : (
          <StudyHub />
        )}
      </Authenticated>
    </div>
  );
}
