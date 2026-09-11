const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(src: string): string {
  if (
    /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src) ||
    src.startsWith(basePath + "/")
  ) {
    return src;
  }
  return src.startsWith("/") ? `${basePath}${src}` : src;
}
