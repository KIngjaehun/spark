import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useCredits } from "../hooks/useCredits";
import IdeaCard from "../components/IdeaCard";
import BottomNav from "../components/BottomNav";
import {
  Coins,
  Search,
  X,
  Filter,
  TrendingUp,
  Clock,
  Sparkles,
  Flame,
  SlidersHorizontal,
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const { credits } = useCredits(user?.uid);
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [filteredIdeas, setFilteredIdeas] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterMode, setFilterMode] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    let result = [...ideas];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (idea) =>
          idea.title.toLowerCase().includes(q) ||
          idea.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
          idea.authorName.toLowerCase().includes(q)
      );
    }

    if (filterMode === "light") {
      result = result.filter((idea) => !idea.protectedMode);
    } else if (filterMode === "protected") {
      result = result.filter((idea) => idea.protectedMode);
    }

    if (sortBy === "popular") {
      result.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else if (sortBy === "trending") {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      result = result.filter((idea) => {
        const createdAt = idea.createdAt?.toDate?.()?.getTime() || 0;
        return createdAt > oneDayAgo;
      });
      result.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    }

    setFilteredIdeas(result);
  }, [ideas, searchQuery, sortBy, filterMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Flame size={48} className="text-orange-500 animate-pulse" />
          <p className="text-gray-400">로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* 상단 바 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Flame size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Spark</h1>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-3 py-1.5 rounded-full">
                  <Coins size={14} className="text-yellow-500" />
                  <span className="text-yellow-500 text-sm font-semibold">
                    {credits}
                  </span>
                </div>
                <img
                  src={user.photoURL}
                  alt="프로필"
                  className="w-9 h-9 rounded-full border-2 border-gray-700 cursor-pointer hover:border-orange-500 transition"
                  onClick={() => navigate("/mypage")}
                />
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
              >
                로그인
              </Link>
            )}
          </div>

          {/* 검색바 */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아이디어, 태그, 작성자 검색..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-11 pr-11 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={18} />
              </button>
            ) : (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                  showFilters ? "text-orange-500" : "text-gray-500"
                } hover:text-orange-500`}
              >
                <SlidersHorizontal size={18} />
              </button>
            )}
          </div>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-800 rounded-xl space-y-4 animate-fadeIn">
              {/* 정렬 */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">정렬</p>
                <div className="flex gap-2">
                  {[
                    { id: "latest", icon: Clock, label: "최신순" },
                    { id: "popular", icon: TrendingUp, label: "인기순" },
                    { id: "trending", icon: Flame, label: "급상승" },
                  ].map((sort) => (
                    <button
                      key={sort.id}
                      onClick={() => setSortBy(sort.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        sortBy === sort.id
                          ? "bg-orange-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <sort.icon size={14} />
                      {sort.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 모드 필터 */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  아이디어 유형
                </p>
                <div className="flex gap-2">
                  {[
                    { id: "all", label: "전체" },
                    { id: "light", label: "🎈 가벼운" },
                    { id: "protected", label: "🔐 진지한" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setFilterMode(mode.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        filterMode === mode.id
                          ? "bg-orange-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {searchQuery && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">
              <span className="text-white font-medium">"{searchQuery}"</span>{" "}
              검색 결과 {filteredIdeas.length}개
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-orange-500 text-sm hover:underline"
            >
              초기화
            </button>
          </div>
        )}

        {filteredIdeas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-400 mb-2">
              {searchQuery
                ? "검색 결과가 없습니다"
                : "아직 아이디어가 없습니다"}
            </p>
            {user && !searchQuery && (
              <Link
                to="/write"
                className="inline-flex items-center gap-2 mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/25 transition"
              >
                <Sparkles size={18} />첫 아이디어 작성하기
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIdeas.map((idea) => (
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

      {user && <BottomNav />}
    </div>
  );
}
