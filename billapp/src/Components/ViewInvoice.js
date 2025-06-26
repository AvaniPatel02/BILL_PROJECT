import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const invoices = [
  { id: 1, name: "shyam patel", billNumber: "01", date: "04/04/2025", amount: 5000 },
  { id: 2, name: "parth patel", billNumber: "02", date: "04/04/2025", amount: 7500 },
  { id: 3, name: "raj shah", billNumber: "03", date: "04/04/2025", amount: 3200 },
  { id: 4, name: "shyam patel", billNumber: "04", date: "05/04/2025", amount: 2000 },
  { id: 5, name: "parth patel", billNumber: "05", date: "06/04/2025", amount: 1500 },
];

const ViewInvoice = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      // No token, redirect to login page
      navigate("/login");
    }
    // Optional: You can also call your backend API here to verify token validity
  }, [navigate]);

  const matchedInvoices = invoices.filter(
    (invoice) => invoice.name.toLowerCase() === decodedName.toLowerCase()
  );

  if (matchedInvoices.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <h3>No invoices found for {decodedName}</h3>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: "100px" }}>
      <h2>Invoices for {decodedName}</h2>
      <table className="table table-bordered mt-3">
        <thead className="thead-dark">
          <tr>
            <th>Name</th>
            <th>Bill Number</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {matchedInvoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.name}</td>
              <td>{invoice.billNumber}</td>
              <td>{invoice.date}</td>
              <td>${invoice.amount.toFixed(2)}</td>
              <td>
                <button
                  className="btn btn-info btn-sm me-2"
                  onClick={() => alert(`Viewing invoice #${invoice.billNumber}`)}
                >
                  View
                </button>
                <button
                  className="btn btn-success btn-sm me-2"
                  onClick={() => alert(`Downloading invoice #${invoice.billNumber}`)}
                >
                  Download
                </button>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => navigate("/new-bill")}
                >
                  New Bill
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-primary mt-3" onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>
    </div>
  );
};

export default ViewInvoice;
