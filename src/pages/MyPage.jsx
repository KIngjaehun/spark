import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useCredits } from "../hooks/useCredits";
import IdeaCard from "../components/IdeaCard";
import BottomNav from "../components/BottomNav";
import {
  Coins,
  Users,
  LogOut,
  Heart,
  Lightbulb,
  ChevronRight,
  Settings,
} from "lucide-react";

export default function MyPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { credits } = useCredits(user?.uid);
  const [myIdeas, setMyIdeas] = useState([]);
  const [likedIdeas, setLikedIdeas] = useState([]);
  const [tab, setTab] = useState("my");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "ideas"),
      where("authorId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ideas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMyIdeas(ideas);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "ideas"),
      where("likes", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ideas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLikedIdeas(ideas);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      await signOut(auth);
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const displayIdeas = tab === "my" ? myIdeas : likedIdeas;
  const totalLikes = myIdeas.reduce(
    (sum, idea) => sum + (idea.likes?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-900 pb-24">
      <header className="bg-gradient-to-b from-gray-800 to-gray-900 px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* 프로필 */}
          <div className="flex items-center gap-4 mb-6">
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-16 h-16 rounded-2xl border-2 border-gray-700"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {user.displayName}
              </h2>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Lightbulb size={16} className="text-orange-500" />
                <span className="text-xl font-bold text-white">
                  {myIdeas.length}
                </span>
              </div>
              <p className="text-gray-500 text-xs">아이디어</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart size={16} className="text-red-500" />
                <span className="text-xl font-bold text-white">
                  {totalLikes}
                </span>
              </div>
              <p className="text-gray-500 text-xs">받은 좋아요</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins size={16} className="text-yellow-500" />
                <span className="text-xl font-bold text-yellow-500">
                  {credits}
                </span>
              </div>
              <p className="text-gray-500 text-xs">크레딧</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 -mt-2">
        {/* 메뉴 */}
        <div className="bg-gray-800 rounded-2xl mb-6 overflow-hidden">
          <button
            onClick={() => navigate("/collab-manage")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Users size={18} className="text-blue-500" />
              </div>
              <span className="text-white font-medium">협업 신청 관리</span>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab("my")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === "my"
                ? "bg-orange-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            내 아이디어 ({myIdeas.length})
          </button>
          <button
            onClick={() => setTab("liked")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === "liked"
                ? "bg-orange-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            좋아요 ({likedIdeas.length})
          </button>
        </div>

        {/* 아이디어 목록 */}
        {displayIdeas.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              {tab === "my" ? (
                <Lightbulb size={28} className="text-gray-600" />
              ) : (
                <Heart size={28} className="text-gray-600" />
              )}
            </div>
            <p className="text-gray-400">
              {tab === "my"
                ? "작성한 아이디어가 없습니다"
                : "좋아요한 아이디어가 없습니다"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                user={user}
                onClick={() => navigate(`/idea/${idea.id}`)}
              />
            ))}
          </div>
        )}

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full mt-8 py-4 flex items-center justify-center gap-2 text-gray-400 hover:text-red-500 transition"
        >
          <LogOut size={18} />
          <span>로그아웃</span>
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
