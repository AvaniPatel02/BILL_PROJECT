import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
// import html2canvas from "html2canvas";
import './style/invoiceDetail.css';

const getCurrencySymbol = (currencyCode) => {
  switch (currencyCode) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    // Add more as needed
    default:
      return currencyCode || "";
  }
};

const InvoiceDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { buyer_name, buyer_gst } = location.state || {};
  const [invoices, setInvoices] = useState([]);
  const [buyerDeposits, setBuyerDeposits] = useState([]);
  const [error, setError] = useState("");
  const tableRef = useRef();
  const token = localStorage.getItem("access_token");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  useEffect(() => {
    if (!token) {
      setError("Unauthorized access. Please login.");
      return;
    }

    fetch("http://localhost:8000/api/invoices/", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed to fetch invoices")))
      .then((all) => setInvoices(
        all.filter((i) =>
          (i.buyer_name || "").trim().toLowerCase() === (buyer_name || "").trim().toLowerCase()
        )
      ))
      .catch((err) => setError(err.toString()));
  }, [buyer_name, token]);

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:8000/api/banking/company/", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed to fetch deposits")))
      .then(setBuyerDeposits)
      .catch(() => setBuyerDeposits([]));
  }, [token]);

  const handleGeneratePDF = () => {
    setIsGeneratingPDF(true);
    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let cursorY = 15;

    // PDF Header
    doc.setFontSize(14);
    doc.text("Statement of Account", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 10;

    // ➕ Add date range info if selected
    if (fromDate || toDate) {
      const dateText = `Statement${fromDate ? ` From: ${formatDate(fromDate)}` : ""}${toDate ? ` To: ${formatDate(toDate)}` : ""}`;
      doc.setFontSize(10);
      doc.text(dateText, pageWidth / 2, cursorY, { align: "center" });
      cursorY += 8;
    }

    doc.setFontSize(11);
    doc.text(`Name: ${buyer_name}`, margin, cursorY);
    cursorY += 6;
    doc.text(`GST Number: ${buyer_gst}`, margin, cursorY);
    cursorY += 6;

    const { rows, balance, currency } = renderTableRows();

    // ✅ Total balance at the top
    doc.text(`Total Balance: INR ${Math.abs(balance).toFixed(2)}`, margin, cursorY);
    cursorY += 10;

    const tableRows = [];
    const cellStyles = [];

    rows.forEach(row => {
      const cells = [];
      const styles = [];

      Array.from(row.props.children).forEach((cell, colIndex) => {
        let val = cell.props.children;
        if (Array.isArray(val)) val = val.join(" ");
        if (typeof val !== "string" && typeof val !== "number") val = "";

        if (colIndex === 1) {
          const isInvoiceNumber = /^\d{2}-\d{4}\/\d{4}$/.test(val);
          styles.push({ halign: isInvoiceNumber ? "center" : "left" });
        } else if (colIndex >= 2) {
          styles.push({ halign: "right" }); // ✅ Align Credit, Debit, Balance
        } else {
          styles.push({});
        }

        cells.push(val);
      });

      tableRows.push(cells);
      cellStyles.push(styles);
    });

    // ✅ Add Total Balance row at end in last column
    const totalRow = ["", "Total Balance:", `INR ${totalCredit.toFixed(2)}`, `INR ${totalDebit.toFixed(2)}`, `INR ${Math.abs(balance).toFixed(2)}`];
    tableRows.push(totalRow);
    cellStyles.push([
      { fillColor: [241, 245, 249], textColor: [12, 74, 110] },
      { fontStyle: "bold", halign: "right", fillColor: [241, 245, 249], textColor: [12, 74, 110] },
      { halign: "right", fontStyle: "bold", fillColor: [241, 245, 249], textColor: [12, 74, 110] },
      { halign: "right", fontStyle: "bold", fillColor: [241, 245, 249], textColor: [12, 74, 110] },
      { halign: "right", fontStyle: "bold", fillColor: [241, 245, 249], textColor: [12, 74, 110] }
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [['Date', 'Description', 'Credit (Deposit)', 'Debit (Invoice)', 'Balance']],
      body: tableRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [111, 113, 114] },
      margin: { left: margin, right: margin },
      didParseCell: function (data) {
        const rowIndex = data.row.index;
        const columnIndex = data.column.index;

        if (cellStyles[rowIndex] && cellStyles[rowIndex][columnIndex]) {
          Object.assign(data.cell.styles, cellStyles[rowIndex][columnIndex]);
        }
      },
      didDrawPage: function () {
        const pageHeight = doc.internal.pageSize.getHeight();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setFontSize(8);
        doc.text(`Page ${currentPage} of {totalPages}`, pageWidth / 2, pageHeight - 8, {
          align: "center",
        });
      }
    });

    doc.putTotalPages("{totalPages}");
    doc.save(`Statement-${buyer_name}.pdf`);
    setIsGeneratingPDF(false);
  };


  const renderTableRows = () => {
    let balance = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    const rows = [];

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    // Filter invoices if invoice date is in range OR it has any deposit in range
    const filteredInvoices = invoices.filter((inv) => {
      const invDate = new Date(inv.invoice_date);
      const inInvoiceRange = (!from || invDate >= from) && (!to || invDate <= to);

      const hasDepositInRange = buyerDeposits.some((d) => {
        if (d.invoice_id !== inv.invoice_number) return false;
        const depDate = new Date(d.transaction_date);
        return (!from || depDate >= from) && (!to || depDate <= to);
      });

      return inInvoiceRange || hasDepositInRange;
    });

    // Group by invoice-number prefix (first two characters), as before
    const invoiceGroups = {};
    filteredInvoices.forEach((inv) => {
      const prefix = inv.invoice_number?.substring(0, 2);
      if (!invoiceGroups[prefix]) {
        invoiceGroups[prefix] = [];
      }
      invoiceGroups[prefix].push(inv);
    });

    // Sort prefixes descending (so "07" appears above "06")
    const sortedPrefixes = Object.keys(invoiceGroups).sort((a, b) => Number(b) - Number(a));

    sortedPrefixes.forEach((prefix) => {
      const group = invoiceGroups[prefix].sort(
        (a, b) => new Date(a.invoice_date) - new Date(b.invoice_date)
      );

      group.forEach((inv) => {
        const total = Number(inv.total_with_gst) || 0;
        const invDate = new Date(inv.invoice_date);
        balance -= total; // Decrease balance for debit transaction
        totalDebit += total;
        rows.push(
          <tr key={`inv-${inv.invoice_number}`} className="bg-red-50 font-semibold">
            <td className="text-center">{formatDate(inv.invoice_date)}</td>
            <td className="text-center">{inv.invoice_number}</td>
            <td className="text-right">-</td>
            <td className="text-right">
              {getCurrencySymbol(inv.currency)} {total.toFixed(2)}
            </td>
            <td className="text-right">
              {getCurrencySymbol(inv.currency)} {Math.abs(balance).toFixed(2)}
            </td>
          </tr>
        );
        // Now render any deposits for this invoice that fall in the date range
        const deposits = buyerDeposits
          .filter((d) => d.invoice_id === inv.invoice_number)
          .filter((d) => {
            const depDate = new Date(d.transaction_date);
            return (!from || depDate >= from) && (!to || depDate <= to);
          })
          .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

        deposits.forEach((dep, i) => {
          const amount = Number(dep.amount) || 0;
          balance += amount; // Increase balance for credit transaction
          totalCredit += amount;
          rows.push(
            <tr key={`dep-${inv.invoice_number}-${i}`} className="bg-green-50">
              <td className="text-center">{formatDate(dep.transaction_date)}</td>
              <td>{dep.notice || "Deposit"}</td>
              <td className="text-right">
                {getCurrencySymbol(inv.currency)} {amount.toFixed(2)}
              </td>
              <td className="text-right">-</td>
              <td className="text-right">
                {getCurrencySymbol(inv.currency)} {Math.abs(balance).toFixed(2)}
              </td>
            </tr>
          );
        });
      });
    });

    return { rows, balance, currency: invoices[0]?.currency || "", totalCredit, totalDebit };
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold mb-2 text-red-600">{error}</h2>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (!invoices.length) {
    return <div className="text-center p-6 text-lg">Loading invoices...</div>;
  }

  const { rows, balance, currency, totalCredit, totalDebit } = renderTableRows();

  return (
    <div className="statement-container">
      <div ref={tableRef}>
        <h2 className="statement-heading">Statement of Account</h2>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="mb-4 fs-5">
            <p><strong>Name:</strong> {buyer_name}</p>
            <p><strong>GST Number:</strong> {buyer_gst}</p>
            <p><strong>Total Balance:</strong> {Math.abs(balance).toFixed(2)}</p>
          </div>
          <div className="mb-4 flex gap-4 items-center">
            {!isGeneratingPDF ? (
              <>
                <div>
                  <label className="block font-semibold">From Date:</label> <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border rounded px-2 py-1"
                    style={{ width: "250px" }}
                  />
                </div>
                <div>
                  <label className="block font-semibold">To Date:</label> <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border rounded px-2 py-1"
                    style={{ width: "250px" }}
                  />
                </div>
              </>
            ) : (
              (fromDate || toDate) && (
                <div className="text-right font-semibold text-sm ml-auto">
                  Statement
                  {fromDate && ` From: ${formatDate(fromDate)}`}
                  {toDate && ` To: ${formatDate(toDate)}`}
                </div>
              )
            )}
          </div>
        </div>

        <h4 className="activity-title">Account Activity</h4>
        <table className="statement-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Credit (Deposit)</th>
              <th>Debit (Invoice)</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            <tr className="remaining-balance">
              <td colSpan={2} className="text-end p-2">Total Balance:</td>
              <td className="text-right p-2">
                {getCurrencySymbol(currency)} {renderTableRows().totalCredit.toFixed(2)}
              </td>
              <td className="text-right p-2">
                {getCurrencySymbol(currency)}  {renderTableRows().totalDebit.toFixed(2)}
              </td>
              <td className="text-right p-2">
                {getCurrencySymbol(currency)} {Math.abs(balance).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="statement-actions">
        <button
          onClick={() => navigate(-1)}
          className="action-btn back-btn"
        >
          ← Go Back
        </button>
        <button
          onClick={handleGeneratePDF}
          className="button-sumbit-banking btn-all"
        >
          📄 Generate PDF
        </button>
      </div>
    </div>
  );
};

export default InvoiceDetails;
