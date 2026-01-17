import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SuccessPopperProps {
    isVisible: boolean;
    onComplete?: () => void;
    text?: string;
    subtext?: string;
}

export default function SuccessPopper({ isVisible, onComplete, text = "COUPON APPLIED!", subtext }: SuccessPopperProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                onComplete?.();
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    // Generate random particles with different shapes and colors
    const particles = Array.from({ length: 60 });

    return (
        <AnimatePresence>
            {show && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => {
                        setShow(false);
                        onComplete?.();
                    }}
                >
                    {/* Darker backdrop for focus */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/5 backdrop-blur-[2px]"
                    />

                    {/* Confetti Particles */}
                    {particles.map((_, i) => {
                        const isSquare = Math.random() > 0.6;
                        const isLine = !isSquare && Math.random() > 0.5;
                        const color = [
                            "#FFD700", // Gold
                            "#1A9952", // Plattr Green
                            "#FF4500", // Orange
                            "#4169E1", // RoyalBlue
                            "#FF69B4", // HotPink
                            "#00CED1", // Turquoise
                            "#ffffff", // White
                        ][Math.floor(Math.random() * 7)];

                        return (
                            <motion.div
                                key={i}
                                className="absolute pointer-events-none"
                                initial={{
                                    x: 0,
                                    y: 50,
                                    opacity: 1,
                                    scale: 0,
                                    rotate: 0
                                }}
                                animate={{
                                    x: (Math.random() - 0.5) * (window.innerWidth * 1.2),
                                    y: (Math.random() - 0.5) * (window.innerHeight * 1.5) - 200,
                                    opacity: [1, 1, 1, 0],
                                    scale: [0, 1.2, 1, 0.5],
                                    rotate: Math.random() * 1440,
                                }}
                                transition={{
                                    duration: 2.5 + Math.random() * 2,
                                    ease: [0.1, 0.5, 0.3, 1],
                                    delay: Math.random() * 0.2,
                                }}
                                style={{
                                    width: isLine ? '4px' : (isSquare ? '12px' : '10px'),
                                    height: isLine ? '15px' : (isSquare ? '12px' : '10px'),
                                    borderRadius: isSquare ? '2px' : (isLine ? '1px' : '50%'),
                                    backgroundColor: color,
                                    boxShadow: `0 0 15px ${color}66`,
                                    zIndex: 20
                                }}
                            />
                        );
                    })}

                    {/* Center Content Component - Floating without card */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50, rotate: -5 }}
                        animate={{
                            scale: [0.5, 1.1, 1],
                            opacity: 1,
                            y: 0,
                            rotate: 0
                        }}
                        exit={{ scale: 0.8, opacity: 0, y: -20, transition: { duration: 0.2 } }}
                        className="flex flex-col items-center justify-center text-center max-w-[90vw] relative pointer-events-none"
                    >
                        {/* Animated Popper Emoji */}
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{
                                scale: [0, 1.8, 1.3],
                                rotate: [0, -10, 10, -10, 0]
                            }}
                            transition={{
                                duration: 0.6,
                                delay: 0.1,
                                rotate: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                            }}
                            className="text-9xl mb-8 select-none drop-shadow-2xl"
                        >
                            🎉
                        </motion.div>

                        <h2
                            className="text-4xl font-black text-[#06352A] mb-3 tracking-tight no-wrap whitespace-nowrap drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
                            style={{ fontFamily: 'Sweet Sans Pro' }}
                        >
                            {text}
                        </h2>

                        {subtext && (
                            <p
                                className="text-[#1A9952] font-black text-xl max-w-[320px] drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
                                style={{ fontFamily: 'Sweet Sans Pro' }}
                            >
                                {subtext}
                            </p>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
