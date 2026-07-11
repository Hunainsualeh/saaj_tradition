import Image from "next/image";
import type { Metadata } from "next";

import { AnimatedHeadingText, BreadCrumb, ProfileDetails } from "@/components";
import { BLOG_NAVBAR_TEXT } from "@/components/layout/Navbar/lib";
import { routes } from "@/lib";
import { getBlogBySlug } from "@/lib/server/queries";
import { formatBlogDate } from "@/lib/utils";
import { convertStringToBlog } from "@/lib/parsers";
import { notFound } from "next/navigation";

type BlogIdPageProps = {
  params: { id: string };
};

export async function generateMetadata(
  props: BlogIdPageProps,
): Promise<Metadata> {
  const { id } = await props.params;
  const blog = await getBlogBySlug(id);

  // Thrown here (not only in the page body) so the response carries a REAL
  // 404 status — the page body streams behind loading.tsx after a 200 shell.
  if (!blog.success || !blog.data) {
    notFound();
  }

  return {
    title: blog.data.title,
  };
}

export default async function BlogIdPage({ params }: BlogIdPageProps) {
  // === PARAMS ===
  const { id } = await params;

  // === QUERIES ===
  const blog = await getBlogBySlug(id);

  // A real 404 (not an empty 200 page) so unknown blog URLs aren't indexed
  // as thin duplicate pages.
  if (!blog.success || !blog.data) {
    notFound();
  }

  return (
    <main>
      <section className="flex flex-col gap-10 mx-auto pt-4 xl:pt-10 pb-16 md:pb-25 px-5 md:px-0 w-full max-w-2xl">
        <div className="flex flex-col gap-6">
          <BreadCrumb
            items={[
              { label: BLOG_NAVBAR_TEXT, href: routes.blog },
              { label: blog.data.title },
            ]}
          />

          <AnimatedHeadingText
            variant="sub-page-title"
            text={blog.data.title}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
            <ProfileDetails
              reviewerImageUrl={blog.data.author.avatarUrl}
              reviewerName={blog.data.author.name}
              reviewerTitle={blog.data.author.occupation}
            />
            <div className="text-sm ms-16 md:ms-0 text-neutral-10">
              <span>{formatBlogDate(blog.data.updatedAt)}</span>
              {" • "}
              <span>{blog.data.duration} min read</span>
            </div>
          </div>

          <div className="aspect-video w-full relative">
            <Image
              priority
              src={blog.data.blogImageUrl}
              alt={blog.data.title}
              fill
              className="object-cover rounded-sm"
            />
          </div>
        </div>
        <div>{convertStringToBlog(blog.data.content)}</div>
      </section>
    </main>
  );
}
