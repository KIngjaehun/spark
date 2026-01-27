import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";
import { Heart, MessageCircle } from "lucide-react";

export default function IdeaCard({ idea, user, onClick }) {
  const isLiked = user && idea.likes?.includes(user.uid);
  const likeCount = idea.likes?.length || 0;
  const commentCount = idea.commentCount || 0;

  const handleLike = async (e) => {
    e.stopPropagation();

    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }

    const ideaRef = doc(db, "ideas", idea.id);

    if (isLiked) {
      await updateDoc(ideaRef, {
        likes: arrayRemove(user.uid),
      });
    } else {
      await updateDoc(ideaRef, {
        likes: arrayUnion(user.uid),
      });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 cursor-pointer transition"
    >
      {/* 작성자 */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={idea.authorPhoto}
          alt={idea.authorName}
          className="w-8 h-8 rounded-full"
        />
        <div>
          <p className="text-white text-sm font-medium">{idea.authorName}</p>
          <p className="text-gray-500 text-xs">{formatDate(idea.createdAt)}</p>
        </div>
      </div>

      {/* 제목 */}
      <h2 className="text-white text-lg font-bold mb-2">{idea.title}</h2>

      {/* 내용 미리보기 */}
      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{idea.content}</p>

      {/* 태그 */}
      {idea.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {idea.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 좋아요, 댓글 */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-700">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm ${
            isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
          }`}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          {likeCount}
        </button>
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <MessageCircle size={18} />
          {commentCount}
        </div>
      </div>
    </div>
  );
}
