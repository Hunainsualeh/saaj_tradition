import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib";

type ContactCardProps = {
  className?: string;
  href?: string;
  title: string;
  description: string;
  icon: ReactNode;
};

type ContentProps = {
  className?: string;
  title: string;
  description: string;
  icon: ReactNode;
};

function ContactCardContent({
  className,
  title,
  description,
  icon,
}: ContentProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 p-8 border rounded-sm border-neutral-04 h-full",
        className,
      )}
    >
      <div className="flex gap-4 items-center">
        <span className="text-neutral-08">{icon}</span>
        <h3 className="text-xl xl:text-2xl font-medium">{title}</h3>
      </div>
      <p className="text-base text-neutral-10">{description}</p>
    </div>
  );
}

export function ContactCard(props: ContactCardProps) {
  const { className = "", href, title, description, icon } = props;

  const content = (
    <ContactCardContent
      className={className}
      title={title}
      description={description}
      icon={icon}
    />
  );

  if (href) {
    return (
      <Link className={className} href={href}>
        {content}
      </Link>
    );
  }

  return content;
}
