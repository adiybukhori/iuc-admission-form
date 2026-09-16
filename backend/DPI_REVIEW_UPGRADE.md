# DPI Review + Conditional Offer Upgrade

## What this adds

Applications sheet workflow:

`New Application -> Under Review -> Approved / Need More Info / Not Approved`

When Status is changed to `Approved`, the Apps Script will:
1. Stamp reviewer and review date.
2. Copy the existing DPI conditional-offer template.
3. Generate a PDF using the applicant data.
4. Save the PDF in `Website Conditional Offers - 2026`.
5. Email the PDF to the applicant.
6. Include a secure online acceptance link.
7. Update the application to `Offer Sent`.

When the applicant accepts online:
1. Status becomes `Offer Accepted`.
2. Accepted timestamp is recorded.
3. Admin receives an email notification.
4. Applicant receives the official-registration link.

`Need More Info` and `Not Approved` also trigger the corresponding candidate emails.

## Existing Drive assets used

- Applications database: `15P3fP6v7m3Pq3365mx-VvRrNlTqn5aRjoNr3S1J7-NM`
- Existing DPI Conditional Offer template: `1qBs6uxRo74LjAuB5qBQBCrEml4r2NnKDa9KhbRjfHBw`
- Generated offer folder: `1v3eFJXDirmYaolWV_gSBbsI6Y8-sDFsv`

## Upgrade the live Apps Script

Replace the current `Code.gs` with `backend/dpi-webhook.gs` from this repository.

Then:
1. Save.
2. Run `upgradeDpiReviewWorkflow()` once and authorize any new permissions.
3. Deploy -> Manage deployments -> Edit the existing Web App -> select **New version** -> Deploy.

The existing Web App URL and existing `DPI_WEBHOOK_TOKEN` can remain unchanged.

## Test

Use one test application:
1. Add optional text into Remarks.
2. Change Status from `New Application` to `Approved`.
3. Confirm Status becomes `Offer Sent`.
4. Confirm Offer Reference, Offer Letter URL and Offer Token are populated.
5. Confirm candidate receives the PDF and online-acceptance link.
6. Open the link and accept.
7. Confirm Status becomes `Offer Accepted` and Accepted At is populated.

Do not launch broadly until this test completes successfully.
