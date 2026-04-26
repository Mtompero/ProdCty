import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { registerPlay } from "../lib/api";
import type { Track } from "../types";

type PlayerContextValue = {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playTrack: (track: Track) => Promise<void>;
  toggleTrack: (track: Track) => Promise<void>;
  updateProgress: (time: number, duration: number) => void;
  setIsPlaying: (value: boolean) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateProgress = useCallback((time: number, audioDuration: number) => {
    setCurrentTime(time);
    setDuration(audioDuration);
  }, []);

  const playTrack = useCallback(async (track: Track) => {
    const audio = audioRef.current;
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.durationSec || 0);

    if (!audio) return;

    await registerPlay(track.id);
    audio.pause();
    audio.volume = 0.55;
    audio.src = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${track.audioUrl}${track.audioUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
    audio.load();
    await audio.play().catch(() => undefined);
    setIsPlaying(true);
  }, []);

  const toggleTrack = useCallback(
    async (track: Track) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentTrack?.id === track.id) {
        if (audio.paused || audio.ended) {
          await audio.play().catch(() => undefined);
          setIsPlaying(true);
        } else {
          audio.pause();
          setIsPlaying(false);
        }
        return;
      }

      await playTrack(track);
    },
    [currentTrack?.id, playTrack]
  );

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      audioRef,
      playTrack,
      toggleTrack,
      updateProgress,
      setIsPlaying,
    }),
    [currentTime, currentTrack, duration, isPlaying, playTrack, toggleTrack, updateProgress]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }
  return context;
}
