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
  if (!history?.length) return "No existing nodes.";
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
      connection_label: typeof c?.connection_label === "string" ? c.connection_label : "Related",
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
    "Suggestion";

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
    (mainNode ? `${mainNode.label} extension` : "Idea extension");
  const finalSuggestionContent =
    (typeof suggestion_content === "string" && suggestion_content.trim()) ||
    (mainNode
      ? `To make "${mainNode.content}" more concrete, what constraints, assumptions, and resources are needed?`
      : "To develop this idea further, let's clarify key assumptions, constraints, and resources.");

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
        content: `${systemPrompt}\n\nOutput JSON only. No prose, markdown, or code fences.`,
      },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  return response.choices?.[0]?.message?.content ?? "";
}

async function repairToSchema({ client, model, schemaName, schemaHint, badJsonText }) {
  const systemPrompt = `You are a JSON transformer. Convert the input JSON so it strictly matches the schema below.
Keep schema key names exactly as specified and fill missing fields with reasonable values.
Output only one JSON object.

[Schema Name]
${schemaName}

[Required Schema]
${schemaHint}
`;
  const content = await createJsonCompletion({
    client,
    model,
    systemPrompt,
    userPrompt: `Input JSON:\n${badJsonText}`,
  });
  return content;
}

export function createThinkingAgent({ apiKey }) {
  const client = new OpenAI({ apiKey });

  async function processIdea({ text, history }) {
    const historyContext = buildHistoryContext(history);

    const systemPrompt = `
You are an autonomous agent that structures and expands a user's idea.
Given a single user input sentence, decompose it using 5W1H (Who/What/When/Where/Why/How),
extract related nodes, and respond in JSON.

---

## STEP 1. Decompose Input -> Create user_nodes

Extract only 5W1H elements that are clearly present in the user input.
- Minimum 1 and maximum 4 nodes
- Include only explicit or strongly implied elements; do not force weak assumptions
- Each node must contain: label (short action-oriented title), content (one-sentence detail), category, and phase

**Category selection criteria (strict):**
| Category | Selection Rule |
|----------|----------------|
| Who      | Main subject, target user, stakeholder, or actor |
| What     | Concrete output, feature, service, or product |
| When     | Time, timing, sequence, or frequency |
| Where    | Place, channel, space, or environment |
| Why      | Purpose, reason, motivation, or problem framing |
| How      | Method, process, means, or strategy |

**Phase selection criteria:**
- Problem: understanding the current issue, need, or context
- Solution: proposing execution, implementation, or resolution

## STEP 2. AI Suggestion Node (1 item)

Create one sharp suggestion or question that expands the idea across user_nodes.
- suggestion_connects_to_index: index of the main user_nodes item the suggestion should connect to

## STEP 3. Connect to Existing Nodes (cross_connections)

Use existing nodes and connect semantically related new user_nodes.
- existing_node_id: ID from existing history
- new_node_index: index in user_nodes to connect
- connection_label: short relation phrase
- If existing nodes are present, include at least one cross connection when meaningfully related.
- Maximum 3 cross connections.

## Existing nodes
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

Return JSON only, strictly matching this schema:
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
          label: "Related",
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
              label: "Related",
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
    const systemPrompt = `You are an AI conversation partner that helps users explore and improve ideas.

Use the suggestion card below as the conversation anchor.
- If this is the first message (messages is empty), explain the suggestion clearly in 2-3 sentences and end with an open question.
- In follow-up turns, refine, expand, and validate the idea based on the user's replies.
- Keep responses concise.
- Respond in English only.

[Suggestion Card]
Category: ${suggestion_category} / ${suggestion_phase}
Title: ${suggestion_title}
Content: ${suggestion_content}
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
You are an agent that structures a conversation into 5W1H idea nodes.

Analyze the conversation below and extract 1 to 4 core idea nodes.
Each node must include:
- label (short action-oriented title)
- content (one sentence)
- category (Who/What/When/Where/Why/How)
- phase (Problem/Solution)

[Original Suggestion Card]
${suggestion_category}/${suggestion_phase}: ${suggestion_title} - ${suggestion_content}

[Conversation]
${conversationText}

## Existing nodes (for cross_connections)
${historyContext}
`;

    const schemaHint = `{
  "user_nodes": [{"label": "string", "content": "string", "category": "Who|What|When|Where|Why|How", "phase": "Problem|Solution"}],
  "cross_connections": [{"existing_node_id":"string","new_node_index":0,"connection_label":"string"}]
}`;

    const strictPrompt = `${systemPrompt}

Return JSON only, strictly matching this schema:
${schemaHint}
`;

    let content = await createJsonCompletion({
      client,
      model: "gpt-4o-2024-08-06",
      systemPrompt: strictPrompt,
      userPrompt: "Convert this conversation into nodes.",
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
          label: "Continues",
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
            label: "Evolved from conversation",
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
