export const SITE_NAME = "Sahithyan's Notes";
export const SITE_DOMAIN = "notes.sahithyan.dev";
export const SITE_HOST_URL = `https://${SITE_DOMAIN}`;
export const SITE_DESCRIPTION =
  "Sahithyan's engineering notes and study materials";

export const CGPA = 3.82;

// Slug prefixes for elective (non-core) modules.
export const ELECTIVE_PREFIXES: string[] = [
  "s5/image-processing",
  "s5/advanced-networking",
  "s5/advanced-software-engineering",
];

export const isElective = (slug: string): boolean =>
  ELECTIVE_PREFIXES.some((p) => slug === p || slug.startsWith(p + "/"));
