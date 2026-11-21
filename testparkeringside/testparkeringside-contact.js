/* Kontaktformular til testparkeringssiden – uafhængigt af /parkering/. */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("test-parking-contact-form");
  if (!form) return;

  const typeSelect = document.getElementById("test-parking-type");
  const addressInput = document.getElementById("test-parking-address");
  const nameInput = document.getElementById("test-parking-name");
  const emailInput = document.getElementById("test-parking-email");
  const messageInput = document.getElementById("test-parking-message");
  const statusContainer = document.getElementById("test-parking-form-status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput?.value.trim() || "";
    const address = addressInput?.value.trim() || "";
    const type = typeSelect?.value || "Venteliste";
    const email = emailInput?.value.trim() || "";
    const message = messageInput?.value.trim() || "";

    const recipient = "bestyrelse@skyttegaardvej.dk";
    const subject = `Parkering - ${type}${address ? ` - ${address}` : ""}`;
    const bodyLines = [
      "Kære bestyrelse,",
      "",
      `Jeg henvender mig hermed vedrørende parkering (${type}).`,
      "",
      `Navn: ${name}`,
      `Adresse: ${address}`,
      `E-mail: ${email}`,
      `Henvendelsestype: ${type}`,
      "",
      message ? `Besked / bemærkninger:\n${message}` : null,
      "",
      "Venlig hilsen,",
      name
    ].filter((line) => line !== null).join("\n");

    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;
    window.location.href = mailtoUrl;

    if (!statusContainer) return;

    const heading = document.createElement("h4");
    const headingIcon = document.createElement("span");
    headingIcon.className = "icon solid fa-check-circle";
    heading.append(headingIcon, document.createTextNode(" E-mail klargjort"));

    const paragraph = document.createElement("p");
    paragraph.append(
      document.createTextNode("Dit e-mailprogram burde nu åbne automatisk med emnet "),
      document.createElement("strong")
    );
    paragraph.querySelector("strong").textContent = `"${subject}"`;
    paragraph.append(document.createTextNode(` og dine oplysninger forudfyldt til ${recipient}.`));

    const actions = document.createElement("div");
    actions.className = "status-actions";

    const reopenLink = document.createElement("a");
    reopenLink.href = mailtoUrl;
    reopenLink.className = "button primary small icon solid fa-envelope";
    reopenLink.textContent = "Åbn e-mail igen";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "button small icon solid fa-copy";
    copyButton.textContent = "Kopier henvendelsestekst";
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(bodyLines);
        copyButton.textContent = "Kopieret!";
      } catch (_error) {
        copyButton.textContent = "Kunne ikke kopiere";
      }
    });

    actions.append(reopenLink, copyButton);
    statusContainer.replaceChildren(heading, paragraph, actions);
    statusContainer.classList.add("is-visible");
  });
});
