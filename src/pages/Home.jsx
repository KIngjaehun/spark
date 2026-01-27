import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import IdeaCard from "../components/IdeaCard";

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ideasData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setIdeas(ideasData);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-gray-900 z-10 w-full">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Spark 🔥</h1>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/write"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600"
              >
                아이디어 작성
              </Link>
              <img
                src={user.photoURL}
                alt="프로필"
                className="w-8 h-8 rounded-full cursor-pointer"
                onClick={() => navigate("/mypage")}
              />
              <button
                onClick={handleLogout}
                className="text-gray-400 text-sm hover:text-white"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-orange-500 font-medium hover:text-orange-400"
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {ideas.length === 0 ? (
          <p className="text-gray-400 text-center py-12">
            아직 아이디어가 없습니다. 첫 번째 아이디어를 공유해보세요!
          </p>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                user={user}
                onClick={() => navigate(`/idea/${idea.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
