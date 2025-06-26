import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
// import { useParams } from "react-router-dom";
// const { buyerName } = useParams();


const BuyerTransaction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { buyer_name, buyer_gst } = location.state || {};

  const [invoices, setInvoices] = useState([]);
  const [buyerDeposits, setBuyerDeposits] = useState([]);
  const [error, setError] = useState("");
  const tableRef = useRef();
  const token = localStorage.getItem("access_token");

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

    if (!buyer_gst) {
      setError("Missing buyer details. Please go back and try again.");
      return;
    }

    // Fetch invoices
    fetch("http://localhost:8000/api/invoices/", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Invoice fetch failed (status ${res.status})`);
        }
        return res.json();
      })
      .then((all) => {
        const filtered = all.filter(
          (i) =>
            i.buyer_gst?.trim().toLowerCase() ===
            buyer_gst?.trim().toLowerCase()
        );
        console.log("Filtered Invoices:", filtered);
        setInvoices(filtered);
      })
      .catch((err) => setError(err.toString()));
  }, [buyer_gst, token]);

  useEffect(() => {
    if (!token) return;

    // Fetch deposits
    fetch("http://localhost:8000/api/banking/buyer/", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Deposit fetch failed (status ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Buyer Deposits:", data);
        setBuyerDeposits(data);
      })
      .catch(() => setBuyerDeposits([]));
  }, [token]);

  const handleGeneratePDF = async () => {
    const element = tableRef.current;
    element.style.backgroundColor = "#fff";

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#fff",
      useCORS: true,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;

    const pdfWidth = pageWidth - margin * 2;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      margin,
      margin,
      pdfWidth,
      pdfHeight
    );

    pdf.save(`Statement-${buyer_name}.pdf`);
  };

  const renderTableRows = () => {
    let balance = 0;
    const rows = [];

    invoices.forEach((inv) => {
      const total = Number(inv.total_with_gst) || 0;
      balance += total;

      rows.push(
        <tr key={`inv-${inv.invoice_number}`} className="bg-red-50 font-semibold">
          <td>{formatDate(inv.invoice_date)}</td>
          <td>{inv.invoice_number}</td>
          <td className="text-right">-</td>
          <td className="text-right">
            {inv.currency} {total.toFixed(2)}
          </td>
          <td className="text-right">
            {inv.currency} {balance.toFixed(2)}
          </td>
        </tr>
      );

      buyerDeposits
        .filter(
          (d) =>
            d.buyer_name?.trim().toLowerCase() ===
              inv.buyer_name?.trim().toLowerCase() ||
            d.buyer_gst?.trim().toLowerCase() ===
              inv.buyer_gst?.trim().toLowerCase()
        )
        .forEach((dep, i) => {
          const amount = Number(dep.amount) || 0;
          balance -= amount;

          rows.push(
            <tr key={`dep-${inv.invoice_number}-${i}`} className="bg-green-50">
              <td>{formatDate(dep.transaction_date)}</td>
              <td>{dep.notice || "Deposit"}</td>
              <td className="text-right">
                {inv.currency} {amount.toFixed(2)}
              </td>
              <td className="text-right">-</td>
              <td className="text-right">
                {inv.currency} {balance.toFixed(2)}
              </td>
            </tr>
          );
        });
    });

    return { rows, balance, currency: invoices[0]?.currency || "₹" };
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

  const { rows, balance, currency } = renderTableRows();

  return (
    <div className="mx-auto bg-white p-6 rounded shadow-md" style={{ paddingLeft: "100px", minHeight: "100vh" }}>
      <div ref={tableRef}>
        <h2 className="text-2xl font-bold text-center mb-6">Statement of Account</h2>
        <div className="mb-4">
          <p><strong>Buyer Name:</strong> {buyer_name}</p>
          <p><strong>GST Number:</strong> {buyer_gst}</p>
        </div>

        <h4 className="w-full text-center py-2" style={{ backgroundColor: "#51add9" }}>Account Activity</h4>
        <table className="w-100 text-sm border mt-2">
          <thead>
            <tr>
              <th className="text-left p-2 border">Date</th>
              <th className="text-left p-2 border">Description</th>
              <th className="text-right p-2 border">Credit (Deposit)</th>
              <th className="text-right p-2 border">Debit (Invoice)</th>
              <th className="text-right p-2 border">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            <tr className="bg-gray-200 font-bold">
              <td colSpan={4} className="text-right p-2 border">Remaining Balance:</td>
              <td className="text-right p-2 border">
                {currency} {balance.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pt-4 d-flex justify-content-around">
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          ← Go Back
        </button>
        <button
          onClick={handleGeneratePDF}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          📄 Generate PDF
        </button>
      </div>
    </div>
  );
};

export default BuyerTransaction;
