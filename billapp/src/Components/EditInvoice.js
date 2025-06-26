import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const EditInvoice = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef();
  const [selectedHsn, setSelectedHsn] = useState("9983");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({
    name: "India",
    currency: "₹",
    currencyCode: "INR",
  });
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [invoiceYear, setInvoiceYear] = useState(() => {
    const year = new Date().getFullYear();
    return `${year}/${year + 1}`;
  });
  const [formData, setFormData] = useState({
    buyer_name: "",
    buyer_address: "",
    buyer_gst: "",
    total_with_gst: "",
    currency: "INR",
    consignee_name: "",
    consignee_address: "",
    consignee_gst: "",
    invoice_number: "",
    invoice_date: "",
    delivery_note: "",
    payment_mode: "",
    delivery_note_date: "",
    destination: "",
    Terms_to_delivery: "",
    Particulars: "",
    hsn_code: "9983",
    total_hours: 0,
    rate: 0,
    base_amount: 0,
    cgst: 0,
    sgst: 0,
    taxtotal: 0,
    remark: "",
  });
  const [settingsData, setSettingsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [states, setStates] = useState([]);

  const fetchCountries = useCallback(async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const countryList = data
        .map((country) => {
          const currencyCode = country.currencies
            ? Object.keys(country.currencies)[0]
            : "";
          const currencySymbol =
            country.currencies?.[currencyCode]?.symbol || "";
          return {
            name: country.name.common,
            currency: currencySymbol,
            currencyCode: currencyCode,
            flag: country.flags?.svg,
          };
        })
        .filter((country) => country.currencyCode);

      countryList.sort((a, b) => a.name.localeCompare(b.name));
      setCountries(countryList);
      setFilteredCountries(countryList);
    } catch (error) {
      console.error("Error fetching countries:", error);
      const fallbackCountries = [
        { name: "India", currency: "₹", currencyCode: "INR" },
        { name: "United States", currency: "$", currencyCode: "USD" },
        { name: "United Kingdom", currency: "£", currencyCode: "GBP" },
        { name: "European Union", currency: "€", currencyCode: "EUR" },
        { name: "Japan", currency: "¥", currencyCode: "JPY" },
      ];
      setCountries(fallbackCountries);
      setFilteredCountries(fallbackCountries);
    }
  }, []);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/invoices/${invoiceId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invoice");
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        buyer_name: data.buyer_name || "",
        buyer_address: data.buyer_address || "",
        buyer_gst: data.buyer_gst || "",
        total_with_gst: data.total_with_gst || "",
        currency: data.currency || "INR",
        consignee_name: data.consignee_name || "",
        consignee_address: data.consignee_address || "",
        consignee_gst: data.consignee_gst || "",
        invoice_number: data.invoice_number || "",
        invoice_date: data.invoice_date || "",
        delivery_note: data.delivery_note || "",
        payment_mode: data.payment_mode || "",
        delivery_note_date: data.delivery_note_date || "",
        destination: data.destination || "",
        Terms_to_delivery: data.Terms_to_delivery || "",
        Particulars: data.Particulars || "",
        hsn_code: data.hsn_code || "9983",
        total_hours: data.total_hours || 0,
        rate: data.rate || 0,
        base_amount: data.base_amount || 0,
        cgst: data.cgst || 0,
        sgst: data.sgst || 0,
        taxtotal: data.taxtotal || 0,
        remark: data.remark || "",
      }));

      const foundCountry = countries.find(
        (c) => c.currencyCode === data.currency
      ) || { name: "India", currency: "₹", currencyCode: "INR" };
      setSelectedCountry(foundCountry);

      if (data.state) {
        setSelectedState(data.state);
      } else {
        setSelectedState('Gujarat');
      }
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
      setError(err.message || "Failed to load invoice data");
    } finally {
      setLoading(false);
    }
  }, [invoiceId, countries, navigate]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:8000/api/settings/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      const setting = Array.isArray(data) ? (data.length > 0 ? data[0] : {}) : data;

      if (setting?.logo) {
        const base64Logo = await toBase64(
          `http://localhost:8000${setting.logo}`
        );
        setSettingsData({ ...setting, logoBase64: base64Logo });
      } else {
        setSettingsData(setting);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError(err.message || "Failed to load company settings");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    if (filteredCountries.length > 0) {
      fetchInvoice();
    }
  }, [fetchInvoice, filteredCountries]);

  useEffect(() => {
    if (formData && formData.state) {
      setSelectedState(formData.state);
    } else {
      setSelectedState('Gujarat');
    }
  }, [formData.state]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (search) {
      const filtered = countries.filter(
        (country) =>
          country.name.toLowerCase().includes(search.toLowerCase()) ||
          country.currencyCode.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(countries);
    }
  }, [search, countries]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      state: selectedState
    }));
  }, [selectedState]);

  useEffect(() => {
    if (selectedCountry.name === "India") {
      fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "India" }),
      })
        .then(res => res.json())
        .then(data => setStates(data.data.states || []));
    } else {
      setStates([]);
    }
  }, [selectedCountry]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Add this function to your component (near the other utility functions)
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      // Format as YYYY-MM-DD for date input
      return date.toISOString().split("T")[0];
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const updatedFormData = {
        ...formData,
        currency: selectedCountry.currencyCode,
        country: selectedCountry.name,
        state: selectedState || "Gujarat",
        hsn_code: formData.hsn_code,
        delivery_note_date: formData.delivery_note_date || null,
      };
      delete updatedFormData.hsn_code;

      const response = await fetch(
        `http://localhost:8000/api/update/${invoiceId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedFormData),
        }
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonErr) {
          errorData = { message: await response.text() };
        }
        console.error("Backend error details:", errorData);
        throw new Error(
          errorData.message ||
          (typeof errorData === 'object' ? Object.values(errorData).flat().join(", ") : errorData) ||
          "Failed to update invoice"
        );
      }

      setSuccess("Invoice updated successfully!");
      generatePDF();
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "An error occurred while updating the invoice");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const input = invoiceRef.current;
    html2canvas(input, {
      scale: 2,
      useCORS: true,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 2;

      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;

      const imgProps = pdf.getImageProperties(imgData);
      let imgWidth = usableWidth;
      let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      if (imgHeight > usableHeight) {
        imgHeight = usableHeight;
        imgWidth = (imgProps.width * imgHeight) / imgProps.height;
      }

      const x = margin + (usableWidth - imgWidth) / 2;
      const y = margin + (usableHeight - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`Invoice_${invoiceId}.pdf`);
    });
  };

  const copyBillToShip = (e) => {
    e.preventDefault();
    setFormData((prev) => ({
      ...prev,
      consignee_name: prev.buyer_name,
      consignee_address: prev.buyer_address,
      consignee_gst: prev.buyer_gst,
    }));
  };

  const handleSelectChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedHsn(selectedValue);
    setFormData((prev) => ({
      ...prev,
      hsn_code: selectedValue,
    }));
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.total_hours, formData.rate, formData.base_amount, formData.hsn_code, selectedCountry.name, selectedState]);

  const totalTax = (cgstValue, sgstValue) => {
    return cgstValue + sgstValue;
  };

  const calculateTotal = () => {
    const total_hours = parseFloat(formData.total_hours) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const base_amount = total_hours * rate;

    if (selectedCountry.name === "India" && base_amount > 0) {
      if ((selectedState || "").trim().toLowerCase() === "gujarat") {
        // Gujarat: CGST + SGST
        const tax = (base_amount * 9) / 100;
        const total_with_gst = Math.round(base_amount + 2 * tax);
        setFormData((prev) => ({
          ...prev,
          base_amount,
          cgst: tax,
          sgst: tax,
          igst: 0,
          taxtotal: 2 * tax,
          total_with_gst,
        }));
      } else {
        // Other states: IGST
        const igst = (base_amount * 18) / 100;
        const total_with_gst = Math.round(base_amount + igst);
        setFormData((prev) => ({
          ...prev,
          base_amount,
          cgst: 0,
          sgst: 0,
          igst,
          taxtotal: igst,
          total_with_gst,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        base_amount,
        cgst: 0,
        sgst: 0,
        igst: 0,
        taxtotal: 0,
        total_with_gst: Math.round(base_amount),
      }));
    }
  };

  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const getWords = (n) => {
      if (n < 20) return ones[n];
      if (n < 100)
        return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      if (n < 1000)
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " " + getWords(n % 100) : "")
        );
      if (n < 100000)
        return (
          getWords(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 ? " " + getWords(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          getWords(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 ? " " + getWords(n % 100000) : "")
        );
      return (
        getWords(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 ? " " + getWords(n % 10000000) : "")
      );
    };

    if (num === 0) return "Zero Rupees Only";

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = getWords(integerPart);

    if (decimalPart > 0) {
      result += " and " + getWords(decimalPart) + "";
    }
    return result + " Only";
  };

  const toBase64 = (url) =>
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      });

  const renderInvoiceForPDF = () => (
    <div style={{
      width: "250mm",
      minHeight: "297mm",
      background: "white",
      boxSizing: "border-box",
      padding: 0,
      margin: 0,
      fontSize: "20px",
      lineHeight: "1.6"
    }}>
      <h2 className="text-center" style={{ fontWeight: "bold", margin: "20px 0 10px 0", fontSize: "2.2em" }}>TAX INVOICE</h2>
      {/* ...rest of your invoice markup... */}
      {/* For each <table> and <td>, add padding: 10px for better readability */}
      {/* Example for a table cell: <td style={{ border: ..., padding: "10px" }}> ... */}
      {/* You can also increase the font size for table headers if needed */}
      {/* ...existing code continues... */}
    </div>
  );

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/", { replace: true }); // Redirect to login page
  };

  return (
    <div style={{paddingLeft:"80px"}}>
      <form onSubmit={handleSubmit}>
        {loading && <div className="text-center">Loading invoice data...</div>}
        
        <div
          style={{
            border: "2px solid",
            backgroundColor: "white",
            padding: "35px",
          }}
        >
          
          <div className="row date-tables" style={{ width: "100%", display: "flex" }}>

            {/* Left column - Seller, Buyer, Consignee info */}
            <div className="col-6" style={{ width: "50%", display: "flex", flexDirection: "column" }}>
              {/* Seller info table */}
              
              <table className="table black-bordered" style={{ width: "100%" }}>
                <tbody style={{ borderBottom: "2px solid" }}>
                  <tr>
                    <td className="gray-background">
                      <strong
                        style={{
                          fontSize: "15px",
                          fontFamily: "Arial, sans-serif",
                        }}
                      >
                        {settingsData?.company_name}:
                      </strong>
                    </td>
                  </tr>
                  {settingsData && (
                    <>
                      <tr>
                        <td
                          style={{
                            padding: "10px",
                            fontFamily: "Arial, sans-serif",
                          }}
                        >
                          {settingsData.seller_address}
                          <br />
                          Email: {settingsData.seller_email}
                          <br />
                          PAN: {settingsData.seller_pan}
                          <br />
                        </td>
                      </tr>
                      <tr>
                        <td className="gray-background">
                          <strong>GSTIN/UIN:</strong>{" "}
                          {settingsData.seller_gstin}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {/* Buyer info table */}
              <table className="table black-bordered" style={{ width: "100%" }}>
                <tbody style={{ borderBottom: "2px solid" }}>
                  <tr>
                    <td className="gray-background">
                      <strong>Buyer (Bill to):</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Name:
                      <input
                        type="text"
                        name="buyer_name"
                        className="billToTitle"
                        value={formData.buyer_name}
                        onChange={handleChange}
                      />
                      <br />
                      Address:
                      <textarea
                        name="buyer_address"
                        className="billToAddress"
                        style={{ width: "100%", height: "100px" }}
                        value={formData.buyer_address}
                        onChange={handleChange}
                      />
                      <br />
                      GSTIN/UIN:
                      <input
                        type="text"
                        name="buyer_gst"
                        className="billToGST"
                        value={formData.buyer_gst}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Consignee info table */}
              <table className="table black-bordered" style={{ width: "100%" }}>
                <tbody style={{ borderBottom: "2px solid" }}>
                  <tr>
                    <td className="gray-background">
                      <strong>Consignee (Ship to):</strong>
                      <button
                        className="copybutton btn btn-sm btn-secondary"
                        style={{ float: "right" }}
                        onClick={copyBillToShip}
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Name:
                      <input
                        type="text"
                        name="consignee_name"
                        className="shipToTitle"
                        value={formData.consignee_name}
                        onChange={handleChange}
                      />
                      <br />
                      Address:
                      <textarea
                        name="consignee_address"
                        className="shipToAddress"
                        style={{ width: "100%", height: "100px" }}
                        value={formData.consignee_address}
                        onChange={handleChange}
                      />
                      <br />
                      GSTIN/UIN:
                      <input
                        type="text"
                        name="consignee_gst"
                        className="shipToGST"
                        value={formData.consignee_gst}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right column - Invoice details */}
            <div className="col-6" style={{ width: "50%", display: "flex", flexDirection: "column" }}>
              {/* Invoice details table */}
              <table className="table black-bordered" style={{ width: "100%" }}>
                <tbody style={{ borderBottom: "2px solid" }}>
                  <tr>
                    <td style={{ width: "50%" }}>Invoice No.</td>
                    <td className="invoice-no-td">
                      <input
                        type="text"
                        style={{ width: "75%", margin: "1px 5px 1px 5px" }}
                        name="invoice_number"
                        className="invoice_number"
                        value={formData.invoice_number}
                        readOnly
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td>
                      <input
                        type="date"
                        id="datePicker"
                        value={formatDate(formData.invoice_date)}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            invoice_date: e.target.value,
                          }));
                        }}
                        name="invoice_date"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Delivery Note</td>
                    <td>
                      <input
                        type="text"
                        className="deliveryNote"
                        value={formData.delivery_note}
                        onChange={handleChange}
                        name="delivery_note"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Mode/Terms of Payment</td>
                    <td>
                      <input
                        type="text"
                        className="deliveryNote"
                        value={formData.payment_mode}
                        onChange={handleChange}
                        name="payment_mode"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Delivery Note Date</td>
                    <td>
                      <input
                        type="date"
                        name="delivery_note_date"
                        className="deliveryNote"
                        value={formData.delivery_note_date ? formatDate(formData.delivery_note_date) : ""}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            delivery_note_date: e.target.value || null,
                          }));
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Destination</td>
                    <td>
                      <input
                        type="text"
                        name="destination"
                        className="deliveryNote"
                        value={formData.destination}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Terms to Delivery section - placed after Destination, before country/currency/state selector */}
              <table className="table black-bordered" style={{ width: "100%" }}>
                <tbody style={{ borderBottom: "2px solid" }}>
                  <tr>
                    <td className="gray-background">
                      <strong>Terms to Delivery:</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <textarea
                        className="billToAddress"
                        name="Terms_to_delivery"
                        style={{ width: "100%", height: "100px" }}
                        value={formData.Terms_to_delivery}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Country and currency dropdown, then state selector for India */}
              <div className="relative w-72" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <p>
                    <strong>Country and currency:</strong>
                  </p>
                  <div
                    className="border border-gray-300 p-2 rounded flex items-center justify-between cursor-pointer bg-white"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <div className="flex items-center">
                      {selectedCountry.flag && (
                        <img
                          src={selectedCountry.flag}
                          alt={`${selectedCountry.name} flag`}
                          style={{ width: "20px", marginRight: "8px" }}
                        />
                      )}
                      <span className="mr-2">
                        {selectedCountry.name} - {selectedCountry.currency} (
                        {selectedCountry.currencyCode})
                      </span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="absolute bg-white border border-gray-300 w-full mt-1 rounded shadow-lg z-10">
                      <input
                        type="text"
                        className="w-full p-2 border-b border-gray-200 focus:outline-none"
                        placeholder="Search country or currency..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />

                      <ul
                        className="overflow-y-auto list-group"
                        style={{ height: "200px" }}
                      >
                        {filteredCountries.map((country, index) => (
                          <li
                            key={index}
                            className="p-2 flex items-center hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedCountry(country);
                              setIsOpen(false);
                              setSearch("");
                            }}
                          >
                            {country.flag && (
                              <img
                                src={country.flag}
                                alt={`${country.name} flag`}
                                style={{ width: "20px", marginRight: "8px" }}
                              />
                            )}
                            {country.name} - {country.currency} (
                            {country.currencyCode})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {/* State selector next to country selector, only for India */}
                {selectedCountry.name === "India" && (
                  <div>
                    <label style={{ fontWeight: 600 }}>State:</label>
                    <select
                      name="state"
                      value={selectedState}
                      onChange={e => setSelectedState(e.target.value)}
                      required
                      style={{ marginLeft: 8 }}
                    >
                      <option value="">Select State</option>
                      {states.map((state, idx) => (
                        <option key={idx} value={state.name}>{state.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* LUT declaration for non-India invoices */}
              <div className="mt-4">
                {selectedCountry.name !== "India" && (
                  <>
                    <div className="lut">
                      <p style={{ margin: "0px" }}>Declare under LUT</p>
                    </div>
                    {settingsData && (
                      <div className="lut mt-3">
                        <p style={{ margin: "0px" }}>{settingsData.company_code}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <input
                type="hidden"
                id="currencyTitle"
                value={selectedCountry.currencyCode}
              />
              <input
                type="hidden"
                id="currencySymbol"
                value={selectedCountry.currency}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-xs-12">
              <table className="table black-bordered" style={{ width: "100%" }}>
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
                <tbody style={{ borderBottom: "2px solid" }}>
                  <tr style={{ height: "111px" }}>
                    <td>1</td>
                    <td>
                      <input
                        name="Particulars"
                        id="gstConsultancy"
                        value={formData.Particulars}
                        onChange={handleChange}
                        type="text"
                      />
                    </td>
                    <td style={{ width: "130px" }}>
                      <select
                        name="hsn_code"
                        id="hns_select"
                        onChange={handleSelectChange}
                        value={formData.hsn_code}
                      >
                        <option value="9983">9983</option>
                        <option value="8523">8523</option>
                      </select>
                    </td>
                    <td style={{ width: "10%" }}>
                      <input
                        type="number"
                        name="total_hours"
                        value={formData.total_hours}
                        onChange={(e) => {
                          handleChange(e);
                          calculateTotal();
                        }}
                      />
                    </td>

                    <td style={{ width: "10%" }}>
                      <input
                        type="number"
                        name="rate"
                        value={formData.rate}
                        onChange={(e) => {
                          handleChange(e);
                          calculateTotal();
                        }}
                      />
                    </td>

                    <td style={{ width: "200px" }}>
                      <span className="currency-sym">
                        {selectedCountry.currency}
                      </span>
                      <input
                        style={{ width: "90%" }}
                        id="baseAmount"
                        name="base_amount"
                        type="number"
                        value={formData.base_amount}
                        onChange={(e) => {
                          handleChange(e);
                          calculateTotal();
                        }}
                      />
                    </td>
                  </tr>
                  {selectedCountry.name === "India" && (
                    (selectedState || "").trim().toLowerCase() === "gujarat" ? (
                      <>
                        <tr className="inside-india">
                          <td></td>
                          <td>CGST @ 9%</td>
                          <td></td><td></td>
                          <td>9%</td>
                          <td>{Math.abs(formData.cgst)}</td>
                        </tr>
                        <tr className="inside-india">
                          <td></td>
                          <td>SGST @ 9%</td>
                          <td></td><td></td>
                          <td>9%</td>
                          <td>{Math.abs(formData.sgst)}</td>
                        </tr>
                      </>
                    ) : (
                      <tr className="inside-india">
                        <td></td>
                        <td>IGST @ 18%</td>
                        <td></td><td></td>
                        <td>18%</td>
                        <td>{Math.abs(formData.igst)}</td>
                      </tr>
                    )
                  )}
                  {/* Total row inside the main table, matching TaxInvoice.js */}
                  <tr>
                    <td colSpan="6">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Left side: INR conversion (not implemented in EditInvoice, so leave blank or add if needed) */}
                        <div style={{ whiteSpace: 'nowrap' }}></div>
                        {/* Right side: Total */}
                        <div style={{ whiteSpace: 'nowrap', textAlign: 'center', width: "200px" }}>
                          <strong>Total:</strong> &nbsp;
                          <strong id="total-with-gst">
                            <span className="currency-sym">{selectedCountry.currency}</span>
                            {Math.abs(formData.total_with_gst)}
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
              <div className="table-bordered black-bordered amount-box">
                <div>
                  <p>
                    <strong>Amount Chargeable (in words):</strong>
                  </p>
                  <h4 className="total-in-words">
                    <span className="currency-text"></span>{" "}
                    {numberToWords(Math.floor(Math.abs(formData.total_with_gst)))}
                  </h4>

                  <div className="top-right-corner">
                    <span>E. & O.E</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedCountry.name === "India" && (
            <div className="row">
              <div className="col-xs-12 inside-india">
                <table
                  className="table black-bordered"
                  style={{ width: "100%" }}
                >
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">
                        HSN/SAC
                      </th>
                      <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">
                        Taxable Value
                      </th>
                      <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">
                        Central Tax
                      </th>
                      <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">
                        State Tax
                      </th>
                      <th
                        style={{ backgroundColor: "#f1f3f4" }}
                        colSpan="2"
                        rowSpan="2"
                      >
                        Total Tax Amount
                      </th>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                      <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                      <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                      <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody style={{ borderBottom: "2px solid" }}>
                    <tr>
                      <td>
                        <span className="hns_select_text">{selectedHsn}</span>
                      </td>
                      <td className="taxable-value">{formData.base_amount}</td>
                      <td>9%</td>
                      <td className="tax-cgst">{Math.abs(formData.cgst)}</td>
                      <td>9%</td>
                      <td className="tax-sgst">{Math.abs(formData.sgst)}</td>
                      <td className="all-tax-amount">{Math.abs(formData.taxtotal)}</td>
                    </tr>
                    <tr className="total-row">
                      <td>Total</td>
                      <td className="total-taxable">{formData.base_amount}</td>
                      <td></td>
                      <td className="total-tax-cgst">{Math.abs(formData.cgst)}</td>
                      <td></td>
                      <td className="total-tax-sgst">{Math.abs(formData.sgst)}</td>
                      <td className="total-tax-amount">{Math.abs(formData.taxtotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div>
            <div className="col-xs-12 inside-india">
              <div>
                <strong>Tax Amount (in words):</strong>
                <span className="total-tax-in-words">
                  <span className="currency-text"></span>{" "}
                  {numberToWords(Math.floor(Math.abs(formData.total_with_gst)))}
                </span>
              </div>
            </div>
            <div className="col-xs-12">
              <div>
                <h5>
                  <strong>Remarks:</strong>
                </h5>
                <h5 className="html-remark">
                  <input
                    name="remark"
                    type="text"
                    value={formData.remark || ""}
                    onChange={handleChange}
                    className="remark"
                    style={{ width: "550px" }}
                  />
                </h5>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-x-12">
              <div className="hr">
                {settingsData && (
                  <div>
                    <strong>Company's Bank Details</strong>
                    <br />
                    A/c Holder's Name: {settingsData.bank_account_holder}
                    <br />
                    Bank Name: {settingsData.bank_name}
                    <br />
                    A/c No.: {settingsData.account_number}
                    <br />
                    IFS Code: {settingsData.ifsc_code}
                    <br />
                    Branch: {settingsData.branch}
                    <br />
                    SWIFT Code: {settingsData.swift_code}
                  </div>
                )}
              </div>

              <div className="text-right signatory">
                {settingsData && settingsData.logo && (
                  <img
                    src={`http://localhost:8000${settingsData.logo}`}
                    alt="Company Logo"
                    className="logo-image"
                  />
                )}

                <p>for {settingsData?.company_name}</p>
                <p>Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-center">
                    <button type="submit" className="btn btn-success mt-3 ">
                        Update Invoice & Download PDF
                    </button>
                </div>
      </form>
      {/* PDF */}
      <div
        ref={invoiceRef}
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          fontFamily: "Arial, sans-serif",
          color: "#575757",
          width: "200mm",
          minHeight: "297mm",
          background: "white",
          boxSizing: "border-box",
          padding: "0",
          margin: "0",
        }}
      >
        <h2 className="text-center" style={{ fontWeight: "bold" }}>TAX INVOICE</h2>
        <div style={{ border: "2px solid", backgroundColor: "white", padding: "10px", width: "100%" }}>
          <div className="row date-tables" style={{ width: "100%", display: "flex" }}>
            <div className="col-6" style={{ width: "50%", display: "flex", flexDirection: "column" }}>
              <table className="table black-bordered">
                <tbody>
                  <tr>
                    <td className="gray-background">
                      <strong style={{ fontSize: "15px" }}>{settingsData?.company_name}:</strong>
                    </td>
                  </tr>
                  {settingsData && (
                    <>
                      <tr>
                        <td style={{ padding: "10px", height: "150px" }}>
                          {settingsData.seller_address}<br />
                          Email: {settingsData.seller_email}<br />
                          PAN: {settingsData.seller_pan}<br />
                        </td>
                      </tr>
                      <tr>
                        <td className="gray-background">
                          <strong>GSTIN/UIN:</strong> {settingsData.seller_gstin}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              <table className="table black-bordered">
                <tbody>
                  <tr>
                    <td className="gray-background">
                      <strong>Buyer (Bill to):</strong> {formData.buyer_name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ maxWidth: "250px", overflowWrap: "break-word", height: "150px" }}>
                      <div style={{ whiteSpace: "pre-wrap" }}>{formData.buyer_address}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="gray-background">
                      <strong>GSTIN/UIN:</strong> {formData.buyer_gst}
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="table black-bordered">
                <tbody>
                  <tr>
                    <td className="gray-background">
                      <strong>Consignee (Ship to):</strong> {formData.consignee_name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ maxWidth: "250px", overflowWrap: "break-word", height: "150px" }}>
                      <div>{formData.consignee_address}</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="gray-background">
                      <strong>GSTIN/UIN:</strong> {formData.consignee_gst}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="col-6" style={{ width: "50%", display: "flex", flexDirection: "column" }}>
              <table className="table black-bordered">
                <tbody>
                  <tr><td>Invoice No.</td><td>{`${String(formData.invoice_number).padStart(2, "0")}`}</td></tr>
                  <tr><td>Date</td><td>{formatDisplayDate(formData.invoice_date)}</td></tr>
                  <tr><td>Delivery Note</td><td>{formData.delivery_note}</td></tr>
                  <tr><td>Mode/Terms of Payment</td><td>{formData.payment_mode}</td></tr>
                  <tr><td>Delivery Note Date</td>
                  <td>{formData.delivery_note_date ? formatDisplayDate(formData.delivery_note_date) : "-"}</td>
                    </tr>
                  <tr><td>Destination</td><td>{formData.destination}</td></tr>
                  
                </tbody>
              </table>

              <table className="table black-bordered">
                <tbody>
                  <tr><td className="gray-background"><strong>Terms to Delivery:</strong></td></tr>
                  <tr><td style={{ maxWidth: "250px", overflowWrap: "break-word", height: "150px" }}>{formData.Terms_to_delivery}</td></tr>
                </tbody>
              </table>

              <div className="relative w-72">
                <p><strong>Country and currency:</strong></p>
                <div className="flex items-center">
                  {selectedCountry.flag && (
                    <img src={selectedCountry.flag} alt="flag" style={{ width: "20px", marginRight: "8px" }} />
                  )}
                  <span>{selectedCountry.name} - {selectedCountry.currency} ({selectedCountry.currencyCode})</span>
                </div>
              </div>

              {selectedCountry.name !== "India" && (
                <>
                  <div className="mt-4">
                    <p style={{ margin: "0px" }}>Declare under LUT</p>
                  </div>
                  {settingsData && (
                    <div className="lut mt-3">
                      <p style={{ margin: "0px" }}></p>
                      <p>{settingsData.company_code}</p>
                    </div>
                  )}
                </>
              )}

              <input type="hidden" id="currencyTitle" value={selectedCountry.currencyCode} />
              <input type="hidden" id="currencySymbol" value={selectedCountry.currency} />
            </div>
          </div>

          <div className="row">
            <div className="col-xs-12">
              <table className="table black-bordered">
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
                  <tr style={{ height: "130px" }}>
                    <td>1</td>
                    <td>{formData.Particulars}</td>
                    <td>{formData.hsn_code}</td>
                    <td>{formData.total_hours}</td>
                    <td>{formData.rate}</td>
                    <td><span className="currency-sym">{selectedCountry.currency}</span>{Math.abs(formData.base_amount)}</td>
                  </tr>
                  {selectedCountry.name === "India" && (
                    (selectedState || "").trim().toLowerCase() === "gujarat" ? (
                      <>
                        <tr><td></td><td><span style={{ float: "right" }}>CGST @ 9%</span></td><td></td><td></td><td>9%</td><td><span className="currency-sym">₹</span>{Math.abs(formData.cgst)}</td></tr>
                        <tr><td></td><td><span style={{ float: "right" }}>SGST @ 9%</span></td><td></td><td></td><td>9%</td><td><span className="currency-sym">₹</span>{Math.abs(formData.sgst)}</td></tr>
                      </>
                    ) : (
                      <tr><td></td><td><span style={{ float: "right" }}>IGST @ 18%</span></td><td></td><td></td><td>18%</td><td><span className="currency-sym">₹</span>{Math.abs(formData.igst)}</td></tr>
                    )
                  )}
                  {/* Total row inside the main table, matching TaxInvoice.js */}
                  <tr>
                    <td colSpan="6">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Left side: INR conversion (not implemented in EditInvoice, so leave blank or add if needed) */}
                        <div style={{ whiteSpace: 'nowrap' }}></div>
                        {/* Right side: Total */}
                        <div style={{ whiteSpace: 'nowrap', textAlign: 'center', width: "200px" }}>
                          <strong>Total:</strong> &nbsp;
                          <strong id="total-with-gst">
                            <span className="currency-sym">{selectedCountry.currency}</span>
                            {Math.abs(formData.total_with_gst)}
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
              <div className="table-bordered black-bordered amount-box">
                <div>
                  <p>
                    <strong>Amount Chargeable (in words):</strong>
                  </p>
                  <h4 className="total-in-words">
                    <span className="currency-text">INR</span>{" "}
                    {numberToWords(Math.floor(Math.abs(formData.total_with_gst)))}
                  </h4>
                  <div className="top-right-corner">
                    <span>E. & O.E</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedCountry.name === "India" && (
            <div className="row" style={{ padding: "10px" }}>
              <div className="col-12">
                <table className="table black-bordered">
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">HSN/SAC</th>
                      <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">Taxable Value</th>
                      <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">Central Tax</th>
                      <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">State Tax</th>
                      <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2" rowSpan="2">Total Tax Amount</th>
                    </tr>
                    <tr>
                      <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th><th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                      <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th><th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{selectedHsn}</td>
                      <td>{Math.abs(formData.base_amount)}</td>
                      <td>9%</td>
                      <td>{Math.abs(formData.cgst)}</td>
                      <td>9%</td>
                      <td>{Math.abs(formData.sgst)}</td>
                      <td>{Math.abs(formData.taxtotal)}</td>
                    </tr>
                    {/* Total row inside the main table, matching TaxInvoice.js */}
                    <tr>
                      <td colSpan="6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {/* Left side: INR conversion (not implemented in EditInvoice, so leave blank or add if needed) */}
                          <div style={{ whiteSpace: 'nowrap' }}></div>
                          {/* Right side: Total */}
                          <div style={{ whiteSpace: 'nowrap', textAlign: 'center', width: "200px" }}>
                            <strong>Total:</strong> &nbsp;
                            <strong id="total-with-gst">
                              <span className="currency-sym">{selectedCountry.currency}</span>
                              {Math.abs(formData.total_with_gst)}
                            </strong>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <strong>Tax Amount (in words):</strong>
                <span className="total-tax-in-words">INR {numberToWords(Math.floor(Math.abs(formData.total_with_gst)))}</span>
              </div>

              <div className="col-12">
                <h4><strong>Remarks:</strong></h4>
                <h5>{formData.remark}</h5>
              </div>
            </div>
          )}

          <div className="row">
            <div className="col-x-12">
              <div className="hr">
                {settingsData && (
                  <div>
                    <strong>Company's Bank Details</strong><br />
                    A/c Holder's Name: {settingsData.bank_account_holder}<br />
                    Bank Name: {settingsData.bank_name}<br />
                    A/c No.: {settingsData.account_number}<br />
                    IFS Code: {settingsData.ifsc_code}<br />
                    Branch: {settingsData.branch}<br />
                    SWIFT Code: {settingsData.swift_code}
                  </div>
                )}
              </div>
              <div className="text-right signatory">
                {settingsData && settingsData.logoBase64 && (
                  <img src={settingsData.logoBase64} alt="Company Logo" className="logo-image" style={{ maxWidth: "200px", height: "auto" }} />
                )}
                <p>for {settingsData?.company_name}</p>
                <p>Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center" style={{ marginBottom: "0px" }}>This is a Computer Generated Invoice</p>
      </div>
    </div>
  );
};

export default EditInvoice;