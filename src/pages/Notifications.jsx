import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import BottomNav from "../components/BottomNav";
import { Heart, MessageCircle, Users, Bell, CheckCheck } from "lucide-react";

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("toUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notiData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notiData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notiId) => {
    await updateDoc(doc(db, "notifications", notiId), {
      read: true,
    });
  };

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach((noti) => {
      if (!noti.read) {
        batch.update(doc(db, "notifications", noti.id), { read: true });
      }
    });
    await batch.commit();
  };

  const handleClick = (noti) => {
    markAsRead(noti.id);
    if (noti.ideaId) {
      navigate(`/idea/${noti.ideaId}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart size={18} className="text-red-500" fill="currentColor" />;
      case "comment":
        return <MessageCircle size={18} className="text-blue-500" />;
      case "collab":
        return <Users size={18} className="text-green-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "like":
        return "bg-red-500/10";
      case "comment":
        return "bg-blue-500/10";
      case "collab":
        return "bg-green-500/10";
      default:
        return "bg-gray-500/10";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <Bell size={48} className="text-gray-600" />
        <p className="text-gray-400">로그인이 필요합니다</p>
        <button
          onClick={() => navigate("/login")}
          className="text-orange-500 font-medium hover:underline"
        >
          로그인하기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-24">
      <header className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={24} className="text-orange-500" />
            <h1 className="text-xl font-bold text-white">알림</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-gray-400 text-sm hover:text-white transition"
            >
              <CheckCheck size={16} />
              모두 읽음
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Bell size={28} className="text-gray-600" />
            </div>
            <p className="text-gray-400">알림이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((noti) => (
              <div
                key={noti.id}
                onClick={() => handleClick(noti)}
                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition ${
                  noti.read
                    ? "bg-gray-800/30 hover:bg-gray-800/50"
                    : "bg-gray-800 hover:bg-gray-750"
                }`}
              >
                <div
                  className={`w-10 h-10 ${getIconBg(
                    noti.type
                  )} rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  {getIcon(noti.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed ${
                      noti.read ? "text-gray-400" : "text-white"
                    }`}
                  >
                    {noti.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(noti.createdAt)}
                  </p>
                </div>
                {!noti.read && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
