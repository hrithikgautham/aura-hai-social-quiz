
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { GhostIcon, HomeIcon, HeartIcon } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#9b87f5] to-[#D6BCFA]">
      <div className="relative bg-white p-8 rounded-2xl shadow-lg max-w-md w-full transform hover:scale-105 transition-transform duration-300">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
          <div className="relative">
            <GhostIcon className="w-24 h-24 text-[#9b87f5] animate-bounce" />
            <HeartIcon className="absolute top-6 right-4 w-6 h-6 text-pink-400 animate-pulse" />
          </div>
        </div>
        
        <div className="text-center mt-8">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#9b87f5] to-[#7E69AB]">
            404
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Oops! This page has ghosted us! 👻
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] text-white font-medium hover:opacity-90 transition-opacity group"
          >
            <HomeIcon className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
            Float back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
