import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createChatSession } from "@/utils/GeminiAIModal";

// POST /api/habits/suggest — turn a goal into a suggested habit plan via Gemini
export async function POST(request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { goal } = body;

    if (!goal?.trim()) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    const sanitizedGoal = goal.replace(/[<>{}]/g, "").trim().substring(0, 300);

    const prompt = `A user wants help turning this goal into a trackable daily/weekly habit:
"${sanitizedGoal}"

Suggest ONE concrete starter habit. Reply with ONLY valid JSON, no markdown, no code fences, in this exact format:
{
  "name": "Short habit name (max 6 words)",
  "frequency": "daily" or "3x_week" or "weekly",
  "description": "One sentence describing what to actually do, specific and achievable for a beginner",
  "milestones": ["short milestone 1", "short milestone 2", "short milestone 3"]
}

The milestones should be a simple 3-step progression (e.g. week 1, week 2, week 3 targets), each under 10 words.`;

    const session = createChatSession();
    const aiResult = await session.sendMessage(prompt);
    let responseText = aiResult.response.text();

    const cleaned = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let plan;
    try {
      plan = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 502 }
      );
    }

    if (!plan.name || !plan.frequency || !plan.description) {
      return NextResponse.json(
        { error: "Invalid AI response format. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/habits/suggest]", error);
    return NextResponse.json(
      { error: "Failed to generate habit plan. Please try again." },
      { status: 500 }
    );
  }
}
