export const AUDIO_DURATION_LIMITS_SEC = {
  sample: 45,
  demo: 300,
} as const;

export async function getAudioDuration(file: File) {
  return new Promise<number | "">((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? Math.round(audio.duration) : "";
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
    audio.src = url;
  });
}

export async function validateAudioDuration(file: File, kind: "sample" | "demo") {
  const durationSec = await getAudioDuration(file);
  const limitSec = AUDIO_DURATION_LIMITS_SEC[kind];

  if (durationSec && durationSec > limitSec) {
    return {
      ok: false,
      durationSec,
      message:
        kind === "sample"
          ? `Sample uploads are limited to ${limitSec} seconds.`
          : `Demo uploads are limited to ${Math.round(limitSec / 60)} minutes.`,
    };
  }

  return { ok: true, durationSec, message: "" };
}

export async function buildTrackUploadFormData(
  file: File,
  values: Record<string, string>,
  kind: "sample" | "demo"
) {
  const formData = new FormData();
  const durationSec = await getAudioDuration(file);

  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      formData.set(key, value);
    }
  });

  formData.set("kind", kind);
  formData.append("audio", file);

  if (durationSec) {
    formData.set("durationSec", String(durationSec));
  }

  return formData;
}
