import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const OtherTypeTransactions = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const tableRef = useRef();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);


  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      setError("Unauthorized. Please login.");
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/banking/other/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch transactions.");
        const data = await res.json();
        const filtered = data.filter((txn) => txn.other_type === type);
        setTransactions(filtered);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [type, token]);

  const handleGeneratePDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Table columns
    const columns = [
      { header: "Date", dataKey: "date" },
      { header: "Description", dataKey: "description" },
      { header: "Credit (Deposit)", dataKey: "credit" },
      { header: "Debit (Invoice)", dataKey: "debit" },
      { header: "Balance (INR)", dataKey: "balance" },
    ];

    // Process rows for PDF
    let balance = 0;
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(a.other_date) - new Date(b.other_date)
    );

    const dataRows = sorted.map((txn) => {
      const rawAmount = Number(txn.other_amount || 0);
      const isCredit = txn.transaction_type === "credit";
      balance += rawAmount;

      return {
        date: formatDate(txn.other_date),
        description: txn.other_notice || "-",
        credit: isCredit ? `INR ${rawAmount.toFixed(2)}` : "-",
        debit: !isCredit ? `INR ${Math.abs(rawAmount).toFixed(2)}` : "-",
        balance: `INR ${Math.abs(balance).toFixed(2)}`,
      };
    });

    // Add title and metadata
    pdf.setFontSize(16);
    pdf.text("Other Transactions Statement", pageWidth / 2, 15, { align: "center" });

    pdf.setFontSize(10);
    if (fromDate || toDate) {
      const fromText = fromDate ? `From: ${formatDate(fromDate)}` : "";
      const toText = toDate ? `To: ${formatDate(toDate)}` : "";
      pdf.text(`Statement ${fromText} ${toText}`, pageWidth / 2, 23, { align: "center" });
    }

    pdf.setFontSize(12);
    let currentY = 29;
    pdf.text(`Type: ${type}`, margin, currentY);
    currentY += 7;
    pdf.text(`Total Balance: INR ${Math.abs(balance).toFixed(2)}`, margin, currentY);
    currentY += 6;

    // 1️⃣ Add total summary row to dataRows
    dataRows.push({
      date: "",
      description: "Total Balance:",
      credit: `INR ${totalCredit.toFixed(2)}`,
      debit: `INR ${Math.abs(totalDebit).toFixed(2)}`,
      balance: `INR ${Math.abs(balance).toFixed(2)}`
    });
    let lastRowIndex = dataRows.length - 1;

    // Add table
    pdf.autoTable({
      startY: currentY,
      head: [columns.map(col => col.header)],
      body: dataRows.map(row => Object.values(row)),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { top: 10 },
      theme: "striped",
      showHead: "everyPage",
      didParseCell: function (data) {
        if (data.row.index === lastRowIndex) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.halign = 'right';
          data.cell.styles.halign = 'right';
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [12, 74, 110];
        }
      },
      didDrawPage: function (data) {
        const pageCount = pdf.internal.getNumberOfPages();
        const pageSize = pdf.internal.pageSize;
        const pageHeight = pageSize.height || pageSize.getHeight();

        pdf.setFontSize(8);
        const pageNumberText = `Page ${pdf.internal.getCurrentPageInfo().pageNumber} of {totalPages}`;
        pdf.text(pageNumberText, pageWidth / 2, pageHeight - 10, {
          align: "center"
        });
      }
    });

    // Save PDF
    // Replace placeholder with actual total page count
    pdf.putTotalPages("{totalPages}");
    pdf.save(`Other-Transactions-${type}.pdf`);
  };


  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  // ✅ Filter transactions based on date range
  const filteredTransactions = transactions.filter((txn) => {
    const txnDate = new Date(txn.other_date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return (
      (!from || txnDate >= from) &&
      (!to || txnDate <= to)
    );
  });

  let balance = 0;
  let totalCredit = 0;
  let totalDebit = 0;
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(a.other_date) - new Date(b.other_date)
  );

  const rows = sortedTransactions.map((txn) => {
    const rawAmount = Number(txn.other_amount || 0);
    const isCredit = txn.transaction_type === "credit";
    if (isCredit) {
      totalCredit += rawAmount;
    } else {
      totalDebit += rawAmount;
    }

    balance += rawAmount;

    return (
      <tr key={txn.id}>
        <td className="text-center">{formatDate(txn.other_date)}</td>
        <td className="text-center">{txn.other_notice || "-"}</td>
        <td className="text-right">
          {isCredit ? `₹ ${rawAmount.toFixed(2)}` : "-"}
        </td>
        <td className="text-right">
          {!isCredit ? `₹ ${Math.abs(rawAmount).toFixed(2)}` : "-"}
        </td>
        <td className="text-right">₹ {Math.abs(balance).toFixed(2)}</td>
      </tr>
    );
  });

  if (loading) return <p className="text-center p-4">Loading...</p>;
  if (error)
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

  return (
    <div className="statement-container">
      {/* ✅ Date Filter Section */}


      <div ref={tableRef}>
        <h2 className="statement-heading">Other Transactions Statement</h2>

        {/* 👇 Visible on screen - date filters */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="mb-4 fs-5">
            <p>
              <strong>Name:</strong> {type}
            </p>
            <p>
              <strong>Total Balance:</strong> ₹ {Math.abs(balance).toFixed(2)}
            </p>
          </div>

          {/* Date Inputs - only shown on screen */}
          <div className="mb-4 flex gap-4 items-center w-full">
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
              <th>Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            <tr className="remaining-balance">
              <td colSpan={2} className="text-end p-2">
                Total Amount:
              </td>
              <td className="text-right p-2">{totalCredit.toFixed(2)}</td>
              <td className="text-right p-2">{Math.abs(totalDebit).toFixed(2)}</td>
              <td className="text-right p-2">{Math.abs(balance).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="statement-actions">
        <button onClick={() => navigate(-1)} className="action-btn back-btn">
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

export default OtherTypeTransactions;
