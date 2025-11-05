"use client";

import Link from "next/link";
import React from "react";

type SidebarLinkProps = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick?: () => void;
  sidebarCollapsed?: boolean;
  asideLeftPad?: number;
  asideRightPad?: number;
};

const SidebarLink: React.FC<SidebarLinkProps> = ({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
  sidebarCollapsed,
  asideLeftPad = 25,
  asideRightPad = 17,
}) => {
  return (
    <div
      style={{
        marginLeft: `-${asideLeftPad}px`,
        marginRight: `-${asideRightPad}px`,
      }}
    >
      <Link
        href={href}
        onClick={onClick}
        className={`group flex items-center gap-3 py-2.5 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? "lg:justify-center" : ""
        } ${
          isActive
            ? "bg-[rgb(var(--neutral-600))] text-neutral-0"
            : "text-neutral-400 hover:text-neutral-0 hover:bg-[rgb(var(--neutral-600))]"
        }`}
        style={{
          paddingLeft: `${asideLeftPad}px`,
          paddingRight: `${asideRightPad}px`,
          borderLeft: isActive ? '5px solid rgb(var(--brand-600))' : '5px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.borderLeft = '5px solid rgb(var(--brand-600))';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.borderLeft = '5px solid transparent';
          }
        }}
        title={label}
      >
        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-neutral-0" : "text-neutral-400 group-hover:text-neutral-0"}`} />
        <span
          className={`tp-body-s font-medium ${
            sidebarCollapsed ? "lg:hidden" : ""
          } ${isActive ? "text-neutral-0" : "text-neutral-400 group-hover:text-neutral-0"}
        `}
        >
          {label}
        </span>
      </Link>
    </div>
  );
};

export default SidebarLink;
