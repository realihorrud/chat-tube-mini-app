import { useState } from "react";
import { ApiError } from "@/services/api";

export function DebugError({ error }: { error: unknown }) {
  const [expanded, setExpanded] = useState(false);

  const message = error instanceof Error ? error.message : String(error);
  const debug = error instanceof ApiError ? error.debugInfo : undefined;
  const status = error instanceof ApiError ? error.status : undefined;

  return (
    <div className="text-xs text-[#ff4444] text-left">
      <p>⚠️ Something went wrong.{status ? ` (${status})` : ""}</p>
      {debug && (
        <>
          <button
            className="mt-1 text-[11px] text-tg-hint bg-transparent border-none underline cursor-pointer p-0"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide" : "Show"} debug info
          </button>
          {expanded && (
            <pre className="mt-1.5 p-2 rounded-lg bg-black/30 text-[11px] text-tg-text overflow-x-auto whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto">
{`${debug.method} ${debug.url}

Request Headers:
${Object.entries(debug.headers).map(([k, v]) => `  ${k}: ${k === "Authorization" ? v.slice(0, 20) + "..." : v}`).join("\n")}
${debug.body ? `\nRequest Body:\n  ${debug.body}` : ""}

Response Status: ${status}
Response Message: ${message}

Response Body:
  ${debug.responseBody.slice(0, 2000)}`}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
