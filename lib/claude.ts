import Anthropic from "@anthropic-ai/sdk";
import { PURPOSE_LABEL, type Purpose } from "./types";

export interface ReasonInput {
  purpose: Purpose;
  meetingTitle: string;
  timeLabel: string;
  participantCount: number;
  attendable: number;
  preferred: number;
  durationLabel: string;
  requiredLabel: string;
  comments: string[];
}

export interface ReasonOutput {
  reason: string;
  commentSummary: string | null;
}

const SYSTEM = `너는 모임 일정 조율 서비스의 결과 화면 문구를 쓴다.
주어진 숫자만 근거로 삼고, 없는 사실을 지어내지 마라.

문체 규칙:
- 반존대(-해요, -이에요)로 쓴다.
- 이모지, 느낌표, 과장된 감탄은 쓰지 않는다.
- "최적의", "완벽한", "모두를 만족시키는" 같은 홍보 문구는 쓰지 않는다.
- 숫자를 그대로 언급하고, 왜 이 시간이 뽑혔는지만 담백하게 말한다.`;

function buildPrompt(input: ReasonInput) {
  const facts = [
    `모임 이름: ${input.meetingTitle}`,
    `모임 목적: ${PURPOSE_LABEL[input.purpose]}`,
    `추천된 시간: ${input.timeLabel}`,
    `전체 참가자: ${input.participantCount}명`,
    `참석 가능: ${input.attendable}명`,
    `이 시간을 고른 사람: ${input.preferred}명`,
    `확보되는 시간: ${input.durationLabel} (필요한 시간 ${input.requiredLabel})`,
  ].join("\n");

  const commentBlock = input.comments.length
    ? `\n\n참가자가 남긴 메모:\n${input.comments.map((c) => `- ${c}`).join("\n")}`
    : "";

  return `${facts}${commentBlock}

아래 JSON 형식으로만 답해라. 다른 텍스트는 붙이지 마라.
{"reason": "이 시간을 추천한 이유 두 문장 이내", "comment_summary": ${
    input.comments.length
      ? '"참가자 메모를 한 문장으로 정리"'
      : "null (메모가 없으므로 null)"
  }}`;
}

/**
 * 추천 이유 문장을 만든다.
 * 키가 없거나 호출에 실패하면 null을 돌려주고, 화면에서는 규칙 기반 문장으로 대체한다.
 */
export async function generateReason(
  input: ReasonInput,
): Promise<ReasonOutput | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    if (message.stop_reason === "refusal") return null;

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return parseReason(text);
  } catch (error) {
    console.error("Claude 호출 실패:", error);
    return null;
  }
}

function parseReason(text: string): ReasonOutput | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      reason?: unknown;
      comment_summary?: unknown;
    };
    if (typeof parsed.reason !== "string" || !parsed.reason.trim()) return null;

    return {
      reason: parsed.reason.trim(),
      commentSummary:
        typeof parsed.comment_summary === "string" &&
        parsed.comment_summary.trim()
          ? parsed.comment_summary.trim()
          : null,
    };
  } catch {
    return null;
  }
}
