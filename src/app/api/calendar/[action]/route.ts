import { NextRequest, NextResponse } from "next/server";
import { listEvents, insertEvent, deleteEvent, updateEvent } from "@/lib/api/calendar";
import type { CalendarEvent } from "@/types/calendar";

interface CalendarRequestBody {
  userId?: string;
  event?: CalendarEvent;
  id?: string;
  newStart?: string;
  newEnd?: string;
  updateLinkedEntity?: boolean;
}

export async function POST(
  req: NextRequest,
  context: { params: { action: "list" | "insert" | "delete" | "update" } }
) {
  const params = await context.params;
  const body: CalendarRequestBody = await req.json();
  
  try {
    if (params.action === "list") {
      if (!body.userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
      }
      return NextResponse.json(await listEvents(body.userId));
    }
    
    if (params.action === "insert") {
      if (!body.event) {
        return NextResponse.json({ error: "event is required" }, { status: 400 });
      }
      await insertEvent(body.event);
    }
    
    if (params.action === "delete") {
      if (!body.id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
      }
      await deleteEvent(body.id);
    }
    
    if (params.action === "update") {
      if (!body.id || !body.userId || !body.newStart) {
        return NextResponse.json({ error: "id, userId, and newStart are required" }, { status: 400 });
      }
      
      const result = await updateEvent({
        id: body.id,
        userId: body.userId,
        newStart: body.newStart,
        ...(body.newEnd !== undefined && { newEnd: body.newEnd }),
        ...(body.updateLinkedEntity !== undefined && { updateLinkedEntity: body.updateLinkedEntity })
      });
      
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 