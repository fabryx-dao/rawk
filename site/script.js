// Set copyright year
const copyrightYear = document.getElementById('copyright-year');
if (copyrightYear) {
  copyrightYear.textContent = new Date().getFullYear();
}

const accordionButtons = document.querySelectorAll(".accordion-btn");
if (accordionButtons.length) {
  const openPanel = (panel, btn) => {
    panel.classList.add("is-open");
    panel.style.maxHeight = `${panel.scrollHeight}px`;
    btn.classList.add("is-open");
  };

  accordionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.nextElementSibling;
      if (!panel || !panel.classList.contains("accordion-panel")) return;

      document.querySelectorAll(".accordion-panel.is-open").forEach((openPanel) => {
        if (openPanel === panel) return;
        openPanel.classList.remove("is-open");
        openPanel.style.maxHeight = "0px";
        const openButton = openPanel.previousElementSibling;
        if (openButton && openButton.classList.contains("accordion-btn")) {
          openButton.classList.remove("is-open");
        }
      });

      if (panel.classList.contains("is-open")) {
        panel.classList.remove("is-open");
        panel.style.maxHeight = "0px";
        btn.classList.remove("is-open");
        return;
      }

      openPanel(panel, btn);
    });
  });

  if (window.matchMedia("(min-width: 1081px)").matches) {
    const firstBtn = accordionButtons[0];
    const firstPanel = firstBtn ? firstBtn.nextElementSibling : null;
    if (firstBtn && firstPanel && firstPanel.classList.contains("accordion-panel")) {
      openPanel(firstPanel, firstBtn);
    }
  }
}
