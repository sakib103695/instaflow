"use client";
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import svgPaths from "@/public/assets/data/svgPaths";
import "../../styles/button.css";
function Mic2() {
  return (
    <div className="relative shrink-0 size-[31px]">
      <svg className="block size-full" fill="none" viewBox="0 0 31 31">
        <g>
          <path d={svgPaths.p3ea94300} stroke="white" strokeWidth="1.98" />
          <path
            d={svgPaths.p29e00940}
            stroke="white"
            strokeLinecap="round"
            strokeWidth="1.98"
          />
          <path
            d={svgPaths.p3f7ddb80}
            stroke="white"
            strokeLinecap="round"
            strokeWidth="1.98"
          />
        </g>
      </svg>
    </div>
  );
}

const NAV_SECTIONS = [
  { id: "hero", label: "Try It" },
  { id: "calculator", label: "Your Numbers" },
  { id: "features", label: "How It Works" },
] as const;

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function HeaderLogo({ onNavigate }: { onNavigate: () => void }) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className="flex items-center gap-2 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-lg"
      aria-label="InstaFlow home"
    >
      <Mic2 />
      <p
        className="uppercase text-[16px] sm:text-[18px] md:text-[19px] tracking-wide font-normal bg-clip-text"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgb(235,235,235) 20%, rgb(197,197,197) 100%)",
          WebkitTextFillColor: "transparent",
        }}
      >
        instaflow
      </p>
    </button>
  );
}

function NavLinks({
  onNavigate,
  closeMenu,
}: {
  onNavigate: (sectionId: string) => void;
  closeMenu: () => void;
}) {
  return (
    <nav className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 uppercase tracking-wider text-sm md:text-[15px] font-medium">
      {NAV_SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            onNavigate(id);
            closeMenu();
          }}
          className={`text-left md:text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-1 py-0.5 transition-colors ${
            id === "hero"
              ? "text-[#dadada] hover:text-white"
              : "text-[#7989a3] hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

function CTAButton({ closeMenu }: { closeMenu: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        scrollToSection("calculator");
        closeMenu();
      }}
      className="cta-btn cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-full"
    >
      <span className="cta-border">
        <span className="cta-content cursor-pointer px-6 py-2 md:py-2.5 uppercase text-white text-sm md:text-base">
          ROI Calculator
        </span>
      </span>
      <span className="cta-glow" />
      <span className="cta-shine" />
    </button>
  );
}

function DesktopNav({
  onNavigate,
  closeMenu,
}: {
  onNavigate: (sectionId: string) => void;
  closeMenu: () => void;
}) {
  return (
    <div className="hidden md:flex items-center gap-10">
      <NavLinks onNavigate={onNavigate} closeMenu={closeMenu} />
      <CTAButton closeMenu={closeMenu} />
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  // Close the mobile menu on Escape for keyboard parity with modals.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="w-full fixed top-4 sm:top-6 z-50 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/10 backdrop-blur-lg border border-white/30 rounded-full px-4 sm:px-6 py-2.5 sm:py-3">
        <HeaderLogo onNavigate={() => scrollToSection("hero")} />
        <DesktopNav onNavigate={scrollToSection} closeMenu={closeMenu} />

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-white p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-4 max-w-7xl mx-auto bg-white/10 backdrop-blur-lg border border-white/30 rounded-2xl p-6 space-y-6">
          <NavLinks onNavigate={scrollToSection} closeMenu={closeMenu} />
          <CTAButton closeMenu={closeMenu} />
        </div>
      )}
    </div>
  );
}
