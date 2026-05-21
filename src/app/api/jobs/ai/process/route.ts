import { NextResponse } from "next/server";
import { processPendingAiJobs } from "@/lib/ai/jobs";
import { processDueOperationTasks } from "@/lib/operations";

export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [aiResults, taskResults] = await Promise.all([
    processPendingAiJobs(),
    processDueOperationTasks(),
  ]);

  return NextResponse.json({
    processed: aiResults.length + taskResults.length,
    results: {
      ai: aiResults,
      tasks: taskResults,
    },
  });
}
