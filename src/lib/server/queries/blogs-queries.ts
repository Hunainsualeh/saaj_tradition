import { unstable_cache } from "next/cache";
import { BlogPost } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BlogPostWithAuthor, ServerActionResponse } from "@/types/server";
import { wrapServerCall } from "@/lib/server/helpers";
import { CACHE_TAG_BLOG } from "@/lib/constants/cache-tags";

// === FETCHES ===
const getBlogsCached = unstable_cache(
  async () =>
    prisma.blogPost.findMany({
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  [CACHE_TAG_BLOG, "all"],
  { tags: [CACHE_TAG_BLOG] },
);

export async function getBlogs(): Promise<ServerActionResponse<BlogPost[]>> {
  return wrapServerCall(() => getBlogsCached());
}

export async function getBlogById(
  id: string,
): Promise<ServerActionResponse<BlogPost | null>> {
  return wrapServerCall(async () => {
    const blog = await prisma.blogPost.findFirst({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return blog;
  });
}

export async function getBlogBySlug(
  slug: string,
): Promise<ServerActionResponse<BlogPostWithAuthor | null>> {
  return wrapServerCall(async () => {
    const blog = await prisma.blogPost.findFirst({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            occupation: true,
          },
        },
      },
    });

    return blog;
  });
}

export async function getHomePageBlogs(): Promise<
  ServerActionResponse<BlogPostWithAuthor[]>
> {
  return wrapServerCall(async () => {
    const blogs = await prisma.blogPost.findMany({
      take: 4,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            occupation: true,
          },
        },
      },
    });

    return blogs;
  });
}
