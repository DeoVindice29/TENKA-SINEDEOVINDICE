// Ikon-ikon kecil khusus buat Settings (menu utama, header subview, dan
// status locked di achievement grid). Sengaja dipisah dari Sidebar.tsx biar
// gampang dipakai ulang, tapi ngikutin konvensi SVG yang sama persis:
// viewBox 24x24, stroke=currentColor, strokeWidth=2, round caps/joins.

type IconProps = { className?: string };

export function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8.2" r="3.7" stroke="currentColor" strokeWidth="2" />
      <path d="M4.8 19.5c1.1-3.4 4-5.2 7.2-5.2s6.1 1.8 7.2 5.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PaletteIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5c1 0 1.7-.8 1.7-1.7 0-.45-.17-.85-.45-1.16-.28-.32-.45-.72-.45-1.17 0-.9.73-1.67 1.67-1.67H16c2.5 0 4.5-2 4.5-4.5C20.5 6.9 16.7 3.5 12 3.5Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="7.6" cy="11" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="9.8" cy="7.3" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="7.3" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="11" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4.5h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5v-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 5.5H4.8A1.8 1.8 0 0 0 3 7.3c0 2 1.6 3.6 3.6 3.6H7M17 5.5h2.2A1.8 1.8 0 0 1 21 7.3c0 2-1.6 3.6-3.6 3.6H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13.5V17m-3 3.5h6M9 20.5v-1.8a1.7 1.7 0 0 1 1.7-1.7h2.6a1.7 1.7 0 0 1 1.7 1.7v1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MessageIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4.2 3.4a.6.6 0 0 1-.98-.47V16h-.3A2.5 2.5 0 0 1 4 13.5v-7Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M8 8.7h8M8 11.7h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 5.5 15.5 12 9 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 12H5M5 12l6.5-6.5M5 12l6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="11" x2="12" y2="16.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5.5" y="10.5" width="13" height="9" rx="2.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="14.8" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}
