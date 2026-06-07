import { getCollection } from "astro:content";
import { titleize } from "../utils";

export interface SidebarNote {
  slug: string;
  title: string;
  label: string;
  order: number;
  moduleOrder: number;
}

export interface SidebarData {
  currentSemester: string;
  currentModule: string;
  grouped: Record<string, Record<string, SidebarNote[]>>;
  semesters: { number: number; label: string; firstSlug: string }[];
  currentModuleTree: {
    direct: SidebarNote[];
    topics: Record<string, SidebarNote[]>;
  };
  prevNote: SidebarNote | null;
  nextNote: SidebarNote | null;
}

export function getSemesterInfo(slugParts: string[]): { label: string } {
  const match = slugParts[0].match(/^s(\d)$/);
  if (match) {
    return { label: `Semester ${match[1]}` };
  }
  return { label: "Unknown" };
}

function moduleOrderFromFilePath(filePath: string | undefined): number {
  if (!filePath) return Infinity;
  const parts = filePath.split("/");
  const topicDir = parts[3];
  if (!topicDir) return Infinity;
  const m = topicDir.match(/^(\d+)-/);
  return m ? parseInt(m[1], 10) : Infinity;
}

export async function getSidebarData(
  currentSlug: string,
): Promise<SidebarData> {
  const allNotes = await getCollection("notes");
  const currentSlugParts = currentSlug.split("/");
  const currentSemester = currentSlugParts[0];
  const currentModule = currentSlugParts[1];

  const grouped: Record<string, Record<string, SidebarNote[]>> = {};
  const semesterMap: Record<
    number,
    Record<string, { slug: string; order: number }[]>
  > = {};

  allNotes.forEach((note) => {
    const parts = note.data.slug.split("/");
    const sem = parts[0];
    const mod = parts[1];
    const order = note.data.sidebar?.order ?? 999;

    if (!grouped[sem]) grouped[sem] = {};
    if (!grouped[sem][mod]) grouped[sem][mod] = [];
    grouped[sem][mod].push({
      slug: note.data.slug,
      title: note.data.title,
      label: note.data.sidebar?.label || note.data.title,
      order,
      moduleOrder: moduleOrderFromFilePath(note.filePath),
    });

    const match = sem.match(/^s(\d)$/);
    if (match) {
      const n = parseInt(match[1]);
      const moduleKey = mod ?? "general";
      if (!semesterMap[n]) semesterMap[n] = {};
      if (!semesterMap[n][moduleKey]) semesterMap[n][moduleKey] = [];
      semesterMap[n][moduleKey].push({ slug: note.data.slug, order });
    }
  });

  Object.keys(grouped).forEach((sem) => {
    Object.keys(grouped[sem]).forEach((mod) => {
      grouped[sem][mod].sort((a, b) => a.order - b.order);
    });
  });

  const currentModuleNotes = grouped[currentSemester]?.[currentModule] || [];
  const currentModuleTree: {
    direct: SidebarNote[];
    topics: Record<string, SidebarNote[]>;
  } = {
    direct: [],
    topics: {},
  };

  currentModuleNotes.forEach((note) => {
    const parts = note.slug.split("/");
    if (parts.length === 3) {
      currentModuleTree.direct.push(note);
    } else if (parts.length >= 4) {
      const topic = parts[2];
      if (!currentModuleTree.topics[topic]) {
        currentModuleTree.topics[topic] = [];
      }
      currentModuleTree.topics[topic].push(note);
    }
  });

  const sortedTopics = Object.keys(currentModuleTree.topics).sort((a, b) => {
    const orderA = currentModuleTree.topics[a][0]?.moduleOrder ?? Infinity;
    const orderB = currentModuleTree.topics[b][0]?.moduleOrder ?? Infinity;
    return orderA - orderB;
  });

  let prevNote: SidebarNote | null = null;
  let nextNote: SidebarNote | null = null;
  const slugParts = currentSlug.split("/");

  if (slugParts.length >= 4) {
    const currentTopic = slugParts[2];
    const topicNotes = currentModuleTree.topics[currentTopic] || [];
    const currentIndex = topicNotes.findIndex(
      (note) => note.slug === currentSlug,
    );
    if (currentIndex > 0) prevNote = topicNotes[currentIndex - 1];
    if (currentIndex < topicNotes.length - 1)
      nextNote = topicNotes[currentIndex + 1];
  } else if (slugParts.length === 3) {
    const directNotes = currentModuleTree.direct;
    const currentIndex = directNotes.findIndex(
      (note) => note.slug === currentSlug,
    );
    if (currentIndex > 0) prevNote = directNotes[currentIndex - 1];
    if (currentIndex < directNotes.length - 1)
      nextNote = directNotes[currentIndex + 1];
  }

  const semesters = Object.keys(semesterMap)
    .map((n) => parseInt(n))
    .sort((a, b) => a - b)
    .map((number) => {
      const modules = semesterMap[number];
      const firstModuleKey = Object.keys(modules).sort((a, b) =>
        titleize(a).localeCompare(titleize(b)),
      )[0];
      const firstNote = [...modules[firstModuleKey]].sort(
        (a, b) => a.order - b.order,
      )[0];
      return {
        number,
        label: `Semester ${number}`,
        firstSlug: firstNote.slug,
      };
    });

  return {
    currentSemester,
    currentModule,
    grouped,
    semesters,
    currentModuleTree: {
      ...currentModuleTree,
      topics: Object.fromEntries(
        sortedTopics.map((key) => [key, currentModuleTree.topics[key]]),
      ),
    },
    prevNote,
    nextNote,
  };
}
