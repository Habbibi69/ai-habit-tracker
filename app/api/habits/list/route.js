import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db";
import { Habit, Checkin } from "@/utils/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/habits/list — list all habits for the logged in user, with today's checkin status
export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress?.emailAddress ?? "";
    const today = new Date().toISOString().split("T")[0];

    const habits = await db
      .select()
      .from(Habit)
      .where(eq(Habit.createdBy, userEmail))
      .orderBy(desc(Habit.id));

    // For each habit, get today's checkin (if any) and a simple streak count
    const habitsWithStatus = await Promise.all(
      habits.map(async (habit) => {
        const todayCheckin = await db
          .select()
          .from(Checkin)
          .where(and(eq(Checkin.habitId, habit.id), eq(Checkin.date, today)))
          .limit(1);

        const allCheckins = await db
          .select()
          .from(Checkin)
          .where(eq(Checkin.habitId, habit.id))
          .orderBy(desc(Checkin.date));

        // Simple streak: count consecutive "done" days going backward from today
        let streak = 0;
        for (const c of allCheckins) {
          if (c.status === "done") {
            streak++;
          } else {
            break;
          }
        }

        return {
          ...habit,
          todayStatus: todayCheckin[0]?.status ?? null,
          streak,
        };
      })
    );

    return NextResponse.json({ habits: habitsWithStatus }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/habits/list]", error);
    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 }
    );
  }
}
