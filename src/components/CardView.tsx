import { DevCard, Gem } from "@/lib/types";
import GemIcon from "./GemIcon";

const GEMS: Gem[] = ["white", "blue", "green", "red", "black"];

export default function CardView({
  card,
  onClick,
  small = false,
}: {
  card: DevCard;
  onClick?: () => void;
  small?: boolean;
}) {
  const costs = GEMS.filter((g) => (card.cost[g] || 0) > 0);
  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden border-2 border-slate-800 shadow-lg ${
        onClick ? "cursor-pointer hover:scale-[1.03] transition-transform" : ""
      } ${small ? "w-20" : "w-28"}`}
    >
      <img
        src={`/assets/cards/card_tier${card.tier}_${card.bonus}.png`}
        alt={`tier ${card.tier} ${card.bonus} card`}
        className="w-full h-auto block"
        draggable={false}
      />
      <div className={`absolute top-0 left-0 flex items-center justify-center rounded-br-lg bg-slate-900/70 ${small ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"} font-bold text-amber-300`}>
        {card.points || ""}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 flex flex-wrap gap-0.5 p-1 justify-end`}>
        {costs.map((g) => (
          <div key={g} className="relative">
            <GemIcon token={g} size={small ? 16 : 20} />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow">
              {card.cost[g]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
