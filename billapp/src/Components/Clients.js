import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './Address.css';
import "./Taxinvoice.css";

// Force browser cache refresh - PDF spacing optimized and company code display improved
const Clients = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();
  const [countryFlags, setCountryFlags] = useState({});

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("access_token");
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  };

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth("http://localhost:8000/api/grouped-invoices/");
      if (data) {
        setInvoices(data);
        // Only show toast if there are invoices
        if (data.length > 0) {
          toast.success("Invoices loaded successfully");
        }
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      // Only show error toast if there's a real error
      if (err.message !== "Failed to fetch") {
        toast.error(err.message || "Failed to load invoices");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const numberToWords = (num) => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const thousandUnits = ["", "Thousand", "Lakh", "Crore"];

    if (num === 0) return "Zero";
    let words = "";
    let unitIndex = 0;
    let integerPart = Math.floor(num);

    while (integerPart > 0) {
      let chunk = integerPart % 1000;
      if (chunk) {
        let chunkWords = "";
        if (chunk >= 100) {
          chunkWords += ones[Math.floor(chunk / 100)] + " Hundred ";
          chunk %= 100;
        }
        if (chunk < 10) {
          chunkWords += ones[chunk];
        } else if (chunk < 20) {
          chunkWords += teens[chunk - 10];
        } else {
          chunkWords += tens[Math.floor(chunk / 10)] + (chunk % 10 !== 0 ? " " + ones[chunk % 10] : "");
        }
        words = chunkWords.trim() + " " + thousandUnits[unitIndex] + " " + words;
      }
      integerPart = Math.floor(integerPart / 1000);
      unitIndex++;
    }

    let decimalPart = Math.round((num - Math.floor(num)) * 100);
    if (decimalPart > 0) {
      words += " and " + numberToWords(decimalPart) + " Paisa";
    }

    return words.trim();
  };

  const handleDownload = async (invoiceId) => {
    try {
      setLoading(true);

      // Fetch invoice data
      const pdfBasicDetail = await fetchWithAuth(
        `http://localhost:8000/api/invoices/${invoiceId}/`
      );
      if (!pdfBasicDetail) return;

      // Fetch settings data
      const pdfMainDetails = await fetchWithAuth(
        `http://localhost:8000/api/settings/`
      );
      if (!pdfMainDetails) return;

      // Set combined data - note: pdfMainDetails is already the object
      setSelectedInvoice({
        ...pdfBasicDetail,
        ...pdfMainDetails // No need for [0] since it's not an array
      });

      // Preload logo
      const logoImg = new Image();
      logoImg.crossOrigin = "Anonymous";
      logoImg.src = `http://localhost:8000${pdfMainDetails?.logo || '/media/favicon_cvGw7pn.png'}`;
      logoImg.onload = () => setLogoLoaded(true);
      logoImg.onerror = () => {
        console.warn("Failed to load logo, using default");
        setLogoLoaded(true); // Still proceed even if logo fails
      };

    } catch (err) {
      console.error("Download error:", err);
      toast.error(err.message || "Failed to prepare invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInvoice && logoLoaded) {
      generatePDF();
    }
  }, [selectedInvoice, logoLoaded]);

  const pdfRef = useRef(null);

  const generatePDF = async (invoiceNumber) => {
    const input = pdfRef.current;

    if (!input) {
      toast.error("PDF content not found.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    try {
      // Give a brief delay to ensure DOM is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(input, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        scrollY: -window.scrollY,
        backgroundColor: '#ffffff',
        width: input.scrollWidth,
        height: input.scrollHeight,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      // Reduce margins for better space utilization
      const margin = 5; // Reduced from 10
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxWidth = pageWidth - 2 * margin;
      const maxHeight = pageHeight - 2 * margin;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const imgAspectRatio = imgWidth / imgHeight;

      let renderWidth = maxWidth;
      let renderHeight = maxWidth / imgAspectRatio;

      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = maxHeight * imgAspectRatio;
      }

      // Center the image on the page
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);

      const fileName = `Invoice_${selectedInvoice?.buyer_name || "Client"}_${invoiceNumber}.pdf`;
      pdf.save(fileName);

      toast.success("Invoice downloaded successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleNewBill = (group) => {
    navigate('/tax-invoice', {
      state: {
        buyerData: {
          buyer_name: group.buyer_name || '',
          buyer_address: group.buyer_address || '',
          buyer_gst: group.buyer_gst || '',
        }
      }
    });
  };

  const handleEdit = (invoice) => {
    navigate(`/edit-invoice/${invoice.id}`, {
      state: {
        isEdit: true,
        fullInvoiceData: invoice,
      },
    });
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      // Optimistically remove the row from UI
      setInvoices((prev) =>
        prev
          .map((group) => ({
            ...group,
            invoices: group.invoices.filter((inv) => inv.id !== invoiceId),
          }))
          .filter((group) => group.invoices.length > 0)
      );

      try {
        const response = await fetchWithAuth(
          `http://localhost:8000/api/delete/${invoiceId}/`,
          { method: "DELETE" }
        );

        if (response) {
          toast.success("Invoice deleted successfully");
        } else {
          toast.error("Failed to delete invoice from server");
          fetchInvoices(); // rollback and re-fetch if failed
        }
      } catch (err) {
        console.error("Error deleting invoice:", err);
        toast.error(err.message || "Failed to delete invoice");
        fetchInvoices(); // rollback and re-fetch if failed
      }
    }
  };

  // Check if user is authenticated on component mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch country flags on mount
  useEffect(() => {
    const fetchCountryFlags = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all");
        if (!response.ok) throw new Error("Failed to fetch country flags");
        const data = await response.json();
        const flags = {};
        data.forEach((country) => {
          if (country.name && country.name.common && country.flags && country.flags.svg) {
            flags[country.name.common] = country.flags.svg;
          }
        });
        setCountryFlags(flags);
      } catch (error) {
        console.error("Error fetching country flags:", error);
      }
    };
    fetchCountryFlags();
  }, []);

  return (
    <div className="year_container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        limit={1}
      />

      {loading && (
        <div className="text-center mt-3">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="header-bar">
        <button
          type="button"
          className="new-bill-btn"
          onClick={() => navigate("/tax-invoice")}
          disabled={loading}
        >
          <i className="bi bi-plus-lg"></i> {loading ? "Loading..." : "New Bills"}
        </button>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Buyer Name</th>
            <th>Address</th>
            <th>Bill Number</th>
            <th>Total Amount</th>
            <th>items</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </td>
            </tr>
          ) : (
            invoices.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.flatMap((group) => (
                group.invoices.map((invoice, idx) => (
                  <tr key={invoice.id}>
                    <td>{idx === 0 ? group.serial_number : ''}</td>
                    <td>{group.buyer_name}</td>
                    <td>
                      {group.buyer_address.length > 20
                        ? group.buyer_address.substring(0, 20) + "..."
                        : group.buyer_address}
                    </td>
                    <td>{invoice.invoice_number}</td>
                    <td>
                      {invoice.currency} {parseFloat(invoice.total_with_gst).toFixed(2)}
                    </td>
                    <td className="d-flex flex-wrap gap-2 justify-content-center">
                      <div className="tooltip-container">
                        <button
                          className="action-btn view"
                          onClick={() => navigate(`/invoice-detail/${invoice.id}`)}
                          disabled={loading}
                        >
                          <i className="fa-regular fa-eye"></i>
                        </button>
                        <span className="tooltip-text">View</span>
                      </div>

                      <div className="tooltip-container">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit(invoice)}
                          disabled={loading}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <span className="tooltip-text">Edit</span>
                      </div>

                      <div className="tooltip-container">
                        <button
                          className="action-btn download"
                          onClick={() => handleDownload(invoice.id)}
                          disabled={loading}
                        >
                          <i className="fa-solid fa-download"></i>
                        </button>
                        <span className="tooltip-text">Download</span>
                      </div>

                      <div className="tooltip-container">
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(invoice.id)}
                          disabled={loading}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                        <span className="tooltip-text">Delete</span>
                      </div>

                      <div className="tooltip-container">
                        <button
                          className="action-btn new"
                          onClick={() => handleNewBill(group)}
                          disabled={loading}
                        >
                          <i className="fa-solid fa-plus"></i>
                        </button>
                        <span className="tooltip-text">Newbill</span>
                      </div>
                    </td>
                  </tr>
                ))
              ))
            )
          )}
        </tbody>
      </table>

      {/* Hidden printable invoice for PDF */}
      {selectedInvoice && (
        <div ref={pdfRef} style={{ position: "absolute", left: "-9999px" }}>
          <div style={{ paddingLeft: "5px" }}>
            <div style={{ paddingRight: "5px" }}>
              <h2 className="text-center" style={{ margin: "5px 0" }}>TAX INVOICE</h2>
              <div className="table-bordered black-bordered main-box" style={{ backgroundColor: "white", margin: "0" }}>
                <div className="row date-tables">
                  <div className="col-6">
                    {/* Seller Info */}
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong style={{ fontSize: "15px" }}>
                              {selectedInvoice.company_name}:
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "5px", height: "120px" }}>
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
                            <strong>GSTIN/UIN:</strong> {selectedInvoice.seller_gstin}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Buyer Info */}
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong>Buyer (Bill to):</strong> {selectedInvoice.buyer_name}
                          </td>
                        </tr>
                        <tr>
                          <td style={{
                            maxWidth: "250px",
                            overflowWrap: "break-word",
                            height: "120px",
                            padding: "5px"
                          }}>
                            <div style={{ whiteSpace: "pre-wrap" }}>
                              {selectedInvoice.buyer_address}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="gray-background">
                            <strong>GSTIN/UIN:</strong> {selectedInvoice.buyer_gst || (selectedInvoice.country === "India" ? "Not Provided" : "N/A")}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Consignee Info */}
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong>Consignee (Ship to):</strong> {selectedInvoice.consignee_name}
                          </td>
                        </tr>
                        <tr>
                          <td style={{
                            maxWidth: "250px",
                            overflowWrap: "break-word",
                            height: "120px",
                            padding: "5px"
                          }}>
                            <div style={{ whiteSpace: "pre-wrap" }}>
                              {selectedInvoice.consignee_address}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="gray-background">
                            <strong>GSTIN/UIN:</strong> {selectedInvoice.consignee_gst || (selectedInvoice.country === "India" ? "Not Provided" : "N/A")}
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
                          <td>{formatDate(selectedInvoice.invoice_date)}</td>
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
                          <td>{selectedInvoice.delivery_note_date ? formatDate(selectedInvoice.delivery_note_date) : ''}</td>
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
                          <td style={{
                            maxWidth: "250px",
                            overflowWrap: "break-word",
                            height: "120px",
                            padding: "5px"
                          }}>
                            {selectedInvoice.Terms_to_delivery}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="relative w-72">
                      <p><strong>Country and currency:</strong></p>
                      <div style={{
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        padding: "4px 12px",
                        background: "#f9f9f9",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                        width: "fit-content"
                      }}>
                        {(selectedInvoice.country_flag || countryFlags[selectedInvoice.country]) && (
                          <img
                            src={selectedInvoice.country_flag || countryFlags[selectedInvoice.country]}
                            alt={`${selectedInvoice.country} flag`}
                            style={{
                              width: 32,
                              height: 24,
                              border: "1px solid #ccc",
                              objectFit: "cover",
                              marginRight: 8
                            }}
                          />
                        )}
                        <span>{selectedInvoice.country}</span>
                        <span>-</span>
                        <span>
                          {selectedInvoice.currency === "INR" && "₹"}
                          {selectedInvoice.currency === "USD" && "$"}
                          {selectedInvoice.currency === "AUD" && "A$"}
                          {selectedInvoice.currency === "ARS" && "$"}
                          {" (" + selectedInvoice.currency + ")"}
                        </span>
                      </div>

                      {selectedInvoice.country !== "India" && (
                        <div className="mt-2">
                          <>
                            <div className="lut">
                              <p style={{ margin: "0px" }}>Declare under LUT</p>
                            </div>
                            <div className="lut mt-3">
                              <p style={{ margin: "0px" }}>{selectedInvoice.company_code}</p>
                            </div>
                          </>
                        </div>
                      )}

                      <input type="hidden" id="currencyTitle" value={selectedInvoice.currency || "INR"} />
                      <input type="hidden" id="currencySymbol" value={selectedInvoice.currency === "USD" ? "$" : "₹"} />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-xs-12">
                    <table className="table table-bordered black-bordered" style={{ textAlign: "center" }}>
                      <thead>
                        <tr className="trbody">
                          <th style={{ backgroundColor: "#f1f3f4" }}>SI No.</th>
                          <th style={{ backgroundColor: "#f1f3f4" }}>Particulars</th>
                          <th style={{ backgroundColor: "#f1f3f4" }}>HSN/SAC</th>
                          <th style={{ backgroundColor: "#f1f3f4" }}>Hours</th>
                          <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                          <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ height: "80px" }}>
                          <td>1</td>
                          <td style={{ width: "526px" }}>{selectedInvoice.Particulars}</td>
                          <td style={{ width: "130px", paddingTop: "10px" }}>{selectedInvoice.hsn_code || selectedInvoice.hsn_sac_code}</td>
                          <td style={{ width: "10%" }}>{isNaN(selectedInvoice.total_hours) ? '' : selectedInvoice.total_hours}</td>
                          <td style={{ width: "10%" }}>{isNaN(selectedInvoice.rate) ? '' : selectedInvoice.rate}</td>
                          <td style={{ width: "200px" }}>
                            <span className="currency-sym">
                              {selectedInvoice.currency} {isNaN(selectedInvoice.base_amount) ? '' : selectedInvoice.base_amount}
                            </span>
                          </td>
                        </tr>

                        {/* IGST for other states */}
                        {selectedInvoice.country === "India" && selectedInvoice.state !== "Gujarat" && (
                          <tr className="inside-india">
                            <td></td>
                            <td>
                              <span style={{ float: "right" }}>IGST @ 18%</span>
                            </td>
                            <td></td>
                            <td></td>
                            <td>18%</td>
                            <td id="igst">
                              <span className="currency-sym">{selectedInvoice.currency} {isNaN(selectedInvoice.taxtotal) ? '' : selectedInvoice.taxtotal}</span>
                            </td>
                          </tr>
                        )}

                        {/* CGST/SGST for Gujarat */}
                        {selectedInvoice.country === "India" && selectedInvoice.state === "Gujarat" && (
                          <>
                            <tr className="inside-india">
                              <td></td>
                              <td>
                                <span style={{ float: "right" }}>CGST @ 9%</span>
                              </td>
                              <td></td>
                              <td></td>
                              <td>9%</td>
                              <td id="cgst">
                                <span className="currency-sym">{selectedInvoice.currency} {isNaN(selectedInvoice.cgst) ? '' : selectedInvoice.cgst}</span>
                              </td>
                            </tr>
                            <tr className="inside-india">
                              <td></td>
                              <td>
                                <span style={{ float: "right" }}>SGST @ 9%</span>
                              </td>
                              <td></td>
                              <td></td>
                              <td>9%</td>
                              <td id="sgst">
                                <span className="currency-sym">{selectedInvoice.currency} {isNaN(selectedInvoice.sgst) ? '' : selectedInvoice.sgst}</span>
                              </td>
                            </tr>
                          </>
                        )}

                        {/* Total row */}
                        <tr>
                          <td colSpan="6">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {/* Left side: INR Equivalent (if applicable) */}
                              {selectedInvoice.country !== "India" && selectedInvoice.inr_equivalent && (
                                <div style={{ whiteSpace: 'nowrap' }}>
                                  INR Equivalent: INR {isNaN(selectedInvoice.inr_equivalent) ? '' : selectedInvoice.inr_equivalent.toFixed(2)}
                                </div>
                              )}

                              {/* Right side: Total (always right aligned) */}
                              <div style={{ whiteSpace: 'nowrap', marginLeft: 'auto', textAlign: 'right' }}>
                                <strong>Total:</strong> &nbsp;
                                <strong id="total-with-gst">
                                  <span className="currency-sym">{selectedInvoice.currency} </span>
                                  {isNaN(selectedInvoice.total_with_gst) ? '' : selectedInvoice.total_with_gst}
                                </strong>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="row">
                  <div className="col-xs-12">
                    <div className="table-bordered black-bordered amount-box" style={{ margin: "5px 0" }}>
                      <div>
                        <p style={{ margin: "5px 0" }}>
                          <strong>Amount Chargeable (in words):</strong>
                        </p>
                        <h4 className="total-in-words" style={{ margin: "5px 0" }}>
                          <span className="currency-text">{selectedInvoice.currency} </span>
                          {numberToWords(Math.floor(isNaN(selectedInvoice.total_with_gst) ? 0 : selectedInvoice.total_with_gst))} Only
                        </h4>
                        <div className="top-right-corner">
                          <span>E. & O.E</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedInvoice.country === "India" && (
                  <div className="row">
                    <div className="col-xs-12 inside-india">
                      <table className="table table-bordered invoice-table">
                        <thead>
                          {selectedInvoice.state === "Gujarat" ? (
                            <>
                              <tr>
                                <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">HSN/SAC</th>
                                <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">Taxable Value</th>
                                <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">Central Tax</th>
                                <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">State Tax</th>
                                <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">Total Tax Amount</th>
                              </tr>
                              <tr>
                                <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                                <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                                <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                                <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                              </tr>
                            </>
                          ) : (
                            <>
                              <tr>
                                <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">HSN/SAC</th>
                                <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">Taxable Value</th>
                                <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">Integrated Tax</th>
                                <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">Total Tax Amount</th>
                              </tr>
                              <tr>
                                <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                                <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                              </tr>
                            </>
                          )}
                        </thead>
                        <tbody style={{ border: "2px solid" }}>
                          <tr>
                            <td>{selectedInvoice.hsn_code}</td>
                            <td>{isNaN(selectedInvoice.base_amount) ? '' : selectedInvoice.base_amount}</td>
                            {selectedInvoice.state === "Gujarat" ? (
                              <>
                                <td>9%</td>
                                <td>{isNaN(selectedInvoice.cgst) ? '' : selectedInvoice.cgst}</td>
                                <td>9%</td>
                                <td>{isNaN(selectedInvoice.sgst) ? '' : selectedInvoice.sgst}</td>
                                <td>{isNaN(selectedInvoice.taxtotal) ? '' : selectedInvoice.taxtotal}</td>
                              </>
                            ) : (
                              <>
                                <td>18%</td>
                                <td>{isNaN(selectedInvoice.taxtotal) ? '' : selectedInvoice.taxtotal}</td>
                                <td>{isNaN(selectedInvoice.taxtotal) ? '' : selectedInvoice.taxtotal}</td>
                              </>
                            )}
                          </tr>
                          <tr className="total-row">
                            <td>Total</td>
                            <td>{isNaN(selectedInvoice.base_amount) ? '' : selectedInvoice.base_amount}</td>
                            {selectedInvoice.state === "Gujarat" ? (
                              <>
                                <td></td>
                                <td>{isNaN(selectedInvoice.cgst) ? '' : selectedInvoice.cgst}</td>
                                <td></td>
                                <td>{isNaN(selectedInvoice.sgst) ? '' : selectedInvoice.sgst}</td>
                                <td>{isNaN(selectedInvoice.taxtotal) ? '' : selectedInvoice.taxtotal}</td>
                              </>
                            ) : (
                              <>
                                <td></td>
                                <td>{isNaN(selectedInvoice.igst) ? '' : selectedInvoice.igst}</td>
                                <td>{isNaN(selectedInvoice.taxtotal) ? '' : selectedInvoice.taxtotal}</td>
                              </>
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div style={{ padding: "0 0 0 20px" }}>
                      <div className="col-xs-12 inside-india">
                        <div>
                          <strong>Tax Amount (in words):</strong>
                          <span className="total-tax-in-words">
                            <span className="currency-text">{selectedInvoice.currency} </span>
                            {numberToWords(Math.floor(isNaN(selectedInvoice.total_with_gst) ? 0 : selectedInvoice.total_with_gst))} Only
                          </span>
                        </div>
                      </div>
                      <div className="col-xs-12">
                        <div>
                          <h4>
                            <strong>Remarks:</strong>
                          </h4>
                          <h5 className="html-remark">{selectedInvoice.remark}</h5>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="row mb-3">
                  <div className="col-x-12 mb-3">
                    <div className="hr" style={{ margin: "5px 0" }}>
                      <strong>Company's Bank Details</strong>
                      <br />
                      A/c Holder's Name: {selectedInvoice.bank_account_holder}
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
                    <div className="text-right signatory" style={{ margin: "5px 0" }}>
                      {selectedInvoice.logo && (
                        <img
                          src={`http://localhost:8000${selectedInvoice.logo}`}
                          alt="Company Logo"
                          className="logo-image"
                        />
                      )}
                      <p style={{ margin: "2px 0" }}>for {selectedInvoice.company_name || 'Grabsolve Infotech'}</p>
                      <p style={{ margin: "2px 0" }}>Authorized Signatory</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center" style={{ margin: "2px 0" }}>This is a Computer Generated Invoice</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;