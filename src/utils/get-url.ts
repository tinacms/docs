export function getUrl(input: any): string {
  let url = "";
  if (typeof input === "string") {
    url = input;
  } else if (input && typeof input === "object") {
    if (input.id && typeof input.id === "string") {
      url = input.id;
    }
  }

  url = url
    .replace(/^content\/docs-zh(?=\/|$)/, "/zh")
    .replace(/^content\/docs(?=\/|$)/, "");

  url = url.replace(/\.(mdx|md)$/, "");

  if (url === "/index") {
    url = "/";
  } else if (url === "/zh/index") {
    url = "/zh";
  }

  if (!url.startsWith("/")) {
    url = `/${url}`;
  }
  return url;
}
