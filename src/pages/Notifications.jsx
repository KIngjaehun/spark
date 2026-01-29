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
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import BottomNav from "../components/BottomNav";
import { ArrowLeft, Heart, MessageCircle, Users, Check } from "lucide-react";

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

  const handleClick = (noti) => {
    markAsRead(noti.id);
    if (noti.ideaId) {
      navigate(`/idea/${noti.ideaId}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart size={20} className="text-red-500" />;
      case "comment":
        return <MessageCircle size={20} className="text-blue-500" />;
      case "collab":
        return <Users size={20} className="text-green-500" />;
      default:
        return <Check size={20} className="text-gray-500" />;
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">로그인이 필요합니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <header className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-gray-900 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">알림</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <p className="text-gray-400 text-center py-8">로딩중...</p>
        ) : notifications.length === 0 ? (
          <p className="text-gray-400 text-center py-8">알림이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((noti) => (
              <div
                key={noti.id}
                onClick={() => handleClick(noti)}
                className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition ${
                  noti.read ? "bg-gray-800/50" : "bg-gray-800"
                }`}
              >
                <div className="mt-1">{getIcon(noti.type)}</div>
                <div className="flex-1">
                  <p
                    className={`text-sm ${
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
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
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
