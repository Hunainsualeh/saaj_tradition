# Saaj Tradition: Audit Report and Local SEO Strategy

Prepared 25 September 2026 for saajtradition.com

---

## Part 1. What was fixed in the codebase

All of the changes below are live on `master` (commit `520290f`).

### SEO

| Issue found | Root cause | Fix |
|---|---|---|
| Every page had two H1 tags | The footer watermark "Saaj Tradition" was an `<h1>` | Changed to a decorative `<p>` |
| Product, location, about, blog and support pages had no H1 | The animated heading component always rendered an `<h2>` plus a hidden duplicate `<h3>` | Rebuilt the component so it renders one real heading at the right level |
| Most pages shared the homepage meta description | Pages only set a title | Every indexable page now has its own title, description, canonical URL, Open Graph and X card |
| No canonical tags outside product pages | Canonicals were set only on products | Canonicals on every indexable page. Filtered and search results point to the clean URL and are noindex |
| Admin, cart, checkout and tracking pages could be indexed | No robots meta on those routes | noindex meta plus an `X-Robots-Tag` header |
| Vercel preview deployments could be indexed as duplicates | A static robots.txt applied everywhere | New `robots.ts` blocks all crawling on preview deployments and adds the header |
| Blog posts were never in the sitemap | The admin never set `publishedAt` and the sitemap filtered on it | New posts get a publish date and the sitemap includes every public post |
| Sitemap listed empty or test categories and showed fake "updated now" dates | Every category was included and the date was always the current time | Only categories and collections with active products are listed. Real dates are used and product images are included |
| Hidden (inactive) products were publicly reachable | The product lookup ignored `isActive` | Inactive products now return a real 404 |
| Breadcrumbs linked the current page to `#` | Hard-coded fallback link | The current page is plain text with `aria-current` |
| FAQ answers were not in the HTML | The accordion unmounted closed answers | Answers are always rendered (hidden until opened), so Google can read them |
| www and old URL variants had no redirects | No redirects configured | 301 redirects for www to the apex domain, plus /contact, /faq, /about-us, /products, /bahawalpur, /ahmedpur-east and others |

**Structured data added**
- ClothingStore (LocalBusiness) with address, map coordinates, opening hours, areas served, price range and clean social links.
- Product with brand, category, price in PKR, availability, shipping details and a 7-day return policy.
- BreadcrumbList on shop, product, blog and landing pages.
- BlogPosting on blog posts.
- FAQPage only on pages that actually show an FAQ.

**New and rebuilt pages**
- `/bahawalpuri-suits`: pillar page on chunri, gota, mukesh and the Bahawalpuri shalwar, with products and an FAQ.
- `/boutique-in-bahawalpur`: an honest page for Bahawalpur shoppers. It says the store is in Ahmedpur East, about 53 km away, and explains ordering with cash on delivery. No fake Bahawalpur address.
- `/location`: rebuilt as the Ahmedpur East boutique page, with directions, nearby towns and an FAQ.

**Internal linking**
- The footer now shows the full address, phone and hours, plus links to the new pages, categories and Help.
- The homepage has an "Explore" block linking to the landing pages and the top categories.
- Product pages show related products from the same category, with a "View all" link to that category.
- Blog posts end with links to the blog, the Bahawalpuri suits page and the shop.

### Performance

| Issue found | Root cause | Fix |
|---|---|---|
| Content on every storefront page appeared late (about 300 ms on a fast machine, and much longer under Lighthouse mobile throttling) | A storefront-wide `loading.tsx` wrapped every page in a Suspense boundary, so even cached HTML arrived as a skeleton and waited for a script to reveal it | Removed it. Only the shop listing keeps a loading skeleton |
| Brand images were sent at full size (up to 2400 px) to phones | The custom image loader turned off Next.js resizing for local files | Added a script (`npm run optimize-assets`) that makes WebP versions at 640, 1080 and 1920 px. The loader picks the right size. The 1080 px set totals 982 KB against 3.1 MB of originals |
| Animation library code loaded on every page | Headings, the footer newsletter form and the hero button used framer-motion | Replaced with CSS animations that look the same and respect reduced-motion settings |
| Product and blog pages were rendered fresh on every visit | No `generateStaticParams` | These pages are now cached (ISR) and refreshed when content changes |
| Too many images marked as high priority | Footer logo and below-the-fold images had `priority` | Priority is kept only for above-the-fold images |

### Accessibility
- Logical heading order on every page (verified by an automated crawl: zero skipped levels).
- The mobile menu and cart drawer are removed from keyboard focus when closed, close with Escape and have dialog labels.
- The menu buttons announce whether they are open.
- The newsletter email field has a label, and error messages are announced.
- Colour contrast fixed in the footer and location cards.
- Decorative images use empty alt text. Meaningful images have descriptive alt text.

### Admin panel (17 fixes)
- **Security**
  - Fixed an open redirect after login: `?redirect=` could send you to another site.
  - Fixed stored XSS in the printed invoice: customer text was inserted as raw HTML.
  - Added an admin check to an order-email action that anyone could call.
- **Delete flows**
  - Delete dialogs no longer stay stuck after the first delete.
  - Edit-page deletes now ask for confirmation.
- **Forms and saving**
  - Saving now returns to the list page instead of going "back" (which could land on the login page).
  - Real error messages are shown.
  - Double submits are blocked on email templates and broadcasts.
- **Other fixes**
  - The blog form showed the wrong field's error.
  - Password length hints now match the server (10 characters).
  - Blog edits no longer reset the creation date.
  - The sidebar loading bar no longer spins forever.
  - Layouts are fixed on mobile.

### Content corrections
- The default announcement bar said "Free Worldwide Shipping". It now reads "Cash on Delivery across Pakistan", because you only ship within Pakistan.
- The default FAQ said orders are tracked by email and that support is open Monday to Friday 9 to 6. It now points to the Track Order page and your real hours.
- Checkout placeholders were British (London, SW1A 1AA, United Kingdom). They are now Pakistani examples.

### Verification
- Type check and lint are clean. The production build passes.
- A crawl of 50 public pages found:
  - 0 broken internal links
  - exactly 1 H1 on every page
  - a canonical tag on every page
  - no images without alt text
- Robots, sitemap and the verification file are confirmed live on saajtradition.com.

---

## Part 2. Manual steps that cannot be done in code

These are not done. You need to do them yourself.

1. **Google Search Console**
   - Verified: done.
   - Sitemap submitted: done.
   - Use URL Inspection and click Request Indexing for the homepage, `/location`, `/bahawalpuri-suits`, `/boutique-in-bahawalpur` and `/shop`.
2. **Google Business Profile.** This is the single biggest local ranking factor.
   - Create or claim the profile at business.google.com.
   - Category: "Women's clothing store". Add "Boutique" as a secondary category.
   - Use exactly this address: 1/2 km KLP Road, near Hotel Pearl Resort, Ahmedpur East, Punjab 63350.
   - Put the map pin where the store really is. The site uses coordinates 29.1371, 71.2726 (from your map code 47PF+R29). Correct `STORE_GEO` in `src/lib/constants/store-information.ts` if the pin differs.
   - Hours: Monday to Saturday, 10:00 to 20:00.
   - Website: https://saajtradition.com/location
   - Add 20 or more real photos of the shop front, the interior and products.
   - Post weekly updates such as new arrivals and Eid offers.
3. **Reviews.** After every order, ask customers for a Google review (by WhatsApp or on a card in the parcel). It helps if they mention what they bought and the town, for example "chunri suit, Ahmedpur East". Reply to every review. Never buy reviews.
4. **Bing Webmaster Tools.** Import the site from Search Console. You can put a Bing code in the `NEXT_PUBLIC_BING_SITE_VERIFICATION` environment variable; the site already supports it.
5. **Citations.** Use the exact same name, address and phone everywhere (see Part 7).
6. **Vercel settings**
   - Add `www.saajtradition.com` as a domain that redirects to `saajtradition.com`.
   - Keep `NEXT_PUBLIC_SITE_URL=https://saajtradition.com` in Production.
7. **Admin clean-up**
   - Delete the "test" category.
   - Make sure "eid-collection" exists as either a category or a collection, not both. Having both creates duplicate pages.
   - Update the Support FAQ in Site Content. Your saved database text still says tracking is by email.
8. **Photos.** The fallback images on the About, Support and hero sections are generic stock photos of Western fashion. Replace them in Site Content with real photos of your suits and your shop. This matters for trust and for Google Images.
9. **Security**
   - `prisma/seed-admin.ts` contains a default admin password.
   - If production was ever seeded with it, change the admin password now.

---

## Part 3. Search landscape and competitors

We did not have access to Google Keyword Planner, Ahrefs or Semrush. Volumes below are **relative estimates** (Very Low to High). They are judged from Google autocomplete in Pakistan, how many results rank, and whether big brands appear. Once Search Console has data (after 4 to 8 weeks), replace these estimates with your real impressions.

| Query group | Demand | Competition | Who ranks today |
|---|---|---|---|
| Ahmedpur East boutique and dress shop | Very Low | Very Low | Almost nobody. Two Facebook pages for "MY Boutique Ahmedpur East". Google often confuses the search with Ahmedabad in India |
| Bahawalpur boutique and ladies boutique | Low to Medium | Low to Medium | bahawalpurboutique.com (a dress-rental site), Facebook and Instagram shops, an old directory at bahawalpur.ebizpk.com |
| Bahawalpuri chunri, gota and mukesh suits | Medium | Medium | Daraz tag pages, Saleem Fabrics "Bahawalpur Pehnawa", chunricollection.com, sindhcrafts.com. chunri.com.pk still ranks but its domain no longer works |
| Pakistani designer suits and online boutique Pakistan | High | Very High | Daraz, Khaadi, Gul Ahmed, Nishat, Edenrobe, Sanaulla. Not a realistic target yet |

**Gaps you can win**
1. **Ahmedpur East is uncontested.** A strong location page plus a Google Business Profile can rank quickly.
2. **Competitor category pages for chunri and gota are thin**, with little or no text. Pages with 150 to 300 words of accurate copy, prices and an FAQ can outrank them.
3. **People add "with price", "online shopping" and "cash on delivery"** to their searches. Show prices and COD clearly in titles and copy.
4. **Accuracy is a differentiator.**
   - Tilla work is Kashmiri.
   - Gota originated in Rajasthan, but Bahawalpur is a major market for it today.

   Getting these right builds trust.

---

## Part 4. Keyword map (one main target per page)

| Page | Primary keyword | Secondary keywords |
|---|---|---|
| Homepage `/` | saaj tradition / bahawalpuri suits | ladies boutique Ahmedpur East, traditional Bahawalpuri dresses |
| `/location` | boutique in Ahmedpur East | ladies boutique Ahmedpur East, dress shop Ahmedpur East, Ahmadpur Sharqia boutique |
| `/boutique-in-bahawalpur` | ladies boutique Bahawalpur | best boutique in Bahawalpur, women clothing Bahawalpur, online shopping Bahawalpur COD |
| `/bahawalpuri-suits` | traditional Bahawalpuri suits | Bahawalpuri dress, Bahawalpuri chunri suit, gota and mukesh suits |
| `/shop` | ladies suits online Pakistan | women's suits online, Pakistani suits cash on delivery |
| Category: Lawn | lawn suits online Pakistan | printed lawn suits, summer lawn with price |
| Category: Chunri (create it) | chunri suits online | Bahawalpuri chunri dupatta, chunri dress price in Pakistan |
| Category: Gota work (create it) | gota work dresses | gota dress for mehndi, Bahawalpur gota work dress with price |
| Category: Mukesh (create it) | mukesh work suits | mukaish suits price in Pakistan, kamdani suits |
| Category: Party wear (create it) | party wear dresses Pakistan | formal suits for women, embroidered party wear |
| Collection: Eid | Eid dresses for women | Eid collection with price, festive suits |
| Collection: Wedding (create it) | wedding guest dresses Pakistan | walima dresses, formal chiffon suits |
| Product pages | the product name plus its craft and fabric | "3 piece", "stitched" or "unstitched", occasion |
| Blog | how-to and informational queries | see the content plan |

**Product naming tip.** "Royal Grace Suit" tells Google nothing. "Royal Grace Chiffon Gota Suit, 3 Piece" matches real searches. Keep the brand-style name at the front and add the craft, fabric and piece count.

---

## Part 5. Target keyword list (56 keywords)

Priority: **P1** = start now, **P2** = next 3 months, **P3** = later or long-term.

| # | Keyword | Intent | Location | Est. demand | Priority | Target page | Content opportunity |
|---|---|---|---|---|---|---|---|
| 1 | saaj tradition | Brand | Any | Low | P1 | Home | Brand entity and Google Business Profile |
| 2 | saaj tradition ahmedpur east | Brand + local | Ahmedpur East | Very Low | P1 | /location | NAP and map |
| 3 | boutique in ahmedpur east | Commercial local | Ahmedpur East | Very Low | P1 | /location | Uncontested |
| 4 | ladies boutique ahmedpur east | Commercial local | Ahmedpur East | Very Low | P1 | /location | Uncontested |
| 5 | best boutique in ahmedpur east | Commercial local | Ahmedpur East | Very Low | P1 | /location | Reviews drive "best" |
| 6 | dress shop ahmedpur east | Commercial local | Ahmedpur East | Very Low | P1 | /location | Google Business Profile category |
| 7 | women clothing store ahmedpur east | Commercial local | Ahmedpur East | Very Low | P1 | /location | GBP primary category |
| 8 | ahmadpur sharqia boutique | Commercial local | Ahmedpur East | Very Low | P2 | /location | Spelling variant is on the page |
| 9 | bahawalpuri suits in ahmedpur east | Commercial local | Ahmedpur East | Very Low | P1 | /bahawalpuri-suits | Internal link from /location |
| 10 | designer suits ahmedpur east | Commercial local | Ahmedpur East | Very Low | P2 | /location | Add "designer" wording to GBP |
| 11 | traditional dress shop ahmedpur east | Commercial local | Ahmedpur East | Very Low | P2 | /location | Copy already covers it |
| 12 | boutique near uch sharif | Commercial local | Uch Sharif | Very Low | P3 | /location | Nearby-towns section |
| 13 | best boutique in bahawalpur | Commercial local | Bahawalpur | Low to Medium | P1 | /boutique-in-bahawalpur | Honest delivery page |
| 14 | ladies boutique bahawalpur | Commercial local | Bahawalpur | Low | P1 | /boutique-in-bahawalpur | |
| 15 | boutique in bahawalpur | Commercial local | Bahawalpur | Low to Medium | P1 | /boutique-in-bahawalpur | |
| 16 | women clothing brands in bahawalpur | Commercial local | Bahawalpur | Low | P2 | /boutique-in-bahawalpur | Seen in autocomplete |
| 17 | clothing stores in bahawalpur | Commercial local | Bahawalpur | Low | P2 | /boutique-in-bahawalpur | |
| 18 | online shopping bahawalpur | Transactional | Bahawalpur | Low | P1 | /boutique-in-bahawalpur | COD angle |
| 19 | online clothing store bahawalpur | Transactional | Bahawalpur | Low | P2 | /boutique-in-bahawalpur | |
| 20 | designer suits in bahawalpur | Commercial local | Bahawalpur | Low | P2 | /boutique-in-bahawalpur | |
| 21 | pakistani suits online bahawalpur | Transactional | Bahawalpur | Low | P2 | /boutique-in-bahawalpur | |
| 22 | bahawalpur bridal dresses with price | Commercial | Bahawalpur | Low | P3 | Wedding collection | Needs bridal stock |
| 23 | traditional bahawalpuri suits | Commercial | South Punjab | Medium | P1 | /bahawalpuri-suits | Pillar page is live |
| 24 | bahawalpuri suits online | Transactional | Pakistan | Medium | P1 | /bahawalpuri-suits | |
| 25 | bahawalpuri dress | Commercial | Pakistan | Medium | P1 | /bahawalpuri-suits | |
| 26 | bahawalpuri dress collection with price | Transactional | Pakistan | Medium | P1 | /bahawalpuri-suits | Show prices |
| 27 | bahawalpuri chunri suit | Commercial | Pakistan | Medium | P1 | Chunri category | Create the category |
| 28 | bahawalpuri chunri dupatta | Commercial | Pakistan | Medium | P1 | Chunri category | |
| 29 | chunri dress price in pakistan | Transactional | Pakistan | Medium | P1 | Chunri category | Prices in copy |
| 30 | chunri suits online pakistan | Transactional | Pakistan | Medium | P2 | Chunri category | |
| 31 | bahawalpuri gota suit | Commercial | Pakistan | Medium | P1 | Gota category | Create the category |
| 32 | gota work dresses with price | Transactional | Pakistan | Medium | P1 | Gota category | |
| 33 | gota dress for mehndi | Commercial | Pakistan | Medium | P2 | Gota category + blog | Occasion guide |
| 34 | bahawalpur gota work dupatta | Commercial | Bahawalpur | Low | P2 | Gota category | |
| 35 | bahawalpuri chunri gota mukesh | Commercial | Pakistan | Low to Medium | P2 | /bahawalpuri-suits | Already covered |
| 36 | mukesh work suits | Commercial | Pakistan | Medium | P2 | Mukesh category | Create the category |
| 37 | bahawalpur mukesh dresses with price | Transactional | Bahawalpur | Low to Medium | P2 | Mukesh category | |
| 38 | kamdani suits price in pakistan | Transactional | Pakistan | Medium | P2 | Mukesh category | |
| 39 | lawn suits online pakistan | Transactional | Pakistan | High | P2 | Lawn category | Long-tail only |
| 40 | printed lawn suits with price | Transactional | Pakistan | High | P3 | Lawn category | |
| 41 | cotton suits for women | Commercial | Pakistan | Medium | P3 | Cotton category | |
| 42 | chiffon suits pakistan | Commercial | Pakistan | Medium | P3 | Chiffon category | |
| 43 | eid dresses for women | Seasonal commercial | Pakistan | High (seasonal) | P2 | Eid collection | Refresh 6 weeks before Eid |
| 44 | eid collection with price | Seasonal transactional | Pakistan | High (seasonal) | P2 | Eid collection | |
| 45 | party wear dresses pakistan | Commercial | Pakistan | High | P3 | Party wear category | |
| 46 | wedding guest dresses pakistan | Commercial | Pakistan | Medium | P3 | Wedding collection | |
| 47 | ready to wear suits women | Transactional | Pakistan | High | P3 | Shop | Filter or category |
| 48 | stitched suits online pakistan | Transactional | Pakistan | High | P3 | Shop | |
| 49 | unstitched suits online pakistan | Transactional | Pakistan | High | P3 | Shop | Only if you sell them |
| 50 | ladies suits cash on delivery | Transactional | Pakistan | Medium | P2 | /shop | COD in titles |
| 51 | what is chunri | Informational | Pakistan | Low to Medium | P2 | Blog | Guide post |
| 52 | gota vs mukesh vs kamdani | Informational | Pakistan | Low | P2 | Blog | Comparison post |
| 53 | how to wash gota work dress | Informational | Pakistan | Low | P3 | Blog | Care guide |
| 54 | mehndi dress colours | Informational | Pakistan | Medium | P2 | Blog | Links to the Gota category |
| 55 | bahawalpuri shalwar | Informational + commercial | Pakistan | Low to Medium | P3 | Blog + /bahawalpuri-suits | Heritage post |
| 56 | ahmedpur east shopping | Informational local | Ahmedpur East | Very Low | P3 | Blog | Local guide post |

---

## Part 6. Content plan

### Pages already built (keep improving them)

| Page | Title | H1 | H2 topics | Schema |
|---|---|---|---|---|
| `/location` | Ladies Boutique in Ahmedpur East \| Store Address & Hours | Our Boutique in Ahmedpur East | Finding the store / What you'll find in store / Shoppers from nearby towns / FAQ | ClothingStore (site-wide), BreadcrumbList, FAQPage |
| `/boutique-in-bahawalpur` | Ladies Boutique for Bahawalpur \| Suits Delivered with COD | Ladies Suits Delivered in Bahawalpur | How ordering works / Shop in person / FAQ | BreadcrumbList, FAQPage |
| `/bahawalpuri-suits` | Traditional Bahawalpuri Suits Online \| Chunri, Gota & Mukesh | Traditional Bahawalpuri Suits | What makes a suit Bahawalpuri / Choosing for the occasion / FAQ | BreadcrumbList, FAQPage |

**Please check the new pages.** Confirm every product and craft claim matches what you actually stock. Adjust any copy that doesn't.

### Categories to create in the admin

Each category page automatically gets:
- a title in the format "{Name} for Women | Buy Online in Pakistan"
- breadcrumbs
- a place in the sitemap once it has active products

Write a real tagline for each one, because it becomes the intro text and meta description. Use these slugs:

| Category name | Slug | Suggested tagline |
|---|---|---|
| Chunri Suits | `chunri-suits` | Hand tie and dye Bahawalpuri chunri suits and dupattas |
| Gota Work Suits | `gota-work-suits` | Gota kinari suits for mehndi, mayun and Eid |
| Mukesh Suits | `mukesh-suits` | Mukesh and kamdani work for formal evenings |
| Lawn Suits | `lawn` (already exists) | Printed and embroidered lawn for everyday and summer |
| Party Wear | `party-wear` | Embroidered chiffon and organza party wear |

Collections: **Eid Collection** (already exists), **Summer Collection** (already exists) and **Wedding Edit** (create it).

### Blog posts, one or two per month

Each post should be 800 to 1,500 words, with original photos, and should link to its matching category.

1. What Is Bahawalpuri Chunri? How It Is Made and How to Wear It → links to Chunri Suits
2. Gota vs Mukesh vs Kamdani: Which Handwork Suits Your Occasion → links to Gota and Mukesh
3. Mehndi and Mayun Outfit Colours: A South Punjab Guide → links to Gota Work
4. How to Wash and Store Gota and Mukesh Suits → links to the Bahawalpuri suits page
5. The Bahawalpuri Shalwar: History and Styling Tips → links to the Bahawalpuri suits page
6. Eid Outfit Guide (update every year) → links to the Eid collection
7. Shopping in Ahmedpur East: Heritage Sights and Where to Find Traditional Suits → links to /location

---

## Part 7. Local SEO plan

**NAP to use everywhere, word for word**

> Saaj Tradition
> 1/2 km KLP Road, near Hotel Pearl Resort, Ahmedpur East, Punjab 63350, Pakistan
> +92 310 6040861

**Citations**

| Priority | Source | Cost |
|---|---|---|
| 1 | Google Business Profile (business.google.com) | Free |
| 1 | Facebook Page: switch the profile to a Business Page with address and category | Free |
| 1 | Instagram: add the address and the website link to the bio | Free |
| 2 | Bing Places (bing.com/forbusiness), import from Google | Free |
| 2 | Yellow Pages Pakistan (yellowpagespk.com/add-free-business-listing) | Free |
| 2 | YellowPage.pk | Free standard listing |
| 2 | Brownbook (brownbook.net/add-business) | Free |
| 2 | OpenStreetMap: add the shop yourself | Free |
| 3 | Infoisinfo Pakistan, PakBD (has a Bahawalpur section) | Check |
| 3 | Daraz seller store: an extra sales channel and a brand mention | Commission |
| Avoid | tuugo.pk: the domain now serves spam | |
| Paid, optional | BusinessList.pk (US$10 one-time) | Paid |

**Local links and authority (real relationships only)**
- Ask Hotel Pearl Resort to mention you as a nearby shop.
- Local tailors, bridal makeup artists and wedding photographers in Ahmedpur East and Bahawalpur can cross-link or tag you.
- Sponsor or supply a college or community event in Ahmedpur East and ask for a link on their page.
- Pitch a "keeping Bahawalpuri craft alive" story to local news pages and Bahawalpur Facebook groups.
- Work with the artisans who make your chunri or gota, if they agree. A short feature on your blog makes a strong, genuine story.
- Collaborate with South Punjab fashion creators on Instagram and TikTok, and ask them to link to the product page.

**Review keywords.** Ask happy customers to mention the product type and their town in their review. Never write reviews yourself.

---

## Part 8. Roadmap

| Phase | Work | Status |
|---|---|---|
| 1. Technical SEO | Canonicals, robots, sitemap, noindex rules, redirects, schema, headings, speed and image fixes | **Done in code** |
| 2. Keyword and page optimization | Titles, descriptions and H1s mapped to keywords. New landing pages | **Done in code.** You still need to rename products and write category taglines |
| 3. Local SEO | Google Business Profile, citations, reviews, NAP consistency | **Manual.** Start this week |
| 4. Content creation | Create the Chunri, Gota and Mukesh categories. Publish one or two blog posts a month | **Manual** (admin plus writing) |
| 5. Internal linking | Footer, home explore block, related products, blog link footer | **Done in code.** Keep linking each new post to its category |
| 6. Digital PR and links | Local partners, artisan stories, creators | **Manual.** Ongoing |
| 7. Tracking | Search Console Performance report every month: check queries, pages and click-through rate. Rewrite titles on pages with many impressions but a low CTR | **Manual.** Monthly |

**What to expect**
- **Ahmedpur East searches:** 4 to 8 weeks after the Google Business Profile is verified.
- **Bahawalpuri chunri and gota searches:** about 3 to 6 months.
- **Broad national terms:** a year or more, and only with steady content and links.
