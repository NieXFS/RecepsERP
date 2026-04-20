"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ChevronDownIcon } from "@/app/(landing)/_icons";

export default function SiteHeader() {
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    let ticking = false;
    function handleNavScroll() {
      if (!navbar) return;
      if (window.scrollY > 20) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleNavScroll();
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    handleNavScroll();

    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");

    function openMobileMenu() {
      hamburger?.classList.add("active");
      mobileMenu?.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function closeMobileMenu() {
      hamburger?.classList.remove("active");
      mobileMenu?.classList.remove("open");
      document.body.style.overflow = "";
    }
    function toggleMobileMenu() {
      if (mobileMenu?.classList.contains("open")) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    }

    hamburger?.addEventListener("click", toggleMobileMenu);

    const mobileLinks = document.querySelectorAll<HTMLElement>(
      ".mobile-link, .btn-mobile-cta"
    );
    mobileLinks.forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobileMenu();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("scroll", onScroll);
      hamburger?.removeEventListener("click", toggleMobileMenu);
      mobileLinks.forEach((link) => {
        link.removeEventListener("click", closeMobileMenu);
      });
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="receps-landing">
      <nav className="navbar" id="navbar">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" aria-label="Receps">
            <Image
              src="/landing-wordmark.svg"
              alt="Receps"
              width={853}
              height={228}
              className="nav-logo-img"
              style={{ height: 28, width: "auto", display: "block" }}
              sizes="140px"
              priority
            />
          </Link>
          <div className="nav-links" id="navLinks">
            <div className="nav-dropdown">
              <button
                type="button"
                className="nav-dropdown-trigger"
                aria-haspopup="true"
              >
                Produtos
                <ChevronDownIcon size={12} />
              </button>
              <div className="nav-dropdown-menu">
                <Link href="/atendentes-ia" className="nav-dropdown-item">
                  <strong>Atendente IA</strong>
                  <span>IA que atende no WhatsApp 24h</span>
                </Link>
                <Link href="/erp" className="nav-dropdown-item">
                  <strong>ERP Financeiro</strong>
                  <span>Gestão completa da clínica</span>
                </Link>
                <Link href="/erp-atendente-ia" className="nav-dropdown-item">
                  <strong>ERP + Atendente IA</strong>
                  <span>Solução completa integrada</span>
                </Link>
              </div>
            </div>
            <Link href="/#features">Funcionalidades</Link>
            <Link href="/#how-it-works">Como Funciona</Link>
            <Link href="/#pricing">Planos</Link>
            <Link href="/#contato">Contato</Link>
          </div>
          <div className="nav-actions">
            <a href="https://app.receps.com.br/login" className="nav-login">
              Entrar
            </a>
            <Link href="/erp-atendente-ia" className="btn btn-primary btn-nav">
              Começar
              <span className="btn-icon-wrap">
                <ArrowRightIcon size={16} />
              </span>
            </Link>
            <button className="nav-hamburger" id="hamburger" aria-label="Menu">
              <span />
              <span />
            </button>
          </div>
        </div>

        <div className="mobile-menu" id="mobileMenu">
          <div className="mobile-menu-inner">
            <div className="mobile-menu-group">
              <span className="mobile-menu-label">Produtos</span>
              <Link href="/atendentes-ia" className="mobile-link mobile-sublink">
                Atendente IA
              </Link>
              <Link href="/erp" className="mobile-link mobile-sublink">
                ERP Financeiro
              </Link>
              <Link href="/erp-atendente-ia" className="mobile-link mobile-sublink">
                ERP + Atendente IA
              </Link>
            </div>
            <Link href="/#features" className="mobile-link">
              Funcionalidades
            </Link>
            <Link href="/#how-it-works" className="mobile-link">
              Como Funciona
            </Link>
            <Link href="/#pricing" className="mobile-link">
              Planos
            </Link>
            <Link href="/#contato" className="mobile-link">
              Contato
            </Link>
            <a href="https://app.receps.com.br/login" className="mobile-link">
              Entrar
            </a>
            <Link href="/erp-atendente-ia" className="btn btn-primary btn-mobile-cta">
              Começar
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
