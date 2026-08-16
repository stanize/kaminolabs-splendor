import { Noble, Gem } from "@/lib/types";
import GemIcon from "./GemIcon";

const GEMS: Gem[] = ["white", "blue", "green", "red", "black"];

export default function NobleView({ noble }: { noble: Noble }) {
  const reqs = GEMS.filter((g) => (noble.requirement[g] || 0) > 0);
  return (
    <div className="relative w-16 rounded-lg overflow-hidden border-2 border-slate-800 shadow-md">
      <img src="/assets/cards/noble_tile.png" alt="noble" className="w-full h-auto block" draggable={false} />
      <div className="absolute bottom-0 left-0 right-0 flex flex-wrap gap-0.5 p-1 justify-center">
        {reqs.map((g) => (
          <div key={g} className="relative">
            <GemIcon token={g} size={13} />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow">
              {noble.requirement[g]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
