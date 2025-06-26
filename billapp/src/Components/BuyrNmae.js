import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BuyerInvoices = () => {
  const { buyerName } = useParams();
  const [buyerInvoices, setBuyerInvoices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("You are not authorized. Please log in.");
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:8000/api/invoices/by-buyer/?name=${buyerName}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.status === 401 || res.status === 403) {
          setError("Unauthorized access. Please log in again.");
          navigate("/login");
          return;
        }

        const data = await res.json();
        setBuyerInvoices(data);
      } catch (err) {
        console.error("Error fetching buyer invoices:", err);
        setError("Failed to fetch invoices. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [buyerName, navigate]);

  return (
    <div style={{ padding: "20px" }}>
      <h3>Invoices for: {buyerName}</h3>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <p>Loading invoices...</p>
      ) : (
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>No.</th>
              <th>Invoice Number</th>
              <th>Date</th>
              <th>Country</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {buyerInvoices.map((invoice, index) => (
              <tr key={invoice.id}>
                <td>{index + 1}</td>
                <td>{invoice.invoice_number}</td>
                <td>{invoice.invoice_date}</td>
                <td>{invoice.country}</td>
                <td>
                  <button
                    className="btn btn-success"
                    onClick={() =>
                      alert(`Downloading: ${invoice.invoice_number}`)
                    }
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BuyerInvoices;
