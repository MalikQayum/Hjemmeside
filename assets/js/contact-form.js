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
    const brikSelect = form.querySelector("[name='antal_brikker']");
    const kortSelect = form.querySelector("[name='antal_kort']");
    const totalPriceEl = form.querySelector(".js-total-price");
    const priceBreakdownEl = form.querySelector(".js-price-breakdown");
    const consentCheckbox = form.querySelector("[name='postkasse_godkendelse']");
    const orderFieldsWrapper = form.querySelector(".js-order-fields");
    const messageFieldWrapper = form.querySelector(".js-message-field");
    const statusContainer = form.querySelector(".info-contact-status");

    const unitPrice = brikSelect
      ? Number(brikSelect.getAttribute("data-unit-price")) || 100
      : 100;

    const formatKr = (amount) => `${amount.toLocaleString("da-DK")} kr.`;

    const isOrderType = () => {
      if (!typeSelect) return false;
      return typeSelect.value.toLowerCase().startsWith("bestilling");
    };

    const getCounts = () => {
      const brikQty = brikSelect ? Math.max(0, parseInt(brikSelect.value, 10) || 0) : 0;
      const kortQty = kortSelect ? Math.max(0, parseInt(kortSelect.value, 10) || 0) : 0;
      return { brikQty, kortQty, totalQty: brikQty + kortQty };
    };

    const clearOrderCustomValidity = () => {
      if (brikSelect) brikSelect.setCustomValidity("");
      if (consentCheckbox) consentCheckbox.setCustomValidity("");
    };

    const updateTotalPrice = () => {
      if (!totalPriceEl) return;
      const { brikQty, kortQty, totalQty } = getCounts();
      totalPriceEl.textContent = formatKr(totalQty * unitPrice);
      if (priceBreakdownEl) {
        priceBreakdownEl.textContent = `(${brikQty} brikker + ${kortQty} kort × ${unitPrice} kr.)`;
      }
      if (totalQty > 0 && brikSelect) {
        brikSelect.setCustomValidity("");
      }
    };

    const updateOrderFieldsVisibility = () => {
      if (!orderFieldsWrapper || !typeSelect) return;
      const showOrder = isOrderType();
      orderFieldsWrapper.hidden = !showOrder;
      if (messageFieldWrapper) {
        messageFieldWrapper.hidden = showOrder;
      }
      if (consentCheckbox) {
        consentCheckbox.required = showOrder;
      }
      if (!showOrder) {
        clearOrderCustomValidity();
      }
    };

    if (brikSelect || kortSelect) {
      [brikSelect, kortSelect].forEach((el) => {
        if (!el) return;
        el.addEventListener("change", updateTotalPrice);
        el.addEventListener("input", updateTotalPrice);
      });
      updateTotalPrice();
    }

    if (consentCheckbox) {
      consentCheckbox.addEventListener("change", () => {
        if (consentCheckbox.checked) {
          consentCheckbox.setCustomValidity("");
        }
      });
    }

    if (typeSelect && orderFieldsWrapper) {
      typeSelect.addEventListener("change", updateOrderFieldsVisibility);
      updateOrderFieldsVisibility();
    }

    form.addEventListener("submit", (e) => {
      clearOrderCustomValidity();

      const hasOrderFields = orderFieldsWrapper && !orderFieldsWrapper.hidden;
      const { brikQty, kortQty, totalQty } = getCounts();

      if (hasOrderFields && totalQty < 1 && brikSelect) {
        e.preventDefault();
        brikSelect.setCustomValidity("Vælg mindst 1 nøglebrik eller 1 nøglekort.");
        form.reportValidity();
        return;
      }

      if (hasOrderFields && consentCheckbox && !consentCheckbox.checked) {
        e.preventDefault();
        consentCheckbox.setCustomValidity(
          "Du skal sætte kryds ved godkendelse af aflevering i postkassen, før bestillingen kan sendes."
        );
        form.reportValidity();
        return;
      }

      e.preventDefault();

      const name = nameInput ? nameInput.value.trim() : "";
      const address = addressInput ? addressInput.value.trim() : "";
      const type = typeSelect ? typeSelect.value : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const hasMessageField = !messageFieldWrapper || !messageFieldWrapper.hidden;
      const message = hasMessageField && messageInput ? messageInput.value.trim() : "";

      const totalFormatted = hasOrderFields ? formatKr(totalQty * unitPrice) : null;
      const mailboxApproved =
        hasOrderFields && consentCheckbox ? consentCheckbox.checked : false;

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
        hasOrderFields ? `Antal nøglebrikker: ${brikQty} stk.` : null,
        hasOrderFields ? `Antal nøglekort: ${kortQty} stk.` : null,
        totalFormatted ? `Samlet pris: ${totalFormatted} (${totalQty} stk. à ${unitPrice} kr.)` : null,
        mailboxApproved
          ? "Samtykke og godkendelse af postkasse-aflevering: Ja, beboeren giver samtykke til og godkendelse af, at bestyrelsen må aflevere nøglebrikker/nøglekort i min postkasse."
          : null,
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
            <button type="button" class="button small icon solid fa-copy copy-body-btn">Kopier teksten</button>
          </div>
        `;
        statusContainer.classList.add("is-visible");

        const copyBtn = statusContainer.querySelector(".copy-body-btn");
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

/* Sidst opdateret: 2026-11-18 */
