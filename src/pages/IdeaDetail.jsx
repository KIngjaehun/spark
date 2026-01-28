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
      alert("50 크레딧을 사용하여 잠금 해제했습니다!");
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
      alert("협업 신청이 완료되었습니다. 작성자의 승인을 기다려주세요.");
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

    await updateDoc(doc(db, "ideas", id), {
      commentCount: comments.length + 1,
    });

    setNewComment("");
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
        <p className="text-white">로딩중...</p>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">아이디어를 찾을 수 없습니다</p>
      </div>
    );
  }

  const isLiked = user && idea.likes?.includes(user.uid);
  const likeCount = idea.likes?.length || 0;
  const isAuthor = user && user.uid === idea.authorId;
  const isApproved = user && idea.approvedUsers?.includes(user.uid);
  const isProtected = idea.protectedMode;

  // 공개 레벨 체크 (보호 모드일 때만 적용)
  const canViewContent =
    !isProtected || likeCount >= 10 || isAuthor || unlockedWithCredits;
  const canViewSecret = isApproved || isAuthor;

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-gray-900 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-bold text-white">아이디어</h1>
          </div>

          {user && (
            <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full">
              <Coins size={16} className="text-yellow-500" />
              <span className="text-yellow-500 text-sm font-medium">
                {credits}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 모드 뱃지 */}
        <div className="mb-4">
          {isProtected ? (
            <div className="inline-flex items-center gap-1 bg-blue-500/20 px-3 py-1 rounded-full">
              <Shield size={14} className="text-blue-400" />
              <span className="text-sm text-blue-400">보호된 아이디어</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 bg-orange-500/20 px-3 py-1 rounded-full">
              <Sparkles size={14} className="text-orange-400" />
              <span className="text-sm text-orange-400">공개 아이디어</span>
            </div>
          )}
        </div>

        {/* 작성자 정보 */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={idea.authorPhoto}
            alt={idea.authorName}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="text-white font-medium">{idea.authorName}</p>
            <p className="text-gray-500 text-sm">
              {formatDate(idea.createdAt)}
            </p>
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-2xl font-bold text-white mb-4">{idea.title}</h2>

        {/* 내용 - 보호 모드 분기 */}
        {isProtected ? (
          // 보호 모드: Lv2 잠금 적용
          canViewContent ? (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Unlock size={16} className="text-green-500" />
                <span className="text-xs text-green-500">Lv2 공개됨</span>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">
                {idea.content}
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6 text-center">
              <Lock size={32} className="text-yellow-500 mx-auto mb-2" />
              <p className="text-yellow-500 font-medium">상세 내용 잠김</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">
                좋아요 {likeCount}/10개 - {10 - likeCount}개 더 필요
              </p>

              {user && !isAuthor && (
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <p className="text-gray-400 text-sm mb-2">
                    또는 크레딧으로 바로 열기
                  </p>
                  <button
                    onClick={handleUnlockWithCredits}
                    className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-400"
                  >
                    <Coins size={16} className="inline mr-2" />
                    50 크레딧으로 잠금 해제
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          // 가벼운 모드: 전체 공개
          <div className="mb-6">
            <p className="text-gray-300 whitespace-pre-wrap">{idea.content}</p>
          </div>
        )}

        {/* Lv3: 핵심 노하우 (보호 모드에서만) */}
        {isProtected &&
          idea.secretContent &&
          (canViewSecret ? (
            <div className="bg-gray-800 border border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Unlock size={16} className="text-red-500" />
                <span className="text-xs text-red-500">Lv3 핵심 노하우</span>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">
                {idea.secretContent}
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6 text-center">
              <Lock size={32} className="text-red-500 mx-auto mb-2" />
              <p className="text-red-500 font-medium">핵심 노하우 잠김</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">
                협업 신청 후 작성자 승인이 필요합니다
              </p>
              {user && !isAuthor && (
                <button
                  onClick={handleCollabRequest}
                  disabled={requestSent}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  <Users size={16} className="inline mr-2" />
                  {requestSent ? "신청 완료" : "협업 신청하기"}
                </button>
              )}
            </div>
          ))}

        {/* 태그 */}
        {idea.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {idea.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-700 text-gray-300 text-sm px-3 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 좋아요 */}
        <div className="border-t border-b border-gray-800 py-4 mb-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 ${
              isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
            }`}
          >
            <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
            <span>{likeCount}명이 좋아합니다</span>
          </button>
        </div>

        {/* 소유권 증명 (보호 모드에서만) */}
        {isProtected && idea.ideaHash && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">
              🔐 아이디어 소유권 증명
            </p>
            <p className="text-xs text-gray-400 font-mono break-all">
              해시: {idea.ideaHash}
            </p>
            <p className="text-xs text-gray-400 mt-1">
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

          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={comment.authorPhoto}
                    alt={comment.authorName}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-white text-sm font-medium">
                    {comment.authorName}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{comment.content}</p>
              </div>
            ))}
          </div>

          {user ? (
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
              >
                <Send size={20} />
              </button>
            </form>
          ) : (
            <p className="text-gray-500 text-center py-4">
              댓글을 작성하려면{" "}
              <a href="/login" className="text-orange-500">
                로그인
              </a>
              하세요
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
