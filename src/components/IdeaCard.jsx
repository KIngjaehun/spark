import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Heart, MessageCircle, Lock, Shield, Sparkles } from "lucide-react";

export default function IdeaCard({ idea, user, onClick }) {
  const isLiked = user && idea.likes?.includes(user.uid);
  const likeCount = idea.likes?.length || 0;
  const commentCount = idea.commentCount || 0;
  const isProtected = idea.protectedMode;
  const isLocked = isProtected && likeCount < 10;
  const isAuthor = user && user.uid === idea.authorId;

  const handleLike = async (e) => {
    e.stopPropagation();

    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }

    const ideaRef = doc(db, "ideas", idea.id);
    const authorRef = doc(db, "users", idea.authorId);

    if (isLiked) {
      await updateDoc(ideaRef, {
        likes: arrayRemove(user.uid),
      });
    } else {
      await updateDoc(ideaRef, {
        likes: arrayUnion(user.uid),
      });

      // 작성자 크레딧 추가
      const authorSnap = await getDoc(authorRef);
      if (authorSnap.exists()) {
        await updateDoc(authorRef, { credits: increment(5) });
      } else {
        await setDoc(authorRef, { credits: 105 });
      }
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
      className={`bg-gray-800 border rounded-lg p-4 hover:border-gray-600 cursor-pointer transition ${
        isProtected ? "border-blue-500/30" : "border-gray-700"
      }`}
    >
      {/* 모드 뱃지 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={idea.authorPhoto}
            alt={idea.authorName}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="text-white text-sm font-medium">{idea.authorName}</p>
            <p className="text-gray-500 text-xs">
              {formatDate(idea.createdAt)}
            </p>
          </div>
        </div>

        {isProtected ? (
          <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded-full">
            <Shield size={12} className="text-blue-400" />
            <span className="text-xs text-blue-400">보호됨</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded-full">
            <Sparkles size={12} className="text-orange-400" />
            <span className="text-xs text-orange-400">공개</span>
          </div>
        )}
      </div>

      <h2 className="text-white text-lg font-bold mb-2">{idea.title}</h2>

      {/* 내용 */}
      {isLocked && !isAuthor ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
          <Lock size={14} />
          <span>좋아요 {likeCount}/10 달성 시 내용 공개</span>
        </div>
      ) : (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {idea.content}
        </p>
      )}

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
        {!isLiked && (
          <span className="text-xs text-yellow-500 ml-auto">+5 크레딧</span>
        )}
      </div>
    </div>
  );
}
