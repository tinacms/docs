const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(src: string): string {
  if (src.startsWith("/") && !src.startsWith("//")) {
    return `${basePath}${src}`;
  }
  return src;
}
