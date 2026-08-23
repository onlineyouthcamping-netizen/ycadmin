import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  collapseIdenticalMealGroups,
  mealChipLabel,
} from "@/utils/departure/vendorFoodMenu";

type MealsRow = {
  mealGroups?: Array<{ type: string; dishes: string }>;
  mealSource?: "vendor" | "itinerary" | "none";
  mealMenu?: { vendorName?: string } | null;
};

export function MealsMenuBody({
  groups,
  vendorName,
  source,
}: {
  groups: Array<{ type: string; dishes: string }>;
  vendorName?: string;
  source?: "vendor" | "itinerary" | "none";
}) {
  const collapsed = collapseIdenticalMealGroups(groups);
  if (collapsed.length === 0) {
    return <p className="text-[12px] text-slate-400">No meal plan for this day.</p>;
  }
  return (
    <div className="space-y-3">
      {collapsed.map((g) => (
        <div key={`${g.type}-${g.dishes.slice(0, 24)}`}>
          <div className="text-[10px] font-semibold text-slate-500 tracking-wide">{g.type}</div>
          <div className="text-[12px] text-[#0B1528] leading-snug mt-0.5">{g.dishes}</div>
        </div>
      ))}
      {vendorName && source === "vendor" && (
        <div className="text-[10px] text-slate-400 pt-1 border-t border-[#E8EEF4]">{vendorName}</div>
      )}
    </div>
  );
}

export function TripControlMealsCell({ row }: { row: MealsRow }) {
  const groups = row.mealGroups || [];
  if (groups.length === 0) {
    return <span className="text-slate-300">—</span>;
  }
  const chip = mealChipLabel(groups, undefined, row.mealSource);
  const hasDishes = row.mealSource === "vendor";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={hasDishes ? `Open menu: ${chip}` : chip}
        >
          <span className="text-[12px] font-medium text-[#0B1528] truncate">{chip}</span>
          {hasDishes && (
            <span className="text-[10px] font-medium text-[#FF4D00] shrink-0 whitespace-nowrap">Menu</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        onClick={(e) => e.stopPropagation()}
        className="w-72 p-3 bg-white shadow-lg border border-[#E8EEF4] rounded-xl z-50"
      >
        <MealsMenuBody groups={groups} vendorName={row.mealMenu?.vendorName} source={row.mealSource} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
