import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const YearDetails = () => {
  const { yearRange } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [groupedClients, setGroupedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setError("You must be logged in to view this page.");
          setLoading(false);
          navigate("/login");
          return;
        }

        const res = await fetch("http://localhost:8000/api/invoices", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 401) {
          setError("Unauthorized. Please log in again.");
          setLoading(false);
          localStorage.removeItem("access_token");
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error("Error fetching invoices");

        const data = await res.json();

        const [startYear, endYear] = yearRange.split("-").map(Number);
        const filtered = data.filter((invoice) => {
          const date = new Date(invoice.invoice_date);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          return month >= 4 ? year === startYear : year === endYear;
        });

        setInvoices(filtered);

        const grouped = groupInvoicesByNameAddressGst(filtered);
        setGroupedClients(grouped);
      } catch (err) {
        setError("Failed to fetch invoices.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (yearRange?.match(/^\d{4}-\d{4}$/)) {
      fetchInvoices();
    } else {
      setError("Invalid year format.");
      setLoading(false);
    }
  }, [yearRange, navigate]);

  return (
    <div className="year_container">
      <h2>Year: {yearRange}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : (
        <table className="custom-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Buyer Name</th>
              <th>GST Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedClients.map((client, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{client.buyer_name}</td>
                <td>{client.buyer_gst || 'N/A'}</td>
                <td>
                  <div className="tooltip-container">
                    <button
                      className="view-button"
                      onClick={() => {
                        navigate("/client-invoices", {
                          state: {
                            client: {
                              buyer_name: client.buyer_name,
                              buyer_gst: client.buyer_gst,
                              buyer_address: client.buyer_address,
                              invoices: client.invoices,
                            },
                          },
                        });
                      }}
                    >
                      <i className="fa-regular fa-eye"></i>
                    </button>
                    <span className="tooltip-text">View</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

function groupInvoicesByNameAddressGst(invoices) {
  const grouped = {};
  invoices.forEach((invoice) => {
    // Normalize fields for grouping
    const name = (invoice.buyer_name || "").trim().toLowerCase();
    const address = (invoice.buyer_address || "").trim().toLowerCase();
    const gst = (invoice.buyer_gst || "").trim().toLowerCase();

    // Build a composite key: name + address (GST only if present)
    let key = `${name}__${address}`;
    if (gst) {
      key += `__${gst}`;
    }

    if (!grouped[key]) {
      grouped[key] = {
        buyer_name: invoice.buyer_name,
        buyer_address: invoice.buyer_address,
        buyer_gst: invoice.buyer_gst,
        invoices: [invoice],
      };
    } else {
      grouped[key].invoices.push(invoice);
    }
  });
  return Object.values(grouped);
}

export default YearDetails;
