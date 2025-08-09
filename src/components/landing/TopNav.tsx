"use client";
import React from "react";
import { FloatingNav } from "@/components/ui/floating-navbar";

export function TopNav({ className }: { className?: string }) {
  const navItems = [
    {
      name: "How It Works",
      link: "#how",
    },
    {
      name: "Publications",
      link: "#publications",
    },
    {
      name: "About",
      link: "#about",
    },
  ];
  return (
    <FloatingNav
      navItems={navItems}
      className={className}
      autoHide={false}
      cta={{ label: "Test Your Perception", href: "/start" }}
    />
  );
}

export default TopNav;
