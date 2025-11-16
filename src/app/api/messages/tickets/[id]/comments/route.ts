/**
 * Messages API - Ticket Comments
 * POST /api/messages/tickets/[id]/comments - Add comment
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TicketsService } from "@/lib/services/messages/tickets-service";
import { z } from "zod";

const addCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(5000),
  attachments: z.array(z.string()).optional(),
  isInternal: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const ticketId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = addCommentSchema.safeParse(body);

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

    // Add comment
    const comment = await TicketsService.addComment(tenantId, userId, {
      ticketId,
      ...validation.data,
    });

    return NextResponse.json({
      success: true,
      data: comment,
      message: "Comment added successfully",
    });
  } catch (error: any) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add comment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
