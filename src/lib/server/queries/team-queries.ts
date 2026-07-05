import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ServerActionResponse } from "@/types/server";
import { TeamMemberItem } from "@/types/client";
import { TeamMember } from "@prisma/client";
import { wrapServerCall } from "@/lib/server/helpers";
import { CACHE_TAG_TEAM } from "@/lib/constants/cache-tags";

const getTeamMembersCached = unstable_cache(
  async () =>
    prisma.teamMember.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  [CACHE_TAG_TEAM, "all"],
  { tags: [CACHE_TAG_TEAM] },
);

// === FETCHES ===
export async function getTeamMembers(): Promise<
  ServerActionResponse<TeamMemberItem[]>
> {
  return wrapServerCall(() => getTeamMembersCached());
}

export async function getTeamMemberById(
  id: string,
): Promise<ServerActionResponse<TeamMember | null>> {
  return wrapServerCall(() =>
    prisma.teamMember.findUnique({
      where: { id },
    }),
  );
}
