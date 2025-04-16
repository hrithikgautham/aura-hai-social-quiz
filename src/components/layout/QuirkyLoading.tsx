
import { ZapIcon, StarIcon, CloudLightningIcon } from "lucide-react";

const QuirkyLoading = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#FFA99F] to-[#FF719A]">
      <div className="relative">
        <div className="absolute -top-12 -left-12 animate-bounce delay-100">
          <StarIcon className="w-8 h-8 text-yellow-300" />
        </div>
        <div className="absolute -top-12 -right-12 animate-bounce delay-300">
          <CloudLightningIcon className="w-8 h-8 text-purple-300" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center space-x-4">
            <ZapIcon className="w-8 h-8 text-[#FF719A] animate-pulse" />
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF719A] to-[#FFA99F]">
              Loading your aura...
            </h2>
            <ZapIcon className="w-8 h-8 text-[#FFA99F] animate-pulse" />
          </div>
          <div className="mt-4 flex justify-center">
            <div className="w-16 h-16 border-4 border-[#FF719A] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuirkyLoading;
