import React from "react";

const shapes = {
  dashboard: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></>,
  friends: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  groups: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  expense: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
  settle: <><path d="M7 7h14l-3-3M21 7l-3 3M17 17H3l3 3M3 17l3-3" /></>,
  insights: <><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 6-7" /><path d="M17 6h4v4" /></>,
  trip: <><path d="m3 17 7-2 4-11 2 1-1 9 5 3-1 2-6-2-5 4-2-1 2-4-5 2z" /><path d="M5 21h14" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8z" transform="translate(-1 -1)" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
  chevron: <path d="m7 10 5 5 5-5" />,
  back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v16H5a2 2 0 0 1-2-2V6.5A2.5 2.5 0 0 1 5.5 9H20" /><path d="M16 14h.01" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
  filter: <><path d="M4 5h16M7 12h10m-7 7h4" /></>,
  sparkle: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  upload: <><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M4 16v4h16v-4" /></>,
};

export function Icon({ name, size = 18, className = "", strokeWidth = 1.8 }) {
  return (
    <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {shapes[name] || shapes.sparkle}
    </svg>
  );
}

export function BrandMark({ size = 36 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="36" height="36" rx="12" fill="#D8F0E4" />
      <path d="M8 12.5h23a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3v-15Z" fill="#0F3B2E" />
      <path d="M8 14.5a4 4 0 0 1 4-4h17" stroke="#0F3B2E" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 21h7v6h-7a3 3 0 0 1 0-6Z" fill="#8DE0BE" />
      <circle cx="29" cy="24" r="1" fill="#0F3B2E" />
      <path d="M14 18.5h5m-2.5-2.5v9m2.5 2h-5" stroke="#D8F0E4" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Avatar({ person, size = "md" }) {
  const style = { background: person?.color || "#D8F0E4" };
  const initials = person?.initials || person?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join("") || "?";
  return <span className={`avatar avatar-${size}`} style={style} aria-label={person?.name || "Person"}>{initials}</span>;
}
