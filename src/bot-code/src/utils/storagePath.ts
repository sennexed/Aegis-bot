/**
 * Storage Path Resolver
 * Ensures persistent JSON files are stored in a canonical, permanent directory
 * that works identically whether the bot is started from root or from src/bot-code.
 */

import fs from "fs";
import path from "path";

export function getPersistentDataDir(): string {
  // Check if an explicit DATA_DIR is provided
  if (process.env.DATA_DIR && process.env.DATA_DIR.trim()) {
    const customDir = path.resolve(process.env.DATA_DIR.trim());
    if (!fs.existsSync(customDir)) {
      try {
        fs.mkdirSync(customDir, { recursive: true });
      } catch {}
    }
    return customDir;
  }

  // Check possible data directories
  const candidateDirs = [
    path.resolve(process.cwd(), "data"),
    path.resolve(process.cwd(), "src/bot-code/data"),
    path.resolve("/data"),
  ];

  for (const dir of candidateDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Test write access
      const testFile = path.join(dir, ".perm_test");
      fs.writeFileSync(testFile, "ok", "utf8");
      fs.unlinkSync(testFile);
      return dir;
    } catch {
      // Continue to next candidate
    }
  }

  // Fallback to process.cwd() data
  const fallback = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(fallback)) {
    try {
      fs.mkdirSync(fallback, { recursive: true });
    } catch {}
  }
  return fallback;
}
