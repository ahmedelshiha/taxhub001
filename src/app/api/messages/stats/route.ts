/**
 * Messages API - Statistics
 * GET /api/messages/stats - Get messaging statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MessagesService } from "@/lib/services/messages/messages-service";
import { TicketsService } from "@/lib/services/messages/tickets-service";

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

    // Get statistics
    const [messagesStats, ticketsStats] = await Promise.all([
      MessagesService.getStats(tenantId, userId),
      TicketsService.getStats(tenantId),
    ]);

    const stats = {
      totalThreads: messagesStats.totalThreads,
      unreadThreads: messagesStats.unreadThreads,
      totalMessages: messagesStats.totalMessages,
      todayMessages: messagesStats.todayMessages,
      totalTickets: ticketsStats.total,
      openTickets: ticketsStats.open,
      inProgressTickets: ticketsStats.inProgress,
      resolvedTickets: ticketsStats.resolved,
      byCategory: ticketsStats.byCategory,
      byPriority: ticketsStats.byPriority,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Error fetching messaging stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch messaging statistics",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
