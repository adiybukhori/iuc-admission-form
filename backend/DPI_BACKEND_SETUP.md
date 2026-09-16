# Dana Pendidikan Inovatif — Backend Setup

This backend is intentionally separate from the main IUC Admission workflow. DPI submissions are pre-applications/leads and must not auto-create Admission records or offer letters.

## 1. Create the standalone Apps Script

1. Create a new standalone Google Apps Script project, e.g. `DPI Application Backend`.
2. Copy the contents of `backend/dpi-webhook.gs` into the project.
3. Run `setupDpiBackend()` once and grant the requested Google permissions.
4. Open the execution log and copy the returned:
   - `spreadsheetUrl`
   - `webhookToken`

The setup function creates a Google Sheet with two tabs:
- `Applications`
- `Corporate Leads`

It also prepares email notifications to `adiybukhori@innovative.edu.my`.

## 2. Deploy as Web App

Deploy the Apps Script as a Web App:
- Execute as: the script owner
- Who has access: Anyone

Copy the `/exec` deployment URL.

## 3. Configure Vercel

Add these Environment Variables to the `iuc-admission-form` Vercel project:
- `DPI_WEBHOOK_URL` = Apps Script `/exec` URL
- `DPI_WEBHOOK_TOKEN` = token returned by `setupDpiBackend()`

Redeploy after saving the variables.

## 4. Test

Submit one individual DPI application and one corporate enquiry from the landing page. Verify:
- the browser shows a success message only after a successful API response;
- the records appear in the correct Sheet tab;
- the admin receives the corresponding notification email;
- no record, folder, PDF, COL or offer letter is created in the main Admission workflow.
