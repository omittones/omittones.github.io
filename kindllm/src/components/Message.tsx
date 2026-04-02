import { Message as MessageType } from "../storage";

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  var isAssistant = message.role === "assistant";
  return (
    <p className={isAssistant ? "message-assistant" : "message-user"}>
      {message.content}
    </p>
  );
}
