import { NextRequest, NextResponse } from "next/server";
import { listEvents, insertEvent, deleteEvent, updateEvent } from "@/lib/api/calendar";

export async function POST(
  req: NextRequest,
  context: { params: { action: "list" | "insert" | "delete" | "update" } }
) {
  const params = await context.params;
  const body = await req.json();
  try {
    if (params.action === "list")
      return NextResponse.json(await listEvents(body.userId));
    if (params.action === "insert") await insertEvent(body.event);
    if (params.action === "delete") await deleteEvent(body.id);
    if (params.action === "update") {
      const result = await updateEvent({
        id: body.id,
        userId: body.userId,
        newStart: body.newStart,
        newEnd: body.newEnd,
        updateLinkedEntity: body.updateLinkedEntity
      });
      return NextResponse.json(result);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 