import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import BottomNav from "../components/BottomNav";
import { Trophy, TrendingUp, Crown, Medal, Award } from "lucide-react";

export default function Ranking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("ideas"); // ideas, users
  const [topIdeas, setTopIdeas] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      // 인기 아이디어 (좋아요순)
      const ideasQuery = query(
        collection(db, "ideas"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const ideasSnap = await getDocs(ideasQuery);
      const ideasData = ideasSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // 좋아요순 정렬
      ideasData.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      setTopIdeas(ideasData.slice(0, 10));

      // 활발한 유저 (크레딧순)
      const usersQuery = query(
        collection(db, "users"),
        orderBy("credits", "desc"),
        limit(10)
      );
      const usersSnap = await getDocs(usersQuery);
      const usersData = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTopUsers(usersData);

      setLoading(false);
    };

    fetchRankings();
  }, []);

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown size={20} className="text-yellow-500" />;
      case 1:
        return <Medal size={20} className="text-gray-400" />;
      case 2:
        return <Award size={20} className="text-amber-600" />;
      default:
        return (
          <span className="text-gray-500 text-sm font-medium w-5 text-center">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <header className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-gray-900 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={24} className="text-yellow-500" />
            <h1 className="text-xl font-bold text-white">랭킹</h1>
          </div>

          {/* 탭 */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setTab("ideas")}
              className={`flex-1 py-2 text-center font-medium ${
                tab === "ideas"
                  ? "text-orange-500 border-b-2 border-orange-500"
                  : "text-gray-400"
              }`}
            >
              🔥 인기 아이디어
            </button>
            <button
              onClick={() => setTab("users")}
              className={`flex-1 py-2 text-center font-medium ${
                tab === "users"
                  ? "text-orange-500 border-b-2 border-orange-500"
                  : "text-gray-400"
              }`}
            >
              👑 활발한 유저
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <p className="text-gray-400 text-center py-8">로딩중...</p>
        ) : tab === "ideas" ? (
          <div className="space-y-3">
            {topIdeas.map((idea, index) => (
              <div
                key={idea.id}
                onClick={() => navigate(`/idea/${idea.id}`)}
                className="flex items-center gap-4 bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition"
              >
                <div className="w-6 flex justify-center">
                  {getRankIcon(index)}
                </div>
                <img
                  src={idea.authorPhoto}
                  alt={idea.authorName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {idea.title}
                  </p>
                  <p className="text-gray-500 text-sm">{idea.authorName}</p>
                </div>
                <div className="flex items-center gap-1 text-red-500">
                  <TrendingUp size={16} />
                  <span className="text-sm font-medium">
                    {idea.likes?.length || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {topUsers.map((userData, index) => (
              <div
                key={userData.id}
                className="flex items-center gap-4 bg-gray-800 rounded-lg p-4"
              >
                <div className="w-6 flex justify-center">
                  {getRankIcon(index)}
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                  {userData.displayName?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {userData.displayName || "익명"}
                  </p>
                </div>
                <div className="text-yellow-500 font-medium">
                  {userData.credits || 0} 크레딧
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
