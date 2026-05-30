document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  const topButton = document.querySelector(".back-to-top-container");

  if (header && topButton) {
    const headerObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          topButton.classList.add("visible");
        } else {
          topButton.classList.remove("visible");
        }
      },
      {
        threshold: 0,
      },
    );

    headerObserver.observe(header);
  }

  const tocLinks = document.querySelectorAll(".sidebar a");
  const headings = document.querySelectorAll("main h2, main h3");

  if (tocLinks.length === 0 || headings.length === 0) return;

  const updateActiveToC = () => {
    let currentHeading = headings[0];

    headings.forEach((heading) => {
      if (heading.getBoundingClientRect().top < 150) {
        currentHeading = heading;
      }
    });

    tocLinks.forEach((link) => link.classList.remove("active"));

    if (currentHeading) {
      const id = currentHeading.getAttribute("id");
      const activeLink = document.querySelector(`.sidebar a[href="#${id}"]`);
      if (activeLink) {
        activeLink.classList.add("active");
      }
    }
  };

  let isScrolling = false;
  window.addEventListener("scroll", () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        updateActiveToC();
        isScrolling = false;
      });
      isScrolling = true;
    }
  });

  updateActiveToC();
});
