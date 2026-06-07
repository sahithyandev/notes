function formatRelativeTime(isoDate: string): string {
  const lastUpdated = new Date(isoDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastUpdated.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  const weeks = Math.floor(diffDays / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;

  const months = Math.floor(diffDays / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

document.addEventListener("DOMContentLoaded", () => {
  const metaElement = document.querySelector(".note-meta-item[data-date]");
  if (metaElement) {
    const isoDate = metaElement.getAttribute("data-date");
    if (isoDate) {
      metaElement.textContent = "Updated " + formatRelativeTime(isoDate);
    }
  }
});
