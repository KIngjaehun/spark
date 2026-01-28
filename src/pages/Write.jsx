import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { generateIdeaHash } from "../utils/hash";
import { Shield, Sparkles } from "lucide-react";

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

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요");
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

      // 보호 모드일 때만 해시 + 비밀 내용 추가
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
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">아이디어 작성</h1>
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white"
          >
            취소
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 모드 선택 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setProtectedMode(false)}
            className={`p-4 rounded-lg border-2 transition ${
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
              className={`font-medium ${
                !protectedMode ? "text-orange-500" : "text-gray-300"
              }`}
            >
              🎈 가벼운 아이디어
            </p>
            <p className="text-xs text-gray-500 mt-1">
              자유롭게 공유, 전체 공개
            </p>
          </button>

          <button
            type="button"
            onClick={() => setProtectedMode(true)}
            className={`p-4 rounded-lg border-2 transition ${
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
              className={`font-medium ${
                protectedMode ? "text-blue-500" : "text-gray-300"
              }`}
            >
              🔐 진지한 아이디어
            </p>
            <p className="text-xs text-gray-500 mt-1">
              소유권 보호, 단계별 공개
            </p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              제목
              {protectedMode && (
                <span className="text-green-500 ml-2">
                  (Lv1 - 모든 사람 공개)
                </span>
              )}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="아이디어를 한 줄로 표현해주세요"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* 상세 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {protectedMode ? "상세 내용" : "내용"}
              {protectedMode && (
                <span className="text-yellow-500 ml-2">
                  (Lv2 - 좋아요 10개 이상 시 공개)
                </span>
              )}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="아이디어를 자세히 설명해주세요. 문제점, 해결방법, 기대효과 등"
              rows={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* 핵심 노하우 (보호 모드에서만) */}
          {protectedMode && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                핵심 노하우{" "}
                <span className="text-red-500">
                  (Lv3 - 협업 승인된 사람만 공개)
                </span>
              </label>
              <textarea
                value={secretContent}
                onChange={(e) => setSecretContent(e.target.value)}
                placeholder="(선택) 실제 구현 방법, 수익 모델, 핵심 인사이트 등 비공개 정보"
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
          )}

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              태그 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="예: AI, 자동화, 사이드프로젝트"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* 안내 */}
          {protectedMode ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
              <p className="text-sm text-blue-400 font-medium">
                🔐 보호 모드 활성화
              </p>
              <p className="text-xs text-green-500">
                Lv1: 제목 - 모든 사람에게 공개
              </p>
              <p className="text-xs text-yellow-500">
                Lv2: 상세 내용 - 좋아요 10개 이상 시 열람 가능
              </p>
              <p className="text-xs text-red-500">
                Lv3: 핵심 노하우 - 협업 신청 후 승인된 사람만
              </p>
              <p className="text-xs text-gray-400 mt-2">
                타임스탬프 해시로 소유권이 기록됩니다.
              </p>
            </div>
          ) : (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <p className="text-sm text-orange-400 font-medium">
                🎈 가벼운 모드
              </p>
              <p className="text-xs text-gray-400 mt-1">
                제목과 내용이 모든 사람에게 공개됩니다. 자유롭게 아이디어를
                나눠보세요!
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              protectedMode
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {loading ? "작성 중..." : "아이디어 공유하기"}
          </button>
        </form>
      </main>
    </div>
  );
}
