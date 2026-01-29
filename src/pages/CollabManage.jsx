import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft, Check, X, Users } from "lucide-react";

export default function CollabManage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      // 내 아이디어 가져오기
      const ideasQuery = query(
        collection(db, "ideas"),
        where("authorId", "==", user.uid)
      );
      const ideasSnap = await getDocs(ideasQuery);

      const allRequests = [];

      for (const ideaDoc of ideasSnap.docs) {
        const requestsQuery = query(
          collection(db, "ideas", ideaDoc.id, "collabRequests"),
          where("status", "==", "pending")
        );
        const requestsSnap = await getDocs(requestsQuery);

        requestsSnap.docs.forEach((reqDoc) => {
          allRequests.push({
            id: reqDoc.id,
            ideaId: ideaDoc.id,
            ideaTitle: ideaDoc.data().title,
            ...reqDoc.data(),
          });
        });
      }

      setRequests(allRequests);
      setLoading(false);
    };

    fetchRequests();
  }, [user]);

  const handleApprove = async (request) => {
    try {
      // 요청 상태 업데이트
      await updateDoc(
        doc(db, "ideas", request.ideaId, "collabRequests", request.id),
        {
          status: "approved",
        }
      );

      // 승인된 유저 목록에 추가
      await updateDoc(doc(db, "ideas", request.ideaId), {
        approvedUsers: arrayUnion(request.userId),
      });

      // 알림 보내기
      await addDoc(collection(db, "notifications"), {
        toUserId: request.userId,
        fromUserId: user.uid,
        type: "collab",
        message: `"${request.ideaTitle}" 협업 신청이 승인되었습니다!`,
        ideaId: request.ideaId,
        read: false,
        createdAt: serverTimestamp(),
      });

      // UI 업데이트
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      alert("승인되었습니다!");
    } catch (error) {
      console.error("승인 실패:", error);
    }
  };

  const handleReject = async (request) => {
    try {
      await updateDoc(
        doc(db, "ideas", request.ideaId, "collabRequests", request.id),
        {
          status: "rejected",
        }
      );

      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      alert("거절되었습니다.");
    } catch (error) {
      console.error("거절 실패:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">로그인이 필요합니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="border-b border-gray-800 px-4 py-3 sticky top-0 bg-gray-900 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">협업 신청 관리</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-gray-400 text-center py-8">로딩중...</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">대기 중인 협업 신청이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={request.userPhoto}
                    alt={request.userName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{request.userName}</p>
                    <p className="text-gray-500 text-sm">협업 신청</p>
                  </div>
                </div>

                <div className="bg-gray-700 rounded p-3 mb-3">
                  <p className="text-gray-400 text-sm">신청한 아이디어:</p>
                  <p className="text-white">{request.ideaTitle}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                  >
                    <Check size={18} />
                    승인
                  </button>
                  <button
                    onClick={() => handleReject(request)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-500"
                  >
                    <X size={18} />
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
