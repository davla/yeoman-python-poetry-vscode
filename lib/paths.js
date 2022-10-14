import path from "path";
import { fileURLToPath } from "url";

export const moduleDirName = (meta) => path.dirname(fileURLToPath(meta.url));

export const rootPath = path.join(moduleDirName(import.meta), "..");
