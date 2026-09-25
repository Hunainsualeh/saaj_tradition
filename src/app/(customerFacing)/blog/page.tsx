import {
  AnimatedHeadingText,
  AnimateFadeIn,
  BaseSection,
  BlogTile,
} from "@/components";
import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { routes, screamingSnakeToTitle } from "@/lib";
import { getBlogs } from "@/lib/server/queries";

export async function generateMetadata(): Promise<Metadata> {
  const blogs = await getBlogs();
  const hasPosts = blogs.success && blogs.data.length > 0;
  return pageMetadata({
    title: "Fashion Blog: Bahawalpuri Style Guides & Trends",
    description:
      "Style guides, fabric tips and trend notes on traditional Bahawalpuri suits, lawn and Eid dresses from the Saaj Tradition boutique in Ahmedpur East.",
    path: "/blog",
    noindex: !hasPosts,
  });
}

export default async function BlogPage() {
  // === QUERIES ===
  const blogs = await getBlogs();

  return (
    <main>
      <BaseSection id="blog-page" className="pb-16 flex flex-col gap-8">
        <div className="pt-6 md:pt-10 pb-6">
          <AnimatedHeadingText
            disableIsInView
            className="pb-1"
            variant="page-title"
            text="Our News"
          />
          <p className="text-neutral-10 text-base">
            Stories, updates and inspirations from our shop to you.
          </p>
        </div>
        {(!blogs.success || blogs.data.length === 0) && (
          <div className="flex flex-col items-start gap-4">
            <p className="text-neutral-10 text-base">
              New style guides are on the way. In the meantime, explore our
              traditional Bahawalpuri suits or the latest arrivals.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href={routes.bahawalpuriSuits} className="rounded-full border border-neutral-05 px-4 py-2 hover:border-neutral-11">
                Traditional Bahawalpuri suits
              </Link>
              <Link href={routes.shopNewArrivals} className="rounded-full border border-neutral-05 px-4 py-2 hover:border-neutral-11">
                New arrivals
              </Link>
            </div>
          </div>
        )}
        {blogs.success && blogs.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...blogs.data]
              .sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime(),
              )
              .map((blog, index) => {
                const tile = (
                  <BlogTile
                    isBlogPage={true}
                    href={routes.blog + "/" + blog.slug}
                    title={blog.title}
                    description={blog.description}
                    imageUrl={blog.blogImageUrl}
                    alt={blog.title}
                    category={screamingSnakeToTitle(blog.category)}
                    priority={index < 3}
                  />
                );
                return index < 3 ? (
                  <div key={blog.id}>{tile}</div>
                ) : (
                  <AnimateFadeIn key={blog.id}>{tile}</AnimateFadeIn>
                );
              })}
          </div>
        )}
      </BaseSection>
    </main>
  );
}
