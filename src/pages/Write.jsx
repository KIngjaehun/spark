import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { generateIdeaHash } from "../utils/hash";

export default function Write() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [secretContent, setSecretContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

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

      const ideaHash = await generateIdeaHash(
        title.trim(),
        content.trim(),
        user.uid,
        now
      );

      await addDoc(collection(db, "ideas"), {
        title: title.trim(),
        content: content.trim(),
        secretContent: secretContent.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        likes: [],
        commentCount: 0,
        ideaHash: ideaHash,
        hashTimestamp: now,
        approvedUsers: [],
        createdAt: serverTimestamp(),
      });

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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lv1: 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              제목{" "}
              <span className="text-green-500">(Lv1 - 모든 사람 공개)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="아이디어를 한 줄로 표현해주세요"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Lv2: 상세 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              상세 내용{" "}
              <span className="text-yellow-500">
                (Lv2 - 좋아요 10개 이상 시 공개)
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="아이디어를 자세히 설명해주세요. 문제점, 해결방법, 기대효과 등"
              rows={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Lv3: 핵심 노하우 */}
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

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-400">🔐 단계별 공개 시스템</p>
            <p className="text-xs text-green-500">
              Lv1: 제목 - 모든 사람에게 공개
            </p>
            <p className="text-xs text-yellow-500">
              Lv2: 상세 내용 - 좋아요 10개 이상 시 열람 가능
            </p>
            <p className="text-xs text-red-500">
              Lv3: 핵심 노하우 - 협업 신청 후 승인된 사람만
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "작성 중..." : "아이디어 공유하기"}
          </button>
        </form>
      </main>
    </div>
  );
}
