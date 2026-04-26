import { formatInterestLabel } from "../lib/interests";

type InterestPickerProps = {
  options: readonly string[] | string[];
  selected: string[];
  onChange: (values: string[]) => void;
  maxSelected?: number;
};

export function InterestPicker({
  options,
  selected,
  onChange,
  maxSelected = 20,
}: InterestPickerProps) {
  const selectedSet = new Set(selected);

  function toggleOption(option: string) {
    if (selectedSet.has(option)) {
      onChange(selected.filter((item) => item !== option));
      return;
    }
    if (selected.length >= maxSelected) {
      return;
    }
    onChange([...selected, option]);
  }

  return (
    <div className="interest-picker">
      {options.map((option) => {
        const active = selectedSet.has(option);
        return (
          <button
            key={option}
            className={`genre-filter-chip ${active ? "active" : ""}`}
            type="button"
            onClick={() => toggleOption(option)}
          >
            {active ? "x " : "+ "}
            {formatInterestLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
