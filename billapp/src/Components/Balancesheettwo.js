import React, { useState, useEffect } from "react";

const BalanceSheettwo = () => {
  const [invoices, setInvoices] = useState([]);
  const [buyerTransactions, setBuyerTransactions] = useState([]);
  const [otherTransactions, setOtherTransactions] = useState([]);
  const [companyTransactions, setCompanyTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        const [invoicesRes, buyersRes, othersRes, companyRes] = await Promise.all([
          fetch("http://localhost:8000/api/invoices/", { headers }),
          fetch("http://localhost:8000/api/banking/buyer/", { headers }),
          fetch("http://localhost:8000/api/banking/other/", { headers }),
          fetch("http://localhost:8000/api/banking/company/", { headers }),
        ]);

        if (!invoicesRes.ok || !buyersRes.ok || !othersRes.ok || !companyRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const invoicesData = await invoicesRes.json();
        const buyersData = await buyersRes.json();
        const othersData = await othersRes.json();
        const companyData = await companyRes.json();

        setInvoices(invoicesData);
        setBuyerTransactions(buyersData);
        setOtherTransactions(othersData);
        setCompanyTransactions(companyData);
      } catch (err) {
        setError(err.message || "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  // Group invoices by buyer + currency
  const invoiceTotals = {};
  const latestInvoiceDates = {};

  invoices.forEach((inv) => {
    const key = `${inv.buyer_name}__${inv.currency || "INR"}`;
    const date = new Date(inv.invoice_date);

    invoiceTotals[key] = (invoiceTotals[key] || 0) + Number(inv.total_with_gst || 0);

    if (!latestInvoiceDates[key] || date > new Date(latestInvoiceDates[key])) {
      latestInvoiceDates[key] = inv.invoice_date;
    }
  });

  // Group deposits by buyer + currency (assuming INR if currency missing)
  const buyerDeposits = {};
  const latestBuyerDepositDates = {};

  buyerTransactions.forEach((t) => {
    const currency = "INR"; // You can adjust if buyerTransactions API has currency field
    const key = `${t.buyer_name}__${currency}`;
    buyerDeposits[key] = (buyerDeposits[key] || 0) + Number(t.deposit_amount || 0);

    const depositDate = new Date(t.transaction_date || t.created_at || null);
    if (depositDate && (!latestBuyerDepositDates[key] || depositDate > new Date(latestBuyerDepositDates[key]))) {
      latestBuyerDepositDates[key] = t.transaction_date || t.created_at;
    }
  });

  // Combine balances by buyer + currency
  const balances = {};
  const allKeys = new Set([...Object.keys(invoiceTotals), ...Object.keys(buyerDeposits)]);
  allKeys.forEach((key) => {
    const invoiceAmt = invoiceTotals[key] || 0;
    const depositAmt = buyerDeposits[key] || 0;
    balances[key] = Math.round((invoiceAmt - depositAmt) * 100) / 100;
  });

  const buyersOweYou = Object.entries(balances).filter(([_, bal]) => bal > 0);
  const buyersYouOwe = Object.entries(balances).filter(([_, bal]) => bal < 0);

  // Filter other transactions by type
  const otherCredits = otherTransactions.filter((t) => t.transaction_type === "credit");
  const otherDebits = otherTransactions.filter((t) => t.transaction_type === "debit");

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 md:pl-24" style={{ paddingLeft: "100px" }}>
      <h1 className="text-2xl font-bold mb-6">Balance Sheet</h1>

      <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded">
        <h2 className="text-lg font-semibold">Total Deposits (INR only):</h2>
        <p className="text-xl font-mono">
          ₹{" "}
          {Object.entries(buyerDeposits)
            .filter(([key]) => key.endsWith("__INR"))
            .reduce((a, [, b]) => a + b, 0)
            .toFixed(2)}
        </p>
      </div>

      <div className="d-flex flex-row mb-6" style={{ display: "flex" }}>
        {/* Credit (You owe them) */}
        <div className="w-50 pr-4" style={{ flex: 1, marginRight: "20px" }}>
          <h2 className="text-lg font-semibold mb-2">Advance / Credit (You owe them)</h2>
          <table className="w-100 bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 border-b text-left">Name</th>
                <th className="py-3 px-4 border-b text-left">Date</th>
                <th className="py-3 px-4 border-b text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {buyersYouOwe.map(([key, bal]) => {
                const [name, currency] = key.split("__");
                // Show latest invoice or deposit date
                const date = latestInvoiceDates[key]
                  ? formatDate(latestInvoiceDates[key])
                  : latestBuyerDepositDates[key]
                  ? formatDate(latestBuyerDepositDates[key])
                  : "—";

                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">{name}</td>
                    <td className="py-3 px-4 border-b">{date}</td>
                    <td className="py-3 px-4 border-b text-right font-mono text-green-700 font-semibold">
                      {currency} {Math.abs(bal).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {otherCredits.map((entry, index) => (
                <tr key={`credit-${index}`} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{entry.other_type}</td>
                  <td className="py-3 px-4 border-b">{formatDate(entry.other_date || entry.created_at)}</td>
                  <td className="py-3 px-4 border-b text-right font-mono text-green-700 font-semibold">
                    ₹ {Math.abs(Number(entry.other_amount)).toFixed(2)}
                  </td>
                </tr>
              ))}
              {buyersYouOwe.length === 0 && otherCredits.length === 0 && (
                <tr>
                  <td className="py-3 px-4 border-b" colSpan={3}>
                    No advance/credit balances
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Debit (They owe you) */}
        <div className="w-50 pl-4" style={{ flex: 1 }}>
          <h2 className="text-lg font-semibold mb-2">Outstanding Balance (They owe you)</h2>
          <table className="w-100 bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b text-left">Name</th>
                <th className="py-3 px-4 border-b text-left">Date</th>
                <th className="py-3 px-4 border-b text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {buyersOweYou.map(([key, bal]) => {
                const [name, currency] = key.split("__");
                const date = latestInvoiceDates[key] ? formatDate(latestInvoiceDates[key]) : "—";
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">{name}</td>
                    <td className="py-3 px-4 border-b">{date}</td>
                    <td className="py-3 px-4 border-b text-right font-mono text-red-600 font-semibold">
                      {currency} {Math.abs(bal).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {otherDebits.map((entry, index) => (
                <tr key={`debit-${index}`} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{entry.other_type}</td>
                  <td className="py-3 px-4 border-b">{formatDate(entry.other_date || entry.created_at)}</td>
                  <td className="py-3 px-4 border-b text-right font-mono text-red-600 font-semibold">
                    ₹ {Math.abs(Number(entry.other_amount)).toFixed(2)}
                  </td>
                </tr>
              ))}
              {companyTransactions.map((entry, index) => (
                <tr key={`company-${index}`} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{entry.company_name}</td>
                  <td className="py-3 px-4 border-b">{formatDate(entry.transaction_date || entry.created_at)}</td>
                  <td className="py-3 px-4 border-b text-right font-mono text-red-600 font-semibold">
                    ₹ {Number(entry.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              {buyersOweYou.length === 0 && otherDebits.length === 0 && companyTransactions.length === 0 && (
                <tr>
                  <td className="py-3 px-4 border-b" colSpan={3}>
                    No outstanding balances
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheettwo;
