import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db";
import { Habit, Checkin } from "@/utils/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { createChatSession } from "@/utils/GeminiAIModal";

// GET /api/habits/insights — AI summary of the last 7 days across all habits
export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress?.emailAddress ?? "";

    const habits = await db
      .select()
      .from(Habit)
      .where(eq(Habit.createdBy, userEmail));

    if (habits.length === 0) {
      return NextResponse.json(
        { error: "No habits yet. Create a habit first to get insights." },
        { status: 400 }
      );
    }

    // 7 days ago, as YYYY-MM-DD
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split("T")[0];

    // Gather each habit's last-7-days checkins
    const summaryLines = [];
    let totalDone = 0;
    let totalPossible = 0;

    for (const habit of habits) {
      const checkins = await db
        .select()
        .from(Checkin)
        .where(and(eq(Checkin.habitId, habit.id), gte(Checkin.date, cutoffDate)))
        .orderBy(desc(Checkin.date));

      const doneCount = checkins.filter((c) => c.status === "done").length;
      totalDone += doneCount;
      totalPossible += 7; // rough baseline: 7 possible days per habit

      const dayList =
        checkins.map((c) => `${c.date}:${c.status}`).join(", ") || "no checkins";

      summaryLines.push(
        `- ${habit.name} (${habit.frequency}): ${doneCount}/7 done. Details: ${dayList}`
      );
    }

    const consistencyPct =
      totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    const prompt = `You are a supportive habit coach reviewing someone's last 7 days across multiple habits.

Data:
${summaryLines.join("\n")}

Overall consistency: ${consistencyPct}%

Write a short weekly summary in 3-4 sentences:
1. Acknowledge their overall consistency (${consistencyPct}%).
2. Point out one specific pattern you notice (a strong habit, a struggling habit, or a particular day of the week).
3. Give one concrete, encouraging suggestion for next week.

Keep it warm and encouraging, no markdown formatting, plain sentences only.`;

    let insight = "";
    try {
      const session = createChatSession();
      const aiResult = await session.sendMessage(prompt);
      insight = aiResult.response.text().trim();
    } catch (aiError) {
      console.error("[GET /api/habits/insights] AI error", aiError);
      insight = `You completed ${consistencyPct}% of your habit check-ins this week. Keep going — consistency builds over time!`;
    }

    return NextResponse.json(
      { insight, consistencyPct, habitCount: habits.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/habits/insights]", error);
    return NextResponse.json(
      { error: "Failed to generate insights. Please try again." },
      { status: 500 }
    );
  }
}
