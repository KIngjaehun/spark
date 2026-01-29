import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Flame, Sparkles, Shield, Users } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (error) {
      console.error("로그인 실패:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* 상단 그래픽 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* 로고 */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Flame size={48} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles size={16} className="text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2">Spark</h1>
        <p className="text-gray-400 text-center mb-8">
          아이디어를 나누고, 함께 키우는 공간
        </p>

        {/* 특징 */}
        <div className="w-full max-w-sm space-y-3 mb-8">
          <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Sparkles size={20} className="text-orange-500" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                자유로운 아이디어 공유
              </p>
              <p className="text-gray-500 text-xs">가볍게 던지고 피드백 받기</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                아이디어 소유권 보호
              </p>
              <p className="text-gray-500 text-xs">타임스탬프 해시로 기록</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                협업으로 실현하기
              </p>
              <p className="text-gray-500 text-xs">함께 만들어가는 아이디어</p>
            </div>
          </div>
        </div>
      </div>

      {/* 로그인 버튼 */}
      <div className="p-8">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 px-6 py-4 rounded-xl font-medium hover:bg-gray-100 transition shadow-lg"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          Google로 시작하기
        </button>

        <p className="text-gray-500 text-xs text-center mt-4">
          첫 로그인 시 100 크레딧 지급 🎁
        </p>
      </div>
    </div>
  );
}
