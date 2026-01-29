import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
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
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const { credits } = useCredits(user?.uid);
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [filteredIdeas, setFilteredIdeas] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest"); // latest, popular, trending
  const [filterMode, setFilterMode] = useState("all"); // all, light, protected
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

  // 검색 + 필터 + 정렬 적용
  useEffect(() => {
    let result = [...ideas];

    // 검색
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (idea) =>
          idea.title.toLowerCase().includes(query) ||
          idea.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          idea.authorName.toLowerCase().includes(query)
      );
    }

    // 모드 필터
    if (filterMode === "light") {
      result = result.filter((idea) => !idea.protectedMode);
    } else if (filterMode === "protected") {
      result = result.filter((idea) => idea.protectedMode);
    }

    // 정렬
    if (sortBy === "popular") {
      result.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else if (sortBy === "trending") {
      // 최근 24시간 내 좋아요 많은 순
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      result = result.filter((idea) => {
        const createdAt = idea.createdAt?.toDate?.()?.getTime() || 0;
        return createdAt > oneDayAgo;
      });
      result.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    }

    setFilteredIdeas(result);
  }, [ideas, searchQuery, sortBy, filterMode]);

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
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-gray-900 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-white">Spark 🔥</h1>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full">
                  <Coins size={16} className="text-yellow-500" />
                  <span className="text-yellow-500 text-sm font-medium">
                    {credits}
                  </span>
                </div>
                <img
                  src={user.photoURL}
                  alt="프로필"
                  className="w-8 h-8 rounded-full cursor-pointer"
                  onClick={() => navigate("/mypage")}
                />
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

          {/* 검색바 */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아이디어, 태그, 작성자 검색..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-10 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* 필터 토글 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-gray-400 text-sm mt-2 hover:text-white"
          >
            <Filter size={14} />
            필터 {showFilters ? "닫기" : "열기"}
          </button>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg space-y-3">
              {/* 정렬 */}
              <div>
                <p className="text-xs text-gray-500 mb-2">정렬</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy("latest")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      sortBy === "latest"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <Clock size={14} />
                    최신순
                  </button>
                  <button
                    onClick={() => setSortBy("popular")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      sortBy === "popular"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <TrendingUp size={14} />
                    인기순
                  </button>
                  <button
                    onClick={() => setSortBy("trending")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      sortBy === "trending"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <Sparkles size={14} />
                    급상승
                  </button>
                </div>
              </div>

              {/* 모드 필터 */}
              <div>
                <p className="text-xs text-gray-500 mb-2">아이디어 유형</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterMode("all")}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filterMode === "all"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setFilterMode("light")}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filterMode === "light"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    🎈 가벼운
                  </button>
                  <button
                    onClick={() => setFilterMode("protected")}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filterMode === "protected"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    🔐 진지한
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 검색 결과 표시 */}
        {searchQuery && (
          <p className="text-gray-400 text-sm mb-4">
            "{searchQuery}" 검색 결과: {filteredIdeas.length}개
          </p>
        )}

        {filteredIdeas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {searchQuery
                ? "검색 결과가 없습니다"
                : "아직 아이디어가 없습니다"}
            </p>
            {user && !searchQuery && (
              <Link
                to="/write"
                className="inline-block mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg"
              >
                첫 아이디어 작성하기
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

      {/* 하단 네비게이션 */}
      {user && <BottomNav />}
    </div>
  );
}
