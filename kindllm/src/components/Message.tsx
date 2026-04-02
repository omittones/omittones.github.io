import { useMemo } from "preact/hooks";
import { marked } from "marked";
import { Message as MessageType } from "../storage";
import { logger } from "../diagnostic-log";

marked.setOptions({
  breaks: true,
  gfm: true,
});

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  var isAssistant = message.role === "assistant";

  var html = useMemo(function () {
    try {
      return marked.parse(message.content, { async: false }) as string;
    } catch (e) {
      logger("message").error("marked.parse failed", {
        role: message.role,
        message: e instanceof Error ? e.message : String(e),
        contentLen: message.content.length,
      });
      return "<p>[Could not render this message]</p>";
    }
  }, [message.content]);

  return (
    <div
      className={isAssistant ? "message-assistant" : "message-user"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
