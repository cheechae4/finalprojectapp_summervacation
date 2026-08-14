export type Purpose = "study" | "meeting" | "meal" | "social";
export type VoteStatus = "unavailable" | "available" | "preferred";

export interface Meeting {
  id: string;
  creator_token: string;
  title: string;
  purpose: Purpose;
  min_duration_minutes: number;
  status: "voting" | "confirmed";
  confirmed_candidate_id: string | null;
  confirmed_location: string | null;
  confirmed_place_lat: number | null;
  confirmed_place_lng: number | null;
  created_at: string;
}

export interface TimeCandidate {
  id: string;
  meeting_id: string;
  start_at: string;
  end_at: string;
}

export interface Participant {
  id: string;
  meeting_id: string;
  participant_token: string;
  name: string;
  departure_location: string | null;
  departure_lat: number | null;
  departure_lng: number | null;
  created_at: string;
}

export interface Vote {
  id: string;
  participant_id: string;
  candidate_id: string;
  status: VoteStatus;
  comment: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  meeting_id: string;
  content: string;
  assignee_participant_id: string | null;
  is_done: boolean;
}

export const PURPOSE_LABEL: Record<Purpose, string> = {
  study: "스터디",
  meeting: "회의",
  meal: "식사",
  social: "친목",
};

export const PURPOSE_DESC: Record<Purpose, string> = {
  study: "집중해서 오래 앉아 있어야 하는 모임",
  meeting: "안건을 정리하고 결정하는 자리",
  meal: "같이 밥 먹고 이야기하는 모임",
  social: "가볍게 모여서 노는 자리",
};

export const VOTE_LABEL: Record<VoteStatus, string> = {
  unavailable: "안 돼요",
  available: "가능해요",
  preferred: "이때가 좋아요",
};
