"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "../helpers/cache-helpers";

import { prisma } from "@/lib/prisma";
import { TeamMemberMutationInput, ServerActionResponse } from "@/types/server";
import {
  AdminFormAddTeamData,
  AdminFormEditTeamData,
} from "@/components/admin/forms/AdminTeamForm/schema";
import { adminRoutes, routes } from "@/lib/routing";
import { CACHE_TAG_TEAM } from "@/lib/constants/cache-tags";
import { wrapServerCall } from "../helpers/generic-helpers";
import { requireAdmin } from "../helpers/require-admin";
import { isDemoMode } from "@/lib/server/helpers/demo-mode";
import { uploadToCloudinary } from "@/lib/server/helpers/cloudinary-upload";

// === MUTATIONS ===
export async function deleteTeamMemberById(
  id: string,
): Promise<ServerActionResponse<TeamMemberMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    const deleted = await prisma.teamMember.delete({ where: { id } });

    invalidateCacheTag(CACHE_TAG_TEAM);
    revalidatePath(adminRoutes.team);
    revalidatePath(routes.about);

    return { id: deleted.id };
  });
}

export async function createTeamMember(
  data: AdminFormAddTeamData,
): Promise<ServerActionResponse<TeamMemberMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id: `demo-${data.name.toLowerCase().replace(/\s+/g, "-")}` };
    }

    const imageFile = data.image;
    const buffer = await imageFile.arrayBuffer();
    const imageSrc = await uploadToCloudinary(
      Buffer.from(buffer),
      data.name,
      "team",
    );

    const maxOrder = await prisma.teamMember.aggregate({
      _max: { sortOrder: true },
    });

    const created = await prisma.teamMember.create({
      data: {
        name: data.name,
        position: data.position,
        imageSrc,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    invalidateCacheTag(CACHE_TAG_TEAM);
    revalidatePath(adminRoutes.team);
    revalidatePath(routes.about);

    return { id: created.id };
  });
}

export async function updateTeamMemberById(
  id: string,
  data: AdminFormEditTeamData,
): Promise<ServerActionResponse<TeamMemberMutationInput>> {
  return wrapServerCall(async () => {
      await requireAdmin();
    if (isDemoMode()) {
      return { id };
    }

    invalidateCacheTag(CACHE_TAG_TEAM);
    revalidatePath(adminRoutes.team);
    revalidatePath(routes.about);

    if (data.image) {
      const imageFile = data.image;
      const buffer = await imageFile.arrayBuffer();
      const imageSrc = await uploadToCloudinary(
        Buffer.from(buffer),
        data.name,
        "team",
      );

      await prisma.teamMember.update({
        where: { id },
        data: {
          name: data.name,
          position: data.position,
          imageSrc,
          sortOrder: data.sortOrder,
        },
      });

      return { id };
    }

    await prisma.teamMember.update({
      where: { id },
      data: {
        name: data.name,
        position: data.position,
        sortOrder: data.sortOrder,
      },
    });
    return { id };
  });
}
