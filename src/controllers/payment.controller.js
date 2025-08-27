import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Payment } from "../models/Payment.model.js";
import { Bill } from "../models/Bill.model.js";
import { Customer } from "../models/Customer.model.js";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// ✅ Payment Creation + Mail Invoice
const createPayment = asyncHandler(async (req, res) => {
  try {
    const { billId, mode } = req.body;
    const paymentDate = new Date();

    // 2️⃣ Update Bill Status 
    await Bill.findOneAndUpdate({ billId }, { status: "paid", paidDate: paymentDate });

    // 3️⃣ Get Customer & Bill

    const bill = await Bill.findOne({ billId });
    const customerId = bill.customerId;
    const amountPaid = bill.amount;
    const customer = await Customer.findOne({ "_id": customerId });

    const paymentId = `Payment-${Date.now()}-${customerId}`
    //Save Payment
    const payment = new Payment({ paymentId, billId, customerId, amountPaid, paymentDate, mode });
    await payment.save();


    if (!customer || !bill) {
      return res.status(404).json({ message: "Customer or Bill not found" });
    }

    // 4️⃣ Generate Invoice PDF
    const invoicePath = path.resolve(`./public/temp/${bill.billId}.pdf`);
    await generateInvoicePDF(customer, bill, payment, invoicePath);

    // 5️⃣ Send Mail with Invoice
    await sendInvoiceMail(customer, bill, invoicePath);

    res.status(201).json({ message: "Payment recorded & invoice mailed!", payment });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ message: "Error processing payment", error });
  }
});

// =======================
// 🔹 Generate Invoice PDF
// =======================
// ✅ Utility: Format Date -> "DD MMM YYYY"
const formatDate = (date) => {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const generateInvoicePDF = (customer, bill, payment, invoicePath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(invoicePath);
    doc.pipe(stream);

    // ===== HEADER =====
    try {
      const logoPath = "./public/company-logo.png"; // Place your logo
      doc.image(logoPath, 40, 30, { width: 100 });
    } catch (err) {
      console.warn("⚠️ Logo missing, skipping...");
    }

    doc.fontSize(20).text("Invoice", 450, 40, { align: "right" });

    // ===== GREY SUMMARY BOX =====
    doc.rect(320, 80, 250, 120).fill("#f0f0f0").stroke();
    doc.fillColor("black").fontSize(10);

    const boxX = 330;
    let boxY = 90;
    const boxWidth = 230; // restrict width so text wraps

    doc.text("Paid", boxX, boxY, { width: boxWidth });
    boxY += 15;

    doc.text(`Payment reference: ${payment?.paymentId || "N/A"}`, boxX, boxY, {
      width: boxWidth,
      continued: false,
    });
    boxY += 28; // allow wrapped text space

    doc.text(`Invoice #: ${bill.billId}`, boxX, boxY, { width: boxWidth });
    boxY += 20;

    doc.text(`Invoice date: ${formatDate(bill.generatedDate)}`, boxX, boxY, { width: boxWidth });
    boxY += 15;

    doc.text(`Due date: ${formatDate(bill.dueDate)}`, boxX, boxY, { width: boxWidth });
    boxY += 15;

    doc.text(`Total payable: ₹${bill.amount}`, boxX, boxY, { width: boxWidth });


    // ===== CUSTOMER INFO =====
    doc.fontSize(11).fillColor("black").text(customer.name, 40, 200);
    doc.text(customer.address);
    doc.text(customer.email);
    doc.text(customer.phone);

    doc.moveDown(1);

    // ===== TABLE: Billing / Delivery / Seller =====
    const topY = 260;
    doc.fontSize(11).text("Billing address", 40, topY, { underline: true });
    doc.text(customer.name, 40, topY + 15);
    doc.text(customer.address, 40, topY + 30);

    doc.text("Delivery address", 220, topY, { underline: true });
    doc.text(customer.name, 220, topY + 15);
    doc.text(customer.address, 220, topY + 30);

    doc.text("Sold by", 400, topY, { underline: true });
    doc.text("OdishaTech Software Solutions Pvt. Ltd", 400, topY + 15);
    doc.text("Corporate Office, Bhubaneswar", 400, topY + 30);


    // ===== ORDER INFO =====
    doc.moveDown(6);
    doc.fontSize(12).fillColor("black").text("Order information", 40, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Order date: ${formatDate(bill.generatedDate)}`, 40);
    doc.text(`Order #: ORD-${bill.billId}`, 300);

    // ===== INVOICE DETAILS TABLE =====
    doc.moveDown(2);
    doc.fontSize(12).text("Invoice details", 40, doc.y, { underline: true });
    doc.moveDown(1);

    // Table Header
    const startX = 40;
    let y = doc.y;
    doc.fontSize(10).fillColor("black").text("Description", startX, y);
    doc.text("Qty", startX + 250, y);
    doc.text("Unit price", startX + 300, y);
    doc.text("Item subtotal", startX + 400, y);

    doc.moveTo(40, y + 12).lineTo(560, y + 12).stroke();

    // Table Row (Monthly Rent)
    y += 20;
    doc.text("Monthly Rent", startX, y);
    doc.text("1", startX + 250, y);
    doc.text(`₹${bill.amount}`, startX + 300, y);
    doc.text(`₹${bill.amount}`, startX + 400, y);

    // ===== TOTAL =====
    doc.moveDown(2);
    doc.fontSize(12).text("Invoice total", 40, doc.y);
    doc.font("Helvetica-Bold").text(`₹${bill.amount}`, 450, doc.y, { align: "right" });

    // ===== FOOTER =====
    doc.moveDown(4);
    doc.fontSize(9).fillColor("#555").text(
      "This is a computer-generated invoice and does not require a signature.",
      { align: "center" }
    );
    doc.text("For queries, contact billing@company.com", { align: "center" });
    doc.text("© 2025 OdishaTech Software Solutions Pvt. Ltd | All Rights Reserved", { align: "center" });

    doc.end();
    stream.on("finish", () => resolve(true));
    stream.on("error", reject);
  });
};


// ====================
// 🔹 Send Mail Invoice
// ====================
const sendInvoiceMail = async (customer, bill, invoicePath) => {
  // Setup transporter (use your SMTP or Gmail App Password)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    port: 465,
    secure: true
  });

  const mailOptions = {
    from: `"OdishaTech Billing Team" <${process.env.MAIL_USER}>`,
    to: `${customer.email},kumaranish1958@gmail.com`,
    subject: `OdishaTech | Invoice Confirmation - ${bill.billId} (${bill.month})`,
    html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #2c3e50; padding: 20px; background: #f9f9f9;">
      <div style="max-width: 650px; margin: auto; background: #ffffff; border: 1px solid #e1e1e1; border-radius: 8px; padding: 30px;">
        
        <!-- Header -->
        <div style="border-bottom: 2px solid #004080; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="color: #004080; margin: 0;">OdishaTech Software Solutions</h2>
          <p style="font-size: 13px; margin: 2px 0; color: #555;">infocity, Patia,Bhubanewar, India</p>
          <p style="font-size: 13px; margin: 2px 0; color: #555;">
            <a href="https://otss.netlify.app" target="_blank" style="color: #004080; text-decoration: none;">www.otss.com</a>
          </p>
        </div>

        <!-- Greeting -->
        <p style="font-size: 15px;">Dear <strong>${customer.name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">
          We acknowledge the receipt of your payment. Please find below the summary of your invoice for <strong>${bill.month}</strong>.  
          The detailed invoice is attached with this email for your records.
        </p>

        <!-- Invoice Summary Table -->
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f2f6fa;"><strong>Invoice ID</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bill.billId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f2f6fa;"><strong>Invoice Month</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bill.month}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f2f6fa;"><strong>Total Amount</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">₹${bill.amount}</td>
          </tr>
        </table>

        <!-- Support Info -->
        <p style="margin-top: 20px; font-size: 14px; line-height: 1.6;">
          Should you have any queries, please reach out to our support team at  
          <a href="mailto:support@otss.com" style="color: #004080; text-decoration: none;">support@otss.com</a>.
        </p>

        <!-- Footer -->
        <p style="margin-top: 40px; font-size: 14px; color: #333;">
          Best Regards,<br>
          <strong>OTSS Billing Team</strong>
        </p>

        <hr style="margin: 30px 0;">
        <p style="font-size: 11px; color: #777; line-height: 1.5;">
          This is an automated message from OdishaTech Softare Solutions. Please do not reply to this email.  
          <br>© ${new Date().getFullYear()}  OdishaTech Softare Solution Private Limited. All rights reserved.
        </p>
      </div>
    </div>
  `,
    attachments: [
      {
        filename: `${bill.billId}.pdf`,
        path: invoicePath,
      },
    ],
  };


  await transporter.sendMail(mailOptions);
};


// ✅ Get All Payments
const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find();
  return res
    .status(200)
    .json(new ApiResponse(200, payments, "Payments fetched successfully"));
});

// ✅ Get Payment By ID
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ paymentId: req.params.id });
  if (!payment) throw new ApiError(404, "Payment not found");
  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment fetched successfully"));
});

const getPaymentByBillId = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ billId: req.params.id });
  if (!payment) throw new ApiError(404, "Payment not found");
  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment fetched successfully"));
});
// ✅ Delete Payment
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOneAndDelete({ paymentId: req.params.id });
  if (!payment) throw new ApiError(404, "Payment not found");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Payment deleted successfully"));
});

export { createPayment, getPayments, getPaymentById, deletePayment, getPaymentByBillId };
