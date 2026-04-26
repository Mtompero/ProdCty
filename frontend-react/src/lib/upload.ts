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
