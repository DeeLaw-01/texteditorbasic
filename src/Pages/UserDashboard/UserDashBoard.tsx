import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import useUserStore from "@/store/userStore";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-provider";

// Custom icons
const GamepadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 11h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1Z" />
    <path d="M14 10h4a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1Z" />
    <path d="M6 20h4a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1Z" />
    <path d="M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  </svg>
);

const TrophyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.11" />
    <path d="M15 7a3 3 0 1 0-6 0c0 1.66.5 3 2 5h2c1.5-2 2-3.34 2-5Z" />
  </svg>
);

const FriendsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const sidebarLinks = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    exact: true,
  },
  {
    title: "Profile",
    icon: User,
    path: "/dashboard/profile",
  },
  {
    title: "My Games",
    icon: GamepadIcon,
    path: "/dashboard/games",
  },
  {
    title: "Achievements",
    icon: TrophyIcon,
    path: "/dashboard/achievements",
  },
  {
    title: "Friends",
    icon: FriendsIcon,
    path: "/dashboard/friends",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/dashboard/settings",
  },
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] text-[var(--dashboard-text)] pt-16">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--dashboard-border)]">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--gaming-purple)]"
          >
            <path d="M6 11h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1Z" />
            <path d="M14 10h4a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1Z" />
            <path d="M6 20h4a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1Z" />
            <path d="M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          </svg>
          GameHub
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-[var(--dashboard-card-hover)]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun size={20} className="text-[var(--gaming-purple-light)]" />
            ) : (
              <Moon size={20} className="text-[var(--gaming-purple)]" />
            )}
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-md hover:bg-[var(--dashboard-card-hover)]"
            aria-label="Toggle menu"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 border-r border-[var(--dashboard-border)] bg-[var(--dashboard-sidebar)] h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--gaming-purple)]"
              >
                <path d="M6 11h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1Z" />
                <path d="M14 10h4a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1Z" />
                <path d="M6 20h4a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1Z" />
                <path d="M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
              GameHub
            </h2>
          </div>

          <div className="flex-1 px-4 py-2">
            <nav className="space-y-1">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    location.pathname === link.path ||
                      (link.exact && location.pathname === link.path)
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text)] hover:bg-[var(--dashboard-card-hover)]"
                  )}
                >
                  {typeof link.icon === "function" ? (
                    <link.icon />
                  ) : (
                    React.createElement(link.icon, { size: 20 })
                  )}
                  <span>{link.title}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-[var(--dashboard-border)]">
            <div className="flex items-center gap-3 mb-4 p-2">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[var(--gaming-purple)]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--dashboard-card-hover)] border-2 border-[var(--gaming-purple)] flex items-center justify-center">
                  <User
                    size={20}
                    className="text-[var(--dashboard-text-muted)]"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-[var(--dashboard-text-muted)] truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--dashboard-card-hover)] rounded-md transition-colors mb-3"
            >
              <div className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon
                    size={18}
                    className="text-[var(--gaming-purple-light)]"
                  />
                ) : (
                  <Sun size={18} className="text-[var(--gaming-purple)]" />
                )}
                <span>{theme === "dark" ? "Light" : "Dark"} Mode</span>
              </div>
              <span className="text-xs text-[var(--dashboard-text-muted)]">
                Toggle
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text)] hover:bg-[var(--dashboard-card-hover)] rounded-md transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMobileSidebarOpen(false)}
            ></div>
            <div className="fixed top-0 left-0 bottom-0 w-64 bg-[var(--dashboard-sidebar)] z-50 p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[var(--gaming-purple)]"
                  >
                    <path d="M6 11h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1Z" />
                    <path d="M14 10h4a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1Z" />
                    <path d="M6 20h4a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1Z" />
                    <path d="M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  </svg>
                  GameHub
                </h2>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-md hover:bg-[var(--dashboard-card-hover)]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 p-3 bg-[var(--dashboard-card-hover)]/50 rounded-lg">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[var(--gaming-purple)]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--dashboard-card)] border-2 border-[var(--gaming-purple)] flex items-center justify-center">
                      <User
                        size={20}
                        className="text-[var(--dashboard-text-muted)]"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-[var(--dashboard-text-muted)]">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="space-y-1 mb-6">
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      location.pathname === link.path ||
                        (link.exact && location.pathname === link.path)
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text)] hover:bg-[var(--dashboard-card-hover)]"
                    )}
                  >
                    {typeof link.icon === "function" ? (
                      <link.icon />
                    ) : (
                      React.createElement(link.icon, { size: 20 })
                    )}
                    <span>{link.title}</span>
                  </Link>
                ))}
              </nav>

              <div className="pt-4 border-t border-[var(--dashboard-border)]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text)] hover:bg-[var(--dashboard-card-hover)] rounded-md transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 pt-4 md:pt-8 pb-20 bg-[var(--dashboard-bg)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
