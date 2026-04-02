import { Message as MessageType } from "../storage";

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  return (
    <p
      style={{
        whiteSpace: "pre-wrap",
        marginBottom: "1rem",
      }}
    >
      <b>{message.role === "assistant" ? "Kindllm" : "User"}</b>: {message.content}
    </p>
  );
}
