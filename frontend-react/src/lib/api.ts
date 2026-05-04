import type {
  ApiCollection,
  AdminOverview,
  AdminUser,
  CollabRequest,
  Comment,
  ProfilePayload,
  RatingResponse,
  Report,
  Track,
  User,
} from "../types";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  errorMessage: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, init);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        data && typeof data === "object" && "error" in data && data.error && typeof data.error === "object" && "message" in data.error
          ? String(data.error.message)
          : "Request failed.";
      return {
        ok: false,
        status: response.status,
        data: null,
        errorMessage,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data as T,
      errorMessage: "",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      errorMessage: error instanceof Error ? error.message : "Network error.",
    };
  }
}

export function authHeaders(token?: string, extra?: Record<string, string>) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function healthcheck() {
  return request<{ ok: boolean }>("/health");
}

export async function register(payload: {
  username: string;
  email: string;
  password: string;
  interests: string[];
}) {
  return request<{ ok: true; user: User }>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function login(payload: { email: string; password: string }) {
  return request<{ ok: true; token: string; user: User }>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchMe(token: string) {
  return request<{ user: User }>("/me", {
    headers: authHeaders(token),
  });
}

export async function updateMe(
  token: string,
  payload: {
    bio: string;
    interests: string[];
  }
) {
  return request<{ ok: true; user: User }>("/me", {
    method: "PATCH",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatar(token: string, file: File) {
  const formData = new FormData();
  formData.append("avatar", file);
  return request<{ ok: true; user: User }>("/me/avatar", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
}

export async function searchUsers(query: string) {
  return request<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
}

export async function fetchProfile(userId: string) {
  return request<ProfilePayload>(`/users/${userId}`);
}

export async function fetchTracks(query: string) {
  return request<ApiCollection<Track>>(`/tracks?${query}`);
}

export async function fetchDemos(sort?: string) {
  const params = new URLSearchParams({ limit: "24" });
  if (sort) params.set("sort", sort);
  return request<ApiCollection<Track>>(`/demos?${params.toString()}`);
}

export async function fetchForYou(interests: string[]) {
  const params = new URLSearchParams({
    interests: interests.join(","),
    limit: "24",
  });
  return request<ApiCollection<Track>>(`/feed/for-you?${params.toString()}`);
}

export async function fetchTrack(trackId: string) {
  return request<Track>(`/tracks/${trackId}`);
}

export async function uploadTrack(token: string, formData: FormData) {
  return request<Track>("/tracks", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
}

export async function deleteTrack(token: string, trackId: string) {
  return request<{ ok: true }>(`/tracks/${trackId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function voteTrack(token: string, trackId: string, value: 1 | -1 | 0) {
  return request<{ ok: true; upvoteCount: number; downvoteCount: number }>(`/tracks/${trackId}/vote`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ value }),
  });
}

export async function registerPlay(trackId: string) {
  return request<{ ok: true; playCount: number }>(`/tracks/${trackId}/play`, {
    method: "POST",
  });
}

export async function fetchRatings(trackId: string) {
  return request<RatingResponse>(`/tracks/${trackId}/ratings`);
}

export async function saveRating(
  token: string,
  trackId: string,
  payload: { score: number; text: string }
) {
  return request<{ ok: true; average: number; count: number }>(`/tracks/${trackId}/ratings`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function fetchComments(trackId: string) {
  return request<Comment[]>(`/tracks/${trackId}/comments`);
}

export async function saveComment(
  token: string,
  trackId: string,
  payload: { text: string; parentId?: string; parentRatingId?: string }
) {
  return request<Comment>(`/tracks/${trackId}/comments`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function deleteOwnComment(token: string, trackId: string, commentId: string) {
  return request<{ ok: true; comment: Comment }>(`/tracks/${trackId}/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function reportComment(
  token: string,
  trackId: string,
  commentId: string,
  payload: { reason: string; details: string }
) {
  return request<{ ok: true; reportId: string }>(`/tracks/${trackId}/comments/${commentId}/reports`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function reportTrack(
  token: string,
  trackId: string,
  payload: { reason: string; details: string }
) {
  return request<{ ok: true; reportId: string }>(`/tracks/${trackId}/reports`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function sendCollabRequest(
  token: string,
  trackId: string,
  payload: { message: string; skills: string[]; contactPreference: "email" | "instagram"; instagramHandle?: string }
) {
  return request<{ ok: true; request: CollabRequest }>(`/tracks/${trackId}/collab-requests`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function fetchCollabRequests(token: string) {
  return request<{ items: CollabRequest[] }>("/collab-requests", {
    headers: authHeaders(token),
  });
}

export async function updateCollabRequest(token: string, requestId: string, status: "accepted" | "declined") {
  return request<{ ok: true; request: CollabRequest }>(`/collab-requests/${requestId}`, {
    method: "PATCH",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ status }),
  });
}

export async function fetchAdminOverview(token: string) {
  return request<AdminOverview>("/admin/overview", {
    headers: authHeaders(token),
  });
}

export async function fetchAdminUsers(token: string) {
  return request<{ items: AdminUser[] }>("/admin/users", {
    headers: authHeaders(token),
  });
}

export async function fetchAdminTracks(token: string) {
  return request<{ items: Track[] }>("/admin/tracks", {
    headers: authHeaders(token),
  });
}

export async function fetchAdminComments(token: string) {
  return request<{ items: Comment[] }>("/admin/comments", {
    headers: authHeaders(token),
  });
}

export async function fetchAdminReports(token: string) {
  return request<{ items: Report[] }>("/admin/reports", {
    headers: authHeaders(token),
  });
}

export async function updateAdminReport(
  token: string,
  reportId: string,
  payload: { status: "reviewed" | "dismissed" | "actioned"; resolutionNote: string }
) {
  return request<{ ok: true }>(`/admin/reports/${reportId}`, {
    method: "PATCH",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function updateUserModeration(
  token: string,
  userId: string,
  payload: { action: "warn" | "ban" | "clear"; reason: string }
) {
  return request<{ ok: true; user: AdminUser }>(`/admin/users/${userId}/moderation`, {
    method: "PATCH",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteUser(token: string, userId: string) {
  return request<{ ok: true; deleted: { users: number; tracks: number } }>(`/admin/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function adminDeleteTrack(token: string, trackId: string) {
  return request<{ ok: true }>(`/admin/tracks/${trackId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function clearAdminTrackRisk(token: string, trackId: string) {
  return request<{ ok: true; track: Track }>(`/admin/tracks/${trackId}/risk`, {
    method: "PATCH",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "clear" }),
  });
}

export async function adminDeleteComment(token: string, commentId: string) {
  return request<{ ok: true }>(`/admin/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
