import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { billsService } from "@/lib/services/bills/bills-service";
import { logger } from "@/lib/logger";

/**
 * GET /api/bills/stats
 * Get bills statistics and analytics
 */
const _api_GET = async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext();
    const { userId, tenantId } = ctx;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get statistics
    const stats = await billsService.getStats(tenantId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching bill stats", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
