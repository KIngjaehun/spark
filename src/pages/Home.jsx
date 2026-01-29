import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useCredits } from "../hooks/useCredits";
import IdeaCard from "../components/IdeaCard";
import BottomNav from "../components/BottomNav";
import SkeletonCard from "../components/SkeletonCard";
import {
  Coins,
  Search,
  Flame,
  Clock,
  TrendingUp,
  Bookmark,
  Hash,
} from "lucide-react";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { credits } = useCredits(user?.uid);
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("trending"); // trending, latest, protected
  const [trendingTags, setTrendingTags] = useState([]);

  // 아이디어 불러오기
  useEffect(() => {
    setLoading(true);

    let q;
    if (tab === "latest") {
      q = query(
        collection(db, "ideas"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
    } else if (tab === "protected") {
      q = query(
        collection(db, "ideas"),
        where("protectedMode", "==", true),
        orderBy("createdAt", "desc"),
        limit(20)
      );
    } else {
      q = query(
        collection(db, "ideas"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let ideasData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 트렌딩: 좋아요순 정렬
      if (tab === "trending") {
        ideasData.sort(
          (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
        );
        ideasData = ideasData.slice(0, 20);
      }

      setIdeas(ideasData);

      // 트렌딩 태그 추출
      const tagCounts = {};
      ideasData.forEach((idea) => {
        idea.tags?.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag]) => tag);
      setTrendingTags(sortedTags);

      setLoading(false);
    });

    return () => unsubscribe();
  }, [tab]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 bg-gray-950/80 backdrop-blur-xl z-20 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4">
          {/* 상단 */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Flame size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                Spark
              </span>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => navigate("/search")}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition"
                  >
                    <Search size={20} className="text-gray-400" />
                  </button>
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
                    <Coins size={14} className="text-yellow-500" />
                    <span className="text-yellow-500 text-sm font-semibold">
                      {credits}
                    </span>
                  </div>
                  <img
                    src={user.photoURL}
                    alt="프로필"
                    className="w-9 h-9 rounded-xl border border-white/10 cursor-pointer hover:border-orange-500/50 transition"
                    onClick={() => navigate("/mypage")}
                  />
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-orange-500/25 transition"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-1 pb-3">
            {[
              { id: "trending", icon: TrendingUp, label: "트렌딩" },
              { id: "latest", icon: Clock, label: "최신" },
              { id: "protected", icon: Bookmark, label: "보호됨" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                  tab === t.id
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* 트렌딩 태그 */}
        {tab === "trending" && trendingTags.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Hash size={16} className="text-gray-500" />
              <span className="text-sm text-gray-400">인기 태그</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/search?tag=${tag}`)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 아이디어 목록 */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flame size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-400 mb-2">아직 아이디어가 없어요</p>
            {user && (
              <Link
                to="/write"
                className="inline-flex items-center gap-2 mt-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/25 transition"
              >
                첫 아이디어 작성하기
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea, index) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                user={user}
                onClick={() => navigate(`/idea/${idea.id}`)}
                featured={tab === "trending" && index < 3}
              />
            ))}
          </div>
        )}
      </main>

      {user && <BottomNav />}
    </div>
  );
}
