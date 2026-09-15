# Royal Honey BD — n8n Automation & Sync Integration 🍯⚡

This directory contains the production-ready n8n automation workflow for **Royal Honey BD**:

1. **Google Sheets Secondary Backup**: Automatically logs every confirmed customer order into a Google Sheet table.
2. **Owner WhatsApp Alerts**: Real-time notifications for:
   - **Payment Verification Pending** (bKash/Nagad advance payments with TrxID and screenshot).
   - **Order Confirmed** (Full customer and item summary).
   - **Low Stock Warning** (Products with stock count $\le 10$).
   - **Human Handoff Request** (With 1-click live takeover link).
3. **Two-way Incoming Webhook Forwarder**: Forwards external WhatsApp and Messenger messages directly to the Express.js API (`http://localhost:5000/api/v1/webhook`).

---

## 📁 Workflow File:

[`royal-honey-automation-workflow.json`](./royal-honey-automation-workflow.json)

---

## 🚀 How to Setup & Import into n8n:

### Option A: Run n8n locally with Docker (Fastest)

If you don't have an n8n instance running yet, start one with Docker:

```bash
docker run -d \
  --name royal_honey_n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n:latest
```

Then open `http://localhost:5678` in your browser.

### Option B: Import Workflow JSON

1. Open your n8n Dashboard.
2. Click on **Workflows** → **Add Workflow** (or **+**).
3. Click the top-right **"..." (Options)** menu → select **"Import from File"** (or press `Ctrl+O`).
4. Select [`n8n/royal-honey-automation-workflow.json`](./royal-honey-automation-workflow.json).
5. The complete workflow canvas with all triggers, router, Google Sheets node, and WhatsApp alert nodes will appear!

---

## ⚙️ Configuration & Credentials:

1. **Google Sheets Node**:
   - Authenticate with your Google account via OAuth2.
   - Create a Google Sheet titled `Royal Honey BD Orders` with the following header row:
     `Order ID | Consignment ID | Tracking Code | Date Time | Customer Name | Phone Number | District | Thana | Delivery Address | Ordered Products | Product Total | Delivery Charge | Total Payable | Payment Method | Payment Status | Transaction ID | Courier Status | Order Status | Source Channel`
   - Paste the Sheet's Document ID in the Google Sheets node.

2. **WhatsApp Node (Meta Cloud API)**:
   - Replace `YOUR_PHONE_NUMBER_ID` with your Meta WhatsApp Phone ID.
   - Replace `YOUR_META_WHATSAPP_ACCESS_TOKEN` with your System User Access Token.
   - The recipient is preconfigured to the business owner: `01604121107`.

3. **Connect Backend to n8n**:
   - Copy the Production Webhook URL from the **"Royal Honey Events Webhook"** node in n8n (e.g. `http://localhost:5678/webhook/royal-honey-events` or your public tunnel URL).
   - In `backend/.env`, set:
     ```env
     N8N_OUTGOING_WEBHOOK_URL=http://localhost:5678/webhook/royal-honey-events
     ```
   - Restart the backend server.
