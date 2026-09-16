# Dana Pendidikan Inovatif — Backend Activation

The DPI backend is intentionally separate from the main IUC Admission workflow. DPI submissions are pre-applications/leads and must not auto-create Admission records, student folders, PDFs or offer letters.

## Database already created

Google Sheet: `Dana Pendidikan Inovatif - Applications Database`

Spreadsheet ID: `15P3fP6v7m3Pq3365mx-VvRrNlTqn5aRjoNr3S1J7-NM`

Tabs already prepared:
- `Applications`
- `Corporate Leads`
- `Activity Log`

The Apps Script source is `backend/dpi-webhook.gs`. It is already wired to the live spreadsheet above.

## What the backend does

### Individual application
1. Validates the payload.
2. Generates a DPI reference number.
3. Saves the application into `Applications` with status `New Application`.
4. Logs actions in `Activity Log`.
5. Sends an admin notification email.
6. Sends an acknowledgement email to the applicant confirming receipt and stating that submission is not yet registration/admission approval.

### Corporate / HR lead
1. Validates the payload.
2. Generates a corporate reference number.
3. Saves the lead into `Corporate Leads` with status `Corporate Lead`.
4. Logs actions in `Activity Log`.
5. Sends an admin notification email.
6. Sends an acknowledgement email to the corporate PIC.

## One-time Google authorization and deployment

Google requires the account owner to authorize MailApp/SpreadsheetApp and deploy the Web App. This cannot be pre-authorized from the repository.

1. Create/open a standalone Apps Script project named `DPI Application Backend` while signed in to the Google Workspace account that should send the emails.
2. Copy `backend/dpi-webhook.gs` into the Apps Script project.
3. Run `setupDpiBackend()` once and approve the requested Google permissions.
4. Copy the `webhookToken` shown in the execution log.
5. Deploy > New deployment > Web app.
   - Execute as: Me
   - Who has access: Anyone
6. Copy the `/exec` Web App URL.

## Vercel configuration

In the `dana-pendidikan-inovatif` Vercel project, add these Production environment variables:
- `DPI_WEBHOOK_URL` = Apps Script `/exec` URL
- `DPI_WEBHOOK_TOKEN` = token returned by `setupDpiBackend()`

Redeploy Production after saving the variables.

## End-to-end acceptance test

Submit one test individual application and one corporate enquiry. Confirm all of the following before public launch:
- browser success message appears only after backend success;
- individual row is stored in `Applications`;
- corporate row is stored in `Corporate Leads`;
- `Activity Log` records the save and email actions;
- admin notification email is received;
- applicant/PIC acknowledgement email is received;
- no Admission workflow document, folder, COL or offer letter is generated.
