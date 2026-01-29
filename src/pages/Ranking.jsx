import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import BottomNav from "../components/BottomNav";
import { Trophy, Heart, Coins, Crown, Medal, Award, Flame } from "lucide-react";

export default function Ranking() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("ideas");
  const [topIdeas, setTopIdeas] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      // 인기 아이디어
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
      ideasData.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      setTopIdeas(ideasData.slice(0, 10));

      // 활발한 유저
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

  const getRankStyle = (index) => {
    switch (index) {
      case 0:
        return {
          icon: <Crown size={18} />,
          color: "text-yellow-500",
          bg: "bg-yellow-500/10",
        };
      case 1:
        return {
          icon: <Medal size={18} />,
          color: "text-gray-400",
          bg: "bg-gray-500/10",
        };
      case 2:
        return {
          icon: <Award size={18} />,
          color: "text-amber-600",
          bg: "bg-amber-500/10",
        };
      default:
        return {
          icon: <span className="text-sm font-bold">{index + 1}</span>,
          color: "text-gray-500",
          bg: "bg-gray-800",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-24">
      <header className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={24} className="text-yellow-500" />
            <h1 className="text-xl font-bold text-white">랭킹</h1>
          </div>

          <div className="flex bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setTab("ideas")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === "ideas"
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🔥 인기 아이디어
            </button>
            <button
              onClick={() => setTab("users")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === "users"
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              👑 TOP 유저
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "ideas" ? (
          <div className="space-y-3">
            {topIdeas.length === 0 ? (
              <p className="text-gray-400 text-center py-12">
                아직 아이디어가 없습니다
              </p>
            ) : (
              topIdeas.map((idea, index) => {
                const rankStyle = getRankStyle(index);
                return (
                  <div
                    key={idea.id}
                    onClick={() => navigate(`/idea/${idea.id}`)}
                    className="flex items-center gap-4 bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-750 transition"
                  >
                    <div
                      className={`w-10 h-10 ${rankStyle.bg} rounded-xl flex items-center justify-center ${rankStyle.color}`}
                    >
                      {rankStyle.icon}
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
                    <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full">
                      <Heart size={14} fill="currentColor" />
                      <span className="text-sm font-medium">
                        {idea.likes?.length || 0}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {topUsers.length === 0 ? (
              <p className="text-gray-400 text-center py-12">
                아직 유저가 없습니다
              </p>
            ) : (
              topUsers.map((userData, index) => {
                const rankStyle = getRankStyle(index);
                return (
                  <div
                    key={userData.id}
                    className="flex items-center gap-4 bg-gray-800 rounded-xl p-4"
                  >
                    <div
                      className={`w-10 h-10 ${rankStyle.bg} rounded-xl flex items-center justify-center ${rankStyle.color}`}
                    >
                      {rankStyle.icon}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                      {userData.displayName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {userData.displayName || "익명"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full">
                      <Coins size={14} />
                      <span className="text-sm font-medium">
                        {userData.credits || 0}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
