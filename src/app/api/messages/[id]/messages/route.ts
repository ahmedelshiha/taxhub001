/**
 * Messages API - Send Message
 * POST /api/messages/[id]/messages - Send a message in a thread
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MessagesService } from "@/lib/services/messages/messages-service";
import { z } from "zod";

const sendMessageSchema = z.object({
  text: z.string().min(1, "Message text is required").max(5000),
  attachments: z.array(z.string()).optional(),
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
    const userName = session.user.name || session.user.email;
    const userRole = session.user.role || "CLIENT";
    const threadId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);

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

    const { text } = validation.data;

    // Send message
    const message = await MessagesService.sendMessage(
      tenantId,
      userId,
      userName,
      userRole,
      threadId,
      text
    );

    return NextResponse.json({
      success: true,
      data: message,
      message: "Message sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send message",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
