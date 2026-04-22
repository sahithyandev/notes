import { getCollection } from "astro:content";
import { OGImageRoute } from "astro-og-canvas";

const SITE_TITLE = "Sahithyan's Notes";

const entries = await getCollection("notes");

const pages: Record<
  string,
  {
    data: (typeof entries)[number]["data"];
  }
> = {};

for (const entry of entries) {
  const { data, id } = entry;
  const _id = id.replace(".md", "").replace(/\d+-/, "");
  if (typeof _id !== "string" || _id.endsWith("summary")) {
    continue;
  }
  pages[_id] = { data };
}

export const {getStaticPaths, GET} = await OGImageRoute({
  pages,
  param: "slug",
  getImageOptions: (_path, page: (typeof pages)[number]) => {
    return {
      title: page.data.title,
      description: "On ".concat(SITE_TITLE),
      bgGradient: [[250, 254, 247]],
      // logo: {
      //   path: "./public/logo.png",
      //   size: [170],
      // },
      // fonts: ["./public/fonts/DMSans_36pt-Regular.ttf"],
      font: {
        title: {
          color: [0, 0, 0],
          weight: "Bold",
          size: 90,
          lineHeight: 1.2,
        },
        description: {
          color: [0, 0, 0],
          size: 32,
        },
      },
      padding: 60,
    };
  },
});
