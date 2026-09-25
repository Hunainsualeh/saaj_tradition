import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqJsonLd } from "@/lib/seo";

export type FaqItem = { question: string; answer: string };

type FaqSectionProps = {
  heading?: string;
  items: FaqItem[];
  withSchema?: boolean;
};

export function FaqSection({
  heading = "Frequently asked questions",
  items,
  withSchema = true,
}: FaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {withSchema && <JsonLd data={faqJsonLd(items)} />}
      <h2 className="text-2xl md:text-3xl font-medium">{heading}</h2>
      <Accordion collapsible type="single">
        {items.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent forceMount className="data-[state=closed]:hidden">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
