import Link from "next/link";
import type { Metadata } from "next";

import {
  AnimatedHeadingText,
  BaseSection,
  BreadCrumb,
  ExploreLinks,
  FaqSection,
} from "@/components";
import { ProductShowcase } from "@/components/common/ProductShowcase/ProductShowcase";
import { JsonLd } from "@/components/seo/JsonLd";
import { routes } from "@/lib";
import { getAllCategories, getCollections } from "@/lib/server/queries";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Traditional Bahawalpuri Suits Online | Chunri, Gota & Mukesh",
  absoluteTitle: true,
  description:
    "Shop traditional Bahawalpuri suits for women: chunri, gota and mukesh work in lawn, cotton and chiffon. From our Ahmedpur East boutique with cash on delivery.",
  path: routes.bahawalpuriSuits,
});

const faqs = [
  {
    question: "What is a traditional Bahawalpuri suit?",
    answer:
      "A Bahawalpuri suit is a women's shalwar kameez styled in the tradition of the Bahawalpur region of South Punjab. It is known for a wide, full shalwar, bright colours and handwork such as chunri tie and dye, gota ribbon work and mukesh metal thread embellishment on the kameez and dupatta.",
  },
  {
    question: "Where can I buy Bahawalpuri suits in Ahmedpur East?",
    answer:
      "Visit Saaj Tradition on KLP Road near Hotel Pearl Resort, Ahmedpur East. The boutique is open Monday to Saturday from 10 AM to 8 PM, and you can also order online from this website.",
  },
  {
    question: "Do you deliver Bahawalpuri suits to Bahawalpur and other cities?",
    answer:
      "Yes. We deliver across Pakistan, including Bahawalpur city, with cash on delivery in eligible areas. Orders are processed in 1 to 2 business days and usually arrive within 3 to 7 business days after dispatch.",
  },
  {
    question: "Which Bahawalpuri style is best for mehndi or mayun?",
    answer:
      "Chunri and gota work in yellow, green, orange and pink are popular choices for mehndi and mayun because the colours are bright and the gota catches the light. For a lighter look, choose a lawn or cotton suit with a chunri dupatta.",
  },
  {
    question: "How should I wash a suit with gota or mukesh work?",
    answer:
      "Dry clean is safest. If you hand wash, use cold water and mild detergent, do not wring or scrub the embellished areas, dry in the shade and iron on the reverse side with a cloth over the work.",
  },
];

export default async function BahawalpuriSuitsPage() {
  const [categoriesRes, collectionsRes] = await Promise.all([
    getAllCategories(),
    getCollections(),
  ]);
  const categories = categoriesRes.success ? categoriesRes.data : [];
  const collections = collectionsRes.success ? collectionsRes.data : [];

  const crumbs = [
    { name: "Shop", path: routes.shop },
    { name: "Traditional Bahawalpuri Suits" },
  ];

  return (
    <main>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <BaseSection id="bahawalpuri-suits-intro" className="pt-6 md:pt-10 pb-10 xl:pb-14">
        <div className="flex flex-col gap-4 max-w-4xl">
          <BreadCrumb
            items={crumbs.map((crumb) => ({ label: crumb.name, href: crumb.path }))}
          />
          <AnimatedHeadingText
            disableIsInView
            text="Traditional Bahawalpuri Suits"
            variant="page-title"
            className="pb-1"
          />
          <p className="text-base md:text-lg text-neutral-10">
            Bahawalpuri suits carry the colour and handwork of Bahawalpur and
            the Cholistan desert: a full, flowing shalwar, bright chunri tie and
            dye, shimmering gota and fine mukesh work. At Saaj Tradition in
            Ahmedpur East we bring these styles to everyday lawn and cotton
            suits as well as festive and wedding wear for women.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={routes.shop}
              className="rounded-full bg-neutral-11 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-12"
            >
              Shop the collection
            </Link>
            <Link
              href={routes.location}
              className="rounded-full border border-neutral-05 px-6 py-3 text-sm font-medium text-neutral-11 hover:border-neutral-11"
            >
              Visit the Ahmedpur East boutique
            </Link>
          </div>
        </div>
      </BaseSection>

      <BaseSection id="bahawalpuri-suits-products" className="pb-16 xl:pb-20">
        <ProductShowcase
          heading="Shop Bahawalpuri and Pakistani suits"
          intro="Our latest ladies suits, ready to order online with cash on delivery."
        />
      </BaseSection>

      <BaseSection id="bahawalpuri-suits-guide" className="py-16 xl:py-20 border-t border-neutral-03">
        <article className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-10 xl:gap-16">
          <h2 className="text-3xl md:text-4xl font-medium">
            What makes a suit Bahawalpuri
          </h2>
          <div className="flex flex-col gap-8 text-base text-neutral-10">
            <section className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">Chunri tie and dye</h3>
              <p>
                Chunri (also written chunari) is a hand tie and dye technique.
                Artisans tie hundreds of tiny knots in the fabric before dyeing,
                so each knot leaves a small undyed dot. Multi colour pieces go
                through several dye baths. Chunri is closely linked with the
                Cholistan and Bahawalpur region and is a favourite for dupattas
                and mehndi outfits.
              </p>
            </section>
            <section className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">Gota and gota kinari</h3>
              <p>
                Gota is metallic ribbon that is cut, folded and stitched onto the
                fabric to make borders (kinari) and motifs. Bahawalpur is one of
                the busiest markets for gota work dresses in Pakistan, and gota
                is the classic choice for mehndi, mayun and Eid.
              </p>
            </section>
            <section className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">Mukesh and kamdani</h3>
              <p>
                Mukesh (mukaish) work uses thin strips of metal wire that are
                pushed through the fabric and twisted into small shining dots.
                South Punjab is well known for mukesh and kamdani suits and
                dupattas, which look elegant for formal evenings and weddings.
              </p>
            </section>
            <section className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">The Bahawalpuri shalwar</h3>
              <p>
                The traditional Bahawalpuri shalwar is wide and full with deep
                folds, which makes it comfortable in the South Punjab heat. It
                pairs with a kameez that often carries local prints or
                embroidery and a matching or contrast dupatta.
              </p>
            </section>
          </div>
        </article>
      </BaseSection>

      <BaseSection id="bahawalpuri-suits-occasions" className="py-16 xl:py-20 border-t border-neutral-03">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-10 xl:gap-16">
          <h2 className="text-3xl md:text-4xl font-medium">
            Choosing a Bahawalpuri suit for the occasion
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base text-neutral-10">
            <section className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">Everyday and summer</h3>
              <p>
                Printed lawn and cotton suits with a light chunri dupatta stay
                cool and easy to wash for daily wear and summer.
              </p>
            </section>
            <section className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">Mehndi and mayun</h3>
              <p>
                Yellow, green and orange suits with gota borders and chunri are
                the traditional pick for mehndi and mayun functions.
              </p>
            </section>
            <section className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">Eid and festive</h3>
              <p>
                Embroidered three piece suits in chiffon or lawn with gota or
                mukesh details feel festive without being too heavy.
              </p>
            </section>
            <section className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-neutral-12">Weddings and formal</h3>
              <p>
                Chiffon and organza suits with heavier mukesh, kamdani or gota
                work suit wedding guests, walima and formal dinners.
              </p>
            </section>
          </div>
        </div>
      </BaseSection>

      <BaseSection id="bahawalpuri-suits-links" className="py-16 xl:py-20 border-t border-neutral-03">
        <ExploreLinks
          heading="Shop by category and collection"
          intro="Find Bahawalpuri and Pakistani ladies suits by fabric, style and season."
          links={[
            ...categories.map((category) => ({
              label: category.name,
              href: `${routes.shopCategories}/${category.slug}`,
              description: category.tagline || undefined,
            })),
            ...collections.map((collection) => ({
              label: collection.name,
              href: `${routes.shopCollections}/${collection.slug}`,
              description: collection.tagline || undefined,
            })),
            {
              label: "Delivery in Bahawalpur",
              href: routes.bahawalpurBoutique,
              description: "Cash on delivery to Bahawalpur city and South Punjab",
            },
          ]}
        />
      </BaseSection>

      <BaseSection id="bahawalpuri-suits-faq" className="py-16 xl:py-20 border-t border-neutral-03">
        <div className="max-w-4xl">
          <FaqSection heading="Bahawalpuri suits: common questions" items={faqs} />
        </div>
      </BaseSection>
    </main>
  );
}
