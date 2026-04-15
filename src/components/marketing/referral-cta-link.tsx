"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getReferralCookie, setReferralCookie } from "@/lib/referral-cookie";
import { cn } from "@/lib/utils";

type ReferralCtaLinkProps = {
  planSlug: string;
  children: React.ReactNode;
  className?: string;
  dataCta?: string;
  magnetic?: boolean;
};

export function ReferralCtaLink({
  planSlug,
  children,
  className,
  dataCta,
  magnetic = false,
}: ReferralCtaLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refFromUrl = params.get("ref")?.trim() || "";
    const resolvedReferralCode = refFromUrl || getReferralCookie() || "";

    if (resolvedReferralCode) {
      setReferralCookie(resolvedReferralCode);
      setReferralCode(resolvedReferralCode);
    }
  }, []);

  useEffect(() => {
    const element = linkRef.current;

    if (!element || !magnetic || !window.matchMedia("(hover: hover)").matches) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    function handleMouseMove(event: MouseEvent) {
      const currentElement = linkRef.current;

      if (!currentElement) {
        return;
      }

      const rect = currentElement.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      currentElement.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
    }

    function handleMouseEnter() {
      const currentElement = linkRef.current;

      if (!currentElement) {
        return;
      }

      currentElement.style.transition = "none";
    }

    function handleMouseLeave() {
      const currentElement = linkRef.current;

      if (!currentElement) {
        return;
      }

      currentElement.style.transform = "";
      currentElement.style.transition = "transform 700ms cubic-bezier(0.32, 0.72, 0, 1)";
    }

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [magnetic]);

  const href = useMemo(() => {
    const params = new URLSearchParams({
      plan: planSlug,
    });

    if (referralCode) {
      params.set("ref", referralCode);
    }

    return `/cadastro?${params.toString()}`;
  }, [planSlug, referralCode]);

  return (
    <Link
      ref={linkRef}
      href={href}
      data-cta={dataCta}
      className={cn(className)}
    >
      {children}
    </Link>
  );
}
