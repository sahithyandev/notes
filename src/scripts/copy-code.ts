document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("article pre").forEach((pre) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", "Copy code");
    btn.textContent = "Copy";

    btn.addEventListener("click", () => {
      const code = pre.querySelector("code");
      const text = (code as HTMLElement)?.innerText ?? "";
      navigator.clipboard.writeText(text).then(
        () => {
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy"), 1500);
        },
        () => {
          btn.textContent = "Failed";
          setTimeout(() => (btn.textContent = "Copy"), 1500);
        },
      );
    });

    pre.appendChild(btn);
  });
});
