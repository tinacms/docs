import { withBasePath } from "@/utils/with-base-path";
import { tinaField } from "tinacms/dist/react";

interface WebmEmbedProps {
  embedSrc?: string;
  width?: string;
}

export default function WebmEmbed(props: WebmEmbedProps) {
  const { embedSrc, width = "100%" } = props;

  if (!embedSrc) return null;

  const src = withBasePath(embedSrc);

  return (
    <div
      className="my-6 flex justify-center"
      data-testid="webm-embed"
      data-tina-field={tinaField(props, "embedSrc")}
    >
      <video
        className="rounded-xl border border-neutral-border shadow-sm"
        style={{ width }}
        src={src}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={src} type="video/webm" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
