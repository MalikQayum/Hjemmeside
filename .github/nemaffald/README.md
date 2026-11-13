# NemAffald v0.8.0 – GitHub Actions (Hjemmeside repository integration)

This is a self-contained NemAffald automation project integrated into the Hjemmeside repository without replacing the website's root files.

## Files and layout

- Active workflow: `.github/workflows/nemaffald-weekly.yml`
- Automation source and package: `.github/nemaffald/`
- Runtime-only private config: `.github/nemaffald/config/contact.json` and `settings.json` (generated in the hosted runner; never commit them)
- Runtime state: `.github/nemaffald/artifacts/` (persisted using a workflow artifact)

The code is stored below `.github/nemaffald/` to avoid collisions with the Hjemmeside website's root `README.md`, `package.json`, scripts, and Jekyll content. The workflow remains in the root `.github/workflows/` directory, where GitHub discovers it.

## Order target

- Property: **Vigerslevvej 148**
- Service: **Haveaffald – Tømning af materiel**
- Standplads: **VIGERSLEVVEJ 148**
- Equipment: **240 l Havebeholder**
- Expected total: **DKK 0,00**
- Schedule: **Friday at 04:00 Europe/Copenhagen**
- Requested date: **the following Friday**

## Public repository considerations

The Hjemmeside repository is a public GitHub Pages repository, so the automation source and workflow YAML are visible to anyone who can view the repository. Contact details are not included in the source package; they are supplied through the encrypted GitHub Actions secret. Keep repository write access limited to trusted people, because someone who can modify trusted workflow code may be able to change how a workflow uses an available secret.

The source is stored under `.github/nemaffald/`, a dot-directory that Jekyll excludes from the published site by default. The workflow itself remains in `.github/workflows/` so GitHub can discover it.

GitHub may automatically disable scheduled workflows in public repositories after 60 days without repository activity. Check the Actions page periodically to ensure the schedule remains enabled.

## Safety

- The browser runs headlessly on GitHub's hosted Linux runner; it does not reuse the Windows browser profile.
- Contact data is read from the encrypted Actions secret `NEMAFFALD_CONTACT_JSON`. It is not printed or uploaded as an artifact.
- Manual `workflow_dispatch` defaults to `test`; test mode stops before adding to the basket or clicking final `GODKEND`.
- Production requires the repository variable `NEMAFFALD_ENABLE_SUBMISSION=true`. It is intentionally not enabled by default.
- A concurrency group prevents overlapping workflow runs.
- Active Haveaffald requests are checked live before production; existing date requests are skipped. Unparseable dates cause a safe stop.
- The request date is persisted as attempted before final approval. An uncertain submission is not retried automatically.
- The test readiness record is tied to the automation fingerprint, including the root workflow file. A code/workflow change requires another successful test.
- Do not run the Windows scheduled task and GitHub production workflow simultaneously.

## Install in the Hjemmeside repository

1. Extract the integration ZIP at the repository root and merge the `.github` folder. Do not replace the repository's existing root files. Existing workflow files under `.github/workflows/` must be kept; add `nemaffald-weekly.yml` alongside them.
2. Commit and push the new `.github/nemaffald/` folder and `.github/workflows/nemaffald-weekly.yml` to the default branch.
3. In repository **Settings → Secrets and variables → Actions → New repository secret**, create `NEMAFFALD_CONTACT_JSON` with the full contents of the local `config/contact.json`. Do not commit the local contact file.
4. In **Actions**, run `NemAffald weekly Haveaffald` manually with mode `test`. Confirm the log says `TEST MODE SUCCEEDED`.
5. Only after a successful hosted test, disable the Windows scheduled task and create repository variable `NEMAFFALD_ENABLE_SUBMISSION=true`.

To create the secret using GitHub CLI from the Windows project folder:

```powershell
gh secret set NEMAFFALD_CONTACT_JSON < .\config\contact.json
```

## Disable production

Remove the `NEMAFFALD_ENABLE_SUBMISSION` repository variable or change its value from `true`. Scheduled and manual production runs will stop before ordering.

## Windows fallback

The original Windows installation remains separate. Disable or re-enable its task independently. Never run both production schedulers at once.
