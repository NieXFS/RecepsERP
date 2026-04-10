"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AnimatedListProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  animation?: string;
  as?: "div" | "ul" | "ol" | "section";
};

export function AnimatedList({
  children,
  className,
  stagger = 50,
  animation = "animate-fade-in-up",
  as: Tag = "div",
}: AnimatedListProps) {
  const items = React.Children.toArray(children);

  return (
    <Tag className={className}>
      {items.map((child, index) => (
        <div
          key={React.isValidElement(child) ? (child.key ?? index) : index}
          className={animation}
          style={{ animationDelay: `${index * stagger}ms` }}
        >
          {child}
        </div>
      ))}
    </Tag>
  );
}
