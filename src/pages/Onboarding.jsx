import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Shield,
  Users,
  TrendingUp,
  ChevronRight,
  Rocket,
} from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Rocket size={64} className="text-orange-500" />,
      title: "Spark에 오신 걸 환영해요! 🔥",
      description:
        "아이디어를 나누고, 함께 키우는 공간이에요.\n당신의 아이디어가 세상을 바꿀 수 있어요.",
      color: "orange",
    },
    {
      icon: <Sparkles size={64} className="text-yellow-500" />,
      title: "🎈 가벼운 아이디어",
      description:
        "부담 없이 아이디어를 던져보세요.\n모든 사람에게 공개되고, 자유롭게 피드백을 받을 수 있어요.",
      color: "yellow",
    },
    {
      icon: <Shield size={64} className="text-blue-500" />,
      title: "🔐 진지한 아이디어",
      description:
        "사업화를 고려하는 아이디어는 보호받을 수 있어요.\n타임스탬프 해시로 소유권이 기록되고,\n단계별로 공개 범위를 설정할 수 있어요.",
      color: "blue",
    },
    {
      icon: <Users size={64} className="text-green-500" />,
      title: "👥 함께 만들어가요",
      description:
        "좋은 아이디어에 좋아요와 댓글로 응원하고,\n협업을 신청해 함께 실현해보세요.\n당신의 참여가 한국 경제를 바꿀 수 있어요!",
      color: "green",
    },
    {
      icon: <TrendingUp size={64} className="text-purple-500" />,
      title: "🚀 지금 시작하세요!",
      description:
        "첫 로그인 시 100 크레딧을 드려요.\n좋아요를 받으면 크레딧이 쌓이고,\n크레딧으로 다른 아이디어의 상세 내용을 열어볼 수 있어요.",
      color: "purple",
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("spark_onboarding_done", "true");
      navigate("/login");
    }
  };

  const handleSkip = () => {
    localStorage.setItem("spark_onboarding_done", "true");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Skip 버튼 */}
      <div className="p-4 flex justify-end">
        <button
          onClick={handleSkip}
          className="text-gray-500 text-sm hover:text-white"
        >
          건너뛰기
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-8 animate-bounce">{currentStep.icon}</div>
        <h1 className="text-2xl font-bold text-white mb-4">
          {currentStep.title}
        </h1>
        <p className="text-gray-400 whitespace-pre-line leading-relaxed max-w-sm">
          {currentStep.description}
        </p>
      </div>

      {/* 하단 */}
      <div className="p-8">
        {/* 인디케이터 */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === step ? "w-8 bg-orange-500" : "w-2 bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* 버튼 */}
        <button
          onClick={handleNext}
          className="w-full bg-orange-500 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-orange-600 transition"
        >
          {step === steps.length - 1 ? "시작하기" : "다음"}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
