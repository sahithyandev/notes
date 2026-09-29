// Drives the right-sidebar TOC rail: the scroll-linked highlight path and
// active-heading tracking. Extracted out of toc-rail.astro's own <script>
// (which still calls this on every normal page load) so a dev-only content
// swap (src/scripts/live-update.ts) can re-run it against a freshly
// rendered TOC without leaking the previous run's listeners - unlike the
// per-article scripts (copy-code, image-zoom, illustrations), this one
// binds to elements that survive a content swap (`window`, the scrolling
// `section`), so simply calling it again would double (then triple, ...)
// every scroll/resize handler and ResizeObserver. initTocScrollSpy() returns
// a cleanup function for exactly that reason - call it before re-invoking.
export function initTocScrollSpy(): () => void {
  const wrapper = document.querySelector<HTMLElement>(".toc-wrapper");
  const pathTrack = document.querySelector<SVGPathElement>(".toc-path-track");
  const pathProgress =
    document.querySelector<SVGPathElement>(".toc-path-progress");
  const tocLinks = [
    ...document.querySelectorAll<HTMLAnchorElement>(".toc-link"),
  ];

  if (!wrapper || !pathTrack || !pathProgress || tocLinks.length === 0) {
    return () => {};
  }

  const headingElements = tocLinks.map((link) => {
    const href = link.getAttribute("href");
    if (!href) return null;
    const rawId = href.substring(1);
    const decodedId = decodeURIComponent(rawId);
    return (
      document.getElementById(rawId) ||
      document.getElementById(decodedId) ||
      document.querySelector<HTMLElement>(
        `article [id="${CSS.escape(rawId)}"]`,
      ) ||
      document.querySelector<HTMLElement>(
        `article [id="${CSS.escape(decodedId)}"]`,
      )
    );
  });

  // Rail line sits 6px inside each link's left edge, leaving a clean 12px gap to text
  const RAIL_INSET = 4;
  const SAME_DEPTH_THRESHOLD_PX = 1;
  const DIAGONAL_HEIGHT_DIVISOR = 2;
  const NAV_FALLBACK_BOTTOM_PX = 56;
  const VISIBLE_TOP_PADDING_PX = 20;
  const VISIBLE_BOTTOM_PADDING_PX = 24;
  // Rail overshoots each end, and the active segment shifts outward by the
  // same amount, so both the track and the highlight reach link edges
  // instead of stopping/starting at link centers.
  const RAIL_END_EXTENSION_RATIO = 0.4;

  let nodeLengths: number[] = [];
  let halfHeights: number[] = [];
  let totalLength = 0;
  let headingTops: (number | null)[] = [];
  let headingBottoms: (number | null)[] = [];
  let navBottom: number | undefined;

  // Article scrolls inside <section>, not the window — cache/read
  // positions relative to whichever element actually scrolls.
  const scrollEl = document.querySelector("section");
  function getScrollOffset() {
    return scrollEl ? scrollEl.scrollTop : window.scrollY;
  }

  function measure() {
    if (!wrapper || !pathTrack || !pathProgress) return;
    const wrapperRect = wrapper.getBoundingClientRect();

    const points = tocLinks.map((link) => {
      const linkRect = link.getBoundingClientRect();
      return {
        x: Math.max(RAIL_INSET, linkRect.left - wrapperRect.left + RAIL_INSET),
        y: linkRect.top - wrapperRect.top + linkRect.height / 2,
        halfHeight: linkRect.height * RAIL_END_EXTENSION_RATIO,
      };
    });

    if (points.length === 0) return;

    halfHeights = points.map((p) => p.halfHeight);

    const scrollOffset = getScrollOffset();
    headingTops = headingElements.map((el) =>
      el ? el.getBoundingClientRect().top + scrollOffset : null,
    );
    headingBottoms = headingElements.map((el) =>
      el ? el.getBoundingClientRect().bottom + scrollOffset : null,
    );
    navBottom = (
      document.querySelector("nav") || document.querySelector("header")
    )?.getBoundingClientRect().bottom;

    let d = `M ${points[0].x} ${points[0].y - points[0].halfHeight} L ${points[0].x} ${points[0].y}`;
    nodeLengths = [points[0].halfHeight];
    totalLength = points[0].halfHeight;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      const dy = curr.y - prev.y;
      const dx = curr.x - prev.x;

      if (Math.abs(dx) < SAME_DEPTH_THRESHOLD_PX) {
        // Same depth level -> straight vertical line
        d += ` L ${curr.x} ${curr.y}`;
        totalLength += Math.abs(dy);
      } else {
        // Depth change -> diagonal chamfered transition (45 degree slant)
        const diagH = Math.min(
          Math.abs(dx),
          Math.abs(dy) / DIAGONAL_HEIGHT_DIVISOR,
        );
        const yMid = (prev.y + curr.y) / DIAGONAL_HEIGHT_DIVISOR;
        const yStartDiag = yMid - diagH / DIAGONAL_HEIGHT_DIVISOR;
        const yEndDiag = yMid + diagH / DIAGONAL_HEIGHT_DIVISOR;

        const dy1 = yStartDiag - prev.y;
        const diagLen = Math.hypot(dx, yEndDiag - yStartDiag);
        const dy2 = curr.y - yEndDiag;

        d += ` L ${prev.x} ${yStartDiag} L ${curr.x} ${yEndDiag} L ${curr.x} ${curr.y}`;
        totalLength += dy1 + diagLen + dy2;
      }

      nodeLengths.push(totalLength);
    }

    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y + last.halfHeight}`;
    totalLength += last.halfHeight;

    pathTrack.setAttribute("d", d);
    pathProgress.setAttribute("d", d);

    updateScroll();
  }

  function updateScroll() {
    if (nodeLengths.length === 0 || !pathProgress) return;

    // Calculate true un-obscured visible viewport bounds (accounting for top sticky navbar)
    const visibleTop =
      (navBottom ?? NAV_FALLBACK_BOTTOM_PX) + VISIBLE_TOP_PADDING_PX;
    const visibleBottom = window.innerHeight - VISIBLE_BOTTOM_PADDING_PX;

    // Positions are cached document-relative (measure()); convert to
    // viewport-relative here instead of re-reading layout every frame.
    const validHeadings: {
      index: number;
      top: number;
      bottom: number;
    }[] = [];
    const scrollOffset = getScrollOffset();
    headingTops.forEach((top, index) => {
      if (top !== null) {
        validHeadings.push({
          index,
          top: top - scrollOffset,
          bottom: (headingBottoms[index] ?? top) - scrollOffset,
        });
      }
    });

    if (validHeadings.length === 0) return;

    // 1. Calculate L_start (top boundary of colored SVG segment)
    let lStart = 0;
    let startIndex = 0;

    if (visibleTop <= validHeadings[0].top) {
      lStart = 0;
      startIndex = 0;
    } else if (visibleTop >= validHeadings[validHeadings.length - 1].top) {
      lStart = totalLength;
      startIndex = validHeadings[validHeadings.length - 1].index;
    } else {
      for (let i = 0; i < validHeadings.length - 1; i++) {
        const curr = validHeadings[i];
        const next = validHeadings[i + 1];

        if (visibleTop >= curr.top && visibleTop < next.top) {
          const fraction =
            next.top === curr.top
              ? 0
              : (visibleTop - curr.top) / (next.top - curr.top);

          const lenA = nodeLengths[curr.index];
          const lenB = nodeLengths[next.index];
          lStart = lenA + Math.max(0, Math.min(1, fraction)) * (lenB - lenA);

          // Exclude heading if its text has scrolled completely above the visible top threshold (hidden under navbar)
          if (curr.bottom <= visibleTop) {
            startIndex = next.index;
          } else {
            startIndex = curr.index;
          }
          break;
        }
      }
    }

    // 2. Calculate L_end (bottom boundary of colored SVG segment)
    let lEnd = totalLength;
    let endIndex = validHeadings[validHeadings.length - 1].index;

    if (visibleBottom <= validHeadings[0].top) {
      lEnd = 0;
      endIndex = 0;
    } else if (visibleBottom >= validHeadings[validHeadings.length - 1].top) {
      lEnd = totalLength;
      endIndex = validHeadings[validHeadings.length - 1].index;
    } else {
      for (let i = 0; i < validHeadings.length - 1; i++) {
        const curr = validHeadings[i];
        const next = validHeadings[i + 1];

        if (visibleBottom >= curr.top && visibleBottom < next.top) {
          endIndex = curr.index;
          const fraction =
            next.top === curr.top
              ? 0
              : (visibleBottom - curr.top) / (next.top - curr.top);

          const lenA = nodeLengths[curr.index];
          const lenB = nodeLengths[next.index];
          lEnd = lenA + Math.max(0, Math.min(1, fraction)) * (lenB - lenA);
          break;
        }
      }
    }

    // Shift outward by each boundary link's half-height so the segment
    // starts/ends at link edges rather than link centers
    lStart = Math.max(0, lStart - (halfHeights[startIndex] ?? 0));
    lEnd = Math.min(totalLength, lEnd + (halfHeights[endIndex] ?? 0));

    // Ensure lStart <= lEnd
    if (lStart > lEnd) {
      lStart = lEnd;
    }

    const segLen = Math.max(0, lEnd - lStart);

    // SVG path segment reveal using strokeDashoffset shift
    pathProgress.style.strokeDasharray = `${segLen} ${totalLength}`;
    pathProgress.style.strokeDashoffset = `${-lStart}px`;

    // Highlight ONLY headings that are currently visible within the un-obscured viewport
    tocLinks.forEach((link, i) => {
      if (i >= startIndex && i <= endIndex) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  // requestAnimationFrame syncs scroll updates with browser paint cycle
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  const teardownFns: (() => void)[] = [];

  // Remeasure triggers
  measure();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", measure);
    teardownFns.push(() =>
      document.removeEventListener("DOMContentLoaded", measure),
    );
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }

  const onResize = () => measure();
  window.addEventListener("resize", onResize);
  teardownFns.push(() => window.removeEventListener("resize", onResize));

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(wrapper);
    teardownFns.push(() => ro.disconnect());
  }

  // Scroll driver
  scrollEl?.addEventListener("scroll", onScroll, { passive: true });
  teardownFns.push(() =>
    scrollEl?.removeEventListener("scroll", onScroll as EventListener),
  );
  window.addEventListener("scroll", onScroll, { passive: true });
  teardownFns.push(() => window.removeEventListener("scroll", onScroll));

  // Smooth scroll link click
  const linkHandlers = tocLinks.map((link) => {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      const href = link.getAttribute("href");
      if (!href) return;
      const rawId = href.substring(1);
      const targetElement =
        document.getElementById(rawId) ||
        document.getElementById(decodeURIComponent(rawId));
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };
    link.addEventListener("click", handler);
    return { link, handler };
  });
  teardownFns.push(() =>
    linkHandlers.forEach(({ link, handler }) =>
      link.removeEventListener("click", handler),
    ),
  );

  return () => teardownFns.forEach((fn) => fn());
}
