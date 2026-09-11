#!/usr/bin/env node

/**
 * TinaDocs API Documentation Cleanup Script
 *
 * This script helps TinaDocs users clean up auto-generated API documentation
 * while preserving manually created overview documents.
 *
 * Usage:
 *   pnpm run cleanup
 *
 * What it does:
 * 1. Deletes all directories within content/docs/ (preserves only index.mdx)
 * 2. Deletes all files in content/apiSchema/ (API spec files)
 * 3. Deletes docs-assets and landing-assets image folders
 * 4. Clears Next.js cache (.next folder) to prevent stale page references
 * 5. Cleans up navigation to only show the main index page
 * 6. Rewrites index.mdx with clean slate instructions and admin link
 * 7. Provides a completely clean documentation slate
 */

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

function log(message) {
  process.stdout.write(`${message}\n`);
}

function logError(message, detail) {
  process.stderr.write(
    detail === undefined ? `${message}\n` : `${message} ${detail}\n`
  );
}

log("🧹 TinaDocs API Documentation Cleanup\n");
log("🚨 WARNING: This will PERMANENTLY DELETE all documentation content!");
log("   - All directories in content/docs/ (except index.mdx)");
log("   - All API schema files");
log("   - All image assets");
log("   - Navigation links");
log("   - Next.js cache");
log("\n❌ If you've made changes, they will be DELETED!");
log("✅ Only run this if you want a completely clean slate.\n");

/**
 * Prompt user for confirmation before proceeding with cleanup
 */
function askForConfirmation() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    log("🔍 Do you want to proceed with the cleanup?");
    log("   Type 'yes' or 'y' to continue");
    log("   Type 'no' or 'n' to cancel");

    rl.question("\n👉 Your choice (yes/no): ", (answer) => {
      rl.close();

      const normalizedAnswer = answer.toLowerCase().trim();
      if (normalizedAnswer === "yes" || normalizedAnswer === "y") {
        log("\n✅ Proceeding with cleanup...\n");
        resolve(true);
      } else if (normalizedAnswer === "no" || normalizedAnswer === "n") {
        log("\n❌ Cleanup cancelled. No changes were made.");
        resolve(false);
      } else {
        log("\n⚠️  Invalid input. Please type 'yes', 'y', 'no', or 'n'.");
        // Recursively ask again for invalid input
        askForConfirmation().then(resolve);
      }
    });
  });
}

// Paths (relative to project root)
const docsPath = path.join(process.cwd(), "content/docs");
const apiSchemaPath = path.join(process.cwd(), "content/apiSchema");
const docsAssetsPath = path.join(process.cwd(), "public/img/docs-assets");
const landingAssetsPath = path.join(process.cwd(), "public/img/landing-assets");
const nextCachePath = path.join(process.cwd(), ".next");
const navigationPath = path.join(
  process.cwd(),
  "content/navigation-bar/docs-navigation-bar.json"
);

/**
 * Validate that we're in a TinaDocs project
 */
function validateTinaDocsProject() {
  const requiredPaths = [
    "content/docs",
    "content/navigation-bar",
    "tina/config.ts",
  ];

  for (const requiredPath of requiredPaths) {
    if (!fs.existsSync(path.join(process.cwd(), requiredPath))) {
      logError("❌ Error: This doesn't appear to be a TinaDocs project.");
      logError(`   Missing required path: ${requiredPath}`);
      logError("   Please run this script from your TinaDocs project root.");
      process.exit(1);
    }
  }

  log("✅ TinaDocs project detected\n");
}

/**
 * Recursively delete a directory and all its contents
 */
function deleteDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    log(`⚠️  Directory not found: ${path.relative(process.cwd(), dirPath)}`);
    return false;
  }

  log(`🗑️  Deleting directory: ${path.relative(process.cwd(), dirPath)}`);

  try {
    const files = fs.readdirSync(dirPath);
    let fileCount = 0;

    // Delete each file/directory
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        deleteDirectory(filePath); // Recursive delete
      } else {
        log(`   📄 Deleting file: ${file}`);
        fs.unlinkSync(filePath);
        fileCount++;
      }
    }

    // Remove the now-empty directory
    fs.rmdirSync(dirPath);
    log(
      `✅ Directory deleted: ${path.basename(dirPath)} (${fileCount} files)\n`
    );
    return true;
  } catch (error) {
    logError(
      `❌ Error deleting directory ${path.basename(dirPath)}:`,
      error.message
    );
    return false;
  }
}

/**
 * Update navigation to clean up all references to deleted directories
 */
function updateNavigation() {
  log("📝 Updating navigation...");

  if (!fs.existsSync(navigationPath)) {
    log("⚠️  Navigation file not found - skipping navigation update");
    return false;
  }

  try {
    // Read the navigation file
    const navigationData = JSON.parse(fs.readFileSync(navigationPath, "utf8"));

    let updatesCount = 0;

    // Remove API tab completely
    const originalTabCount = navigationData.tabs?.length || 0;
    if (navigationData.tabs) {
      navigationData.tabs = navigationData.tabs.filter(
        (tab) => tab.title !== "API"
      );
    }
    const apiTabsRemoved =
      originalTabCount - (navigationData.tabs?.length || 0);
    updatesCount += apiTabsRemoved;

    // Clean up Docs tab - remove all groups except Introduction with only index.mdx
    const docsTab = navigationData.tabs?.find((tab) => tab.title === "Docs");
    if (docsTab?.supermenuGroup) {
      log(
        `   🔍 Found Docs tab with ${docsTab.supermenuGroup.length} menu groups`
      );

      // Keep only Introduction group with only index.mdx
      const originalGroupCount = docsTab.supermenuGroup.length;
      docsTab.supermenuGroup = [
        {
          title: "Introduction",
          items: [
            {
              slug: "content/docs/index.mdx",
              _template: "item",
            },
          ],
        },
      ];

      const removedGroups = originalGroupCount - docsTab.supermenuGroup.length;
      updatesCount += removedGroups;

      log(`   🗑️  Cleaned up Docs navigation (removed ${removedGroups} groups)`);
      log("   ✅ Navigation now only shows index.mdx");
    }

    if (updatesCount > 0) {
      if (apiTabsRemoved > 0) {
        log("   🗑️  Completely removed API tab from navigation");
      }

      // Write back to file
      fs.writeFileSync(navigationPath, JSON.stringify(navigationData, null, 2));
      log("✅ Navigation updated successfully\n");
    } else {
      log("   ℹ️  No navigation updates needed\n");
    }

    return true;
  } catch (error) {
    logError("❌ Error updating navigation:", error.message);
    return false;
  }
}

/**
 * Clean up all directories within content/docs/ while preserving index.mdx
 */
function cleanupDocsDirectories() {
  if (!fs.existsSync(docsPath)) {
    log("⚠️  Docs directory not found - nothing to clean up");
    return { deletedDirectories: [], totalFiles: 0 };
  }

  log("🗑️  Cleaning up docs directories (preserving index.mdx)...\n");

  const results = { deletedDirectories: [], totalFiles: 0 };

  try {
    const items = fs.readdirSync(docsPath);

    for (const item of items) {
      const itemPath = path.join(docsPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        log(`🗑️  Deleting directory: ${path.relative(process.cwd(), itemPath)}`);

        // Count files in this directory recursively
        let fileCount = 0;
        function countFiles(dirPath) {
          try {
            const dirItems = fs.readdirSync(dirPath);
            for (const dirItem of dirItems) {
              const dirItemPath = path.join(dirPath, dirItem);
              const dirItemStat = fs.statSync(dirItemPath);
              if (dirItemStat.isFile()) {
                fileCount++;
                log(
                  `   📄 Deleting file: ${path.relative(itemPath, dirItemPath)}`
                );
              } else if (dirItemStat.isDirectory()) {
                countFiles(dirItemPath);
              }
            }
          } catch (error) {
            logError(
              `   ⚠️  Error reading directory ${dirPath}:`,
              error.message
            );
          }
        }

        countFiles(itemPath);

        // Delete the directory
        if (deleteDirectory(itemPath)) {
          log(`✅ Directory deleted: ${item} (${fileCount} files)\n`);
          results.deletedDirectories.push(item);
          results.totalFiles += fileCount;
        }
      } else if (stat.isFile() && item !== "index.mdx") {
        // Delete any other files in docs root (but preserve index.mdx)
        log(`🗑️  Deleting file: ${item}`);
        fs.unlinkSync(itemPath);
        log(`✅ File deleted: ${item}\n`);
        results.totalFiles += 1;
      } else if (item === "index.mdx") {
        log(`✅ Preserving: ${item}`);
      }
    }

    return results;
  } catch (error) {
    logError("❌ Error cleaning up docs directories:", error.message);
    return { deletedDirectories: [], totalFiles: 0 };
  }
}

/**
 * Clean up image asset directories
 */
function cleanupImageAssets() {
  const results = { deletedDirectories: [], totalFiles: 0 };

  // Clean up docs-assets directory
  if (fs.existsSync(docsAssetsPath)) {
    log(
      `🗑️  Deleting docs-assets directory: ${path.relative(process.cwd(), docsAssetsPath)}`
    );

    try {
      const files = fs.readdirSync(docsAssetsPath);
      let fileCount = 0;

      for (const file of files) {
        const filePath = path.join(docsAssetsPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          log(`   📄 Deleting file: ${file}`);
          fs.unlinkSync(filePath);
          fileCount++;
        }
      }

      fs.rmdirSync(docsAssetsPath);
      log(`✅ docs-assets directory deleted (${fileCount} files)\n`);
      results.deletedDirectories.push("docs-assets");
      results.totalFiles += fileCount;
    } catch (error) {
      logError("❌ Error deleting docs-assets directory:", error.message);
    }
  } else {
    log("⚠️  docs-assets directory not found - skipping");
  }

  // Clean up landing-assets directory
  if (fs.existsSync(landingAssetsPath)) {
    log(
      `🗑️  Deleting landing-assets directory: ${path.relative(process.cwd(), landingAssetsPath)}`
    );

    try {
      const files = fs.readdirSync(landingAssetsPath);
      let fileCount = 0;

      for (const file of files) {
        const filePath = path.join(landingAssetsPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          log(`   📄 Deleting file: ${file}`);
          fs.unlinkSync(filePath);
          fileCount++;
        }
      }

      fs.rmdirSync(landingAssetsPath);
      log(`✅ landing-assets directory deleted (${fileCount} files)\n`);
      results.deletedDirectories.push("landing-assets");
      results.totalFiles += fileCount;
    } catch (error) {
      logError("❌ Error deleting landing-assets directory:", error.message);
    }
  } else {
    log("⚠️  landing-assets directory not found - skipping");
  }

  return results;
}

/**
 * Clean up API schema files
 */
function cleanupApiSchema() {
  log("📄 Cleaning API schema files...");

  if (!fs.existsSync(apiSchemaPath)) {
    log("   ⚠️  API schema directory not found - skipping\n");
    return { deletedFiles: 0 };
  }

  try {
    const files = fs.readdirSync(apiSchemaPath);
    let deletedFiles = 0;

    for (const file of files) {
      const filePath = path.join(apiSchemaPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        deletedFiles++;
        log(`   🗑️  Deleted: ${file}`);
      }
    }

    if (deletedFiles > 0) {
      log(`   ✅ Cleaned up ${deletedFiles} API schema file(s)\n`);
    } else {
      log("   ℹ️  No files found to delete\n");
    }

    return { deletedFiles };
  } catch (error) {
    logError(`   ❌ Error cleaning API schema: ${error.message}\n`);
    return { deletedFiles: 0 };
  }
}

/**
 * Clean up Next.js cache directory
 */
function cleanupNextCache() {
  log("🗂️  Cleaning Next.js cache...");

  if (!fs.existsSync(nextCachePath)) {
    log("   ℹ️  No .next folder found (cache already clean)\n");
    return false;
  }

  try {
    // Count files in .next before deletion
    let fileCount = 0;
    function countFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          countFiles(path.join(dir, entry.name));
        } else {
          fileCount++;
        }
      }
    }
    countFiles(nextCachePath);

    // Delete the .next directory
    fs.rmSync(nextCachePath, { recursive: true, force: true });
    log(`   ✅ Deleted .next cache directory (${fileCount} files)\n`);
    return true;
  } catch (error) {
    logError(`   ❌ Error deleting .next cache: ${error.message}\n`);
    return false;
  }
}

/**
 * Rewrite index.mdx after successful cleanup
 */
function rewriteIndexMdx() {
  log("📝 Updating index.mdx for clean slate...");

  const indexPath = path.join(process.cwd(), "content/docs/index.mdx");

  if (!fs.existsSync(indexPath)) {
    log("   ⚠️  index.mdx not found - skipping rewrite\n");
    return false;
  }

  try {
    // Read current content
    const currentContent = fs.readFileSync(indexPath, "utf8");

    // Extract front matter and intro content (lines 1-15)
    const lines = currentContent.split("\n");
    const frontMatterEnd = lines.findIndex(
      (line, index) => index > 0 && line.trim() === "---"
    );

    if (frontMatterEnd === -1) {
      log("   ❌ Could not find front matter - skipping rewrite\n");
      return false;
    }

    // Find the end of the intro content (line that contains "GitHub repository")
    const introEndIndex = lines.findIndex((line) =>
      line.includes(
        "GitHub repository—versioned, portable, and fully under your control."
      )
    );

    if (introEndIndex === -1) {
      log("   ❌ Could not find intro content end - skipping rewrite\n");
      return false;
    }

    // Preserve front matter and intro content
    const preservedLines = lines.slice(0, introEndIndex + 1);
    const preservedContent = preservedLines.join("\n");

    // New content for post-cleanup (TinaCMS-compatible)
    const newContent =
      "\n\n## Clean Slate Ready!\n\nCongratulations! You've successfully reset your TinaDocs project and now have a clean slate to work with.\n\n### What's Next?\n\n**Start creating your documentation:**\n\n1. **Open the TinaCMS Admin Interface** at: http://localhost:3000/admin\n\n2. **Begin editing your content** using TinaCMS's visual editor\n\n3. **Add new pages** and organize your documentation structure\n\n4. **Customize your site** to match your project's needs\n\n### Quick Tips\n\n- **Create new pages** through the TinaCMS admin interface\n- **Organize content** using TinaCMS's folder structure\n- **Preview changes** instantly as you edit\n- **Commit changes** to your repository when ready\n\n> **Need help getting started?** Check out the [TinaCMS documentation](https://tina.io/docs/) for detailed guides and tutorials.\n\n**Happy documenting!**\n";

    // Combine preserved content with new content
    const finalContent = preservedContent + newContent;

    // Write the updated content
    fs.writeFileSync(indexPath, finalContent);

    log("   ✅ Updated index.mdx with clean slate instructions\n");
    return true;
  } catch (error) {
    logError(`   ❌ Error rewriting index.mdx: ${error.message}\n`);
    return false;
  }
}

/**
 * Main cleanup function
 */
async function cleanup() {
  try {
    // Validate we're in a TinaDocs project
    validateTinaDocsProject();

    // Ask for user confirmation before proceeding
    const shouldProceed = await askForConfirmation();
    if (!shouldProceed) {
      process.exit(0);
    }

    // Clean up all docs directories (preserve only index.mdx)
    const { deletedDirectories: deletedDocs, totalFiles: docsFileCount } =
      cleanupDocsDirectories();

    // Clean up API schema files
    const { deletedFiles: apiSchemaFileCount } = cleanupApiSchema();

    // Clean up image asset directories
    const { deletedDirectories: deletedImageDirs, totalFiles: imageFileCount } =
      cleanupImageAssets();

    // Clean up Next.js cache
    const nextCacheDeleted = cleanupNextCache();

    // Update navigation
    const navigationUpdated = updateNavigation();

    // Rewrite index.mdx for clean slate
    const indexUpdated = rewriteIndexMdx();

    // Summary
    log("🎉 Cleanup completed!\n");
    log("📊 Summary:");

    if (deletedDocs.length > 0) {
      log(
        `• Deleted docs directories: ${deletedDocs.join(", ")} (${docsFileCount} files)`
      );
    } else {
      log("• No docs directories were deleted (none found)");
    }

    if (apiSchemaFileCount > 0) {
      log(`• Deleted API schema files: ${apiSchemaFileCount} files`);
    } else {
      log("• No API schema files were deleted (none found)");
    }

    if (deletedImageDirs.length > 0) {
      log(
        `• Deleted image directories: ${deletedImageDirs.join(", ")} (${imageFileCount} files)`
      );
    } else {
      log("• No image directories were deleted (none found)");
    }

    if (navigationUpdated) {
      log("• Navigation updated successfully");
    } else {
      log("• Navigation update skipped or failed");
    }

    if (nextCacheDeleted) {
      log("• Next.js cache cleared successfully");
    } else {
      log("• Next.js cache clearing skipped (no cache found)");
    }

    if (indexUpdated) {
      log("• Index page updated with clean slate instructions");
    } else {
      log("• Index page update skipped or failed");
    }

    log("\n💡 Next steps:");
    log("   • Review the changes in your editor");
    if (nextCacheDeleted) {
      log("   • Restart your dev server: pnpm dev");
    } else {
      log("   • Start/restart your dev server: pnpm dev");
    }
    if (indexUpdated) {
      log("   • Visit http://localhost:3000/admin to start editing content");
    }
    log("   • Test your documentation site");
    log("   • Commit the changes to version control");
  } catch (error) {
    logError("\n❌ Cleanup failed:", error.message);
    logError("\n🔧 Troubleshooting:");
    logError("   • Make sure you're in your TinaDocs project root");
    logError("   • Check that you have write permissions");
    logError("   • Ensure the content/ directory structure exists");
    process.exit(1);
  }
}

// Show help if requested
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  log("TinaDocs API Documentation Cleanup Script\n");
  log("Usage:");
  log("  pnpm run cleanup");
  log("\nOptions:");
  log("  --help, -h    Show this help message");
  log("\nDescription:");
  log("  Removes all documentation directories while preserving index.mdx");
  log("  Deletes all folders in content/docs/ and API schema files.");
  log("  Deletes image asset directories.");
  log("  Clears Next.js cache to prevent stale page references.");
  log("  Cleans up navigation to only show the main index page.");
  log("  Rewrites index.mdx with clean slate instructions and admin link.");
  process.exit(0);
}

// Run the cleanup
(async () => {
  await cleanup();
})();
