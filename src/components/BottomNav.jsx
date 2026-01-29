import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, PlusCircle, Bell, User } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("toUserId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [user]);

  const navItems = [
    { path: "/", icon: Home, label: "홈" },
    { path: "/search", icon: Search, label: "검색" },
    { path: "/write", icon: PlusCircle, label: "", isMain: true },
    { path: "/notifications", icon: Bell, label: "알림", badge: unreadCount },
    { path: "/mypage", icon: User, label: "마이" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* 블러 배경 */}
      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl border-t border-white/5" />

      <div className="relative max-w-2xl mx-auto flex items-center justify-around py-2 px-6 safe-area-pb">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative -mt-6"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all">
                  <Icon size={26} className="text-white" strokeWidth={2.5} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center py-2 px-3 rounded-xl transition ${
                isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-white text-[10px] font-bold">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  </div>
                )}
              </div>
              {item.label && (
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    isActive ? "text-white" : ""
                  }`}
                >
                  {item.label}
                </span>
              )}
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
