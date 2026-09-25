import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { AnimatedHeadingText, BreadCrumb, ProfileDetails } from "@/components";
import { BLOG_NAVBAR_TEXT } from "@/components/layout/Navbar/lib";
import { routes } from "@/lib";
import { getBlogBySlug } from "@/lib/server/queries";
import { formatBlogDate } from "@/lib/utils";
import { convertStringToBlog } from "@/lib/parsers";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { STORE_ID, absoluteUrl, breadcrumbJsonLd, clampDescription, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type BlogIdPageProps = {
  params: Promise<{ id: string }>;
};

async function getVisibleBlog(slug: string) {
  const blog = await getBlogBySlug(slug);
  if (!blog.success || !blog.data) {
    notFound();
  }
  return blog.data;
}

export async function generateMetadata(
  props: BlogIdPageProps,
): Promise<Metadata> {
  const { id } = await props.params;
  const blog = await getVisibleBlog(id);
  const published = (blog.publishedAt ?? blog.createdAt).toISOString();

  return pageMetadata({
    title: blog.title,
    description: clampDescription(blog.description),
    path: `${routes.blog}/${blog.slug}`,
    type: "article",
    publishedTime: published,
    modifiedTime: blog.updatedAt.toISOString(),
    images: blog.blogImageUrl ? [{ url: blog.blogImageUrl, alt: blog.title }] : undefined,
  });
}

export default async function BlogIdPage({ params }: BlogIdPageProps) {
  const { id } = await params;
  const post = await getVisibleBlog(id);
  const blog = { data: post };
  const postUrl = absoluteUrl(`${routes.blog}/${post.slug}`);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    headline: post.title,
    description: post.description,
    image: post.blogImageUrl ? [absoluteUrl(post.blogImageUrl)] : undefined,
    datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author.name, jobTitle: post.author.occupation },
    publisher: { "@id": STORE_ID },
    mainEntityOfPage: postUrl,
    inLanguage: "en-PK",
  };

  return (
    <main>
      <JsonLd
        data={[
          articleJsonLd,
          breadcrumbJsonLd([
            { name: BLOG_NAVBAR_TEXT, path: routes.blog },
            { name: post.title },
          ]),
        ]}
      />
      <article className="flex flex-col gap-10 mx-auto pt-4 xl:pt-10 pb-16 md:pb-25 px-5 md:px-0 w-full max-w-2xl">
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
              <time dateTime={(post.publishedAt ?? post.createdAt).toISOString()}>
                {formatBlogDate(post.publishedAt ?? post.createdAt)}
              </time>
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
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover rounded-sm"
            />
          </div>
        </div>
        <div>{convertStringToBlog(blog.data.content)}</div>
        <nav aria-label="Keep exploring" className="flex flex-wrap gap-3 border-t border-neutral-03 pt-8 text-sm">
          <Link href={routes.blog} className="rounded-full border border-neutral-05 px-4 py-2 hover:border-neutral-11">
            More from the blog
          </Link>
          <Link href={routes.bahawalpuriSuits} className="rounded-full border border-neutral-05 px-4 py-2 hover:border-neutral-11">
            Traditional Bahawalpuri suits
          </Link>
          <Link href={routes.shop} className="rounded-full border border-neutral-05 px-4 py-2 hover:border-neutral-11">
            Shop all suits
          </Link>
        </nav>
      </article>
    </main>
  );
}
