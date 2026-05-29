import React from "react";

export const CoffeeSteam = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`pointer-events-none relative flex justify-center ${className}`}>
      <div className="absolute bottom-0 w-[40px] h-[100px] flex gap-2 blur-[8px] mix-blend-screen opacity-50">
        <div className="w-[8px] h-full bg-gradient-to-t from-transparent via-white/40 to-transparent rounded-full animate-steam" style={{ animationDelay: '0s', animationDuration: '5s' }}></div>
        <div className="w-[12px] h-full bg-gradient-to-t from-transparent via-white/50 to-transparent rounded-full animate-steam" style={{ animationDelay: '1.2s', animationDuration: '6s' }}></div>
        <div className="w-[8px] h-[80%] bg-gradient-to-t from-transparent via-white/30 to-transparent rounded-full animate-steam self-end" style={{ animationDelay: '2.5s', animationDuration: '4.5s' }}></div>
      </div>
    </div>
  );
};
