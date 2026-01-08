"use client";

import { useEffect, useState } from "react";

interface ScoreRingProps {
    score: number;
    size?: number;
    strokeWidth?: number;
    showLabel?: boolean;
    animate?: boolean;
    color?: string;
    labelColor?: string;
    subLabel?: string;
}

export default function ScoreRing({
    score,
    size = 120,
    strokeWidth = 10,
    showLabel = true,
    animate = true,
    color,
    labelColor,
    subLabel = "Overall"
}: ScoreRingProps) {
    const [progress, setProgress] = useState(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    useEffect(() => {
        if (animate) {
            // Delay to ensure the transition is visible on mount
            const timer = setTimeout(() => setProgress(score), 300);
            return () => clearTimeout(timer);
        } else {
            setProgress(score);
        }
    }, [score, animate]);

    // Determine color based on score if not provided
    const strokeColor = color || (
        score >= 70 ? "#10B981" : // Emerald 500
            score >= 40 ? "#F59E0B" : // Amber 500
                "#EF4444"                // Red 500
    );

    const textColor = labelColor || strokeColor;

    return (
        <div className="relative flex items-center justify-center font-display" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                fill="none"
                className="transform -rotate-90 origin-center"
            >
                {/* Background Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E2E8F0" // Slate 200
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Foreground Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transition: "stroke-dashoffset 1.5s ease-out, stroke 0.5s ease-out"
                    }}
                />
            </svg>

            {showLabel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span
                        className="text-4xl font-bold transition-colors duration-500"
                        style={{ color: textColor, fontSize: size * 0.25 }}
                    >
                        {progress}
                    </span>
                    {subLabel && (
                        <span className="text-secondary font-sans font-medium text-[10px] uppercase tracking-wider mt-1">
                            {subLabel}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
