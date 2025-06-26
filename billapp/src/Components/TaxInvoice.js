import React, { useState, useEffect, useRef, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./Taxinvoice.css";

const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  // add more as needed
};

const getCurrentInvoiceYear = () => {
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`;
};

const Taxinvoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pdfRef = useRef(null);

  // State management
  const [formData, setFormData] = useState({
    buyer_name: location.state?.buyerData?.buyer_name || "",
    buyer_address: location.state?.buyerData?.buyer_address || "",
    buyer_gst: location.state?.buyerData?.buyer_gst || "",
    consignee_name: location.state?.consigneeData?.consignee_name || "",
    consignee_address: location.state?.consigneeData?.consignee_address || "",
    consignee_gst: location.state?.consigneeData?.consignee_gst || "",
    invoice_number: "",
    invoice_date: "",
    delivery_note: "",
    payment_mode: "",
    delivery_note_date: "",
    destination: "",
    Terms_to_delivery: "",
    country: "",
    currency: "",
    Particulars: "",
    hsn_code: "998314",
    total_hours: "",
    rate: "",
    base_amount: "",
    cgst: "",
    sgst: "",
    igst: "",
    total_with_gst: "",
    taxtotal: "",
    remark: "",
    totalWithGst: "",
    financial_year: getCurrentInvoiceYear(),
  });

  const [selectedHsn, setSelectedHsn] = useState("");
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({
    name: "India",
    currency: "₹",
    currencyCode: "INR",
    flag: "https://flagcdn.com/in.svg",
  });
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceYear, setInvoiceYear] = useState(getCurrentInvoiceYear());
  const [settingsData, setSettingsData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOpenCountry, setIsOpenCountry] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [isOpenState, setIsOpenState] = useState(false);
  const [searchState, setSearchState] = useState("");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [showConversion, setShowConversion] = useState(false);

  // Add refs for dropdown containers
  const countryDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);

  // Helper functions
  const formatToISO = (dateStr) => {
    if (!dateStr) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return null;
  };

  // Helper function to safely display numeric values
  const safeNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return value;
  };

  const copyBillToShip = () => {
    setFormData(prev => ({
      ...prev,
      consignee_name: prev.buyer_name,
      consignee_address: prev.buyer_address,
      consignee_gst: prev.buyer_gst,
    }));
  };

  const fetchExchangeRate = useCallback(async (currencyCode) => {
    if (currencyCode === 'INR') {
      setExchangeRate(1);
      setShowConversion(false);
      return;
    }

    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/INR`);
      const data = await response.json();
      const rate = data.rates[currencyCode];
      if (rate) {
        setExchangeRate(1 / rate); // Convert from foreign currency to INR
        setShowConversion(true);
      } else {
        setExchangeRate(1);
        setShowConversion(false);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      setExchangeRate(1);
      setShowConversion(false);
    }
  }, []);

  const calculateInrEquivalent = (amount) => {
    const adjustment = 1; // subtract ₹1 per unit if needed

    if (!amount || isNaN(amount)) return 0;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;

    const converted = numAmount * exchangeRate;
    const adjusted = converted - adjustment; // Adjust if needed

    return adjusted;
  };


  useEffect(() => {
    if (settingsData?.HSN_codes?.length > 0 && (!formData.hsn_code || formData.hsn_code === "998314")) {
      setFormData(prev => ({
        ...prev,
        hsn_code: settingsData.HSN_codes[0],
      }));
    }
  }, [settingsData, formData.hsn_code]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/settings/", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data) {
        setSettingsData(data);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError(err.message || "Failed to load company settings");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  var headers = new Headers();
  // headers.append("X-CSCAPI-KEY", "API_KEY");

  var requestOptions = {
    method: 'GET',
    headers: headers,
    redirect: 'follow'
  };

  const fetchCountries = useCallback(async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const countryList = data
        .filter(country => country.currencies && country.name?.common)
        .map((country) => {
          const currencyCode = Object.keys(country.currencies)[0];
          const currencySymbol = country.currencies[currencyCode]?.symbol || "";
          return {
            name: country.name.common,
            currency: currencySymbol,
            currencyCode: currencyCode,
            flag: country.flags?.svg || ""
          };
        })
        .filter(country => country.currencyCode);
      countryList.sort((a, b) => a.name.localeCompare(b.name));
      setCountries(countryList);
    } catch (error) {
      console.error("Error fetching countries:", error);
      // fallback to a few countries if API fails
      setCountries([
        { name: "India", currency: "₹", currencyCode: "INR", flag: "https://flagcdn.com/in.svg" },
        { name: "United States", currency: "$", currencyCode: "USD", flag: "https://flagcdn.com/us.svg" },
        { name: "United Kingdom", currency: "£", currencyCode: "GBP", flag: "https://flagcdn.com/gb.svg" },
        { name: "European Union", currency: "€", currencyCode: "EUR", flag: "https://flagcdn.com/eu.svg" },
        { name: "Japan", currency: "¥", currencyCode: "JPY", flag: "https://flagcdn.com/jp.svg" }
      ]);
    }
  }, []);


  useEffect(() => {
    const fetchIndianStates = async () => {
      try {
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            country: "India",
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error("Failed to fetch states");
        }

        setStates(data.data.states);
      } catch (error) {
        console.error("Error fetching Indian states:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndianStates();
  }, []);

  useEffect(() => {
    if (selectedCountry.name === "India" && states.length > 0) {
      setSelectedState("Gujarat");
    }
  }, [selectedCountry, states]);

  const filteredStates = states.filter((state) =>
    state.name.toLowerCase().includes(searchState.toLowerCase())
  );

  const fetchNextInvoiceNumber = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/api/get_next_invoice_number/", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("access_token")}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      setNextInvoiceNumber(data.invoice_number);
      setFormData(prev => ({
        ...prev,
        invoice_number: data.invoice_number,
        financial_year: data.financial_year
      }));

    } catch (error) {
      console.error("Error fetching next invoice number:", error);
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const financialYear = `${currentYear}/${nextYear}`;
      const fallbackNumber = `01-${financialYear}`;

      setNextInvoiceNumber(fallbackNumber);
      setFormData(prev => ({
        ...prev,
        invoice_number: fallbackNumber,
        financial_year: financialYear
      }));
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchNextInvoiceNumber();
    fetchCountries();
    fetchSettings();
    fetchExchangeRate('INR');

    const interval = setInterval(() => {
      const newYear = getCurrentInvoiceYear();
      setInvoiceYear(newYear);
    }, 1000 * 60 * 60 * 24);

    return () => clearInterval(interval);
  }, [fetchNextInvoiceNumber, fetchCountries, fetchSettings, fetchExchangeRate]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      financial_year: invoiceYear,
    }));
  }, [invoiceYear]);

  useEffect(() => {
    if (selectedCountry) {
      setFormData(prev => ({
        ...prev,
        country: selectedCountry.name,
        currency: selectedCountry.currencyCode,
      }));
      fetchExchangeRate(selectedCountry.currencyCode);
    }
  }, [selectedCountry, fetchExchangeRate]);

  // Handle clicking outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsOpenCountry(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) {
        setIsOpenState(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchCountry.toLowerCase())
  );

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Handlers
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const calculateTotal = useCallback(() => {
    const total_hours = parseFloat(formData.total_hours) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const base_amount = parseFloat(formData.base_amount);

    let calculatedBaseAmount;
    if (total_hours > 0 && rate > 0) {
      calculatedBaseAmount = total_hours * rate;
    } else {
      calculatedBaseAmount = base_amount;
    }

    if (selectedCountry.name === "India") {
      if (selectedState === "Gujarat") {
        const tax = (calculatedBaseAmount * 9) / 100;
        const total_with_gst = Math.round(calculatedBaseAmount + 2 * tax);
        const total_tax = tax * 2;

        setFormData(prev => ({
          ...prev,
          base_amount: calculatedBaseAmount,
          cgst: tax,
          sgst: tax,
          igst: 0,
          taxtotal: total_tax,
          total_with_gst,
        }));
      } else {
        const igst = (calculatedBaseAmount * 18) / 100;
        const total_with_gst = Math.round(calculatedBaseAmount + igst);

        setFormData(prev => ({
          ...prev,
          base_amount: calculatedBaseAmount,
          cgst: 0,
          sgst: 0,
          igst: igst,
          taxtotal: igst,
          total_with_gst,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        base_amount: calculatedBaseAmount,
        cgst: 0,
        sgst: 0,
        igst: 0,
        taxtotal: 0,
        total_with_gst: Math.round(calculatedBaseAmount) || 0,
      }));
    }
  }, [formData.total_hours, formData.rate, formData.base_amount, selectedCountry.name, selectedState]);

  const handleBaseAmountChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "base_amount" && value && {
        total_hours: "",
        rate: ""
      })
    }));

    if (name === "base_amount") {
      const base_amount = parseFloat(value);
      if (selectedCountry.name === "India") {
        if (selectedState === "Gujarat") {
          const tax = (base_amount * 9) / 100;
          const total_with_gst = Math.round(base_amount + 2 * tax);
          const total_tax = tax * 2;

          setFormData(prev => ({
            ...prev,
            base_amount,
            cgst: tax,
            sgst: tax,
            igst: 0,
            taxtotal: total_tax,
            total_with_gst,
          }));
        } else {
          const igst = (base_amount * 18) / 100;
          const total_with_gst = Math.round(base_amount + igst);

          setFormData(prev => ({
            ...prev,
            base_amount,
            cgst: 0,
            sgst: 0,
            igst: igst,
            taxtotal: igst,
            total_with_gst,
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          base_amount,
          cgst: 0,
          sgst: 0,
          igst: 0,
          taxtotal: 0,
          total_with_gst: Math.round(base_amount),
        }));
      }
    }
  };

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const validateForm = () => {
    const requiredFields = [
      'buyer_name', 'buyer_address', 'invoice_date',
    ];

    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === "");

    if (missingFields.length > 0) {
      missingFields.forEach(field => {
        const fieldName = field.replace(/_/g, ' ');
        toast.error(`Please fill in the ${fieldName} field`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });
      return false;
    }

    if (selectedCountry.name === "India") {
      const hasBuyerGst = formData.buyer_gst && formData.buyer_gst.trim() !== "";
      const hasConsigneeGst = formData.consignee_gst && formData.consignee_gst.trim() !== "";

      const hasHoursRate = formData.total_hours && formData.rate;
      const hasBaseAmount = formData.base_amount;

      if (!hasHoursRate && !hasBaseAmount) {
        toast.error('Please provide either Hours and Rate or Base Amount', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return false;
      }

      if (!hasBaseAmount && (!formData.total_hours || !formData.rate)) {
        toast.error('Both Hours and Rate must be entered', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      if (!isSubmitted) {
        if (!validateForm()) {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const formattedInvoiceDate = formatToISO(formData.invoice_date);
        const formattedDeliveryDate = formData.delivery_note_date
          ? formatToISO(formData.delivery_note_date)
          : null;

        if (!formattedInvoiceDate) {
          throw new Error("Please enter a valid invoice date in DD-MM-YYYY or YYYY-MM-DD format.");
        }

        if (!formData.hsn_code || formData.hsn_code.trim() === "") {
          throw new Error("HSN/SAC code is required. Please select a valid HSN code.");
        }

        const prepareNumericField = (value) => {
          const num = parseFloat(value);
          return isNaN(num) ? null : num;
        };

        let base_amount;
        if (formData.total_hours && formData.rate) {
          base_amount = parseFloat(formData.total_hours) * parseFloat(formData.rate);
        } else if (formData.base_amount) {
          base_amount = parseFloat(formData.base_amount);
        } else {
          throw new Error("Please provide either (total hours + rate) OR base amount");
        }

        // Calculate INR equivalent for all amounts
        const inrEquivalent = calculateInrEquivalent(formData.total_with_gst);

        const payload = {
          buyer_name: formData.buyer_name,
          buyer_address: formData.buyer_address,
          buyer_gst: formData.buyer_gst || null,
          consignee_name: formData.consignee_name,
          consignee_address: formData.consignee_address,
          consignee_gst: formData.consignee_gst,
          invoice_number: formData.invoice_number,
          invoice_date: formattedInvoiceDate,
          delivery_note: formData.delivery_note,
          payment_mode: formData.payment_mode,
          delivery_note_date: formattedDeliveryDate,
          destination: formData.destination,
          country: selectedCountry.name,
          state: selectedState,
          currency: selectedCountry.currencyCode,
          Particulars: formData.Particulars,
          hsn_sac_code: formData.hsn_code,
          total_hours: prepareNumericField(formData.total_hours),
          rate: prepareNumericField(formData.rate),
          base_amount,
          cgst: prepareNumericField(formData.cgst),
          sgst: prepareNumericField(formData.sgst),
          taxtotal: prepareNumericField(formData.taxtotal),
          total_with_gst: prepareNumericField(formData.total_with_gst),
          remark: formData.remark,
          financial_year: formData.financial_year,
          exchange_rate: exchangeRate,
          inr_equivalent: inrEquivalent,
        };

        const response = await fetch("http://localhost:8000/api/create/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
          const errorMessages = Object.values(responseData.errors || {}).flat().join(", ");
          throw new Error(errorMessages || "Failed to save invoice");
        }

        setIsSubmitted(true);
        setFormData(prev => ({
          ...prev,
          invoice_number: responseData.invoice_number || prev.invoice_number
        }));
      }

      await generatePDF(formData.invoice_number);

      toast.success(isSubmitted ? 'PDF downloaded successfully!' : 'Invoice processed successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

    } catch (err) {
      console.error("Error:", err);
      toast.error(err.message || "An error occurred", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

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
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(input, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const margin = 10;
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

      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
      pdf.save(`Invoice_${formData.buyer_name}_${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      await generatePDF(formData.invoice_number);
      toast.success('PDF downloaded successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Failed to download PDF", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!settingsData) return <p className="text-center mt-4">Loading settings...</p>;

  return (
    <div style={{ paddingLeft: "70px", fontFamily: "Arial, sans-serif" }} onSubmit={handleSubmit}>
      <ToastContainer />
      <div style={{ paddingRight: "10px" }}>
        <h2 className="text-center">TAX INVOICE</h2>

        <div className="table-bordered black-bordered main-box" style={{ backgroundColor: "white" }} ref={pdfRef}>
          <div className="row date-tables">
            <div className="col-6">
              {/* Seller Info */}
              <table className="table table-bordered black-bordered">
                <tbody>
                  <tr>
                    <td className="gray-background">
                      <strong style={{ fontSize: "15px", fontfamily: "Arial, sans-serif" }}>
                        {settingsData.company_name}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px", fontFamily: "Arial, sans-serif" }}>
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
                      <strong>GSTIN/UIN:</strong>{settingsData.seller_gstin}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Buyer Info */}
              <table className="table table-bordered black-bordered">
                <tbody>
                  <tr>
                    <td className="gray-background">
                      <strong>Buyer (Bill to):</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Name:{" "}
                      <input
                        type="text"
                        name="buyer_name"
                        className="billToTitle"
                        value={formData.buyer_name}
                        onChange={handleChange}
                        required
                        readOnly={isSubmitted}
                      />
                      <br />
                      Address:
                      <textarea
                        type="text"
                        name="buyer_address"
                        className="billToAddress"
                        style={{ width: "100%", height: "100px" }}
                        value={formData.buyer_address}
                        onChange={handleChange}
                        readOnly={isSubmitted}
                      />
                      <br />
                      GSTIN/UIN:{" "}
                      <input
                        type="text"
                        name="buyer_gst"
                        className="billToGST"
                        value={formData.buyer_gst}
                        onChange={handleChange}
                        title="15 digit GST number required"
                        readOnly={isSubmitted}
                      />
                      {error && (
                        <div className="toast-error">
                          {error}
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Consignee Info */}
              <table className="table table-bordered black-bordered">
                <tbody>
                  <tr>
                    <td className="gray-background">
                      <strong>Consignee (Ship to):</strong>
                      <button
                        className="copybutton"
                        style={{ float: "right" }}
                        onClick={!isSubmitted ? copyBillToShip : undefined}
                        disabled={isSubmitted}
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Name:{" "}
                      <input
                        type="text"
                        name="consignee_name"
                        className="shipToTitle"
                        value={formData.consignee_name}
                        onChange={handleChange}
                        readOnly={isSubmitted}
                      />
                      <br />
                      Address:
                      <textarea
                        name="consignee_address"
                        className="shipToAddress"
                        style={{ width: "100%", height: "100px" }}
                        value={formData.consignee_address}
                        onChange={handleChange}
                        readOnly={isSubmitted}
                      />
                      <br />
                      GSTIN/UIN:{" "}
                      <input
                        type="text"
                        name="consignee_gst"
                        className="shipToGST"
                        value={formData.consignee_gst}
                        onChange={handleChange}
                        title="15 digit GST number required"
                        readOnly={isSubmitted}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="col-6">
              <table className="table table-bordered black-bordered">
                <tbody>
                  <tr>
                    <td style={{ width: "50%" }}>Invoice No.</td>
                    <td className="invoice-no-td">
                      <input
                        type="text"
                        style={{ width: "75%", margin: "1px 5px 1px 5px" }}
                        name="invoice_number"
                        className="invoice_Number"
                        value={formData.invoice_number || "Will be generated"}
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
                        value={formData.invoice_date}
                        onChange={handleChange}
                        name="invoice_date"
                        readOnly={isSubmitted}
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
                        readOnly={isSubmitted}
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
                        readOnly={isSubmitted}
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
                        value={formData.delivery_note_date}
                        onChange={handleChange}
                        readOnly={isSubmitted}
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
                        readOnly={isSubmitted}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="table table-bordered black-bordered">
                <tbody>
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
                        readOnly={isSubmitted}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="relative w-72">
                <div className="d-flex gap-4">
                  {/* Country Selector */}
                  <div style={{ position: "relative", width: "300px" }} ref={countryDropdownRef}>
                    <p><strong>Country and currency:</strong></p>
                    <div
                      className="border border-gray-300 p-2 rounded flex items-center justify-between cursor-pointer bg-white"
                      onClick={() => !isSubmitted && setIsOpenCountry(!isOpenCountry)}
                      style={{ cursor: isSubmitted ? 'not-allowed' : 'pointer', height: "40px" }}
                    >
                      <div
                        className="flex items-center"
                        style={{ height: "30px" }}
                      >
                        {selectedCountry.flag && (
                          <img
                            src={selectedCountry.flag}
                            alt={`${selectedCountry.name} flag`}
                            style={{ width: "20px", marginRight: "8px" }}
                          />
                        )}
                        <span className="mr-2">
                          {selectedCountry.name} - {currencySymbols[selectedCountry.currencyCode] || selectedCountry.currency || selectedCountry.currencyCode}
                        </span>
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {isOpenCountry && (
                      <div className="absolute bg-white border border-gray-300 w-full mt-1 rounded shadow-lg z-10">
                        <input
                          type="text"
                          className="w-full p-2 border-b border-gray-200 focus:outline-none"
                          placeholder="Search country..."
                          value={searchCountry}
                          onChange={(e) => setSearchCountry(e.target.value)}
                        />

                        {/* Country List */}
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
                                setIsOpenCountry(false);
                                setSearchCountry(""); // Clear search after selection
                              }}
                            >
                              {country.flag && (
                                <img
                                  src={country.flag}
                                  alt={`${country.name} flag`}
                                  style={{ width: "20px", marginRight: "8px" }}
                                />
                              )}
                              {country.name} - {currencySymbols[country.currencyCode] || country.currency || country.currencyCode}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Show State Selector only if selected country is India */}
                  {selectedCountry.name === "India" && (
                    <div style={{ position: "relative", width: "300px" }} ref={stateDropdownRef}>
                      <p><strong>Select State:</strong></p>
                      <div
                        className="border border-gray-300 p-2 rounded bg-white cursor-pointer states"
                        onClick={() => !isSubmitted && setIsOpenState(!isOpenState)}
                        style={{ cursor: isSubmitted ? 'not-allowed' : 'pointer' }}
                      >
                        {selectedState || "-- Select State --"}
                      </div>

                      {isOpenState && (
                        <div className="absolute bg-white border border-gray-300 w-full mt-1 rounded shadow-lg z-10">
                          <input
                            type="text"
                            className="w-full p-2 border-b border-gray-200 focus:outline-none"
                            placeholder="Search state..."
                            value={searchState}
                            onChange={(e) => setSearchState(e.target.value)}
                          />
                          <ul className="overflow-y-auto" style={{ maxHeight: "200px" }}>
                            {filteredStates.map((state, index) => (
                              <li
                                key={index}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  setSelectedState(state.name);
                                  setIsOpenState(false);
                                  setSearchState("");
                                }}
                              >
                                {state.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                {selectedCountry.name !== "India" && (
                  <>
                    <div className="lut">
                      <p style={{ margin: "0px" }}>Declare under LUT</p>
                    </div>
                    <div className="lut mt-3">
                      <p style={{ margin: "0px" }}>{settingsData.company_code}</p>
                    </div>
                  </>
                )}
              </div>

              {showConversion && (
                <div className="exchange-rate-note mt-2">
                  <p>
                    <strong>Note:</strong> Conversion rate used: 1 {selectedCountry.currencyCode} = ₹{exchangeRate.toFixed(4)}
                  </p>
                </div>
              )}

              <input type="hidden" id="currencyTitle" value="INR" />
              <input type="hidden" id="currencySymbol" value="₹" />
            </div>
          </div>

          <div className="row" style={{ marginTop: "20px" }}>
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
                  <tr style={{ height: "111px" }}>
                    <td>1</td>
                    <td>
                      <input
                        name="Particulars"
                        id="gstConsultancy"
                        value={formData.Particulars}
                        onChange={handleChange}
                        type="text"
                        readOnly={isSubmitted}
                      />
                    </td>
                    <td style={{ width: "130px", paddingTop: "16px" }}>
                      <select
                        name="hsn_code"
                        id="hns_select"
                        onChange={handleSelectChange}
                        value={formData.hsn_code || ""}
                        style={{ height: "46px" }}
                        readOnly={isSubmitted}
                        required
                      >
                        <option value="">Select</option>
                        {settingsData?.HSN_codes?.map((code, index) => (
                          <option key={index} value={code}>{code}</option>
                        ))}
                      </select>
                    </td>

                    <td style={{ width: "10%" }}>
                      <input
                        type="number"
                        name="total_hours"
                        value={safeNumber(formData.total_hours)}
                        onChange={(e) => {
                          handleChange(e);
                          setFormData(prev => ({
                            ...prev,
                            base_amount: ""
                          }));
                          calculateTotal();
                        }}
                        readOnly={isSubmitted}
                      />
                    </td>

                    <td style={{ width: "10%" }}>
                      <input
                        type="number"
                        name="rate"
                        value={safeNumber(formData.rate)}
                        onChange={(e) => {
                          handleChange(e);
                          setFormData(prev => ({
                            ...prev,
                            base_amount: ""
                          }));
                          calculateTotal();
                        }}
                        readOnly={isSubmitted}
                      />
                    </td>
                    <td style={{ width: "200px" }}>
                      <span className="currency-sym">{currencySymbols[selectedCountry.currencyCode] || selectedCountry.currency || selectedCountry.currencyCode} </span>
                      {safeNumber(formData.base_amount)}
                    </td>
                  </tr>

                  {selectedCountry.name === "India" && selectedState !== "Gujarat" && (
                    <tr className="inside-india">
                      <td></td>
                      <td>
                        <span style={{ float: "right" }}>IGST @ 18%</span>
                      </td>
                      <td></td>
                      <td></td>
                      <td>18%</td>
                      <td id="igst">
                        <span className="currency-sym">{currencySymbols[selectedCountry.currencyCode] || selectedCountry.currency || selectedCountry.currencyCode} </span>
                        {safeNumber(formData.igst)}
                      </td>
                    </tr>
                  )}

                  {selectedCountry.name === "India" && selectedState === "Gujarat" && (
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
                          <span className="currency-sym">{currencySymbols[selectedCountry.currencyCode] || selectedCountry.currency || selectedCountry.currencyCode} </span>
                          {safeNumber(formData.cgst)}
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
                          <span className="currency-sym">{currencySymbols[selectedCountry.currencyCode] || selectedCountry.currency || selectedCountry.currencyCode} </span>
                          {safeNumber(formData.sgst)}
                        </td>
                      </tr>
                    </>
                  )}

                  <tr>
                    <td colSpan="6">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                        {/* Left side: INR conversion (words + number) */}
                        <div style={{ whiteSpace: 'nowrap' }}>
                          {showConversion && (
                            <>
                              <span className="currency-text">{currencySymbols[selectedCountry.currencyCode] || selectedCountry.currency || selectedCountry.currencyCode}</span> {numberToWords(Math.floor(calculateInrEquivalent(safeNumber(formData.total_with_gst))))} Only —
                              <span className="currency-text">{currencySymbols[selectedCountry.currencyCode] || selectedCountry.currency || selectedCountry.currencyCode}</span> {calculateInrEquivalent(safeNumber(formData.total_with_gst))}
                            </>
                          )}
                        </div>

                        {/* Right side: Total */}
                        <div style={{ whiteSpace: 'nowrap', textAlign: 'center', width: "200px" }}>
                          <strong>Total:</strong> &nbsp;
                          <strong id="total-with-gst">
                            <span className="currency-sym">{currencySymbols[selectedCountry.currencyCode] || selectedCountry.currency || selectedCountry.currencyCode} </span>
                            {safeNumber(formData.total_with_gst)}
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
                    {currencySymbols[selectedCountry.currencyCode] || selectedCountry.currency || selectedCountry.currencyCode} {numberToWords(Math.floor(safeNumber(formData.total_with_gst)))} Only
                  </h4>

                  <div className="top-right-corner">
                    <span>E. & O.E</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedCountry.name === "India" && selectedState === "Gujarat" && (
            <div className="row">
              <div className="col-xs-12 inside-india">
                <table className="table table-bordered invoice-table">
                  <thead>
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
                  </thead>
                  <tbody>
                    <tr>
                      <td>{formData.hsn_code}</td>
                      <td>
                        {safeNumber(formData.base_amount)}
                        {showConversion && (
                          <div className="inr-conversion">
                            <span className="currency-text">{selectedCountry.currency}</span> {numberToWords(Math.floor(calculateInrEquivalent(safeNumber(formData.base_amount))))}
                          </div>
                        )}
                      </td>
                      <td>9%</td>
                      <td>
                        <span className="currency-sym">{selectedCountry.currency} </span>
                        {safeNumber(formData.cgst)}
                      </td>
                      <td>9%</td>
                      <td>
                        <span className="currency-sym">{selectedCountry.currency} </span>
                        {safeNumber(formData.sgst)}
                      </td>
                      <td>
                        <span className="currency-sym">{selectedCountry.currency} </span>
                        {safeNumber(formData.taxtotal)}
                      </td>
                    </tr>
                    <tr className="total-row">
                      <td>Total</td>
                      <td>
                        {safeNumber(formData.base_amount)}
                        {showConversion && (
                          <div className="inr-conversion">
                            <span className="currency-text">{selectedCountry.currency}</span> {numberToWords(Math.floor(calculateInrEquivalent(safeNumber(formData.base_amount))))}
                          </div>
                        )}
                      </td>
                      <td></td>
                      <td>
                        <span className="currency-sym">{selectedCountry.currency} </span>
                        {safeNumber(formData.cgst)}
                      </td>
                      <td></td>
                      <td>
                        <span className="currency-sym">{selectedCountry.currency} </span>
                        {safeNumber(formData.sgst)}
                      </td>
                      <td>
                        <span className="currency-sym">{selectedCountry.currency} </span>
                        {safeNumber(formData.taxtotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedCountry.name === "India" && selectedState !== "Gujarat" && (
            <div className="row">
              <div className="col-xs-12 outside-gujarat">
                <table className="table table-bordered invoice-table">
                  <thead>
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
                  </thead>
                  <tbody>
                    <tr>
                      <td>{formData.hsn_code}</td>
                      <td>
                        {safeNumber(formData.base_amount)}
                        {showConversion && (
                          <div className="inr-conversion">
                            <span className="currency-text">{selectedCountry.currency}</span> {numberToWords(Math.floor(calculateInrEquivalent(safeNumber(formData.base_amount))))}
                          </div>
                        )}
                      </td>
                      <td>18%</td>
                      <td>
                        <span className="currency-sym">{selectedCountry.currency} </span>
                        {safeNumber(formData.igst)}
                      </td>
                      <td>
                        <span className="currency-sym">{selectedCountry.currency} </span>
                        {safeNumber(formData.taxtotal)}
                      </td>
                    </tr>
                    <tr className="total-row">
                      <td><strong>Total</strong></td>
                      <td>
                        <strong>{safeNumber(formData.base_amount)}</strong>
                        {showConversion && (
                          <div className="inr-conversion">
                            <span className="currency-text">{selectedCountry.currency}</span> {numberToWords(Math.floor(calculateInrEquivalent(safeNumber(formData.base_amount))))}
                          </div>
                        )}
                      </td>
                      <td></td>
                      <td>
                        <strong>{safeNumber(formData.igst)}</strong>
                        {showConversion && (
                          <div className="inr-conversion">
                            <span className="currency-text">{selectedCountry.currency}</span> {numberToWords(Math.floor(calculateInrEquivalent(safeNumber(formData.igst))))}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{safeNumber(formData.taxtotal)}</strong>
                        {showConversion && (
                          <div className="inr-conversion">
                            <span className="currency-text">{selectedCountry.currency}</span> {numberToWords(Math.floor(calculateInrEquivalent(safeNumber(formData.taxtotal))))}
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ padding: "0 0 0 10px" }}>
            <div className="col-xs-12 inside-india">
              <div>
                <strong>Tax Amount (in words):</strong>
                <span className="total-tax-in-words">
                  {currencySymbols[selectedCountry.currencyCode] || selectedCountry.currency || selectedCountry.currencyCode} {numberToWords(Math.floor(safeNumber(formData.total_with_gst)))} Only
                </span>

              </div>
            </div>
            <div className="col-xs-12">
              <div>
                <h4>
                  <strong>Remarks:</strong>
                </h4>
                <h5 className="html-remark">
                  <input
                    name="remark"
                    type="text"
                    value={formData.remark}
                    onChange={handleChange}
                    className="remark"
                    style={{ width: "550px" }}
                    readOnly={isSubmitted}
                  />
                </h5>
              </div>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-x-12 mb-3">
              <div className="hr">
                <strong>Company's Bank Details</strong>
                <br />
                A/c Holder's Name: {settingsData.bank_account_holder}
                <br />
                Bank Name:{settingsData.bank_name}
                <br />
                A/c No.:{settingsData.account_number}
                <br />
                IFS Code:{settingsData.ifsc_code}
                <br />
                Branch: {settingsData.branch}
                <br />
                SWIFT Code:{settingsData.swift_code}
              </div>
              <div className="text-right signatory">
                {settingsData.logo && (
                  <img
                    src={`http://127.0.0.1:8000${settingsData.logo}`}
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
        <p className="text-center">This is a Computer Generated Invoice</p>
      </div>
      <div className="pdfbutton">
        <button
          onClick={isSubmitted ? handleDownloadPDF : handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          disabled={loading}
        >
          {loading ? 'Processing...' : isSubmitted ? 'Download PDF' : 'Generate & Download PDF'}
        </button>
      </div>
    </div>
  );
};

export default Taxinvoice;