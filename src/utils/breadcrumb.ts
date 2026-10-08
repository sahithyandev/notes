import { titleize } from "./index";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function generateBreadcrumb(
  slug: string,
  pageTitle?: string,
): BreadcrumbItem[] {
  const parts = slug.split("/");
  const breadcrumb: BreadcrumbItem[] = [];

  parts.forEach((part, index) => {
    let label = part;
    let href: string | undefined;

    // Handle semester
    if (index === 0 && part.startsWith("s")) {
      const semesterNum = part.substring(1);
      label = `Semester ${semesterNum}`;
      href = `/${part}`;
    }
    // Handle module names (convert kebab-case to title case)
    else if (index === 1) {
      label = titleize(part);
      href = `/${parts.slice(0, index + 1).join("/")}`;
    }
    // Handle subdirectories
    else if (index > 1 && index < parts.length - 1) {
      label = titleize(part);
      href = `/${parts.slice(0, index + 1).join("/")}`;
    }
    // Handle the final note (current page)
    else if (index === parts.length - 1) {
      label = pageTitle ?? titleize(part);
      if (label.startsWith("Introduction to ")) {
        label = "Introduction";
      }
      // No href for current page
    }

    breadcrumb.push({ label, href });
  });

  return breadcrumb;
}
