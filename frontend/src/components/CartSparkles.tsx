import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  shape: "star" | "dot" | "diamond";
  delay: number;
}

const SPARKLE_COLORS = [
  "var(--coral-400)",
  "var(--amber-400)",
  "var(--coral-300)",
  "var(--amber-500)",
  "var(--teal-400)",
];

function createSparkles(): Sparkle[] {
  const isMobile = window.innerWidth < 480;
  const count = isMobile ? 6 : 10;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
    angle: (360 / count) * i + Math.random() * 20 - 10,
    distance: (window.innerWidth < 480 ? 25 : 40) + Math.random() * (window.innerWidth < 480 ? 30 : 50),
    size: 6 + Math.random() * 8,
    color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
    shape: (["star", "dot", "diamond"] as const)[i % 3],
    delay: Math.random() * 0.05,
  }));
}

interface CartSparklesProps {
  trigger: number;
}

export default function CartSparkles({ trigger }: CartSparklesProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;

    setSparkles(createSparkles());
    setShow(true);

    const timer = setTimeout(() => {
      setShow(false);
    }, 750);

    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="sparkle-container"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        >
          {sparkles.map((sparkle) => {
            const x = Math.cos((sparkle.angle * Math.PI) / 180) * sparkle.distance;
            const y = Math.sin((sparkle.angle * Math.PI) / 180) * sparkle.distance;

            return (
              <motion.span
                key={sparkle.id}
                className={`sparkle-particle sparkle-${sparkle.shape}`}
                style={{
                  width: sparkle.size,
                  height: sparkle.size,
                  color: sparkle.color,
                  borderColor: sparkle.color,
                  backgroundColor:
                    sparkle.shape === "dot" ? sparkle.color : "transparent",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x,
                  y,
                  opacity: [1, 0.8, 0],
                  scale: [0, 1.2, 0.5],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 0.7 + sparkle.delay,
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: sparkle.delay,
                }}
              >
                {sparkle.shape === "star" && "✦"}
                {sparkle.shape === "diamond" && "✧"}
              </motion.span>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to trigger sparkles. Returns a trigger counter and a fire function.
 */
export function useSparkles() {
  const [trigger, setTrigger] = useState(0);

  const fire = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  return { trigger, fire };
}
