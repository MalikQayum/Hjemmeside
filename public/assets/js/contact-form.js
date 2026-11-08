document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll(".info-contact-form");
  if (!forms.length) return;

  forms.forEach((form) => {
    const subjectPrefix = form.getAttribute("data-subject-prefix") || "Henvendelse";
    const typeSelect = form.querySelector("[name='type']");
    const addressInput = form.querySelector("[name='adresse']");
    const nameInput = form.querySelector("[name='navn']");
    const emailInput = form.querySelector("[name='email']");
    const messageInput = form.querySelector("[name='besked']");
    const statusContainer = form.querySelector(".info-contact-status");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = nameInput ? nameInput.value.trim() : "";
      const address = addressInput ? addressInput.value.trim() : "";
      const type = typeSelect ? typeSelect.value : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const message = messageInput ? messageInput.value.trim() : "";

      const recipient = "bestyrelse@skyttegaardvej.dk";
      const subject = `${subjectPrefix}${type ? " - " + type : ""}${address ? " - " + address : ""}`;

      const bodyLines = [
        "Kære bestyrelse,",
        "",
        `Jeg henvender mig hermed vedrørende ${subjectPrefix.toLowerCase()}${type ? " (" + type + ")" : ""}.`,
        "",
        `Navn: ${name}`,
        `Adresse: ${address}`,
        `E-mail: ${email}`,
        type ? `Henvendelsestype: ${type}` : null,
        "",
        message ? `Besked / bemærkninger:\n${message}` : null,
        "",
        "Venlig hilsen,",
        name
      ].filter((line) => line !== null).join("\n");

      const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;

      // Open email client
      window.location.href = mailtoUrl;

      if (statusContainer) {
        statusContainer.innerHTML = `
          <h4><span class="icon solid fa-check-circle"></span> E-mail klargjort</h4>
          <p>Dit e-mailprogram åbner med emnet <strong>"${subject}"</strong> og dine oplysninger forudfyldt til <strong>${recipient}</strong>.</p>
          <div class="status-actions">
            <a href="${mailtoUrl}" class="button primary small icon solid fa-envelope">Åbn e-mail igen</a>
            <button type="button" class="button small icon solid fa-copy" class="copy-body-btn">Kopier teksten</button>
          </div>
        `;
        statusContainer.classList.add("is-visible");

        const copyBtn = statusContainer.querySelector("button");
        if (copyBtn) {
          copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(bodyLines).then(() => {
              copyBtn.textContent = "Kopieret!";
              setTimeout(() => {
                copyBtn.textContent = "Kopier teksten";
              }, 2000);
            });
          });
        }
      }
    });
  });
});

/* Sidst opdateret: 2026-11-08 12:06 */
