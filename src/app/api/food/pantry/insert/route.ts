import { NextRequest, NextResponse } from "next/server";
import { insertPantryItem } from "@/lib/api/food";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('API received payload:', body);
    await insertPantryItem(body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 