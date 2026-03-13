import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BillRecord } from "@/services/billingService";

export const generateBillPDF = (bill: BillRecord) => {
    const doc = new jsPDF();

    // Premium Header
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("cTrack", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Container Tracking & Billing System", 20, 32);

    doc.setFontSize(18);
    doc.text("INVOICE", 150, 25);

    // Bill Info Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 55);

    doc.setFont("helvetica", "normal");
    doc.text(bill.customerName || "Customer", 20, 62);

    doc.setFont("helvetica", "bold");
    doc.text("Bill Details:", 120, 55);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice No: ${bill.billNumber}`, 120, 62);
    doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, 120, 68);
    doc.text(`Due Date: ${new Date(bill.dueDate).toLocaleDateString()}`, 120, 74);
    doc.text(`Container: ${bill.containerNumber}`, 120, 80);
    doc.text(`Status: ${bill.status.toUpperCase()}`, 120, 86);
    if (bill.status === "paid" && bill.paymentMethod) {
        const methodLabel = bill.paymentMethod === "pda" ? "PDA" : "Online Payment";
        doc.text(`Payment Method: ${methodLabel}`, 120, 92);
    }

    // Table of Charges
    const tableData = bill.lineItems.map((item) => [
        item.activityName,
        item.quantity.toString(),
        `INR ${item.unitPrice.toLocaleString()}`,
        `INR ${item.amount.toLocaleString()}`,
    ]);

    autoTable(doc, {
        startY: 100,
        head: [["Activity", "Qty", "Unit Price", "Amount"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            3: { halign: "right" },
        },
    });

    // Total Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: INR ${bill.totalAmount.toLocaleString()}`, 140, finalY);

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for your business!", 75, 280);

    // Save PDF
    doc.save(`Invoice_${bill.billNumber}.pdf`);
};
