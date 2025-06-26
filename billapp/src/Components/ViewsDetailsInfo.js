// ViewsDetailsInfo.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ViewsDetailsInfo = () => {
  const { buyer_name } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");
        if (!token) {
          setError("User is not authenticated");
          setInvoices([]);
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/api/invoices/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Unauthorized access. Please login again.");
            // Optionally redirect to login page here
            // navigate("/login");
          } else {
            throw new Error("Failed to fetch invoices");
          }
          setInvoices([]);
          setLoading(false);
          return;
        }

        const data = await response.json();
        const filtered = data.filter(
          (invoice) => invoice.buyer_name === buyer_name
        );
        setInvoices(filtered);
      } catch (error) {
        console.error(error);
        setError(error.message || "Something went wrong");
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [buyer_name, navigate]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Invoice Details for {buyer_name}</h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : invoices.length === 0 ? (
        <p>No invoices found for this buyer.</p>
      ) : (
        <table className="w-full table-auto border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Invoice No</th>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Amount</th>
              <th className="border px-2 py-1">GST</th>
              <th className="border px-2 py-1">Country</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="border px-2 py-1">{inv.invoice_number}</td>
                <td className="border px-2 py-1">{inv.invoice_date}</td>
                <td className="border px-2 py-1">{inv.total_amount}</td>
                <td className="border px-2 py-1">{inv.buyer_gst}</td>
                <td className="border px-2 py-1">{inv.country}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
    </div>
  );
};

export default ViewsDetailsInfo;
