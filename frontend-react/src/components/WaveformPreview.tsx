import type { CSSProperties } from "react";

const WAVEFORM_BARS = [10, 18, 12, 22, 16, 24, 14, 20, 26, 15, 23, 11, 19, 25, 13, 21, 17, 10, 24, 16, 20, 12, 22, 14];

type WaveformPreviewProps = {
  active?: boolean;
  className?: string;
};

export function WaveformPreview({ active = false, className = "" }: WaveformPreviewProps) {
  return (
    <div className={`library-row-preview ${active ? "active" : ""} ${className}`} aria-hidden="true">
      {WAVEFORM_BARS.map((height, index) => (
        <span
          key={`${height}-${index}`}
          style={
            {
              ["--bar-height" as string]: `${height}px`,
              ["--bar-delay" as string]: `${index * 0.035}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
