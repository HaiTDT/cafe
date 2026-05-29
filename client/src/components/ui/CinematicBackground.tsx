import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export const CinematicBackground = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, 100]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-luxury-bg pointer-events-none">
        {/* Background Image Layer */}
        <motion.div
          style={{ y: y1, x: mousePos.x * 0.5 }}
          className="absolute inset-0 -inset-x-10 -inset-y-10"
        >
          <img
            src="https://images.unsplash.com/photo-1510204739505-89f41785bb0e?q=80&w=2560&auto=format&fit=crop"
            alt="Japanese Cafe Ambience"
            className="w-full h-full object-cover opacity-30"
          />
          {/* Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-radial from-transparent via-luxury-bg/80 to-luxury-bg"></div>
        </motion.div>

        {/* Fog/Mist Layer */}
        <motion.div
          style={{ y: y2 }}
          className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
        >
          <div className="w-[200%] h-full absolute -left-[50%] bg-[url('https://www.transparenttextures.com/patterns/dust.png')] animate-fog opacity-30"></div>
          <div className="w-[200%] h-full absolute -left-[50%] bg-gradient-to-b from-transparent via-luxury-primary/5 to-transparent animate-fog" style={{ animationDirection: 'reverse', animationDuration: '40s' }}></div>
        </motion.div>

        {/* Dust Particles */}
        <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50">
          <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40"></div>
        </div>
        
        {/* Warm Ambient Light Glow */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-luxury-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-luxury-secondary/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
      </div>
      
      {/* Cinematic Film Grain Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      ></div>
    </>
  );
};
