export type Aura = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient: string;
  moodLabel: string;
};

export type Track = {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl?: string;
  title: string;
  kind: "sample" | "demo";
  genre: string;
  description: string;
  bpm: number | null;
  musicalKey: string;
  energyLevel: string;
  tags: string[];
  aura: Aura;
  analysisSource?: string;
  licenseLabel?: string;
  licenseConfirmed?: boolean;
  licenseConfirmedAt?: string | null;
  aiRiskLevel?: "clear" | "suspicious" | "unknown";
  aiRiskReasons?: string[];
  aiSuggestedAction?: "allow" | "manual_review" | "unknown";
  aiAdminNote?: string;
  aiRiskSource?: "openai" | "rule" | "disabled" | "error" | "manual";
  aiCheckedAt?: string | null;
  durationSec: number | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  fileSize: number | null;
  audioUrl: string;
  downloadUrl?: string | null;
  isDownloadable?: boolean;
  ratingAverage: number;
  ratingCount: number;
  playCount: number;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: string;
};

export type User = {
  id: string;
  username: string;
  email?: string;
  role?: "user" | "admin";
  moderationStatus?: "active" | "warned" | "banned";
  warningCount?: number;
  moderationReason?: string;
  interests: string[];
  bio: string;
  avatarUrl?: string | null;
  createdAt?: string;
};

export type AdminOverview = {
  userCount: number;
  sampleCount: number;
  demoCount: number;
  suspiciousSampleCount?: number;
  commentCount: number;
  ratingCount: number;
  totalPlays: number;
  totalUpvotes: number;
  totalDownvotes: number;
  openReportCount: number;
};

export type AdminUser = User & {
  email: string;
  role: "user" | "admin";
  moderationStatus: "active" | "warned" | "banned";
  warningCount: number;
  moderationReason: string;
};

export type Report = {
  id: string;
  targetType: "upload" | "comment";
  trackId: string;
  trackTitle: string;
  trackKind: "sample" | "demo";
  trackOwnerId: string;
  trackOwnerUsername: string;
  commentId?: string | null;
  commentText?: string;
  commentAuthorId?: string;
  commentAuthorUsername?: string;
  reporterId: string;
  reporterUsername: string;
  reason: "spam" | "harassment" | "copyright" | "explicit" | "misleading" | "other";
  details: string;
  status: "open" | "reviewed" | "dismissed" | "actioned";
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string | null;
  createdAt: string;
};

export type ProfilePayload = {
  user: User;
  samples: Track[];
  demos: Track[];
  stats: {
    totalUploads: number;
    sampleCount: number;
    demoCount: number;
    totalPlays: number;
    totalRatings: number;
  };
};

export type CollectionMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type ApiCollection<T> = {
  items: T[];
  meta?: CollectionMeta;
};

export type Rating = {
  id: string;
  trackId: string;
  userId: string;
  author: string;
  authorAvatarUrl?: string;
  score: number;
  text: string;
  updatedAt: string;
};

export type RatingResponse = {
  average: number;
  count: number;
  items: Rating[];
};

export type Comment = {
  id: string;
  trackId: string;
  parentId: string | null;
  parentRatingId?: string | null;
  userId: string;
  author: string;
  authorAvatarUrl?: string;
  category: string;
  timestampSec: number | null;
  text: string;
  isDeleted?: boolean;
  createdAt: string;
};

export type CollabRequest = {
  id: string;
  trackId: string;
  trackTitle: string;
  trackOwnerId: string;
  trackOwnerUsername: string;
  requesterId: string;
  requesterUsername: string;
  requesterAvatarUrl?: string;
  message: string;
  skills: string[];
  contactPreference: "in-app" | "email" | "instagram";
  requesterEmail?: string;
  emailVisible?: boolean;
  instagramHandle?: string;
  instagramVisible?: boolean;
  status: "pending" | "accepted" | "declined";
  direction: "incoming" | "outgoing";
  createdAt: string;
  updatedAt: string;
};
