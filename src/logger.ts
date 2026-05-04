import fs from "node:fs";
import path from "path";
import env from "./env";
import { showDate } from "./utilities";

export function log(label: string, data?: unknown) {
  const now = new Date();
  fs.appendFileSync(
    path.join(env.LOG_DIRPATH, `${showDate(now)}.txt`),
    `[LOG ${now.toISOString()}] ${label}${data === undefined ? "" : `\n${JSON.stringify(data, null, 4)}`}`,
  );
}
