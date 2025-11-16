/**
 * Messages API - Support Tickets
 * GET /api/messages/tickets - List tickets
 * POST /api/messages/tickets - Create ticket
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TicketsService } from "@/lib/services/messages/tickets-service";
import { z } from "zod";

const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000),
  category: z.enum([
    "GENERAL",
    "TECHNICAL",
    "BILLING",
    "ACCOUNT",
    "FEATURE_REQUEST",
    "BUG_REPORT",
    "COMPLIANCE",
    "TAX",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: (searchParams.get("status") as any) || undefined,
      priority: (searchParams.get("priority") as any) || undefined,
      category: (searchParams.get("category") as any) || undefined,
      search: searchParams.get("search") || undefined,
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    // Get tickets
    const { tickets, total } = await TicketsService.getTickets(
      tenantId,
      userId,
      filters
    );

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tickets",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = createTicketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    // Create ticket
    const ticket = await TicketsService.createTicket(
      tenantId,
      userId,
      validation.data
    );

    return NextResponse.json({
      success: true,
      data: ticket,
      message: "Support ticket created successfully",
    });
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create ticket",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
