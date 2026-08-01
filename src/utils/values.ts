export const SITE_NAME = "Sahithyan's Notes";
export const SITE_DOMAIN = "notes.sahithyan.dev";
export const SITE_HOST_URL = `https://${SITE_DOMAIN}`;
export const SITE_DESCRIPTION =
  "Sahithyan's engineering notes and study materials";

export const CGPA = 3.82;

// Slug prefixes whose notes are still being written.
// "s5" = whole semester; "s5/thermodynamics" = single module.
export const WIP_PREFIXES: string[] = ["s5"];

export const isWip = (slug: string): boolean =>
  WIP_PREFIXES.some((p) => slug === p || slug.startsWith(p + "/"));

// Slug prefixes for elective (non-core) modules.
export const ELECTIVE_PREFIXES: string[] = ["s5/image-processing"];

export const isElective = (slug: string): boolean =>
  ELECTIVE_PREFIXES.some((p) => slug === p || slug.startsWith(p + "/"));
