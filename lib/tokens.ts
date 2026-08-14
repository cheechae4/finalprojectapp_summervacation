export const CREATOR_KEY = "moimpick.creator_token";

export const participantKey = (meetingId: string) =>
  `moimpick.participant.${meetingId}`;

function newToken() {
  return crypto.randomUUID();
}

/** 방장 식별용 토큰. 브라우저마다 하나씩 두고 계속 재사용한다. */
export function getCreatorToken(): string {
  const saved = localStorage.getItem(CREATOR_KEY);
  if (saved) return saved;
  const token = newToken();
  localStorage.setItem(CREATOR_KEY, token);
  return token;
}

/** 참가자 토큰은 모임별로 따로 저장한다. 재접속하면 자기 투표를 고칠 수 있게. */
export function createParticipantToken(meetingId: string): string {
  const token = newToken();
  localStorage.setItem(participantKey(meetingId), token);
  return token;
}
