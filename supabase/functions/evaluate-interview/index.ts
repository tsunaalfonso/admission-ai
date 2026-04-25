// Evaluate interview responses with Lovable AI
// deno-lint-ignore-file no-explicit-any
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResponseInput {
  question: string;
  transcript: string;
  expected_keywords?: string[] | null;
}

interface RequestBody {
  character: { name: string; title: string; personality: string };
  responses: ResponseInput[];
  threshold?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = (await req.json()) as RequestBody;
    if (!body.responses || body.responses.length === 0) {
      return new Response(
        JSON.stringify({ error: "No responses provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const threshold = body.threshold ?? 75;

    const systemPrompt = `You are ${body.character.name}, a ${body.character.title} for student admissions. Personality: ${body.character.personality}.

You will evaluate a student's interview answers. For each question, score the answer from 0-100 considering:
- Relevance to the question
- Clarity and structure
- Depth of reasoning
- Communication quality
- Coverage of expected keywords/concepts (if provided)

Be fair, evidence-based, and constructive. Empty or off-topic answers should score very low (0-20). Strong, specific, well-reasoned answers should score 80-100.

Then produce an overall evaluation: aggregate score, pass/fail (pass = overall_score >= ${threshold}), and concise feedback.`;

    const userPrompt = `Threshold for passing: ${threshold}

Evaluate these responses:

${body.responses
  .map(
    (r, i) =>
      `Q${i + 1}: ${r.question}\n${
        r.expected_keywords?.length
          ? `Expected concepts: ${r.expected_keywords.join(", ")}\n`
          : ""
      }Answer: "${r.transcript || "(no answer given)"}"\n`
  )
  .join("\n")}`;

    const tool = {
      type: "function",
      function: {
        name: "submit_evaluation",
        description: "Return the structured evaluation of the interview.",
        parameters: {
          type: "object",
          properties: {
            per_question: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  score: { type: "integer", minimum: 0, maximum: 100 },
                  feedback: { type: "string" },
                },
                required: ["score", "feedback"],
                additionalProperties: false,
              },
            },
            overall_score: { type: "integer", minimum: 0, maximum: 100 },
            passed: { type: "boolean" },
            strengths: { type: "string" },
            weaknesses: { type: "string" },
            improvements: { type: "string" },
            overall_feedback: { type: "string" },
          },
          required: [
            "per_question",
            "overall_score",
            "passed",
            "strengths",
            "weaknesses",
            "improvements",
            "overall_feedback",
          ],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "submit_evaluation" } },
        }),
      }
    );

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, text);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI evaluation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await aiResp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      console.error("No tool call returned:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI did not return a structured evaluation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const evaluation = JSON.parse(call.function.arguments);
    // Enforce threshold consistency
    evaluation.passed = evaluation.overall_score >= threshold;
    evaluation.threshold = threshold;

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-interview error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
