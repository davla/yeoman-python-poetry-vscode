import path from "node:path";
import { fileURLToPath } from "node:url";

export const fileName = (meta) => fileURLToPath(meta.url);

export const moduleDirName = (meta) => path.dirname(fileName(meta));

export const rootPath = path.join(moduleDirName(import.meta), "..");
