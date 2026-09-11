import { tinaField } from "tinacms/dist/react";

interface IframeProps {
  iframeSrc?: string;
  height?: number;
}

export default function Iframe(props: IframeProps) {
  const { iframeSrc, height = 450 } = props;

  if (!iframeSrc) return null;

  return (
    <div
      className="my-6"
      data-testid="iframe-embed"
      data-tina-field={tinaField(props, "iframeSrc")}
    >
      <iframe
        className="w-full rounded-xl border border-neutral-border bg-neutral-background"
        height={height}
        src={iframeSrc}
        title="Embedded content"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
