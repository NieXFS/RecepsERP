type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean;
};

function baseSvgProps(size: number, strokeWidth: number, rest: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": rest["aria-hidden"] ?? true,
    className: rest.className,
  };
}

export function CheckIcon({
  size = 18,
  strokeWidth = 2,
  ...rest
}: IconProps) {
  return (
    <svg {...baseSvgProps(size, strokeWidth, rest)}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ArrowRightIcon({
  size = 16,
  strokeWidth = 2,
  ...rest
}: IconProps) {
  return (
    <svg {...baseSvgProps(size, strokeWidth, rest)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ChevronDownIcon({
  size = 12,
  strokeWidth = 2,
  ...rest
}: IconProps) {
  return (
    <svg {...baseSvgProps(size, strokeWidth, rest)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
