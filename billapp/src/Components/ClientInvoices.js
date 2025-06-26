import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Clientinvoices = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const client = state?.client;
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const printRef = useRef();

  const displayInvoices = client ? client.invoices : invoices;

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:8000/api/invoices/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!client) {
      fetchInvoices();
    }
  }, [client, fetchInvoices]);

  const handleDownload = async (invoice) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const settingsResponse = await fetch(
        `http://localhost:8000/api/settings/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch settings");
      }
      const settingsData = await settingsResponse.json();
      const settings = settingsData[0];

      let fullInvoice;

      if (invoice.id && invoice.invoice_number) {
        fullInvoice = { ...invoice, ...settings };
      } else {
        const invoiceResponse = await fetch(
          `http://localhost:8000/api/invoices/${invoice}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!invoiceResponse.ok) {
          throw new Error("Failed to fetch invoice details");
        }
        const pdfBasicDetail = await invoiceResponse.json();
        fullInvoice = { ...pdfBasicDetail, ...settings };
      }

      if (fullInvoice.logo) {
        const logoImg = new Image();
        logoImg.crossOrigin = "Anonymous";
        logoImg.src = fullInvoice.logo;

        logoImg.onload = () => {
          setSelectedInvoice(fullInvoice);
          setLogoLoaded(true);
        };

        logoImg.onerror = () => {
          console.warn("Logo failed to load, generating PDF without logo.");
          setSelectedInvoice(fullInvoice);
          setLogoLoaded(true);
        };
      } else {
        setSelectedInvoice(fullInvoice);
        setLogoLoaded(true);
      }
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "Failed to prepare invoice for download");
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    const input = printRef.current;
    if (input) {
      try {
        const canvas = await html2canvas(input, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const margin = 10;
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = pageHeight - 2 * margin;

        const ratio = canvas.width / canvas.height;
        let imgWidth = maxWidth;
        let imgHeight = imgWidth / ratio;

        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight * ratio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        pdf.save(`Invoice_${selectedInvoice.invoice_number}.pdf`);

        setSuccess("Invoice downloaded successfully!");
      } catch (err) {
        console.error("PDF generation error:", err);
        setError("Failed to generate PDF");
      } finally {
        setSelectedInvoice(null);
        setLogoLoaded(false);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (selectedInvoice && logoLoaded) {
      generatePDF();
    }
  }, [selectedInvoice, logoLoaded]);

  const handleDelete = async (invoiceId) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch(
          `http://localhost:8000/api/delete/${invoiceId}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.ok) {
          setInvoices((prevInvoices) =>
            prevInvoices.filter((invoice) => invoice.id !== invoiceId)
          );
          setSuccess("Invoice deleted successfully!");
        } else {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to delete invoice");
        }
      } catch (err) {
        console.error("Error deleting invoice:", err);
        setError(err.message || "An error occurred while deleting the invoice");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="year_container">
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <h2>
        {client ? `${client.buyer_name} - ${client.buyer_gst}` : "All Invoices"}
      </h2>

      <table className="custom-table">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Buyer Name</th>
            <th>Bill Number</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>View</th>
            <th>Download</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {loading && invoices.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center">
                Loading invoices...
              </td>
            </tr>
          ) : (
            (displayInvoices || []).map((invoice, index) => (
              <tr key={invoice.id}>
                <td>{index + 1}</td>
                <td>{invoice.buyer_name}</td>
                <td>{invoice.invoice_number}</td>
                <td>
                  {invoice.invoice_date
                    ? new Date(invoice.invoice_date).toLocaleDateString("en-GB")
                    : "N/A"}
                </td>
                <td>
                  {invoice.currency}{" "}
                  {parseFloat(invoice.total_with_gst).toFixed(2)}
                </td>
                <td>
                  <div className="tooltip-container">
                    <button
                      className="view-button"
                      onClick={() =>
                        navigate(`/invoice-detail/${invoice.id}`, {
                          state: { invoice },
                        })
                      }
                      disabled={loading}
                    >
                      <i className="fa-regular fa-eye"></i>
                    </button>
                    <span className="tooltip-text">View</span>
                  </div>
                </td>

                <td>
                    <div className="tooltip-container">
                  <button
                    className="download-button"
                    onClick={() => handleDownload(invoice)}
                    disabled={loading && selectedInvoice?.id === invoice.id}
                  >
                    {loading && selectedInvoice?.id === invoice.id
                      ? "Generating..."
                      : <i className="fa-solid fa-download"></i>}
                  </button>
                    <span className="tooltip-text">Download</span>
                  </div>
                </td>

                <td>
                   <div className="tooltip-container">
                    <button
                    className="delete-button"
                    onClick={() => handleDelete(invoice.id)}
                    disabled={loading}
                  >
                    <i className="fa-solid fa-trash"></i>
                    </button>
                    <span className="tooltip-text">Delete</span>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Hidden Printable Section */}
      {selectedInvoice && (
        <div
          ref={printRef}
          style={{ position: "absolute", left: "-9999px", top: 0 }}
        >
          <div style={{ paddingLeft: "10px" }}>
            <div style={{ paddingRight: "10px" }}>
              <h2 className="text-center">TAX INVOICE</h2>
              <div
                className="table-bordered black-bordered main-box"
                style={{ backgroundColor: "white" }}
              >
                <div className="row date-tables">
                  <div className="col-6">
                    {/* Seller Info */}
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong style={{ fontSize: "15px" }}>
                              Grabsolve Infotech:
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            {selectedInvoice.seller_address}
                            <br />
                            Email: {selectedInvoice.seller_email}
                            <br />
                            PAN: {selectedInvoice.seller_pan}
                            <br />
                          </td>
                        </tr>
                        <tr>
                          <td className="gray-background">
                            <strong>GSTIN/UIN:</strong>{" "}
                            {selectedInvoice.seller_gstin}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Buyer Info */}
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong>Buyer (Bill to):</strong>{" "}
                            {selectedInvoice.buyer_name}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              maxWidth: "250px",
                              overflowWrap: "break-word",
                              height: "150px",
                            }}
                          >
                            {selectedInvoice.buyer_address}
                          </td>
                        </tr>
                        <tr>
                          <td className="gray-background">
                            <strong>GSTIN/UIN:</strong>{" "}
                            {selectedInvoice.buyer_gst}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Consignee Info */}
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong>Consignee (Ship to):</strong>{" "}
                            {selectedInvoice.consignee_name}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              maxWidth: "250px",
                              overflowWrap: "break-word",
                              height: "150px",
                            }}
                          >
                            {selectedInvoice.consignee_address}
                          </td>
                        </tr>
                        <tr>
                          <td className="gray-background">
                            <strong>GSTIN/UIN:</strong>{" "}
                            {selectedInvoice.consignee_gst}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="col-6">
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td style={{ width: "50%" }}>Invoice No.</td>
                          <td>{selectedInvoice.invoice_number}</td>
                        </tr>
                        <tr>
                          <td>Date</td>
                          <td>{selectedInvoice.invoice_date}</td>
                        </tr>
                        <tr>
                          <td>Delivery Note</td>
                          <td>{selectedInvoice.delivery_note}</td>
                        </tr>
                        <tr>
                          <td>Mode/Terms of Payment</td>
                          <td>{selectedInvoice.payment_mode}</td>
                        </tr>
                        <tr>
                          <td>Delivery Note Date</td>
                          <td>{selectedInvoice.delivery_note_date}</td>
                        </tr>
                        <tr>
                          <td>Destination</td>
                          <td>{selectedInvoice.destination}</td>
                        </tr>
                      </tbody>
                    </table>

                    <table className="table table-bordered black-bordered">
                      <tbody style={{ width: "100%", border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong>Terms to Delivery:</strong>
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              maxWidth: "250px",
                              overflowWrap: "break-word",
                              height: "150px",
                            }}
                          >
                            {selectedInvoice.Terms_to_delivery}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="relative w-72">
                      <p>
                        <strong>Country and currency:</strong>
                      </p>
                      <div className="border border-gray-300 p-2 rounded flex items-center justify-between cursor-pointer bg-white">
                        <div
                          className="flex items-center"
                          style={{ height: "30px" }}
                        >
                          <span className="mr-2">
                            {selectedInvoice.country} {selectedInvoice.currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <input type="hidden" id="currencyTitle" value="INR" />
                    <input type="hidden" id="currencySymbol" value="₹" />
                  </div>
                </div>

                <div className="row">
                  <div className="col-xs-12">
                    <table className="table table-bordered black-bordered">
                      <thead>
                        <tr className="trbody" style={{ border: "2px solid" }}>
                          <th>SI No.</th>
                          <th>Particulars</th>
                          <th>HSN/SAC</th>
                          <th>Hours</th>
                          <th>Rate</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody style={{ border: "2px solid" }}>
                        <tr style={{ height: "111px" }}>
                          <td>1</td>
                          <td>{selectedInvoice.Particulars}</td>
                          <td style={{ width: "130px" }}>
                            {selectedInvoice.hsn_code}
                          </td>
                          <td style={{ width: "10%" }}>
                            {selectedInvoice.total_hours}
                          </td>
                          <td style={{ width: "10%" }}>
                            {selectedInvoice.rate}
                          </td>
                          <td style={{ width: "200px" }}>
                            <span className="currency-sym">
                              {selectedInvoice.currency}{" "}
                              {selectedInvoice.base_amount}
                            </span>
                          </td>
                        </tr>
                        {selectedInvoice.country === "India" && (
                          <>
                            <tr className="inside-india">
                              <td></td>
                              <td>
                                <span style={{ float: "right" }}>
                                  CGST @ 9%
                                </span>
                              </td>
                              <td></td>
                              <td></td>
                              <td>9%</td>
                              <td id="cgst">
                                <span className="currency-sym">
                                  {selectedInvoice.currency}{" "}
                                  {selectedInvoice.cgst}
                                </span>
                              </td>
                            </tr>
                            <tr className="inside-india">
                              <td></td>
                              <td>
                                <span style={{ float: "right" }}>
                                  SGST @ 9%
                                </span>
                              </td>
                              <td></td>
                              <td></td>
                              <td>9%</td>
                              <td id="sgst">
                                <span className="currency-sym">
                                  {selectedInvoice.currency}{" "}
                                  {selectedInvoice.sgst}
                                </span>
                              </td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td colSpan="5" className="text-right">
                            <strong>Total</strong>
                          </td>
                          <td>
                            <strong id="total-with-gst">
                              {selectedInvoice.currency}{" "}
                              {selectedInvoice.total_with_gst}
                            </strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="row">
                  <div className="col-xs-12">
                    <div className="table-bordered black-bordered amount-box">
                      <div>
                        <p>
                          <strong>Amount Chargeable (in words):</strong>
                        </p>
                        <h4 className="total-in-words">
                          <span className="currency-text">INR</span>
                        </h4>
                        <div className="top-right-corner">
                          <span>E. & O.E</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  {selectedInvoice.country === "India" && (
                    <div className="col-xs-12 inside-india">
                      <table className="table table-bordered invoice-table">
                        <thead style={{ border: "2px solid" }}>
                          <tr>
                            <th rowSpan="2">HSN/SAC</th>
                            <th rowSpan="2">Taxable Value</th>
                            <th colSpan="2">Central Tax</th>
                            <th colSpan="2">State Tax</th>
                            <th colSpan="2" rowSpan="2">
                              Total Tax Amount
                            </th>
                          </tr>
                          <tr>
                            <th>Rate</th>
                            <th>Amount</th>
                            <th>Rate</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody style={{ border: "2px solid" }}>
                          <tr>
                            <td>
                              <span className="hns_select_text">
                                {selectedInvoice.hsn_code}
                              </span>
                            </td>
                            <td className="taxable-value">
                              {selectedInvoice.base_amount}
                            </td>
                            <td>9%</td>
                            <td className="tax-cgst">{selectedInvoice.cgst}</td>
                            <td>9%</td>
                            <td className="tax-sgst">{selectedInvoice.sgst}</td>
                            <td className="all-tax-amount">
                              {selectedInvoice.taxtotal}
                            </td>
                          </tr>
                          <tr className="total-row">
                            <td>Total</td>
                            <td className="total-taxable">
                              {selectedInvoice.base_amount}
                            </td>
                            <td></td>
                            <td className="total-tax-cgst">
                              {selectedInvoice.cgst}
                            </td>
                            <td></td>
                            <td className="total-tax-sgst">
                              {selectedInvoice.sgst}
                            </td>
                            <td className="total-tax-amount">
                              {selectedInvoice.taxtotal}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div style={{ padding: "0 0 0 20px" }}>
                    <div className="col-xs-12 inside-india">
                      <div>
                        <strong>Tax Amount (in words):</strong>
                        <span className="total-tax-in-words">
                          <span className="currency-text">INR</span>
                        </span>
                      </div>
                    </div>
                    <div className="col-xs-12">
                      <div>
                        <h4>
                          <strong>Remarks:</strong>
                        </h4>
                        <h5 className="html-remark">
                          {selectedInvoice.remark}
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-x-12">
                    <div className="hr">
                      <strong>Company's Bank Details</strong>
                      <br />
                      A/c Holder's Name: {selectedInvoice.seller_name}
                      <br />
                      Bank Name: {selectedInvoice.bank_name}
                      <br />
                      A/c No.: {selectedInvoice.account_number}
                      <br />
                      IFS Code: {selectedInvoice.ifsc_code}
                      <br />
                      Branch: {selectedInvoice.branch}
                      <br />
                      SWIFT Code: {selectedInvoice.swift_code}
                    </div>
                    <div className="text-right signatory">
                      {selectedInvoice.logo && (
                        <img
                          src={`http://127.0.0.1:8000${selectedInvoice.logo}`}
                          alt="Company Logo"
                          className="logo-image"
                        />
                      )}
                      <p>for Grabsolve Infotech</p>
                      <p>Authorized Signatory</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center">
                This is a Computer Generated Invoice
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientinvoices;
