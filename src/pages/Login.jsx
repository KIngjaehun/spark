import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-4xl font-bold text-white mb-2">Spark 🔥</h1>
      <p className="text-gray-400 mb-8">아이디어를 나누고, 함께 키우세요</p>

      <button
        onClick={handleGoogleLogin}
        className="flex items-center gap-3 bg-white text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          className="w-5 h-5"
        />
        Google로 시작하기
      </button>
    </div>
  );
}
