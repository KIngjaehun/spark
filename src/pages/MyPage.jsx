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
import IdeaCard from "../components/IdeaCard";
import { ArrowLeft } from "lucide-react";

export default function MyPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [myIdeas, setMyIdeas] = useState([]);
  const [tab, setTab] = useState("my"); // "my" or "liked"
  const [likedIdeas, setLikedIdeas] = useState([]);

  // 내 아이디어
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

  // 좋아요한 아이디어
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
    await signOut(auth);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">로딩중...</p>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const displayIdeas = tab === "my" ? myIdeas : likedIdeas;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-gray-900 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">마이페이지</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 프로필 */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{myIdeas.length}</p>
            <p className="text-gray-400 text-sm">작성한 아이디어</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{likedIdeas.length}</p>
            <p className="text-gray-400 text-sm">좋아요한 아이디어</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-800 mb-6">
          <button
            onClick={() => setTab("my")}
            className={`flex-1 py-3 text-center font-medium ${
              tab === "my"
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-gray-400"
            }`}
          >
            내 아이디어
          </button>
          <button
            onClick={() => setTab("liked")}
            className={`flex-1 py-3 text-center font-medium ${
              tab === "liked"
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-gray-400"
            }`}
          >
            좋아요
          </button>
        </div>

        {/* 아이디어 목록 */}
        {displayIdeas.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            {tab === "my"
              ? "작성한 아이디어가 없습니다"
              : "좋아요한 아이디어가 없습니다"}
          </p>
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
          className="w-full mt-8 py-3 text-red-500 border border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
        >
          로그아웃
        </button>
      </main>
    </div>
  );
}
