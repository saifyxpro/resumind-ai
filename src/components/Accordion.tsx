"use client";

import { cn } from "@/lib/utils";
import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

interface AccordionContextType {
    openItems: Set<string>;
    toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

const useAccordion = () => {
    const context = useContext(AccordionContext);
    if (!context) {
        throw new Error("Accordion components must be used within an Accordion");
    }
    return context;
};

interface AccordionProps {
    children: ReactNode;
    className?: string;
    defaultOpen?: string[];
}

export const Accordion = ({
    children,
    className,
    defaultOpen = [],
}: AccordionProps) => {
    const [openItems, setOpenItems] = useState<Set<string>>(
        new Set(defaultOpen)
    );

    const toggle = (id: string) => {
        setOpenItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <AccordionContext.Provider value={{ openItems, toggle }}>
            <div className={cn("flex flex-col divide-y divide-gray-200", className)}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
};

interface AccordionItemProps {
    children: ReactNode;
    id: string;
    className?: string;
}

export const AccordionItem = ({
    children,
    id,
    className,
}: AccordionItemProps) => {
    return (
        <div className={cn("py-2", className)} data-accordion-item={id}>
            {children}
        </div>
    );
};

interface AccordionHeaderProps {
    children: ReactNode;
    itemId: string;
    className?: string;
}

export const AccordionHeader = ({
    children,
    itemId,
    className,
}: AccordionHeaderProps) => {
    const { openItems, toggle } = useAccordion();
    const isOpen = openItems.has(itemId);

    return (
        <button
            type="button"
            onClick={() => toggle(itemId)}
            className={cn(
                "flex w-full items-center justify-between text-left transition-colors hover:bg-gray-50 rounded-lg px-2 -mx-2",
                className
            )}
            aria-expanded={isOpen}
        >
            <div className="flex-1">{children}</div>
            <svg
                className={cn(
                    "size-5 text-gray-500 transition-transform duration-200",
                    isOpen && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </button>
    );
};

interface AccordionContentProps {
    children: ReactNode;
    itemId: string;
    className?: string;
}

export const AccordionContent = ({
    children,
    itemId,
    className,
}: AccordionContentProps) => {
    const { openItems } = useAccordion();
    const isOpen = openItems.has(itemId);

    if (!isOpen) return null;

    return (
        <div
            className={cn(
                "overflow-hidden pt-4 animate-in slide-in-from-top-2 duration-200",
                className
            )}
        >
            {children}
        </div>
    );
};
