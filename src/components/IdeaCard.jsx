import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Heart,
  MessageCircle,
  Lock,
  Shield,
  Sparkles,
  Eye,
} from "lucide-react";

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

      const authorSnap = await getDoc(authorRef);
      if (authorSnap.exists()) {
        await updateDoc(authorRef, { credits: increment(5) });
      } else {
        await setDoc(authorRef, { credits: 105 });
      }

      if (user.uid !== idea.authorId) {
        await addDoc(collection(db, "notifications"), {
          toUserId: idea.authorId,
          fromUserId: user.uid,
          fromUserName: user.displayName,
          type: "like",
          message: `${user.displayName}님이 "${idea.title}" 아이디어를 좋아합니다`,
          ideaId: idea.id,
          read: false,
          createdAt: serverTimestamp(),
        });
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
      className={`group bg-gray-800 border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg ${
        isProtected
          ? "border-blue-500/30 hover:border-blue-500/50 hover:shadow-blue-500/10"
          : "border-gray-700 hover:border-gray-600"
      }`}
    >
      {/* 상단: 작성자 + 모드 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={idea.authorPhoto}
            alt={idea.authorName}
            className="w-10 h-10 rounded-full border-2 border-gray-700"
          />
          <div>
            <p className="text-white text-sm font-medium">{idea.authorName}</p>
            <p className="text-gray-500 text-xs">
              {formatDate(idea.createdAt)}
            </p>
          </div>
        </div>

        {isProtected ? (
          <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-full">
            <Shield size={12} className="text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">보호됨</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-full">
            <Sparkles size={12} className="text-orange-400" />
            <span className="text-xs text-orange-400 font-medium">공개</span>
          </div>
        )}
      </div>

      {/* 제목 */}
      <h2 className="text-white text-lg font-bold mb-2 group-hover:text-orange-400 transition">
        {idea.title}
      </h2>

      {/* 내용 */}
      {isLocked && !isAuthor ? (
        <div className="flex items-center gap-3 bg-gray-700/50 rounded-xl p-4 mb-4">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Lock size={18} className="text-yellow-500" />
          </div>
          <div>
            <p className="text-yellow-500 text-sm font-medium">내용 잠김</p>
            <p className="text-gray-500 text-xs">
              좋아요 {likeCount}/10 달성 시 공개
            </p>
          </div>
          <div className="ml-auto">
            <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full transition-all"
                style={{ width: `${Math.min((likeCount / 10) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
          {idea.content}
        </p>
      )}

      {/* 태그 */}
      {idea.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {idea.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="bg-gray-700/50 text-gray-300 text-xs px-2.5 py-1 rounded-lg"
            >
              #{tag}
            </span>
          ))}
          {idea.tags.length > 4 && (
            <span className="text-gray-500 text-xs px-2 py-1">
              +{idea.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* 하단: 좋아요, 댓글 */}
      <div className="flex items-center gap-1 pt-4 border-t border-gray-700/50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            isLiked
              ? "text-red-500 bg-red-500/10"
              : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
          }`}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          <span className="text-sm font-medium">{likeCount}</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400">
          <MessageCircle size={18} />
          <span className="text-sm font-medium">{commentCount}</span>
        </div>

        {!isLiked && user && user.uid !== idea.authorId && (
          <span className="ml-auto text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
            +5 크레딧
          </span>
        )}
      </div>
    </div>
  );
}
