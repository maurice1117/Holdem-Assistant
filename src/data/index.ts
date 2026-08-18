import rawSessionResults from "./session-results.json";

import { parseSessionResults } from "../lib/validation";

export const sessionResults = parseSessionResults(rawSessionResults);
