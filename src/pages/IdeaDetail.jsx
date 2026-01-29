import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useCredits } from "../hooks/useCredits";
import {
  Heart,
  ArrowLeft,
  Send,
  Lock,
  Unlock,
  Users,
  Coins,
  Shield,
  Sparkles,
  Share2,
  MoreHorizontal,
} from "lucide-react";

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, useCredits: spendCredits } = useCredits(user?.uid);

  const [idea, setIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [unlockedWithCredits, setUnlockedWithCredits] = useState(false);

  useEffect(() => {
    const fetchIdea = async () => {
      const docRef = doc(db, "ideas", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setIdea({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };

    fetchIdea();
  }, [id]);

  useEffect(() => {
    const q = query(
      collection(db, "ideas", id, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }

    const ideaRef = doc(db, "ideas", id);
    const isLiked = idea.likes?.includes(user.uid);

    if (isLiked) {
      await updateDoc(ideaRef, {
        likes: arrayRemove(user.uid),
      });
      setIdea((prev) => ({
        ...prev,
        likes: prev.likes.filter((uid) => uid !== user.uid),
      }));
    } else {
      await updateDoc(ideaRef, {
        likes: arrayUnion(user.uid),
      });
      setIdea((prev) => ({
        ...prev,
        likes: [...(prev.likes || []), user.uid],
      }));
    }
  };

  const handleUnlockWithCredits = async () => {
    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }

    if (credits < 50) {
      alert(`크레딧이 부족합니다. (보유: ${credits}, 필요: 50)`);
      return;
    }

    const success = await spendCredits(50);
    if (success) {
      setUnlockedWithCredits(true);
    }
  };

  const handleCollabRequest = async () => {
    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }

    try {
      await addDoc(collection(db, "ideas", id, "collabRequests"), {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setRequestSent(true);
      alert("협업 신청이 완료되었습니다!");
    } catch (error) {
      console.error("협업 신청 실패:", error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }

    if (!newComment.trim()) return;

    await addDoc(collection(db, "ideas", id, "comments"), {
      content: newComment.trim(),
      authorId: user.uid,
      authorName: user.displayName,
      authorPhoto: user.photoURL,
      createdAt: serverTimestamp(),
    });

    // 알림 보내기
    if (user.uid !== idea.authorId) {
      await addDoc(collection(db, "notifications"), {
        toUserId: idea.authorId,
        fromUserId: user.uid,
        fromUserName: user.displayName,
        type: "comment",
        message: `${
          user.displayName
        }님이 댓글을 남겼습니다: "${newComment.slice(0, 30)}${
          newComment.length > 30 ? "..." : ""
        }"`,
        ideaId: idea.id,
        read: false,
        createdAt: serverTimestamp(),
      });
    }

    await updateDoc(doc(db, "ideas", id), {
      commentCount: comments.length + 1,
    });

    setNewComment("");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: idea.title,
        text: `Spark에서 이 아이디어를 확인해보세요!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다!");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">아이디어를 찾을 수 없습니다</p>
        <button
          onClick={() => navigate("/")}
          className="text-orange-500 hover:underline"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const isLiked = user && idea.likes?.includes(user.uid);
  const likeCount = idea.likes?.length || 0;
  const isAuthor = user && user.uid === idea.authorId;
  const isApproved = user && idea.approvedUsers?.includes(user.uid);
  const isProtected = idea.protectedMode;

  const canViewContent =
    !isProtected || likeCount >= 10 || isAuthor || unlockedWithCredits;
  const canViewSecret = isApproved || isAuthor;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 헤더 */}
      <header className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-800 transition"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <h1 className="text-lg font-bold text-white">아이디어</h1>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-full">
                <Coins size={14} className="text-yellow-500" />
                <span className="text-yellow-500 text-sm font-medium">
                  {credits}
                </span>
              </div>
            )}
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-800 transition"
            >
              <Share2 size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 모드 뱃지 */}
        <div className="mb-4">
          {isProtected ? (
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-full">
              <Shield size={14} className="text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">
                보호된 아이디어
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-full">
              <Sparkles size={14} className="text-orange-400" />
              <span className="text-sm text-orange-400 font-medium">
                공개 아이디어
              </span>
            </div>
          )}
        </div>

        {/* 작성자 */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src={idea.authorPhoto}
            alt={idea.authorName}
            className="w-12 h-12 rounded-full border-2 border-gray-700"
          />
          <div>
            <p className="text-white font-medium">{idea.authorName}</p>
            <p className="text-gray-500 text-sm">
              {formatDate(idea.createdAt)}
            </p>
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-2xl font-bold text-white mb-6">{idea.title}</h2>

        {/* 내용 */}
        {isProtected ? (
          canViewContent ? (
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 px-2 py-1 rounded-full text-xs mb-3">
                <Unlock size={12} />
                <span>Lv2 공개됨</span>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {idea.content}
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
                  <Lock size={28} className="text-yellow-500" />
                </div>
                <p className="text-yellow-500 font-bold mb-2">상세 내용 잠김</p>

                {/* 진행바 */}
                <div className="w-full max-w-xs mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>좋아요 {likeCount}개</span>
                    <span>10개 필요</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min((likeCount / 10) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {user && !isAuthor && (
                  <div className="w-full pt-4 border-t border-gray-700">
                    <p className="text-gray-400 text-sm mb-3">
                      또는 크레딧으로 바로 열기
                    </p>
                    <button
                      onClick={handleUnlockWithCredits}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 px-4 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-yellow-500/25 transition"
                    >
                      <Coins size={16} className="inline mr-2" />
                      50 크레딧으로 잠금 해제
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="mb-6">
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {idea.content}
            </p>
          </div>
        )}

        {/* Lv3: 핵심 노하우 */}
        {isProtected &&
          idea.secretContent &&
          (canViewSecret ? (
            <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-2xl p-5 mb-6">
              <div className="inline-flex items-center gap-1.5 text-red-400 text-xs mb-3">
                <Unlock size={12} />
                <span>Lv3 핵심 노하우</span>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {idea.secretContent}
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <Lock size={28} className="text-red-500" />
                </div>
                <p className="text-red-500 font-bold mb-2">핵심 노하우 잠김</p>
                <p className="text-gray-400 text-sm mb-4">
                  협업 신청 후 작성자 승인이 필요합니다
                </p>

                {user && !isAuthor && (
                  <button
                    onClick={handleCollabRequest}
                    disabled={requestSent}
                    className="bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Users size={16} className="inline mr-2" />
                    {requestSent ? "신청 완료" : "협업 신청하기"}
                  </button>
                )}
              </div>
            </div>
          ))}

        {/* 태그 */}
        {idea.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {idea.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 좋아요 바 */}
        <div className="flex items-center gap-2 py-4 border-t border-b border-gray-800 mb-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              isLiked
                ? "text-red-500 bg-red-500/10"
                : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
            }`}
          >
            <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
            <span className="font-medium">{likeCount}</span>
          </button>
          <span className="text-gray-500 text-sm">명이 좋아합니다</span>
        </div>

        {/* 소유권 증명 */}
        {isProtected && idea.ideaHash && (
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 mb-2 font-medium">
              🔐 아이디어 소유권 증명
            </p>
            <p className="text-xs text-gray-400 font-mono break-all mb-1">
              {idea.ideaHash}
            </p>
            <p className="text-xs text-gray-500">
              등록:{" "}
              {idea.hashTimestamp &&
                new Date(idea.hashTimestamp).toLocaleString("ko-KR")}
            </p>
          </div>
        )}

        {/* 댓글 */}
        <div>
          <h3 className="text-white font-bold mb-4">
            댓글 {comments.length}개
          </h3>

          {comments.length > 0 && (
            <div className="space-y-3 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={comment.authorPhoto}
                      alt={comment.authorName}
                      className="w-7 h-7 rounded-full"
                    />
                    <span className="text-white text-sm font-medium">
                      {comment.authorName}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {user ? (
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-orange-500 text-white px-4 py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send size={20} />
              </button>
            </form>
          ) : (
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm">
                댓글을 작성하려면{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-orange-500 font-medium hover:underline"
                >
                  로그인
                </button>
                하세요
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
