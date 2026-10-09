import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RiskBand } from "@/services/api/risk";

const ALL_BANDS = "";

const BAND_ITEMS: Record<RiskBand | typeof ALL_BANDS, string> = {
  [ALL_BANDS]: "Tất cả",
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

interface RiskFiltersProps {
  threshold: number;
  band: RiskBand | "";
  onThresholdChange: (value: number) => void;
  onBandChange: (value: RiskBand | "") => void;
  onClear: () => void;
}

export function RiskFilters({
  threshold,
  band,
  onThresholdChange,
  onBandChange,
  onClear,
}: RiskFiltersProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Ngưỡng rủi ro
        <Input
          type="number"
          min={0}
          max={100}
          value={threshold}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            onThresholdChange(Number.isFinite(nextValue) ? nextValue : 70);
          }}
          className="md:w-40"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Mức rủi ro
        <Select
          value={band}
          onValueChange={(value) => onBandChange(value as RiskBand | "")}
          items={BAND_ITEMS}
        >
          <SelectTrigger className="md:w-48" aria-label="Lọc theo mức rủi ro">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(BAND_ITEMS) as Array<RiskBand | "">).map((value) => (
              <SelectItem key={value || "all"} value={value}>
                {BAND_ITEMS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <Button variant="outline" onClick={onClear}>
        Xóa bộ lọc
      </Button>
    </div>
  );
}
