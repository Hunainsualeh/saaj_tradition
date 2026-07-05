import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ServerActionResponse } from "@/types/server";
import { TestimonialItem } from "@/types/client";
import { Testimonial } from "@prisma/client";
import { wrapServerCall } from "@/lib/server/helpers";
import { CACHE_TAG_TESTIMONIAL } from "@/lib/constants/cache-tags";

export async function getTestimonials(): Promise<
  ServerActionResponse<TestimonialItem[]>
> {
  return wrapServerCall(() =>
    prisma.testimonial.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  );
}

const getActiveTestimonialsCached = unstable_cache(
  async () =>
    prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  [CACHE_TAG_TESTIMONIAL, "active"],
  { tags: [CACHE_TAG_TESTIMONIAL] },
);

export async function getActiveTestimonials(): Promise<
  ServerActionResponse<TestimonialItem[]>
> {
  return wrapServerCall(() => getActiveTestimonialsCached());
}

export async function getTestimonialById(
  id: string,
): Promise<ServerActionResponse<Testimonial | null>> {
  return wrapServerCall(() =>
    prisma.testimonial.findUnique({
      where: { id },
    }),
  );
}
