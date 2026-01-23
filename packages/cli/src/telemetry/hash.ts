import { createHash } from "crypto";

export const hashToBase64 = (input: string): string => {
    return createHash("sha256").update(input).digest("base64");
};
