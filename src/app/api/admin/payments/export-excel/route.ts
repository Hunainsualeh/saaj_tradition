import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getPaymentRecords } from "@/lib/server/queries";

const ADMIN_COOKIE_NAME = "admin_session";

function isAdminAuthenticated(req: NextRequest): boolean {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`),
  );
  const token = match?.[1];
  if (!token) return false;
  try {
    const decoded = JSON.parse(
      Buffer.from(decodeURIComponent(token), "base64").toString("utf-8"),
    );
    return Boolean(decoded.id && decoded.role);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl;
  const filters = {
    paymentStatus: url.searchParams.get("paymentStatus") ?? undefined,
    paymentMethod: url.searchParams.get("paymentMethod") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  };

  const result = await getPaymentRecords(filters);
  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 },
    );
  }

  const records = result.data;

  // Build Excel workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Saaj Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Payment Records", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Define columns
  sheet.columns = [
    { header: "Order #", key: "orderNumber", width: 12 },
    { header: "Date", key: "date", width: 14 },
    { header: "Customer Name", key: "name", width: 22 },
    { header: "Email", key: "email", width: 26 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "City", key: "city", width: 14 },
    { header: "Amount (Rs.)", key: "amount", width: 14 },
    { header: "Shipping (Rs.)", key: "shipping", width: 14 },
    { header: "Discount (Rs.)", key: "discount", width: 14 },
    { header: "Coupon", key: "coupon", width: 12 },
    { header: "Items", key: "items", width: 8 },
    { header: "Payment Method", key: "method", width: 16 },
    { header: "Payment Status", key: "paymentStatus", width: 16 },
    { header: "Order Status", key: "orderStatus", width: 16 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 24;

  // Payment status colors
  const STATUS_FILLS: Record<string, string> = {
    PAID: "FFD1FAE5",
    PENDING: "FFFEF3C7",
    FAILED: "FFFEE2E2",
    REFUNDED: "FFF3F4F6",
  };

  // Add data rows
  for (const r of records) {
    const row = sheet.addRow({
      orderNumber: r.orderNumber,
      date: new Date(r.createdAt).toLocaleDateString("en-PK"),
      name: r.delieveryName ?? "—",
      email: r.deliveryEmail ?? "—",
      phone: r.deliveryPhone ?? "—",
      city: r.deliveryCity ?? "—",
      amount: r.totalPrice,
      shipping: r.shippingAmount ?? 0,
      discount: r.discountAmount ?? 0,
      coupon: r.couponCode ?? "—",
      items: r.itemsCount,
      method: r.paymentMethod === "COD" ? "Cash on Delivery" : "PayFast",
      paymentStatus: r.paymentStatus,
      orderStatus: r.status,
    });

    // Color the payment status cell
    const statusCell = row.getCell("paymentStatus");
    const fill = STATUS_FILLS[r.paymentStatus];
    if (fill) {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fill },
      };
    }

    // Format currency columns
    row.getCell("amount").numFmt = "#,##0";
    row.getCell("shipping").numFmt = "#,##0";
    row.getCell("discount").numFmt = "#,##0";
  }

  // Add summary row
  sheet.addRow({});
  const summaryRow = sheet.addRow({
    name: "TOTAL",
    amount: records.reduce((s, r) => s + r.totalPrice, 0),
    items: records.reduce((s, r) => s + r.itemsCount, 0),
  });
  summaryRow.font = { bold: true };
  summaryRow.getCell("amount").numFmt = "#,##0";

  // Auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: records.length + 1, column: 14 },
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
