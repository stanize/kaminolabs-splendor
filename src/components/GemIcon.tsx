import { Token } from "@/lib/types";

export default function GemIcon({ token, size = 28 }: { token: Token; size?: number }) {
  return (
    <img
      src={`/assets/tokens/token_${token}.png`}
      alt={token}
      width={size}
      height={size}
      className="inline-block drop-shadow"
      draggable={false}
    />
  );
}
