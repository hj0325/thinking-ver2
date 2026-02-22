import OpenAI from "openai";
import { z } from "zod";
import { randomUUID } from "crypto";

const PROBLEM_X_RANGE = [0, 400];
const SOLUTION_X_RANGE = [600, 1000];

const CATEGORY_Y_MAP = {
  Why: 0,
  Who: 150,
  What: 300,
  How: 450,
  When: 600,
  Where: 750,
};

const CategorySchema = z.enum(["Who", "What", "When", "Where", "Why", "How"]);
const PhaseSchema = z.enum(["Problem", "Solution"]);

const UserNodeSchema = z.object({
  label: z.string(),
  content: z.string(),
  category: CategorySchema,
  phase: PhaseSchema,
});

const CrossConnectionSchema = z.object({
  existing_node_id: z.string(),
  new_node_index: z.number().int().nonnegative(),
  connection_label: z.string(),
});

const AIAnalysisResultSchema = z.object({
  user_nodes: z.array(UserNodeSchema).min(1).max(4),
  suggestion_label: z.string(),
  suggestion_content: z.string(),
  suggestion_category: CategorySchema,
  suggestion_phase: PhaseSchema,
  suggestion_connects_to_index: z.number().int().nonnegative(),
  connection_label: z.string(),
  cross_connections: z.array(CrossConnectionSchema).max(3),
});

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const ChatNodeResultSchema = z.object({
  user_nodes: z.array(UserNodeSchema).min(1).max(4),
  cross_connections: z.array(CrossConnectionSchema).max(3),
});

function calculatePosition(phase, category, slotIndex = 0) {
  const xRange = phase === "Problem" ? PROBLEM_X_RANGE : SOLUTION_X_RANGE;
  const baseX = (xRange[0] + xRange[1]) / 2;
  const baseY = CATEGORY_Y_MAP[category] ?? 300;

  const NODE_STRIDE_X = 230;
  const NODE_STRIDE_Y = 160;

  let colOffset = 0;
  if (slotIndex === 0) colOffset = 0;
  else if (slotIndex % 2 === 1) colOffset = (slotIndex + 1) / 2;
  else colOffset = -(slotIndex / 2);

  const row = Math.floor(slotIndex / 4);

  return {
    x: baseX + colOffset * NODE_STRIDE_X,
    y: baseY + row * NODE_STRIDE_Y,
  };
}

function buildHistoryContext(history) {
  if (!history?.length) return "기존 노드 없음.";
  return history
    .map((node) => {
      const nodeId = node?.id ?? "unknown";
      const data = node?.data ?? {};
      const title = typeof data.title === "string" ? data.title : "(unknown)";
      const category = data.category ?? "";
      const phase = data.phase ?? "";
      return `- ID: ${nodeId} | [${phase}/${category}] ${title}`;
    })
    .join("\n");
}

function toNode({ id, label, content, category, phase, is_ai_generated, position }) {
  return {
    id,
    type: "default",
    data: {
      label,
      content,
      category,
      phase,
      is_ai_generated: Boolean(is_ai_generated),
    },
    position,
  };
}

function toEdge({ id, source, target, label }) {
  return { id, source, target, label };
}

function stripCodeFences(text) {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function safeJsonParse(text) {
  const cleaned = stripCodeFences(text);
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1));
    }
    throw new Error("Model did not return valid JSON.");
  }
}

function pickFirstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function normalizeEnum(value, allowed, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  const direct = allowed.find((a) => a === trimmed);
  if (direct) return direct;
  const lower = trimmed.toLowerCase();
  const found = allowed.find((a) => a.toLowerCase() === lower);
  return found ?? fallback;
}

function normalizeCategory(value) {
  const allowed = ["Who", "What", "When", "Where", "Why", "How"];
  return normalizeEnum(value, allowed, "What");
}

function normalizePhase(value) {
  const allowed = ["Problem", "Solution"];
  return normalizeEnum(value, allowed, "Problem");
}

function normalizeChatMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .map((m) => ({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: typeof m?.content === "string" ? m.content : "",
    }))
    .filter((m) => m.content.trim().length > 0);
}

function normalizeUserNodes(rawUserNodes) {
  if (!Array.isArray(rawUserNodes)) return [];
  return rawUserNodes
    .map((n) => ({
      label: typeof n?.label === "string" ? n.label : "",
      content: typeof n?.content === "string" ? n.content : "",
      category: normalizeCategory(n?.category),
      phase: normalizePhase(n?.phase),
    }))
    .filter((n) => n.label.trim() && n.content.trim());
}

function normalizeCrossConnections(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => ({
      existing_node_id: typeof c?.existing_node_id === "string" ? c.existing_node_id : "",
      new_node_index: Number.isFinite(c?.new_node_index) ? Number(c.new_node_index) : 0,
      connection_label: typeof c?.connection_label === "string" ? c.connection_label : "관련",
    }))
    .filter((c) => c.existing_node_id);
}

function normalizeAnalysisResult(raw) {
  const user_nodes = normalizeUserNodes(
    pickFirstDefined(raw?.user_nodes, raw?.userNodes, raw?.nodes, raw?.userNodesList)
  );

  const suggestion_label = pickFirstDefined(
    raw?.suggestion_label,
    raw?.suggestionLabel,
    raw?.suggestion_title,
    raw?.suggestionTitle
  );
  const suggestion_content = pickFirstDefined(
    raw?.suggestion_content,
    raw?.suggestionContent,
    raw?.suggestion_body,
    raw?.suggestionBody
  );
  const suggestion_category = normalizeCategory(
    pickFirstDefined(raw?.suggestion_category, raw?.suggestionCategory)
  );
  const suggestion_phase = normalizePhase(pickFirstDefined(raw?.suggestion_phase, raw?.suggestionPhase));
  let suggestion_connects_to_index = pickFirstDefined(
    raw?.suggestion_connects_to_index,
    raw?.suggestionConnectsToIndex,
    raw?.suggestion_connects_to,
    raw?.suggestionConnectsTo
  );
  suggestion_connects_to_index = Number.isFinite(suggestion_connects_to_index)
    ? Number(suggestion_connects_to_index)
    : 0;

  const connection_label =
    (typeof raw?.connection_label === "string" && raw.connection_label) ||
    (typeof raw?.connectionLabel === "string" && raw.connectionLabel) ||
    "제안";

  const cross_connections = normalizeCrossConnections(
    pickFirstDefined(raw?.cross_connections, raw?.crossConnections, raw?.crossConnectionsList)
  );

  // Fill suggestion defaults if missing (keep app functional)
  const mainIdx =
    user_nodes.length > 0
      ? Math.min(Math.max(0, suggestion_connects_to_index), user_nodes.length - 1)
      : 0;
  const mainNode = user_nodes[mainIdx] ?? null;

  const finalSuggestionLabel =
    (typeof suggestion_label === "string" && suggestion_label.trim()) ||
    (mainNode ? `${mainNode.label} 확장` : "아이디어 확장");
  const finalSuggestionContent =
    (typeof suggestion_content === "string" && suggestion_content.trim()) ||
    (mainNode
      ? `${mainNode.content}를(을) 더 구체화하려면 어떤 조건/제약/자원이 필요한가요?`
      : "이 아이디어를 더 구체화하기 위해 핵심 가정과 제약을 정리해볼까요?");

  const finalSuggestionCategory = mainNode ? normalizeCategory(mainNode.category) : suggestion_category;
  const finalSuggestionPhase = mainNode ? normalizePhase(mainNode.phase) : suggestion_phase;

  return {
    user_nodes,
    suggestion_label: finalSuggestionLabel,
    suggestion_content: finalSuggestionContent,
    suggestion_category: finalSuggestionCategory,
    suggestion_phase: finalSuggestionPhase,
    suggestion_connects_to_index: mainIdx,
    connection_label,
    cross_connections,
  };
}

function normalizeChatNodeResult(raw) {
  const user_nodes = normalizeUserNodes(pickFirstDefined(raw?.user_nodes, raw?.userNodes, raw?.nodes));
  const cross_connections = normalizeCrossConnections(pickFirstDefined(raw?.cross_connections, raw?.crossConnections));
  return { user_nodes, cross_connections };
}

function formatZodIssues(issues) {
  if (!Array.isArray(issues)) return "Invalid AI output.";
  return issues
    .slice(0, 6)
    .map((i) => `${(i?.path ?? []).join(".") || "(root)"}: ${i?.message || "invalid"}`)
    .join(" | ");
}

async function createJsonCompletion({ client, model, systemPrompt, userPrompt }) {
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `${systemPrompt}\n\n반드시 JSON만 출력해. 설명/마크다운/코드블록 없이 순수 JSON만.`,
      },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  return response.choices?.[0]?.message?.content ?? "";
}

async function repairToSchema({ client, model, schemaName, schemaHint, badJsonText }) {
  const systemPrompt = `너는 JSON 변환기다. 입력 JSON을 아래 스키마에 정확히 맞춰 변환해라.
반드시 스키마의 키 이름을 그대로 사용하고, 누락된 필드는 합리적으로 채워라.
출력은 오직 JSON 하나만.

[스키마 이름]
${schemaName}

[요구 스키마]
${schemaHint}
`;
  const content = await createJsonCompletion({
    client,
    model,
    systemPrompt,
    userPrompt: `입력 JSON:\n${badJsonText}`,
  });
  return content;
}

export function createThinkingAgent({ apiKey }) {
  const client = new OpenAI({ apiKey });

  async function processIdea({ text, history }) {
    const historyContext = buildHistoryContext(history);

    const systemPrompt = `
너는 사용자의 아이디어를 구조화하고 확장하는 자율형 에이전트다.
사용자의 한 문장 인풋을 받아 6하원칙(Who/What/When/Where/Why/How) 관점으로 분해하고,
관련된 노드들을 추출한 뒤 JSON으로 응답하라.

---

## STEP 1. 인풋 분해 → user_nodes 생성

사용자의 입력에서 **명확하게 존재하는 6하원칙 요소**만 노드로 추출하라.
- 최소 1개, 최대 4개
- 문장에 명시되거나 강하게 내포된 요소만 포함할 것. 억지로 만들지 마라.
- 각 노드는 label(동사형 짧은 제목), content(한 문장 상세), category, phase로 구성

**카테고리 선택 기준 (엄격히 준수):**
| Category | 선택 조건 |
|----------|----------|
| Who      | 사용자·대상·이해관계자·주체가 핵심 |
| What     | 구체적 결과물·기능·서비스·제품이 핵심 |
| When     | 시간·타이밍·순서·빈도가 핵심 |
| Where    | 장소·공간·채널·환경이 핵심 |
| Why      | 목적·이유·동기·문제의식이 핵심 |
| How      | 방법·프로세스·수단·전략이 핵심 |

**Phase 선택 기준:**
- Problem: 현재 문제/니즈/현상 파악 관점
- Solution: 해결책/구현/실행 관점

**예시:**
입력: "일상에 지친 사람들이 진정한 휴식을 즐길 수 있는 광장을 만들고 싶다"
→ user_nodes:
  [0] Who / Problem: "지친 현대인 정의" / 일상에 지쳐 진정한 휴식이 필요한 사람들
  [1] What / Solution: "휴식 광장 조성" / 진정한 휴식을 제공하는 도심 광장을 만든다
  [2] Why / Problem: "휴식 부재 문제" / 현대인이 일상에서 진정한 휴식을 취하지 못하고 있다

## STEP 2. AI 제안 노드 (1개)

user_nodes 전체를 보고 아이디어를 확장하는 날카로운 질문이나 제안을 하나 만들어라.
- suggestion_connects_to_index: 제안 노드가 직접 연결될 user_nodes의 인덱스 (가장 핵심적인 노드)

## STEP 3. 기존 노드 연결 (cross_connections)

기존 노드 목록을 보고, 새로 만든 user_nodes 중 **의미적으로 관련된** 것과 연결하라.
- existing_node_id: 기존 노드 ID
- new_node_index: 연결될 user_nodes 인덱스
- connection_label: 관계 설명 한 구절
- **기존 노드가 존재하면 반드시 최소 1개는 연결할 것.** 같은 카테고리, 같은 phase, 또는 주제의 연장선상이면 반드시 연결하라.
- 최대 3개.

## 기존 노드 목록
${historyContext}
`;

    const schemaHint = `{
  "user_nodes": [{"label": "string", "content": "string", "category": "Who|What|When|Where|Why|How", "phase": "Problem|Solution"}],
  "suggestion_label": "string",
  "suggestion_content": "string",
  "suggestion_category": "Who|What|When|Where|Why|How",
  "suggestion_phase": "Problem|Solution",
  "suggestion_connects_to_index": 0,
  "connection_label": "string",
  "cross_connections": [{"existing_node_id":"string","new_node_index":0,"connection_label":"string"}]
}`;

    const strictPrompt = `${systemPrompt}

반드시 아래 스키마를 만족하는 JSON만 출력해:
${schemaHint}
`;

    let content = await createJsonCompletion({
      client,
      model: "gpt-4o-2024-08-06",
      systemPrompt: strictPrompt,
      userPrompt: text,
    });

    let raw = safeJsonParse(content);
    let normalized = normalizeAnalysisResult(raw);
    let result;
    try {
      result = AIAnalysisResultSchema.parse(normalized);
    } catch (e) {
      if (e?.name === "ZodError") {
        const repaired = await repairToSchema({
          client,
          model: "gpt-4o-mini",
          schemaName: "AIAnalysisResult",
          schemaHint,
          badJsonText: JSON.stringify(raw, null, 2),
        });
        content = repaired;
        raw = safeJsonParse(content);
        normalized = normalizeAnalysisResult(raw);
        result = AIAnalysisResultSchema.parse(normalized);
      } else {
        throw e;
      }
    }

    const slotCounts = {};
    for (const hNode of history ?? []) {
      const hData = hNode?.data ?? {};
      const hPhase = hData.phase ?? "";
      const hCat = hData.category ?? "";
      if (hPhase && hCat) {
        const key = `${hPhase}_${hCat}`;
        slotCounts[key] = (slotCounts[key] ?? 0) + 1;
      }
    }

    const createdNodes = [];
    const createdNodeIds = [];
    for (const un of result.user_nodes) {
      const nodeId = randomUUID();
      const key = `${un.phase}_${un.category}`;
      const slotIdx = slotCounts[key] ?? 0;
      const pos = calculatePosition(un.phase, un.category, slotIdx);
      slotCounts[key] = slotIdx + 1;

      createdNodes.push(
        toNode({
          id: nodeId,
          label: un.label,
          content: un.content,
          category: un.category,
          phase: un.phase,
          is_ai_generated: false,
          position: pos,
        })
      );
      createdNodeIds.push(nodeId);
    }

    const suggestionId = randomUUID();
    const sKey = `${result.suggestion_phase}_${result.suggestion_category}`;
    const sSlot = slotCounts[sKey] ?? 0;
    const suggestPos = calculatePosition(result.suggestion_phase, result.suggestion_category, sSlot);

    const suggestionNode = toNode({
      id: suggestionId,
      label: result.suggestion_label,
      content: result.suggestion_content,
      category: result.suggestion_category,
      phase: result.suggestion_phase,
      is_ai_generated: true,
      position: suggestPos,
    });

    const nodes = [...createdNodes, suggestionNode];
    const edges = [];

    for (let i = 0; i < createdNodeIds.length - 1; i += 1) {
      edges.push(
        toEdge({
          id: `e-input-${createdNodeIds[i]}-${createdNodeIds[i + 1]}`,
          source: createdNodeIds[i],
          target: createdNodeIds[i + 1],
          label: "관련",
        })
      );
    }

    let idx = result.suggestion_connects_to_index;
    if (idx >= createdNodeIds.length) idx = 0;
    const mainNodeId = createdNodeIds[idx];
    edges.push(
      toEdge({
        id: `e-suggest-${mainNodeId}-${suggestionId}`,
        source: mainNodeId,
        target: suggestionId,
        label: result.connection_label,
      })
    );

    const existingIds = new Set((history ?? []).map((n) => n?.id).filter(Boolean));
    const crossConnectedNewIds = new Set();

    for (const cross of result.cross_connections ?? []) {
      if (!existingIds.has(cross.existing_node_id)) continue;
      let newIdx = cross.new_node_index;
      if (newIdx >= createdNodeIds.length) newIdx = 0;
      const targetId = createdNodeIds[newIdx];
      edges.push(
        toEdge({
          id: `e-cross-${cross.existing_node_id}-${targetId}`,
          source: cross.existing_node_id,
          target: targetId,
          label: cross.connection_label,
        })
      );
      crossConnectedNewIds.add(targetId);
    }

    if ((history ?? []).length && createdNodeIds.length && crossConnectedNewIds.size === 0) {
      const firstNewId = createdNodeIds[0];
      const firstNewCat = result.user_nodes?.[0]?.category ?? null;

      let bestExisting = null;
      for (let i = (history ?? []).length - 1; i >= 0; i -= 1) {
        const h = history[i];
        const hCat = h?.data?.category ?? "";
        if (hCat === firstNewCat) {
          bestExisting = h?.id ?? null;
          break;
        }
      }
      if (!bestExisting) bestExisting = history?.[history.length - 1]?.id ?? null;

      if (bestExisting && existingIds.has(bestExisting)) {
        const edgeId = `e-cross-${bestExisting}-${firstNewId}`;
        const existingEdgeIds = new Set(edges.map((e) => e.id));
        if (!existingEdgeIds.has(edgeId)) {
          edges.push(
            toEdge({
              id: edgeId,
              source: bestExisting,
              target: firstNewId,
              label: "관련",
            })
          );
        }
      }
    }

    return { nodes, edges };
  }

  async function chatWithSuggestion({
    suggestion_title,
    suggestion_content,
    suggestion_category,
    suggestion_phase,
    messages,
    user_message,
  }) {
    const safeMessages = z.array(ChatMessageSchema).parse(normalizeChatMessages(messages));
    const systemPrompt = `너는 사용자의 아이디어를 함께 탐구하는 AI 대화 파트너다.

아래 제안 카드를 중심으로 사용자와 자유롭게 대화하라.
- 처음 대화(messages가 비어 있을 때)라면 제안의 핵심을 2~3문장으로 친절하게 설명하고, 사용자가 어떤 방향으로 발전시키고 싶은지 열린 질문으로 마무리하라.
- 이후 대화에서는 사용자의 답변을 토대로 아이디어를 구체화‧확장‧검증하라.
- 응답은 200자 내외로 간결하게 유지하라.
- 언어는 한국어.

[제안 카드]
카테고리: ${suggestion_category} / ${suggestion_phase}
제목: ${suggestion_title}
내용: ${suggestion_content}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...safeMessages,
        { role: "user", content: user_message },
      ],
    });

    return response.choices?.[0]?.message?.content ?? "";
  }

  async function chatToNodes({
    suggestion_title,
    suggestion_content,
    suggestion_category,
    suggestion_phase,
    messages,
    existing_nodes,
  }) {
    const safeMessages = z.array(ChatMessageSchema).parse(normalizeChatMessages(messages));
    const historyContext = buildHistoryContext(existing_nodes ?? []);
    const conversationText = safeMessages
      .map((m) => `[${String(m.role).toUpperCase()}] ${m.content}`)
      .join("\n");

    const systemPrompt = `
너는 대화 내용을 6하원칙 노드로 구조화하는 에이전트다.

아래 대화를 분석해서 핵심 아이디어를 1~4개의 노드로 추출하라.
각 노드는 label(짧은 동사형 제목), content(한 문장), category(Who/What/When/Where/Why/How), phase(Problem/Solution)로 구성.

[제안 카드 원본]
${suggestion_category}/${suggestion_phase}: ${suggestion_title} - ${suggestion_content}

[대화 내용]
${conversationText}

## 기존 노드 목록 (cross_connections 시 사용)
${historyContext}
`;

    const schemaHint = `{
  "user_nodes": [{"label": "string", "content": "string", "category": "Who|What|When|Where|Why|How", "phase": "Problem|Solution"}],
  "cross_connections": [{"existing_node_id":"string","new_node_index":0,"connection_label":"string"}]
}`;

    const strictPrompt = `${systemPrompt}

반드시 아래 스키마를 만족하는 JSON만 출력해:
${schemaHint}
`;

    let content = await createJsonCompletion({
      client,
      model: "gpt-4o-2024-08-06",
      systemPrompt: strictPrompt,
      userPrompt: "대화를 노드로 구조화해줘.",
    });

    let raw = safeJsonParse(content);
    let normalized = normalizeChatNodeResult(raw);
    let result;
    try {
      result = ChatNodeResultSchema.parse(normalized);
    } catch (e) {
      if (e?.name === "ZodError") {
        const repaired = await repairToSchema({
          client,
          model: "gpt-4o-mini",
          schemaName: "ChatNodeResult",
          schemaHint,
          badJsonText: JSON.stringify(raw, null, 2),
        });
        content = repaired;
        raw = safeJsonParse(content);
        normalized = normalizeChatNodeResult(raw);
        result = ChatNodeResultSchema.parse(normalized);
      } else {
        throw e;
      }
    }

    const slotCounts = {};
    for (const hNode of existing_nodes ?? []) {
      const hData = hNode?.data ?? {};
      const hPhase = hData.phase ?? "";
      const hCat = hData.category ?? "";
      if (hPhase && hCat) {
        const key = `${hPhase}_${hCat}`;
        slotCounts[key] = (slotCounts[key] ?? 0) + 1;
      }
    }

    const createdNodes = [];
    const createdNodeIds = [];
    for (const un of result.user_nodes) {
      const nodeId = randomUUID();
      const key = `${un.phase}_${un.category}`;
      const slotIdx = slotCounts[key] ?? 0;
      const pos = calculatePosition(un.phase, un.category, slotIdx);
      slotCounts[key] = slotIdx + 1;

      createdNodes.push(
        toNode({
          id: nodeId,
          label: un.label,
          content: un.content,
          category: un.category,
          phase: un.phase,
          is_ai_generated: false,
          position: pos,
        })
      );
      createdNodeIds.push(nodeId);
    }

    const edges = [];
    for (let i = 0; i < createdNodeIds.length - 1; i += 1) {
      edges.push(
        toEdge({
          id: `e-chat-${createdNodeIds[i]}-${createdNodeIds[i + 1]}`,
          source: createdNodeIds[i],
          target: createdNodeIds[i + 1],
          label: "이어서",
        })
      );
    }

    const existingIds = new Set((existing_nodes ?? []).map((n) => n?.id).filter(Boolean));
    const crossConnected = new Set();

    for (const cross of result.cross_connections ?? []) {
      if (!existingIds.has(cross.existing_node_id)) continue;
      let newIdx = cross.new_node_index;
      if (newIdx >= createdNodeIds.length) newIdx = 0;
      const targetId = createdNodeIds[newIdx];
      edges.push(
        toEdge({
          id: `e-cross-${cross.existing_node_id}-${targetId}`,
          source: cross.existing_node_id,
          target: targetId,
          label: cross.connection_label,
        })
      );
      crossConnected.add(targetId);
    }

    if ((existing_nodes ?? []).length && createdNodeIds.length && crossConnected.size === 0) {
      const firstId = createdNodeIds[0];
      const anchor = existing_nodes?.[existing_nodes.length - 1]?.id ?? null;
      if (anchor && existingIds.has(anchor)) {
        edges.push(
          toEdge({
            id: `e-cross-${anchor}-${firstId}`,
            source: anchor,
            target: firstId,
            label: "대화에서 발전",
          })
        );
      }
    }

    return { nodes: createdNodes, edges };
  }

  return {
    processIdea,
    chatWithSuggestion,
    chatToNodes,
  };
}

