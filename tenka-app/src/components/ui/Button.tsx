import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export default function Button({
  variant = "primary",
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const classes = [variant, className].filter(Boolean).join(" ");
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
