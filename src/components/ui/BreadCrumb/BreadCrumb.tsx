import Link from "next/link";

type BreadCrumbProps = {
  items: { label: string; href?: string }[];
};

export function BreadCrumb(props: BreadCrumbProps) {
  const { items } = props;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li className="flex text-neutral-10 text-sm" key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <Link className="p-1 hover:text-neutral-12" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span className="p-1 text-neutral-11" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="mx-1 self-center">
                  {"/"}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
