/**
 * Messages API - List Threads
 * GET /api/messages - List all message threads (chat + tickets)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MessagesService } from "@/lib/services/messages/messages-service";
import type { MessageFilters } from "@/types/messages";

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
    const filters: MessageFilters = {
      type: (searchParams.get("type") as any) || "all",
      search: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    // Get threads
    const { threads, total } = await MessagesService.getThreads(
      tenantId,
      userId,
      filters
    );

    return NextResponse.json({
      success: true,
      data: {
        threads,
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error: any) {
    console.error("Error fetching message threads:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch message threads",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
