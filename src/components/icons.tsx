import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </Icon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 20c0-3.4 2.8-6.2 6.2-6.2S15.2 16.6 15.2 20" />
      <path d="M16 5.3a3.4 3.4 0 0 1 0 6.4M17.8 14.2c2.1.9 3.4 2.9 3.4 5.8" />
    </Icon>
  );
}

export function HeartIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon {...props} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.3l-1.1-1C6.1 15 3 12.2 3 8.8 3 6.1 5.1 4 7.8 4c1.6 0 3.1.7 4.2 2.1C13.1 4.7 14.6 4 16.2 4 18.9 4 21 6.1 21 8.8c0 3.4-3.1 6.2-7.9 10.5l-1.1 1z" />
    </Icon>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 11.6a8.4 8.4 0 0 1-8.5 8.4 8.7 8.7 0 0 1-3.8-.9L3.5 21l1.9-5.4a8.4 8.4 0 1 1 15.6-4z" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7M8.5 7H17v8.5" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3.2 2" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.4 2.4 3.6 5.4 3.6 9S14.4 18.6 12 21c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3z" />
    </Icon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M16.8 7.3h.01" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M9.5 7V4.8h5V7M6 7l1 13h10l1-13M10.5 11v5.5M13.5 11v5.5" />
    </Icon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Icon>
  );
}

export function StarIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon {...props} fill={filled ? "currentColor" : "none"}>
      <path d="m12 3.8 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.6 9.9l5.8-.8z" />
    </Icon>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </Icon>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 4.5H6.5A2 2 0 0 0 4.5 6.5v11a2 2 0 0 0 2 2h8M18 8.5l3.5 3.5-3.5 3.5M10 12h11" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v6M12 16.5h.01" />
    </Icon>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5z" />
      <path d="M12 8v8" strokeDasharray="2 2.5" />
    </Icon>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 5.5H5.5A1.5 1.5 0 0 0 4 7c0 2.2 1.8 4 4 4M16 5.5h2.5A1.5 1.5 0 0 1 20 7c0 2.2-1.8 4-4 4" />
      <path d="M12 13v4M8.5 20h7M10 17h4l.6 3h-5.2z" />
    </Icon>
  );
}

/**
 * The team mark from the logo: a comet head with motion trails, followed by
 * spheres fading from deep violet to white. Drawn as vectors so it stays sharp
 * at favicon size; the full lockup lives in public/logo-lockup.png.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g fill="#6a0fd8">
        <rect x="5" y="7" width="17" height="4.4" rx="2.2" />
        <rect x="1" y="15" width="21" height="4.4" rx="2.2" />
        <rect x="7" y="23" width="15" height="4.4" rx="2.2" />
      </g>
      <circle cx="31" cy="17" r="12.5" fill="#6a0fd8" />
      <circle cx="17.5" cy="32" r="9.5" fill="#8a46e4" />
      <circle cx="8.5" cy="40" r="6.4" fill="#a67dda" />
      <circle cx="3.6" cy="45.2" r="3.4" fill="#cbaef1" />
    </svg>
  );
}

/** The four-pointed spark that sits between the mark and the wordmark. */
export function SparkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 1.5c.6 5.4 2.9 8 9 9-6.1 1-8.4 3.6-9 9-.6-5.4-2.9-8-9-9 6.1-1 8.4-3.6 9-9z"
        fill="currentColor"
      />
    </svg>
  );
}
