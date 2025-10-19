"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";

// Text generation effect component - animates words/phrases appearing one by one
// Creates a blur-to-focus effect with staggered timing
export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.2,
  splitByPipe = false,
}) => {
  const [scope, animate] = useAnimate();
  // Split by pipe (|) for phrases, or by space for individual words
  let wordsArray = splitByPipe ? words.split("|") : words.split(" ");
  
  // Animate each word with stagger effect
  useEffect(() => {
    animate(
      "span",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      {
        duration: duration ? duration : 1,
        delay: stagger(staggerDelay),
      }
    );
  }, [scope.current]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className="opacity-0"
              style={{
                filter: filter ? "blur(10px)" : "none",
              }}
            >
              {word}
              {/* Add space after each phrase except the last one */}
              {idx < wordsArray.length - 1 && " "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn(className)}>
      {renderWords()}
    </div>
  );
};

