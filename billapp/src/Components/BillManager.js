import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BillManager = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [category, setCategory] = useState("all");
  const [allCombined, setAllCombined] = useState([]);

  const [invoices, setInvoices] = useState([]);
  const [groupedClients, setGroupedClients] = useState([]);
  const [otherTransactions, setOtherTransactions] = useState([]);
  const [buyerTransactions, setBuyerTransactions] = useState([]);
  const [groupedBuyers, setGroupedBuyers] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Authentication token not found.");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch Invoices
      const invoiceRes = await fetch("http://localhost:8000/api/invoices/", { headers });
      if (!invoiceRes.ok) throw new Error("Failed to fetch invoices.");
      const invoiceData = await invoiceRes.json();
      setInvoices(invoiceData);

      const grouped = {};
      invoiceData.forEach((invoice) => {
        const key = `${invoice.buyer_name}-${invoice.buyer_gst}-${invoice.buyer_address}`;
        if (!grouped[key]) {
          grouped[key] = {
            buyer_name: invoice.buyer_name,
            buyer_gst: invoice.buyer_gst,
            buyer_address: invoice.buyer_address,
            invoices: [invoice],
          };
        } else {
          grouped[key].invoices.push(invoice);
        }
      });
      setGroupedClients(Object.values(grouped));

      const otherRes = await fetch("http://localhost:8000/api/banking/other/", { headers });
      if (!otherRes.ok) throw new Error("Failed to fetch 'other' transactions.");
      const otherData = await otherRes.json();
      setOtherTransactions(otherData);

      const buyerRes = await fetch("http://localhost:8000/api/banking/buyer/", { headers });
      if (!buyerRes.ok) throw new Error("Failed to fetch buyer transactions.");
      const buyerData = await buyerRes.json();
      setBuyerTransactions(buyerData);

      const groupedBuyerMap = buyerData.reduce((acc, txn) => {
        const key = txn.buyer_name;
        if (!acc[key]) {
          acc[key] = txn;
        }
        return acc;
      }, {});
      setGroupedBuyers(Object.values(groupedBuyerMap));

      const combined = [
        ...invoiceData.map((inv) => ({
          source: "Invoice",
          name: inv.buyer_name,
          amount: inv.total_amount,
          date: inv.invoice_date,
          note: inv.note || "-",
          original: inv,
        })),
        ...otherData.map((txn) => ({
          source: "Other",
          name: txn.other_type,
          amount: txn.other_amount,
          date: txn.other_date,
          note: txn.other_notice || "-",
          original: txn,
        })),
        ...buyerData.map((txn) => ({
          source: "Buyer",
          name: txn.buyer_name,
          amount: txn.amount,
          date: txn.transaction_date,
          note: txn.notice || "-",
          original: txn,
        })),
      ];

      const uniqueMap = new Map();
      combined.forEach((txn) => {
        const key = `${txn.source}-${txn.name}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, txn);
        }
      });
      setAllCombined(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = groupedClients.filter((client) =>
    client.buyer_name.toLowerCase().includes(filterText.toLowerCase()) ||
    client.buyer_gst.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredOther = otherTransactions.filter((txn, index, self) =>
    index === self.findIndex(t => t.other_type === txn.other_type) &&
    (
      txn.other_type?.toLowerCase().includes(filterText.toLowerCase()) ||
      txn.other_amount?.toString().includes(filterText)
    )
  );

  const filteredBuyers = groupedBuyers.filter((txn, index, self) =>
    index === self.findIndex(t => t.buyer_name === txn.buyer_name) &&
    (
      txn.buyer_name?.toLowerCase().includes(filterText.toLowerCase()) ||
      txn.amount?.toString().includes(filterText)
    )
  );

  return (
    <div style={{ padding: "10px 21px 10px 82px" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      <h3>Bill Manager</h3>

      <div className="mb-3 d-flex align-items-center gap-2">
        <select
          className="form-select"
          style={{ maxWidth: "200px" }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="invoice">Invoice</option>
          <option value="buyer">Buyer</option>
          <option value="other">Other</option>
          <option value="all">All</option>
        </select>

        <input
          type="text"
          className="form-control"
          placeholder={`Filter by ${category === "other"
              ? "Type or Amount"
              : category === "buyer"
                ? "Buyer Name or Amount"
                : "Name or GST"
            }`}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ maxWidth: "300px" }}
        />
        <button className="action-btn clear" onClick={() => setFilterText("")}>
          Clear
        </button>
      </div>

      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {category === "all" && (
            <>
              <h4>All Transactions</h4>
              {allCombined.length === 0 ? (
                <p>No transactions found.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Type</th>
                      <th>Name</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCombined
                      .filter((txn) =>
                        txn.source.toLowerCase().includes(filterText.toLowerCase()) ||
                        txn.name.toLowerCase().includes(filterText.toLowerCase()) ||
                        txn.note.toLowerCase().includes(filterText.toLowerCase()) ||
                        txn.amount.toString().includes(filterText)
                      )
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((txn, index) => (
                        <tr
                          key={index}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            const { source, original } = txn;
                            if (source === "Invoice") {
                              navigate("/invoice-details/:id", {
                                state: {
                                  buyer_name: original.buyer_name,
                                  buyer_gst: original.buyer_gst,
                                },
                              });
                            } else if (source === "Other") {
                              navigate(`/banking/other-type/${original.other_type}`);
                            } else if (source === "Buyer") {
                              navigate(`/banking/buyer/${original.buyer_name}`, {
                                state: { buyer_name: original.buyer_name },
                              });
                            }
                          }}
                        >
                          <td>{index + 1}</td>
                          <td>{txn.source}</td>
                          <td>{txn.name}</td>
                          <td>{Math.abs(txn.amount).toFixed(2)}</td>
                          <td>{txn.date ? new Date(txn.date).toLocaleDateString("en-GB") : "-"}</td>
                          <td>{txn.note}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {category === "invoice" && (
            <>
              {filteredClients.length === 0 ? (
                <p>No buyers found.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Buyer Name</th>
                      <th>GST Number</th>
                      <th>Invoice Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client, index) => (
                      <tr
                        key={index}
                        style={{ cursor: "pointer" }}
                         className="address-hover" title="click to open"
                        onClick={() =>
                          navigate("/invoice-details/:id", {
                            state: {
                              buyer_name: client.buyer_name,
                              buyer_gst: client.buyer_gst,
                            },
                          })
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{client.buyer_name}</td>
                        <td>{client.buyer_gst}</td>
                        <td>{client.invoices.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {category === "other" && (
            <>
              <h4>Other Banking Transactions</h4>
              {filteredOther.length === 0 ? (
                <p>No transactions found.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Transaction Type</th>
                      <th>Other Type</th>
                      <th>Amount (₹)</th>
                      <th>Date</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOther.map((txn, index) => (
                      <tr
                        key={index}
                        style={{ cursor: "pointer" }}className="address-hover" title="click to open"
                        onClick={() => navigate(`/banking/other-type/${txn.other_type}`)}
                      >
                        <td>{index + 1}</td>
                        <td>{txn.transaction_type}</td>
                        <td>{txn.other_type}</td>
                        <td>{txn.other_amount}</td>
                        <td>{new Date(txn.other_date).toLocaleDateString("en-GB")}</td>
                        <td>{txn.other_notice || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {category === "buyer" && (
            <>
              <h4>Buyer Banking Transactions</h4>
              {filteredBuyers.length === 0 ? (
                <p>No transactions found.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Buyer Name</th>
                      <th>Amount (₹)</th>
                      <th>Date</th>
                      <th>Note</th>
                      <th>Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBuyers.map((txn, index) => (
                      <tr
                        key={index}
                        style={{ cursor: "pointer" }}className="address-hover" title="click to open"
                        onClick={() =>
                          navigate(`/banking/buyer/${txn.buyer_name}`, {
                            state: { buyer_name: txn.transaction_date },
                          })
                        }


                      >
                        <td>{index + 1}</td>
                        <td>{txn.buyer_name}</td>
                        <td>{txn.amount}</td>
                        <td>{new Date(txn.transaction_date).toLocaleDateString("en-GB")}</td>
                        <td>{txn.notice || "-"}</td>
                        <td>{txn.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BillManager;
