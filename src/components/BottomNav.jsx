import { useLocation, useNavigate } from "react-router-dom";
import { Home, PlusCircle, Bell, User, Trophy } from "lucide-react";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", icon: Home, label: "홈" },
    { path: "/ranking", icon: Trophy, label: "랭킹" },
    { path: "/write", icon: PlusCircle, label: "작성", isMain: true },
    { path: "/notifications", icon: Bell, label: "알림" },
    { path: "/mypage", icon: User, label: "마이" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-orange-500 text-white p-3 rounded-full -mt-6 shadow-lg hover:bg-orange-600 transition"
              >
                <Icon size={24} />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-1 px-3 ${
                isActive ? "text-orange-500" : "text-gray-500"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
