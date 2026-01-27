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
import { Heart, ArrowLeft, Send } from "lucide-react";

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [idea, setIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // 아이디어 불러오기
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

  // 댓글 실시간 구독
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

    // 댓글 수 업데이트
    await updateDoc(doc(db, "ideas", id), {
      commentCount: comments.length + 1,
    });

    setNewComment("");
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-gray-900 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">아이디어</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 작성자 */}
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

        {/* 내용 */}
        <p className="text-gray-300 whitespace-pre-wrap mb-4">{idea.content}</p>

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
            <span>{idea.likes?.length || 0}명이 좋아합니다</span>
          </button>
        </div>

        {/* 댓글 */}
        <div>
          <h3 className="text-white font-bold mb-4">
            댓글 {comments.length}개
          </h3>

          {/* 댓글 목록 */}
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

          {/* 댓글 입력 */}
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
