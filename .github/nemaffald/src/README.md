# NemAffald - kildekode

Her ligger NemAffald-projektets JavaScript-moduler. Modulerne håndterer blandt andet browseradgang, formularinspektion, ordrekladder, godkendelse og ugentlig bestilling.

De vigtigste indgange er `weekly-order.js` til test og ugentlig bestilling, `draft-order.js` og `approve-order.js` til klargøring og godkendelse samt `inspect-form.js`, `inspect-orders.js` og `inspect-route.js` til kontrol. `browser.js` deler browseropsætning, og `setup-contact.js` håndterer kontaktopsætning.

Filerne er indbyrdes afhængige og bør ændres som en del af projektets samlede flow. Efter en ændring køres `npm run weekly:test` fra `.github/nemaffald/`; testen er designet til ikke at indsende en bestilling. Kontrollér resultat og readiness-filer, før den lokale planlagte opgave eller GitHub-workflowet ændres.

Se `.github/nemaffald/README.md` for opsætning og workflowets forudsætninger. Brug aldrig livebestilling som test.

[Tilbage til repositoryoversigten](../../../README.md)
