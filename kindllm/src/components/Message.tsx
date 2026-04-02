import { useMemo } from "preact/hooks";
import { marked } from "marked";
import { Message as MessageType } from "../storage";

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
    return marked.parse(message.content, { async: false }) as string;
  }, [message.content]);

  return (
    <div
      className={isAssistant ? "message-assistant" : "message-user"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
