document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("parking-contact-form");
  if (!form) return;

  const subjectInput = document.getElementById("parking-subject");
  const typeSelect = document.getElementById("parking-type");
  const addressInput = document.getElementById("parking-address");
  const nameInput = document.getElementById("parking-name");
  const emailInput = document.getElementById("parking-email");
  const phoneInput = document.getElementById("parking-phone");
  const messageInput = document.getElementById("parking-message");
  const statusContainer = document.getElementById("parking-form-status");

  // Keep subject preview updated based on dropdown and address
  function updateSubject() {
    const type = typeSelect ? typeSelect.value : "Venteliste";
    const address = addressInput && addressInput.value.trim() ? ` - ${addressInput.value.trim()}` : "";
    if (subjectInput) {
      subjectInput.value = `Parkering - ${type}${address}`;
    }
  }

  if (typeSelect) {
    typeSelect.addEventListener("change", updateSubject);
  }
  if (addressInput) {
    addressInput.addEventListener("input", updateSubject);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput ? nameInput.value.trim() : "";
    const address = addressInput ? addressInput.value.trim() : "";
    const type = typeSelect ? typeSelect.value : "Venteliste";
    const email = emailInput ? emailInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const message = messageInput ? messageInput.value.trim() : "";

    const recipient = "bestyrelse@skyttegaardvej.dk";
    const subject = `Parkering - ${type}${address ? " - " + address : ""}`;

    const bodyLines = [
      "Kære bestyrelse,",
      "",
      `Jeg henvender mig hermed vedrørende parkering (${type}).`,
      "",
      `Navn: ${name}`,
      `Adresse: ${address}`,
      `E-mail: ${email}`,
      phone ? `Telefon: ${phone}` : null,
      `Henvendelsestype: ${type}`,
      "",
      message ? `Besked / bemærkninger:\n${message}` : null,
      "",
      "Venlig hilsen,",
      name
    ].filter((line) => line !== null).join("\n");

    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;

    // Open user's email client
    window.location.href = mailtoUrl;

    // Show on-page confirmation with direct fallback buttons
    if (statusContainer) {
      statusContainer.innerHTML = `
        <h4><span class="icon solid fa-check-circle"></span> E-mail klargjort</h4>
        <p>Dit e-mailprogram burde nu åbne automatisk med emnet <strong>"${subject}"</strong> og dine oplysninger forudfyldt til <strong>${recipient}</strong>.</p>
        <div class="status-actions">
          <a href="${mailtoUrl}" class="button primary small icon solid fa-envelope">Åbn e-mail igen</a>
          <button type="button" class="button small icon solid fa-copy" id="copy-email-body-btn">Kopier henvendelsestekst</button>
        </div>
      `;
      statusContainer.classList.add("is-visible");

      const copyBtn = document.getElementById("copy-email-body-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(bodyLines).then(() => {
            copyBtn.textContent = "Kopieret!";
            setTimeout(() => {
              copyBtn.textContent = "Kopier henvendelsestekst";
            }, 2000);
          });
        });
      }
    }
  });
});
