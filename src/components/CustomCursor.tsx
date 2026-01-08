"use client";

import { useEffect, useState, useRef } from "react";
import { Cursor28Filled, Cursor2, CursorProhibited20Filled, CursorText } from "./cursor";

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [cursorVariant, setCursorVariant] = useState<"default" | "pointer" | "prohibited" | "text">("default");
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const mouseMove = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${e.clientX - 14}px, ${e.clientY - 14}px)`;
            }

            const target = e.target as HTMLElement;
            const tagName = target.tagName.toUpperCase();

            const inputType = (target as HTMLInputElement).type?.toLowerCase();
            const isInput = tagName === "INPUT" && !["button", "submit", "reset", "checkbox", "radio", "file", "range", "color", "image", "hidden"].includes(inputType);
            const isText = isInput || tagName === "TEXTAREA" || target.isContentEditable;

            const isPointer =
                tagName === "A" ||
                tagName === "BUTTON" ||
                tagName === "LABEL" ||
                tagName === "SELECT" ||
                tagName === "SUMMARY" ||
                (tagName === "INPUT" && ["button", "submit", "reset", "checkbox", "radio", "file", "image"].includes(inputType)) ||
                target.closest("a") ||
                target.closest("button") ||
                target.closest("label") ||
                target.closest(".cursor-pointer");

            // @ts-ignore
            const isProhibited = target.disabled || target.classList.contains("disabled") || target.closest(":disabled");

            let newVariant: "default" | "pointer" | "prohibited" | "text" = "default";

            if (isProhibited) {
                newVariant = "prohibited";
            } else if (isText) {
                newVariant = "text";
            } else if (isPointer) {
                newVariant = "pointer";
            }

            setCursorVariant(prev => prev !== newVariant ? newVariant : prev);
        };

        const mouseEnter = () => setIsVisible(true);
        const mouseLeave = () => setIsVisible(false);

        window.addEventListener("mousemove", mouseMove);
        window.addEventListener("mouseenter", mouseEnter);
        window.addEventListener("mouseleave", mouseLeave);

        setIsVisible(true);

        return () => {
            window.removeEventListener("mousemove", mouseMove);
            window.removeEventListener("mouseenter", mouseEnter);
            window.removeEventListener("mouseleave", mouseLeave);
        };
    }, []);

    // Don't render on server or if hidden
    if (!isVisible) return null;

    return (
        <>
            <style jsx global>{`
                * {
                    cursor: none !important;
                }
            `}</style>
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 z-[9999] pointer-events-none transition-none flex items-center justify-center text-primary"
                style={{
                    transform: 'translate(-100px, -100px)',
                    willChange: 'transform'
                }}
            >
                {cursorVariant === "default" && <Cursor28Filled className="w-7 h-7 text-black drop-shadow-md" />}
                {cursorVariant === "pointer" && <Cursor2 className="w-7 h-7 drop-shadow-md" />}
                {cursorVariant === "prohibited" && <CursorProhibited20Filled className="w-7 h-7 text-red-500 drop-shadow-md" />}
                {cursorVariant === "text" && <CursorText className="w-7 h-7 text-black drop-shadow-md" />}
            </div>
        </>
    );
}
