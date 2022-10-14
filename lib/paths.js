import path from "node:path";
import { fileURLToPath } from "node:url";

export const moduleDirName = (meta) => path.dirname(fileURLToPath(meta.url));

export const rootPath = path.join(moduleDirName(import.meta), "..");
