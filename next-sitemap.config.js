const { basePath } = require("./next.config.js");
const settings = require("./content/settings/config.json");

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || settings.siteUrl;

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: `${siteUrl}${basePath}`,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 5000,
  generateRobotsTxt: true,
  output: "standalone",
  outDir: "public",
  generateIndexSitemap: false,
  exclude: ["/r/*", "/zh/r/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  },
};
