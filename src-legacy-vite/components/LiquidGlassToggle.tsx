import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

export const LiquidGlassToggle = () => {
  const { isDark, toggle } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        className={cn(
          "relative w-16 h-8 rounded-full transition-all duration-700",
          "bg-white/10 backdrop-blur-2xl border border-white/20",
          "dark:bg-black/40 dark:border-white/5",
          "hover:shadow-[0_0_20px_rgba(129,140,248,0.2)] dark:hover:shadow-[0_0_25px_rgba(0,0,0,0.6)]",
          "group overflow-hidden flex items-center"
        )}
        style={{ filter: "url(#liquid-goo)" }}
      >
        {/* Animated Background Blobs */}
        <motion.div
          animate={{
            x: isDark ? 28 : -8,
            scale: isDark ? [1, 1.2, 1.1] : [1.1, 1.3, 1],
            borderRadius: isDark ? ["40% 60% 70% 30% / 40% 50% 60% 50%", "30% 60% 70% 40% / 50% 60% 30% 60%", "40% 60% 70% 30% / 40% 50% 60% 50%"] : ["50% 50% 50% 50%", "40% 60% 40% 60%", "50% 50% 50% 50%"],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className={cn(
            "absolute w-10 h-10 blur-md opacity-40 transition-colors duration-1000",
            isDark ? "bg-indigo-600" : "bg-blue-400"
          )}
        />

        <motion.div
           animate={{
            x: isDark ? 10 : 30,
            scale: isDark ? [1.1, 1.3, 1.1] : [1, 1.2, 1],
           }}
           transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse",
           }}
           className={cn(
            "absolute w-8 h-8 blur-lg opacity-30 transition-colors duration-1000",
            isDark ? "bg-purple-600" : "bg-purple-300"
          )}
        />

        {/* The Toggle Knob */}
        <motion.div
          layout
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          className={cn(
            "relative w-7 h-7 rounded-full z-20 flex items-center justify-center",
            "bg-white/90 dark:bg-indigo-500 shadow-xl backdrop-blur-sm border border-white/50",
            isDark ? "ml-8" : "ml-0.5"
          )}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 360 : 0, scale: [0.8, 1.1, 1] }}
            key={isDark ? "moon" : "sun"}
            transition={{ duration: 0.5 }}
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-white fill-white" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            )}
          </motion.div>
        </motion.div>
      </button>

      {/* SVG Gooey Filter for the "Liquid" feel */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="liquid-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};
