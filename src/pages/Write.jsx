import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { generateIdeaHash } from "../utils/hash";
import { Shield, Sparkles, X, Info } from "lucide-react";

export default function Write() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [secretContent, setSecretContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [protectedMode, setProtectedMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }

    if (!title.trim()) {
      alert("제목을 입력해주세요");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요");
      return;
    }

    setLoading(true);

    try {
      const now = Date.now();

      let ideaData = {
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        likes: [],
        commentCount: 0,
        createdAt: serverTimestamp(),
        protectedMode: protectedMode,
      };

      if (protectedMode) {
        const ideaHash = await generateIdeaHash(
          title.trim(),
          content.trim(),
          user.uid,
          now
        );

        ideaData = {
          ...ideaData,
          secretContent: secretContent.trim(),
          ideaHash: ideaHash,
          hashTimestamp: now,
          approvedUsers: [],
        };
      }

      await addDoc(collection(db, "ideas"), ideaData);
      navigate("/");
    } catch (error) {
      console.error("작성 실패:", error);
      alert("작성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-800 transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
          <h1 className="text-lg font-bold text-white">새 아이디어</h1>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
            className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "작성 중..." : "공유"}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 모드 선택 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setProtectedMode(false)}
            className={`p-4 rounded-2xl border-2 transition ${
              !protectedMode
                ? "border-orange-500 bg-orange-500/10"
                : "border-gray-700 bg-gray-800 hover:border-gray-600"
            }`}
          >
            <Sparkles
              size={24}
              className={`mx-auto mb-2 ${
                !protectedMode ? "text-orange-500" : "text-gray-400"
              }`}
            />
            <p
              className={`font-medium text-sm ${
                !protectedMode ? "text-orange-500" : "text-gray-300"
              }`}
            >
              🎈 가벼운
            </p>
            <p className="text-xs text-gray-500 mt-1">전체 공개</p>
          </button>

          <button
            type="button"
            onClick={() => setProtectedMode(true)}
            className={`p-4 rounded-2xl border-2 transition ${
              protectedMode
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-700 bg-gray-800 hover:border-gray-600"
            }`}
          >
            <Shield
              size={24}
              className={`mx-auto mb-2 ${
                protectedMode ? "text-blue-500" : "text-gray-400"
              }`}
            />
            <p
              className={`font-medium text-sm ${
                protectedMode ? "text-blue-500" : "text-gray-300"
              }`}
            >
              🔐 보호
            </p>
            <p className="text-xs text-gray-500 mt-1">단계별 공개</p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 제목 */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="아이디어 제목"
              className="w-full bg-transparent text-xl font-bold text-white placeholder-gray-500 focus:outline-none"
              maxLength={100}
            />
            <p className="text-right text-xs text-gray-500 mt-1">
              {title.length}/100
            </p>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-800" />

          {/* 내용 */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="아이디어를 설명해주세요..."
              rows={8}
              className="w-full bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 핵심 노하우 (보호 모드) */}
          {protectedMode && (
            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-red-500" />
                <span className="text-sm font-medium text-red-500">
                  핵심 노하우
                </span>
                <span className="text-xs text-gray-500">
                  (협업 승인 후 공개)
                </span>
              </div>
              <textarea
                value={secretContent}
                onChange={(e) => setSecretContent(e.target.value)}
                placeholder="비공개 정보를 입력하세요 (선택)"
                rows={4}
                className="w-full bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* 태그 */}
          <div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="태그 (쉼표로 구분)"
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
            />
          </div>

          {/* 안내 */}
          {protectedMode && (
            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-1">보호 모드 안내</p>
                <ul className="text-gray-400 space-y-1 text-xs">
                  <li>• 제목은 모든 사람에게 공개</li>
                  <li>• 내용은 좋아요 10개 이상 시 공개</li>
                  <li>• 핵심 노하우는 협업 승인 후 공개</li>
                  <li>• 타임스탬프 해시로 소유권 기록</li>
                </ul>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
