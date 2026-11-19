# NemAffald - kildekode

Her ligger NemAffald-projektets JavaScript-moduler. Modulerne håndterer blandt andet browseradgang, formularinspektion, ordrekladder, godkendelse og ugentlig bestilling.

De vigtigste indgange er `weekly-order.js` til test og ugentlig bestilling, `draft-order.js` og `approve-order.js` til klargøring og godkendelse samt `inspect-form.js`, `inspect-orders.js` og `inspect-route.js` til kontrol. `browser.js` deler browseropsætning, og `setup-contact.js` håndterer kontaktopsætning.

Filerne er indbyrdes afhængige og bør ændres som en del af projektets samlede flow. Se `.github/nemaffald/README.md` for sikker lokal test og workflowets forudsætninger.

[Tilbage til repositoryoversigten](../../../README.md)
