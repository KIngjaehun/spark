import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Shield,
  Users,
  ChevronRight,
  Flame,
  Zap,
} from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Flame size={56} className="text-orange-500" />,
      title: "Spark 🔥",
      description: "아이디어를 나누고\n함께 발전시키는 공간",
      color: "orange",
    },
    {
      icon: <Sparkles size={56} className="text-yellow-500" />,
      title: "가볍게 시작하기",
      description: "부담 없이 아이디어를 공유하고\n다양한 피드백을 받아보세요",
      color: "yellow",
    },
    {
      icon: <Shield size={56} className="text-blue-500" />,
      title: "아이디어 보호",
      description: "중요한 아이디어는 보호 모드로\n단계별 공개 설정이 가능해요",
      color: "blue",
    },
    {
      icon: <Users size={56} className="text-green-500" />,
      title: "협업하기",
      description: "마음에 드는 아이디어에\n협업을 제안해보세요",
      color: "green",
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("spark_onboarding_done", "true");
      navigate("/");
    }
  };

  const handleSkip = () => {
    localStorage.setItem("spark_onboarding_done", "true");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="p-4 flex justify-end">
        <button
          onClick={handleSkip}
          className="text-gray-500 text-sm hover:text-white transition"
        >
          건너뛰기
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-8">{currentStep.icon}</div>
        <h1 className="text-2xl font-bold text-white mb-3">
          {currentStep.title}
        </h1>
        <p className="text-gray-400 whitespace-pre-line leading-relaxed">
          {currentStep.description}
        </p>
      </div>

      <div className="p-8">
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === step ? "w-8 bg-orange-500" : "w-1.5 bg-gray-700"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-500/25 transition"
        >
          {step === steps.length - 1 ? "시작하기" : "다음"}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
