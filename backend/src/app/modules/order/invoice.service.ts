import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../libs/prisma';

/**
 * Generate a standalone, printable HTML invoice & packaging slip
 */
const generateInvoiceHtml = async (orderId: string): Promise<string> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, `অর্ডার "${orderId}" পাওয়া যায়নি।`);
  }

  const customer = order.customer;
  const isPaid = order.paymentStatus === 'PAID';
  const codToCollect = isPaid ? 0 : order.totalAmount;
  const dateFormatted = new Date(order.createdAt).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemRows = order.items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.productName}</strong>
        ${item.product?.weight ? `<span style="color: #6b7280; font-size: 13px;">(${item.product.weight})</span>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">৳${item.unitPrice}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">৳${item.totalPrice}</td>
    </tr>
  `,
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.id} | Royal Honey BD</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'SolaimanLipi', Arial;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
      color: #1f2937;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 35px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .brand-title {
      color: #b45309;
      font-size: 26px;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      color: #6b7280;
      font-size: 13px;
      margin: 4px 0 0 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-paid { background: #dcfce7; color: #166534; }
    .badge-cod { background: #fef3c7; color: #92400e; }
    .barcode {
      letter-spacing: 8px;
      font-family: monospace;
      font-size: 18px;
      background: #f9fafb;
      padding: 6px 14px;
      border: 1px dashed #d1d5db;
      border-radius: 6px;
      display: inline-block;
      margin-top: 6px;
      color: #111827;
      font-weight: bold;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    .box {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #f3f4f6;
    }
    .box h4 { margin: 0 0 8px 0; color: #374151; font-size: 14px; text-transform: uppercase; }
    .box p { margin: 3px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #fef3c7; color: #92400e; padding: 10px; font-size: 13px; text-align: left; }
    .summary-table { width: 300px; margin-left: auto; margin-bottom: 20px; }
    .summary-table td { padding: 6px 10px; }
    .total-row { font-size: 17px; font-weight: bold; color: #b45309; border-top: 2px solid #f59e0b; }
    .fragile-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 5px solid #f59e0b;
      padding: 12px;
      border-radius: 6px;
      margin-top: 20px;
      font-size: 13px;
    }
    .print-btn {
      background: #f59e0b;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div style="max-width: 800px; margin: 0 auto; text-align: right;" class="no-print">
    <button class="print-btn" onclick="window.print()">🖨️ ইনভয়েস প্রিন্ট করুন (Print Label)</button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="brand-title">🍯 ROYAL HONEY BD</h1>
        <p class="brand-sub">১০০% প্রাকৃতিক, ভেজালমুক্ত ও খাঁটি মধুর বিশ্বস্ত ঠিকানা</p>
        <p class="brand-sub">হটলাইন: 01604121107 | ঢাকা, বাংলাদেশ</p>
      </div>
      <div style="text-align: right;">
        <h2 style="margin: 0; font-size: 20px; color: #111827;">INVOICE & SHIPPING LABEL</h2>
        <p style="margin: 4px 0; font-weight: bold; color: #4b5563;">${order.id}</p>
        <span class="badge ${isPaid ? 'badge-paid' : 'badge-cod'}">
          ${isPaid ? 'PAID (পরিশোধিত)' : 'CASH ON DELIVERY (COD)'}
        </span>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <h4>📦 ডেলিভারি প্রাপক (Customer Details)</h4>
        <p><strong>নাম:</strong> ${customer?.name || 'Customer'}</p>
        <p><strong>ফোন নম্বর:</strong> ${customer?.phone || 'N/A'}</p>
        <p><strong>জেলা:</strong> ${customer?.district || 'N/A'}, ${customer?.thana || ''}</p>
        <p><strong>পূর্ণ ঠিকানা:</strong> ${customer?.fullAddress || 'N/A'}</p>
      </div>
      <div class="box">
        <h4>🚚 কুরিয়ার ট্র্যাকিং তথ্য (Courier Details)</h4>
        <p><strong>কুরিয়ার পার্টনার:</strong> ${order.courierProvider || 'Steadfast Courier'}</p>
        <p><strong>ট্র্যাকিং কোড:</strong> <span style="font-weight: bold; color: #2563eb;">${order.trackingCode || 'Pending Booking'}</span></p>
        <p><strong>অর্ডার তারিখ:</strong> ${dateFormatted}</p>
        ${order.trackingCode ? `<div class="barcode">|||| ||| ||||| |||</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align: center; width: 40px;">#</th>
          <th>পণ্যের বিবরণ (Product)</th>
          <th style="text-align: center; width: 80px;">পরিমাণ (Qty)</th>
          <th style="text-align: right; width: 110px;">একক মূল্য (Price)</th>
          <th style="text-align: right; width: 120px;">মোট (Total)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <table class="summary-table">
      <tr>
        <td>পণ্য মূল্য (Subtotal):</td>
        <td style="text-align: right;">৳${order.productTotal}</td>
      </tr>
      <tr>
        <td>ডেলিভারি চার্জ:</td>
        <td style="text-align: right;">৳${order.deliveryCharge}</td>
      </tr>
      <tr class="total-row">
        <td>সর্বমোট বিল:</td>
        <td style="text-align: right;">৳${order.totalAmount}</td>
      </tr>
      <tr>
        <td><strong>কুরিয়ারে আদায়যোগ্য:</strong></td>
        <td style="text-align: right; font-weight: bold; color: ${isPaid ? '#16a34a' : '#dc2626'};">
          ৳${codToCollect} ${isPaid ? '(অগ্রিম পেইড)' : '(COD Collect)'}
        </td>
      </tr>
    </table>

    <div class="fragile-box">
      ⚠️ <strong>কাঁচের পাত্র — সাবধানে নাড়াচাড়া করুন (Fragile: Handle With Care)</strong><br>
      পার্সেল গ্রহণের সময় কোনো ক্ষতি বা ভাঙা পেলে আনবক্সিং ভিডিওসহ আমাদের হটলাইনে (01604121107) যোগাযোগ করার অনুরোধ করা হলো।
    </div>
  </div>
</body>
</html>
  `;
};

export const InvoiceServices = {
  generateInvoiceHtml,
};

