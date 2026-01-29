import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import IdeaCard from "../components/IdeaCard";
import BottomNav from "../components/BottomNav";
import { Search as SearchIcon, X, ArrowLeft, TrendingUp } from "lucide-react";

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("tag") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);

  // 최근 검색어 로드
  useEffect(() => {
    const saved = localStorage.getItem("spark_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // 트렌딩 태그 로드
  useEffect(() => {
    const fetchTrendingTags = async () => {
      const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const tagCounts = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        data.tags?.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const sorted = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      setTrendingTags(sorted);
    };

    fetchTrendingTags();
  }, []);

  // 검색 실행
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);

      const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const query_lower = searchQuery.toLowerCase();
      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (idea) =>
            idea.title.toLowerCase().includes(query_lower) ||
            idea.content.toLowerCase().includes(query_lower) ||
            idea.tags?.some((tag) => tag.toLowerCase().includes(query_lower)) ||
            idea.authorName.toLowerCase().includes(query_lower)
        );

      setResults(filtered);
      setLoading(false);

      // 최근 검색어 저장
      if (searchQuery.trim()) {
        const updated = [
          searchQuery,
          ...recentSearches.filter((s) => s !== searchQuery),
        ].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem("spark_recent_searches", JSON.stringify(updated));
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("spark_recent_searches");
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* 검색바 */}
      <header className="sticky top-0 bg-gray-950/80 backdrop-blur-xl z-20 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>

            <div className="flex-1 relative">
              <SearchIcon
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="아이디어, 태그, 작성자 검색"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {searchQuery ? (
          // 검색 결과
          <>
            <p className="text-gray-400 text-sm mb-4">
              {loading
                ? "검색 중..."
                : `"${searchQuery}" 검색 결과 ${results.length}개`}
            </p>

            {!loading && results.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400">검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    user={user}
                    onClick={() => navigate(`/idea/${idea.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          // 검색 전 화면
          <>
            {/* 최근 검색어 */}
            {recentSearches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">최근 검색</span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-white transition"
                  >
                    전체 삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(search)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 인기 태그 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-orange-500" />
                <span className="text-sm text-gray-400">인기 태그</span>
              </div>
              <div className="space-y-2">
                {trendingTags.map(({ tag, count }, index) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="w-full flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition"
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/10 text-xs text-gray-400 font-medium">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-left text-white">#{tag}</span>
                    <span className="text-sm text-gray-500">{count}개</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {user && <BottomNav />}
    </div>
  );
}
