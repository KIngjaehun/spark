import { useState } from "react";
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
  Bookmark,
  Share2,
  MoreHorizontal,
  Eye,
} from "lucide-react";

export default function IdeaCard({ idea, user, onClick, featured = false }) {
  const [isLiked, setIsLiked] = useState(
    user && idea.likes?.includes(user.uid)
  );
  const [likeCount, setLikeCount] = useState(idea.likes?.length || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);

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
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
      await updateDoc(ideaRef, {
        likes: arrayRemove(user.uid),
      });
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
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
          message: `${user.displayName}님이 회원님의 아이디어를 좋아합니다`,
          ideaId: idea.id,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/idea/${idea.id}`;

    if (navigator.share) {
      navigator.share({ title: idea.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다");
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

    if (minutes < 1) return "방금";
    if (minutes < 60) return `${minutes}분`;
    if (hours < 24) return `${hours}시간`;
    if (days < 7) return `${days}일`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <article
      onClick={onClick}
      className={`group relative bg-gradient-to-br from-white/[0.07] to-white/[0.03] border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
        featured
          ? "border-orange-500/30 hover:border-orange-500/50 hover:shadow-orange-500/10"
          : isProtected
          ? "border-blue-500/20 hover:border-blue-500/40 hover:shadow-blue-500/10"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Featured 배지 */}
      {featured && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-medium px-3 py-1 rounded-bl-xl">
            🔥 HOT
          </div>
        </div>
      )}

      <div className="p-5">
        {/* 상단: 작성자 + 모드 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={idea.authorPhoto}
                alt={idea.authorName}
                className="w-10 h-10 rounded-xl object-cover border border-white/10"
              />
              {isProtected && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center border-2 border-gray-950">
                  <Shield size={10} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {idea.authorName}
              </p>
              <p className="text-gray-500 text-xs">
                {formatDate(idea.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isProtected && (
              <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg">
                <Sparkles size={12} />
                공개
              </span>
            )}
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-white text-lg font-bold mb-2 group-hover:text-orange-400 transition line-clamp-2">
          {idea.title}
        </h2>

        {/* 내용 */}
        {isLocked && !isAuthor ? (
          <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 mb-4">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock size={18} className="text-yellow-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-yellow-500 text-sm font-medium">내용 잠김</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min((likeCount / 10) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400">{likeCount}/10</span>
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
            {idea.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg"
              >
                #{tag}
              </span>
            ))}
            {idea.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{idea.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 하단 액션 */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                isLiked
                  ? "text-red-500 bg-red-500/10"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
              }`}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400">
              <MessageCircle size={18} />
              <span className="text-sm font-medium">{commentCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 호버 효과 */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none" />
    </article>
  );
}
