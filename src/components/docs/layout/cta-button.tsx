import type { FormattedNavigation } from "@/utils/docs/navigation/documentNavigation";

export type CtaButtons = FormattedNavigation["ctaButtons"];
type CtaButtonData = NonNullable<NonNullable<CtaButtons>["button1"]>;

const variantClasses: Record<string, string> = {
  "primary-background":
    "bg-brand-primary text-neutral-surface hover:bg-brand-primary-hover",
  "secondary-background":
    "bg-brand-secondary text-neutral-text hover:bg-brand-secondary-hover",
  "primary-outline":
    "border border-brand-primary text-brand-primary hover:bg-brand-primary/10",
  "secondary-outline":
    "border border-brand-secondary text-brand-secondary hover:bg-brand-secondary/10",
};

export const CtaButton = ({
  button,
  className = "",
  onClick,
}: {
  button: CtaButtonData | null | undefined;
  className?: string;
  onClick?: () => void;
}) => {
  if (!button?.label || !button.link) return null;
  const variant =
    variantClasses[button.variant ?? ""] ??
    variantClasses["primary-background"];
  return (
    <a
      href={button.link}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${variant} ${className}`}
    >
      {button.label}
    </a>
  );
};
