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
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Flame size={40} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Spark</h1>
        <p className="text-gray-400 mb-8">아이디어를 나누는 공간</p>

        <div className="w-full max-w-sm space-y-3 mb-8">
          <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-orange-500" />
            </div>
            <p className="text-gray-300 text-sm">자유로운 아이디어 공유</p>
          </div>

          <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-blue-500" />
            </div>
            <p className="text-gray-300 text-sm">아이디어 보호 기능</p>
          </div>

          <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-green-500" />
            </div>
            <p className="text-gray-300 text-sm">협업 제안 시스템</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 px-6 py-4 rounded-2xl font-medium hover:bg-gray-100 transition shadow-lg"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          Google로 계속하기
        </button>

        <p className="text-gray-500 text-xs text-center mt-4">
          첫 가입 시 100 크레딧 지급
        </p>
      </div>
    </div>
  );
}
