// // src/pages/NewBillPage.jsx

// import React, { useState, useEffect, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import "./Taxinvoice.css";

// const getCurrentInvoiceYear = () => {
//     const year = new Date().getFullYear();
//     return `${year}/${year + 1}`;
// };

// const NewBillPage = () => {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const invoice = location.state?.invoice;

//     const [invoiceNumber, setInvoiceNumber] = useState("");
//     const [formData, setFormData] = useState({
//         buyer_name: "",
//         buyer_address: "",
//         buyer_gst: "",
//         consignee_name: "",
//         consignee_address: "",
//         consignee_gst: "",
//         invoice_number: "",
//         invoice_date: new Date().toISOString().split("T")[0],
//         delivery_note: "",
//         payment_mode: "",
//         delivery_note_date: "",
//         destination: "",
//         Terms_to_delivery: "",
//         country: "India",
//         currency: "₹",
//         Particulars: "",
//         hsn_code: "9983",
//         total_hours: "",
//         rate: "",
//         base_amount: "",
//         cgst: "",
//         sgst: "",
//         total_with_gst: "",
//         taxtotal: "",
//         remark: "",
//         additional_note: "",
//         financial_year: getCurrentInvoiceYear(),
//     });
//     const [settings, setSettings] = useState(null);
//     const [error, setError] = useState(null);
//     const pdfRef = useRef(null);

//     useEffect(() => {
//         fetch("http://127.0.0.1:8000/api/settings/")
//             .then((res) => res.json())
//             .then((data) => {
//                 if (data.length > 0) {
//                     setSettings(data[data.length - 1]);
//                 }
//             })
//             .catch((err) => {
//                 console.error("Error fetching settings:", err);
//                 setError("Failed to load settings.");
//             });
//     }, []);

//     useEffect(() => {
//         if (invoice) {
//             setFormData({
//                 ...formData,
//                 ...invoice,
//                 financial_year: getCurrentInvoiceYear(),
//             });
//             setInvoiceNumber(invoice.invoice_number);
//         }
//     }, [invoice]);

//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prev) => ({
//             ...prev,
//             [name]: value,
//         }));
//     };

//     const handleCopyBillToShip = () => {
//         setFormData((prev) => ({
//             ...prev,
//             consignee_name: prev.buyer_name,
//             consignee_address: prev.buyer_address,
//             consignee_gst: prev.buyer_gst,
//         }));
//     };

//     const handleDownloadPDF = () => {
//         const input = pdfRef.current;
//         html2canvas(input, { scale: 2 }).then((canvas) => {
//             const imgData = canvas.toDataURL("image/png");
//             const pdf = new jsPDF("p", "mm", "a4");
//             const imgProps = pdf.getImageProperties(imgData);
//             const pdfWidth = pdf.internal.pageSize.getWidth();
//             const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

//             pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

//             pdf.save(`Invoice_${invoiceNumber || "New"}.pdf`);
//         });
//     };

//     if (error) {
//         return (
//             <div className="text-center mt-4">
//                 <div className="alert alert-danger">{error}</div>
//                 <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
//                     Go Back
//                 </button>
//             </div>
//         );
//     }

//     if (!settings) {
//         return <p className="text-center mt-4">Loading settings...</p>;
//     }

//     return (
//         <div style={{ paddingLeft: "70px" }}>

//             <h2>New Bill (Prefilled from Existing Invoice)</h2>

//             {/* Input fields instead of static divs */}
//             <div>
//                 <label>Buyer Name:</label>
//                 <input
//                     type="text"
//                     name="buyer_name"
//                     value={formData.buyer_name}
//                     onChange={handleInputChange}
//                     className="form-control"
//                 />
//             </div>

//             <div>
//                 <label>Buyer Address:</label>
//                 <input
//                     type="text"
//                     name="buyer_address"
//                     value={formData.buyer_address}
//                     onChange={handleInputChange}
//                     className="form-control"
//                 />
//             </div>

//             <div>
//                 <label>Buyer GST:</label>
//                 <input
//                     type="text"
//                     name="buyer_gst"
//                     value={formData.buyer_gst}
//                     onChange={handleInputChange}
//                     className="form-control"
//                 />
//             </div>

//             <div>
//                 <label>Invoice Number:</label>
//                 <input
//                     type="text"
//                     name="invoice_number"
//                     value={formData.invoice_number}
//                     onChange={handleInputChange}
//                     className="form-control"
//                 />
//             </div>

//             <div>
//                 <label>Invoice Date:</label>
//                 <input
//                     type="date"
//                     name="invoice_date"
//                     value={formData.invoice_date}
//                     onChange={handleInputChange}
//                     className="form-control"
//                 />
//             </div>

//             <div>
//                 <label>Country:</label>
//                 <input
//                     type="text"
//                     name="country"
//                     value={formData.country}
//                     onChange={handleInputChange}
//                     className="form-control"
//                 />
//             </div>

//             <div>
//                 <label>Currency:</label>
//                 <input
//                     type="text"
//                     name="currency"
//                     value={formData.currency}
//                     onChange={handleInputChange}
//                     className="form-control"
//                 />
//             </div>

//             <div>
//                 <label>Amount with GST:</label>
//                 <input
//                     type="text"
//                     name="total_with_gst"
//                     value={formData.total_with_gst}
//                     onChange={handleInputChange}
//                     className="form-control"
//                 />
//             </div>
 
//             <div className="form-group">
//                 <label htmlFor="additional_note">Additional Note:</label>
//                 <input
//                     type="text"
//                     id="additional_note"
//                     name="additional_note"
//                     value={formData.additional_note}
//                     onChange={(e) =>
//                         setFormData({ ...formData, additional_note: e.target.value })
//                     }
//                     className="form-control"
//                 />
//             </div>

//             {/* Notice Section */}
//             <div style={{ marginTop: "40px", borderTop: "1px solid #ccc", paddingTop: "20px" }}>
//                 <p style={{ fontStyle: "italic", color: "gray", textAlign: "center" }}>
//                     This is a system-generated invoice. No signature required.
//                 </p>
//                 <p style={{ fontWeight: "bold", textAlign: "center" }}>
//                     Thank you for your business!
//                 </p>
//             </div>
//             <div ref={pdfRef} style={{ padding: "20px", backgroundColor: "white" }}>
//                 <div><strong>Buyer Name:</strong> {formData.buyer_name}</div>
//                 <div><strong>Buyer Address:</strong> {formData.buyer_address}</div>
//                 <div><strong>Buyer GST:</strong> {formData.buyer_gst}</div>
//                 <div><strong>Invoice Number:</strong> {formData.invoice_number}</div>
//                 <div><strong>Invoice Date:</strong> {formData.invoice_date}</div>
//                 <div><strong>Country:</strong> {formData.country}</div>
//                 <div><strong>Currency:</strong> {formData.currency}</div>
//                 <div><strong>Amount with GST:</strong> {formData.total_with_gst}</div>
//                 <div><strong>Additional Note:</strong> {formData.additional_note}</div>
//             </div>

//             <div className="d-flex gap-3 mt-3">
//                 <button className="btn btn-primary" onClick={handleCopyBillToShip}>
//                     Copy Bill To Ship
//                 </button>
//                 <button className="btn btn-success" onClick={handleDownloadPDF}>
//                     Download PDF
//                 </button>
//                 <button className="btn btn-secondary" onClick={() => navigate(-1)}>
//                     Back
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default NewBillPage;





// import React, { useState, useEffect, useRef } from "react";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import "./Taxinvoice.css";

// const getCurrentInvoiceYear = () => {
//   const year = new Date().getFullYear();
//   return `${year}/${year + 1}`;
// };

// const Taxinvoice = () => {
//   const [invoice_Number, setinvoice_Number] = useState(1);
//   const [billTo, setBillTo] = useState({ title: "", address: "", gst: "" });
//   const [shipTo, setShipTo] = useState({ title: "", address: "", gst: "" });
//   const [rate, setRate] = useState(0);
//   const [baseAmount, setBaseAmount] = useState(0);
//   const [cgst, setCgst] = useState(0);
//   const [sgst, setSgst] = useState(0);
//   const [totalWithGst, setTotalWithGst] = useState(0);
//   const [selectedHsn, setSelectedHsn] = useState("9983");
//   const [countries, setCountries] = useState([]);
//   const [search, setSearch] = useState("");
//   const [selectedCountry, setSelectedCountry] = useState({
//     name: "India",
//     currency: "₹",
//   });
//   const [isOpen, setIsOpen] = useState(false);
//   const [invoiceYear, setInvoiceYear] = useState(getCurrentInvoiceYear());
//   const [showPdfContent, setShowPdfContent] = useState(false);
//   const pdfRef = useRef(null);
//   const [date, setDate] = useState("");
//   const [deliveryNote, setDeliveryNote] = useState("");
//   const [modeOfPayment, setModeOfPayment] = useState("");
//   const [deliveryNoteDate, setDeliveryNoteDate] = useState("");
//   const [destination, setDestination] = useState("");
//   const [billToAddress, setBillToAddress] = useState("");
//   const [gstConsultancy, setGstConsultancy] = useState("");
//   // const [remark, setremark] = useState("");

//   const copyBillToShip = () => {
//     setFormData((prev) => ({
//       ...prev,
//       consignee_name: prev.buyer_name,
//       consignee_address: prev.buyer_address,
//       consignee_gst: prev.buyer_gst,
//     }));
//   };
//   const handleInputChange = (e) => {
//             const { name, value } = e.target;
//             setFormData((prev) => ({
//                 ...prev,
//                 [name]: value,
//             }));
//         };






        
//   const formatToISO = (dateStr) => {
//     if (!dateStr) return null;

//     // If it's already in YYYY-MM-DD
//     if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

//     const parts = dateStr.split(/[-/]/);
//     if (parts.length !== 3) return null; // Invalid date format

//     // If format is DD-MM-YYYY or DD/MM/YYYY
//     const [day, month, year] = parts;
//     if (!day || !month || !year) return null;

//     return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
//   };

//   const [formData, setFormData] = useState({
//     buyer_name: "",
//     buyer_address: "",
//     buyer_gst: "",
//     consignee_name: "",
//     consignee_address: "",
//     consignee_gst: "",
//     invoice_number: "",
//     invoice_date: "",
//     delivery_note: "",
//     payment_mode: "",
//     delivery_note_date: "",
//     destination: "",
//     Terms_to_delivery: "",
//     country: "",
//     currency: "",
//     Particulars: "",
//     hsn_code: "",
//     total_hours: "",
//     rate: "",
//     base_amount: "",
//     cgst: "",
//     sgst: "",
//     total_with_gst: "",
//     taxtotal: "",
//     remark: "",
//     totalWithGst: "",
//     financial_year: getCurrentInvoiceYear(),
//   });


//   const [data, setData] = useState(null);

//   useEffect(() => {
//     fetch("http://127.0.0.1:8000/api/settings/")
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.length > 0) {
//           setData(data[data.length - 1]);
//         }
//       })
//       .catch((err) => console.error("Error fetching settings", err));
//   }, []);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const newYear = getCurrentInvoiceYear();
//       setInvoiceYear(newYear);
//     }, 1000 * 60 * 60 * 24); // Check daily if the year has changed

//     return () => clearInterval(interval); // Cleanup interval on component unmount
//   }, []);

//   useEffect(() => {
//     setFormData((prev) => ({
//       ...prev,
//       financial_year: invoiceYear,
//     }));
//   }, [invoiceYear]);


//   const incrementInvoice = () => setinvoice_Number((prev) => prev + 1);
//   const decrementInvoice = () =>
//     setinvoice_Number((prev) => (prev > 1 ? prev - 1 : 1));

//   const numberToWords = (num) => {
//     const ones = [
//       "",
//       "One",
//       "Two",
//       "Three",
//       "Four",
//       "Five",
//       "Six",
//       "Seven",
//       "Eight",
//       "Nine",
//     ];
//     const teens = [
//       "Ten",
//       "Eleven",
//       "Twelve",
//       "Thirteen",
//       "Fourteen",
//       "Fifteen",
//       "Sixteen",
//       "Seventeen",
//       "Eighteen",
//       "Nineteen",
//     ];
//     const tens = [
//       "",
//       "",
//       "Twenty",
//       "Thirty",
//       "Forty",
//       "Fifty",
//       "Sixty",
//       "Seventy",
//       "Eighty",
//       "Ninety",
//     ];
//     const thousandUnits = ["", "Thousand", "Lakh", "Crore"];
//     if (num === 0) return "Zero";
//     let words = "";
//     let unitIndex = 0;
//     // Handle the integer part of the number
//     let integerPart = Math.floor(num);
//     while (integerPart > 0) {
//       let chunk = integerPart % 1000;
//       if (chunk) {
//         let chunkWords = "";
//         if (chunk >= 100) {
//           chunkWords += ones[Math.floor(chunk / 100)] + " Hundred ";
//           chunk %= 100;
//         }
//         if (chunk < 10) {
//           chunkWords += ones[chunk];
//         } else if (chunk < 20) {
//           chunkWords += teens[chunk - 10];
//         } else {
//           chunkWords +=
//             tens[Math.floor(chunk / 10)] +
//             (chunk % 10 !== 0 ? " " + ones[chunk % 10] : "");
//         }
//         words =
//           chunkWords.trim() + " " + thousandUnits[unitIndex] + " " + words;
//       }
//       integerPart = Math.floor(integerPart / 1000);
//       unitIndex++;
//     }

//     // Handle the fractional part (for paisa or cents)
//     let decimalPart = Math.round((num - Math.floor(num)) * 100);
//     if (decimalPart > 0) {
//       words += " and " + numberToWords(decimalPart) + " Paisa";
//     }

//     return words.trim();
//   };

//   useEffect(() => {
//     const fetchCountries = async () => {
//       try {
//         const response = await fetch("https://restcountries.com/v3.1/all");
//         if (!response.ok) throw new Error("Network response was not ok");
//         const data = await response.json();
//         const countryList = data.map((country) => {
//           const currencyCode = country.currencies
//             ? Object.keys(country.currencies)[0]
//             : "";
//           const currencySymbol =
//             country.currencies?.[currencyCode]?.symbol || "";
//           return {
//             name: country.name.common,
//             currency: currencySymbol,
//             flag: country.flags.svg, // Get country flag image
//           };
//         });
//         setCountries(countryList);
//       } catch (error) {
//         console.error("Error fetching countries:", error);
//       }
//     };
//     fetchCountries();
//   }, []);

//   const filteredCountries = countries.filter((country) =>
//     country.name.toLowerCase().includes(search.toLowerCase())
//   );
//   const handleSelectChange = (event) => {
//     const selectedValue = event.target.value;
//     setSelectedHsn(selectedValue); // update the select box
//     setFormData((prev) => ({
//       ...prev,
//       hsn_code: selectedValue, // update the form data too
//     }));
//   };
//   useEffect(() => {
//     if (selectedCountry) {
//       setFormData((prev) => ({
//         ...prev,
//         country: selectedCountry.name,
//         currency: selectedCountry.currency, // ✅ update currency
//       }));
//     }
//   }, [selectedCountry]);
  

//   // Auto calculate values when total_hours or rate changes
//   useEffect(() => {
//     calculateTotal();
//   }, [formData.total_hours, formData.rate, formData.country]);

//   // Function to calculate total tax (CGST + SGST)
//   const totalTax = (cgstValue, sgstValue) => {
//     return cgstValue + sgstValue;
//   };

//   // Handle input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };
//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const formattedInvoiceDate = formatToISO(formData.invoice_date);
//     const formattedDeliveryDate = formatToISO(formData.delivery_note_date);

//     if (!formattedInvoiceDate || !formattedDeliveryDate) {
//       alert("Please enter valid dates in DD-MM-YYYY or YYYY-MM-DD format.");
//       return;
//     }

//     // ✅ Ensure invoice number is created before sending
//     let invoice_NumberToUse = formData.invoice_number;
//     if (!invoice_NumberToUse) {
//       invoice_NumberToUse = `${String(invoice_Number).padStart(2, "0")}-${invoiceYear}`; // or use your custom format
//     }

//     // ✅ Final payload preparation
//     const payload = {
//       ...formData,
//       invoice_number: invoice_NumberToUse,
//       invoice_date: formattedInvoiceDate,
//       delivery_note_date: formattedDeliveryDate,
//       currency: formData.currency || "INR",
//       hsn_code: formData.hsn_code || "0000",
//       financial_year: invoiceYear,
//     };

//     // Optional: update formData state for UI
//     setFormData((prev) => ({
//       ...prev,
//       invoice_number: invoice_NumberToUse,
//     }));

//     // ✅ Make API call
//     fetch("http://localhost:8000/api/create/", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     })
//       // .then((res) => {
//       //   if (!res.ok) throw new Error("Something went wrong");
//       //   return res.json();
//       // })
//       .then((data) => {
//         console.log("Invoice saved:", data);
//         alert("Invoice created successfully!");
//         generatePDF(invoice_NumberToUse); // 👈 pass invoice number to PDF function
//       })
//       .catch((err) => {
//         console.error(err);
//         alert("Error saving invoice.");
//       });
//   };
//   const getNextInvoiceNumber = async () => {
//     try {
//       const res = await fetch("http://localhost:8000/api/invoices/");
//       const data = await res.json();
  
//       // Extract and filter only valid invoice numbers like "01-2025/2026"
//       const invoiceNumbers = data
//         .map((inv) => inv.invoice_number)
//         .filter((num) => num && num.includes("-"))
//         .map((num) => {
//           const [prefix] = num.split("-");
//           return parseInt(prefix, 10);
//         });
  
//       const maxNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 0;
//       const nextNumber = (maxNumber + 1).toString().padStart(2, "0");
  
//       const currentYear = new Date().getFullYear();
//       const nextYear = currentYear + 1;
//       const financialYear = `${currentYear}/${nextYear}`;
  
//       return `${nextNumber}-${financialYear}`;
//     } catch (error) {
//       console.error("Error fetching invoices:", error);
//       return "01-2025/2026"; // fallback
//     }
//   };
  
//   const generatePDF = async () => {
//     const input = pdfRef.current;
  
//     if (!input) {
//       alert("PDF content not found.");
//       return;
//     }
  
//     // 📌 Get auto-incremented invoice number
//     const finalInvoiceNumber = await getNextInvoiceNumber();
  
//     // Prepare form data for backend
//     const updatedFormData = {
//       ...formData,
//       invoice_number: finalInvoiceNumber,
//       invoice_date: new Date().toISOString().split("T")[0],
//       financial_year: finalInvoiceNumber.split("-")[1],
//     };
  
//     // Show content temporarily for screenshot
//     input.style.visibility = "visible";
  
//     // ✅ Wait for logo image to load (if any)
//     const logoImg = input.querySelector("img");
//     const waitForImageLoad = logoImg
//       ? new Promise((resolve, reject) => {
//           if (logoImg.complete) {
//             resolve();
//           } else {
//             logoImg.onload = resolve;
//             logoImg.onerror = reject;
//           }
//         })
//       : Promise.resolve();
  
//     // 🌟 Generate PDF after ensuring everything is ready
//     waitForImageLoad
//       .then(() => {
//         setTimeout(() => {
//           html2canvas(input, { scale: 2, useCORS: true })
//             .then((canvas) => {
//               const imgData = canvas.toDataURL("image/png");
//               const pdf = new jsPDF("p", "mm", "a4");
//               const imgWidth = 190;
//               const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
//               pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
//               pdf.save(`Invoice-${formData.buyer_name}-${finalInvoiceNumber}.pdf`);

  
//               input.style.visibility = "hidden";
  
//               // Save to backend
//               return fetch("http://localhost:8000/api/invoices/", {
//                 method: "POST",
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(updatedFormData),
//               });
//             })
//             .then((res) => {
//               if (!res.ok) {
//                 throw new Error("Failed to save invoice to backend.");
//               }
//               return res.json();
//             })
//             .then((data) => {
//               console.log("Invoice saved successfully:", data);
//             })
//             .catch((error) => {
//               console.error("PDF generation/save error:", error);
//             });
//         }, 100);
//       })
//       .catch((err) => {
//         console.error("Logo image failed to load:", err);
//         alert("Logo image couldn't be loaded for PDF.");
//       });
//   };
  

//   // Auto calculate total with GST and tax fields
//   const calculateTotal = () => {
//     const total_hours = parseFloat(formData.total_hours) || 0;
//     const rate = parseFloat(formData.rate) || 0;
//     const base_amount = total_hours * rate;

//     console.log("Base Amount:", base_amount);
//     // console.log("Total With GST:", total_with_gst);

//     if (formData.country === "India" && base_amount > 0) {
//       const tax = (base_amount * 9) / 100;
//       const total_with_gst = Math.round(base_amount + 2 * tax);
//       console.log("Total With GST after tax:", total_with_gst);

//       const total_tax = totalTax(tax, tax); // Calculate CGST + SGST
//       setFormData((prev) => ({
//         ...prev,
//         base_amount,
//         cgst: tax,
//         sgst: tax,
//         taxtotal: total_tax, // Set total tax value
//         total_with_gst,
//       }));
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         base_amount,
//         cgst: 0,
//         sgst: 0,
//         taxtotal: 0, // No tax for countries other than India
//         total_with_gst: Math.round(base_amount),
//       }));
//     }
//   };

//   if (!data) return <p className="text-center mt-4">Loading settings...</p>;
//   return (
//     <div style={{ paddingLeft: "70px" }} onSubmit={handleSubmit}>
//       <div style={{ paddingRight: "10px" }}>
//         <h2 className="text-center">TAX INVOICE</h2>

//         <div className="table-bordered black-bordered main-box" style={{backgroundColor:"white"}}>
//           <div className="row date-tables">
//             <div className="col-6">
//               {/* Seller Info */}
//               <table className="table table-bordered black-bordered">
//                 <tbody>
//                   <tr>
//                     <td className="gray-background">
//                       <strong style={{ fontSize: "15px" }}>
//                         Grabsolve Infotech:
//                       </strong>
//                     </td>
//                   </tr>
//                   <tr>
//                     {data.seller_address}
//                     <br />
//                     Email:{data.seller_email}
//                     <br />
//                     PAN: {data.seller_pan}
//                     <br />
//                   </tr>
//                   <tr>
//                     <td className="gray-background">
//                       <strong>  GSTIN/UIN:</strong>{data.seller_gstin}
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>

//               {/* Buyer Info */}
//               <table className="table table-bordered black-bordered">
//                 <tbody>
//                   <tr>
//                     <td className="gray-background">
//                       <strong>Buyer (Bill to):</strong>
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>
//                       Name:{" "}
//                       <input
//                         type="text"
//                         name="buyer_name"
//                         className="billToTitle"
//                         value={formData.buyer_name}
                                             
//                         onChange={handleInputChange}
//                         // value={formData.buyer_name}
//                         // onChange={handleChange}
//                       />
//                       <br />
//                       Address:
//                       <textarea
//                         type="text"
//                         name="buyer_address"
//                         className="billToAddress"
//                         style={{ width: "100%", height: "100px" }}
//                         value={formData.buyer_address}
//                         onChange={handleChange}
//                       />
//                       <br />
//                       GSTIN/UIN:{" "}
//                       <input
//                         type="text"
//                         name="buyer_gst"
//                         className="billToGST"
//                         value={formData.buyer_gst}
//                         onChange={handleChange}
//                       />
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>

//               {/* Consignee Info */}

//               <table className="table table-bordered black-bordered">
//                 <tbody>
//                   <tr>
//                     <td className="gray-background">
//                       <strong>Consignee (Ship to):</strong>
//                       <button
//                         className="copybutton"
//                         style={{ float: "right" }}
//                         onClick={copyBillToShip}
//                       >
//                         Copy
//                       </button>
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>
//                       Name:{" "}
//                       <input
//                         type="text"
//                         name="consignee_name"
//                         className="shipToTitle"
//                         value={formData.consignee_name}
//                         onChange={handleChange}
//                       />
//                       <br />
//                       Address:
//                       <textarea
//                         name="consignee_address"
//                         className="shipToAddress"
//                         style={{ width: "100%", height: "100px" }}
//                         value={formData.consignee_address}
//                         onChange={handleChange}
//                       />
//                       <br />
//                       GSTIN/UIN:{" "}
//                       <input
//                         type="text"
//                         name="consignee_gst"
//                         className="shipToGST"
//                         value={formData.consignee_gst}
//                         onChange={handleChange}
//                       />
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>

//             <div className="col-6">
//               <table className="table table-bordered black-bordered">
//                 <tbody>
//                   <tr>
//                     <td style={{ width: "50%" }}>Invoice No.</td>
//                     <td className="invoice-no-td">
//                       {/* <button
//                         type="button"
//                         className="decrement button-p-m"
//                         onClick={decrementInvoice}
//                       >
//                         -
//                       </button> */}
//                       <input
//                         type="text"
//                         style={{ width: "75%", margin: "1px 5px 1px 5px" }}
//                         name="invoice_number"
//                         className="invoice_Number"
//                         value={`${String(invoice_Number).padStart(
//                           2,
//                           "0"
//                         )}-${invoiceYear}`}
//                         readOnly
//                       />
//                       {/* <button
//                         type="button"
//                         className="increment button-p-m"
//                         onClick={incrementInvoice}
//                       >
//                         +
//                       </button> */}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>Date</td>
//                     <td>
//                       <input
//                         type="date"
//                         id="datePicker"
//                         value={formData.invoice_date}
//                         onChange={handleChange}
//                         name="invoice_date"
//                       />
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>Delivery Note</td>
//                     <td>
//                       <input
//                         type="text"
//                         className="deliveryNote"
//                         value={formData.delivery_note}
//                         onChange={handleChange}
//                         name="delivery_note"
//                       />
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>Mode/Terms of Payment</td>
//                     <td>
//                       <input
//                         type="text"
//                         className="deliveryNote"
//                         value={formData.payment_mode}
//                         onChange={handleChange}
//                         name="payment_mode"
//                       />
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>Delivery Note Date</td>
//                     <td>
//                       <input
//                         type="text"
//                         name="delivery_note_date"
//                         className="deliveryNote"
//                         value={formData.delivery_note_date}
//                         onChange={handleChange}
//                       />
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>Destination</td>
//                     <td>
//                       <input
//                         type="text"
//                         name="destination"
//                         className="deliveryNote"
//                         value={formData.destination}
//                         onChange={handleChange}
//                       />
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>

//               <table className="table table-bordered black-bordered">
//                 <tbody>
//                   <tr>
//                     <td className="gray-background">
//                       <strong>Terms to Delivery:</strong>
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <textarea
//                         className="billToAddress"
//                         name="Terms_to_delivery"
//                         style={{ width: "100%", height: "100px" }}
//                         value={formData.Terms_to_delivery}
//                         onChange={handleChange}
//                       />
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>

//               <div className="relative w-72">
//                 {/* Selected Country (Dropdown Trigger) */}
//                 <p>
//                   <strong>Country and currency:</strong>
//                 </p>
//                 <div
//                   className="border border-gray-300 p-2 rounded flex items-center justify-between cursor-pointer bg-white"
//                   onClick={() => setIsOpen(!isOpen)}
//                 >
//                   <div className="flex items-center" style={{ height: "30px" }}>
//                     <span className="mr-2">
//                       {selectedCountry.name} - {selectedCountry.currency}
//                     </span>
//                   </div>
//                 </div>

//                 {/* Dropdown Menu */}
//                 {isOpen && (
//                   <div className="absolute bg-white border border-gray-300 w-full mt-1 rounded shadow-lg z-10">
//                     <input
//                       type="text"
//                       className="w-full p-2 border-b border-gray-200 focus:outline-none"
//                       placeholder="Search..."
//                       value={search}
//                       onChange={(e) => setSearch(e.target.value)}
//                     />

//                     {/* Country List */}
//                     <ul
//                       className="overflow-y-auto list-group"
//                       style={{ height: "200px" }}
//                     >
//                       {filteredCountries.map((country, index) => (
//                         <li
//                           key={index}
//                           className="p-2 flex items-center hover:bg-gray-100 cursor-pointer"
//                           onClick={() => {
//                             setSelectedCountry(country);
//                             setIsOpen(false);
//                             setSearch(""); // Clear search after selection
//                           }}
//                         >
//                           {country.name} - {country.currency}
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}
//               </div>

//               {/* Keep "Declare under LUT" separate, so it doesn't slide when dropdown opens */}
//               <div className="mt-4 ">
//                 {selectedCountry.name !== "India" && (
//                   <div className="lut">
//                     <p style={{ margin: "0px" }}>Declare under LUT</p>
//                   </div>
//                 )}
//               </div>

//               <input type="hidden" id="currencyTitle" value="INR" />
//               <input type="hidden" id="currencySymbol" value="₹" />
//             </div>
//           </div>

//           <div className="row">
//             <div className="col-xs-12">
//               <table className="table table-bordered black-bordered">
//                 <thead>
//                   <tr className="trbody">
//                     <th>SI No.</th>
//                     <th>Particulars</th>
//                     <th>HSN/SAC</th>
//                     <th>Hours</th>
//                     <th>Rate</th>
//                     <th>Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr style={{ height: "111px" }}>
//                     <td>1</td>
//                     <td>
//                       <input
//                         name="Particulars"
//                         id="gstConsultancy"
//                         value={formData.Particulars}
//                         onChange={handleChange}
//                         type="text"
//                       />
//                     </td>
//                     <td style={{ width: "130px" }}>
//                       <select
//                         name="hsn_code"
//                         id="hns_select"
//                         onChange={handleSelectChange}
//                         value={formData.hsn_code}
//                       >
//                         <option value="9983">9983</option>
//                         <option value="8523">8523</option>
//                       </select>
//                     </td>
//                     <td style={{ width: "10%" }}>
//                       <input
//                         type="number"
//                         name="total_hours"
//                         value={formData.total_hours}
//                         onChange={(e) => {
//                           handleChange(e);
//                           calculateTotal();
//                         }}
//                       />
//                     </td>

//                     <td style={{ width: "10%" }}>
//                       <input
//                         type="number"
//                         name="rate"
//                         value={formData.rate}
//                         onChange={(e) => {
//                           handleChange(e);
//                           calculateTotal();
//                         }}
//                       />
//                     </td>

//                     <td style={{ width: "200px" }}>
//                       <span className="currency-sym">
//                         {selectedCountry.currency}
//                       </span>
//                       <input
//                         style={{ width: "90%" }}
//                         id="baseAmount"
//                         name="base_amount"
//                         type="number"
//                         value={formData.base_amount}
//                         onChange={(e) => {
//                           handleChange(e); // Update formData
//                           calculateTotal(); // Recalculate totals like GST
//                         }}
//                       />
//                     </td>
//                   </tr>
//                   {selectedCountry.name === "India" && (
//                     <tr className="inside-india">
//                       <td></td>
//                       <td>
//                         <span style={{ float: "right" }}>CGST @ 9%</span>
//                       </td>
//                       <td></td>
//                       <td></td>
//                       <td>9%</td>
//                       <td id="cgst">
//                         <span className="currency-sym">₹</span>
//                         <input
//                           style={{ width: "90%" }}
//                           name="cgst"
//                           type="number"
//                           step="0.01"
//                           placeholder="CGST"
//                           value={formData.cgst}
//                           readOnly
//                         />
//                       </td>
//                     </tr>
//                   )}

//                   {selectedCountry.name === "India" && (
//                     <tr className="inside-india">
//                       <td></td>
//                       <td>
//                         <span style={{ float: "right" }}>SGST @ 9%</span>
//                       </td>
//                       <td></td>
//                       <td></td>
//                       <td>9%</td>
//                       <td id="sgst">
//                         <span className="currency-sym">₹</span>
//                         <input
//                           style={{ width: "90%" }}
//                           name="sgst"
//                           type="number"
//                           step="0.01"
//                           placeholder="SGST"
//                           value={formData.sgst}
//                           readOnly
//                         />
//                       </td>
//                     </tr>
//                   )}
//                   <tr>
//                     <td colSpan="5" className="text-right">
//                       <strong>Total</strong>
//                     </td>
//                     <td>
//                       <strong id="total-with-gst">
//                         <span className="currency-sym">
//                           {selectedCountry.currency}
//                         </span>
//                         <input
//                           style={{ width: "90%" }}
//                           name="total_with_gst"
//                           type="number"
//                           step="0.01"
//                           placeholder="Total with GST"
//                           value={formData.total_with_gst}
//                           readOnly
//                         />
//                       </strong>
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           <div className="row">
//             <div className="col-xs-12">
//               <div className="table-bordered black-bordered amount-box">
//                 <div>
//                   <p>
//                     <strong>Amount Chargeable (in words):</strong>
//                   </p>
//                   <h4 className="total-in-words">
//                     <span className="currency-text">INR</span>{" "}
//                     {numberToWords(Math.floor(formData.total_with_gst))}
//                   </h4>
//                   <div className="top-right-corner">
//                     <span>E. & O.E</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {selectedCountry.name === "India" && (
//             <div className="row">
//               <div className="col-xs-12 inside-india">
//                 <table className="table table-bordered invoice-table">
//                   <thead>
//                     <tr>
//                       <th rowSpan="2">HSN/SAC</th>
//                       <th rowSpan="2">Taxable Value</th>
//                       <th colSpan="2">Central Tax</th>
//                       <th colSpan="2">State Tax</th>
//                       <th colSpan="2" rowSpan="2">
//                         Total Tax Amount
//                       </th>
//                     </tr>
//                     <tr>
//                       <th>Rate</th>
//                       <th>Amount</th>
//                       <th>Rate</th>
//                       <th>Amount</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr>
//                       <td>
//                         <span className="hns_select_text">{selectedHsn}</span>
//                       </td>
//                       <td className="taxable-value">{formData.base_amount}</td>
//                       <td>9%</td>
//                       <td className="tax-cgst">{formData.cgst}</td>
//                       <td>9%</td>
//                       <td className="tax-sgst">{formData.sgst}</td>
//                       <td className="all-tax-amount">{formData.taxtotal}</td>
//                     </tr>
//                     <tr className="total-row">
//                       <td>Total</td>
//                       <td className="total-taxable">{formData.base_amount}</td>
//                       <td></td>
//                       <td className="total-tax-cgst">{formData.cgst}</td>
//                       <td></td>
//                       <td className="total-tax-sgst">{formData.sgst}</td>
//                       <td className="total-tax-amount">{formData.taxtotal}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}
//           <div style={{ padding: "0 0 0 10px" }}>
//             <div className="col-xs-12 inside-india">
//               <div>
//                 <strong>Tax Amount (in words):</strong>
//                 <span className="total-tax-in-words">
//                   <span className="currency-text">INR</span>{" "}
//                   {numberToWords(Math.floor(formData.total_with_gst))}
//                 </span>
//               </div>
//             </div>
//             <div className="col-xs-12">
//               <div>
//                 <h4>
//                   <strong>Remarks:</strong>
//                 </h4>
//                 <h5 className="html-remark">
//                   <input
//                     name="remark"
//                     type="text"
//                     value={formData.remark}
//                     onChange={handleChange}
//                     className="remark"
//                     style={{ width: "550px" }}
//                   />
//                 </h5>
//               </div>
//             </div>
//           </div>
//           <div className="row">
//             <div className="col-x-12">
//               <div className="hr">
//                 <strong>Company's Bank Details</strong>
//                 <br />
//                 A/c Holder's Name: {data.bank_account_holder}
//                 <br />
//                 Bank Name:{data.bank_name}
//                 <br />
//                 A/c No.:{data.account_number}
//                 <br />
//                 IFS Code:{data.ifsc_code}
//                 <br />
//                 Branch: {data.branch}
//                 <br />
//                 SWIFT Code:{data.swift_code}
//               </div>
//               <div className="text-right signatory">
//                 {data.logo && (
//                   <img
//                     src={`http://127.0.0.1:8000${data.logo}`}
//                     alt="Company Logo"
//                     className="logo-image"
//                   />
//                 )}

//                 <p>for Grabsolve Infotech</p>
//                 <p>Authorized Signatory</p>
//               </div>
//             </div>
//           </div>
//         </div>
//         <p className="text-center">This is a Computer Generated Invoice</p>
//       </div>

//       {/* --------------------------------------------pdf------------------------------------------------------ */}
//       <div
//         ref={pdfRef}
//         style={{
//           // position: "absolute",
//           // // top: "-9999px",
//           // // left: "-9999px",
//           // // visibility: "hidden",
//         }}
//         className="bg-white p-4 border rounded shadow mt-4"
//       >
//         <div style={{ paddingRight: "10px" }}>
//           <h2 className="text-center">TAX INVOICE</h2>
//           <div className="table-bordered black-bordered main-box">
//             <div className="row date-tables">
//               <div className="col-6">
//                 {/* Seller Info */}
//                 <table className="table table-bordered black-bordered">
//                   <tbody>
//                     <tr>
//                       <td className="gray-background">
//                         <strong style={{ fontSize: "15px" }}>
//                           Grabsolve Infotech:
//                         </strong>
//                       </td>
//                     </tr>
//                     <tr>
//                       {data.seller_address}
//                       <br />
//                       Email:{data.seller_email}
//                       <br />
//                       PAN:{data.seller_pan}
//                       <br />
//                     </tr>
//                     <tr>
//                       <td className="gray-background">
//                         <strong>  GSTIN/UIN:</strong>{data.seller_gstin}
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>

//                 {/* Buyer Info */}
//                 <table className="table table-bordered black-bordered">
//                   <tbody>
//                     <tr>
//                       <td className="gray-background">
//                         <strong>Buyer (Bill to):</strong>{formData.buyer_name}
//                       </td>
//                     </tr>
//                     <tr>
//                       <td
//                         style={{
//                           maxWidth: "250px",
//                           overflowWrap: "break-word",
//                           height:"150px",
//                         }}
//                       >
//                         <div style={{ whiteSpace: "pre-wrap" }}>
//                           {formData.buyer_address}
//                         </div>
//                       </td>
//                     </tr>
//                     <tr>
//                       <td className="gray-background">
//                         <strong>  GSTIN/UIN:</strong>{formData.buyer_gst}
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>

//                 {/* Consignee Info */}
//                 <table className="table table-bordered black-bordered">
//                   <tbody>
//                     <tr>
//                       <td className="gray-background">
//                         <strong>Consignee (Ship to):</strong>{formData.consignee_name}
//                       </td>
//                     </tr>
//                     <tr>
//                       <td
//                          style={{
//                           maxWidth: "250px",
//                           overflowWrap: "break-word",
//                           height:"150px",
//                         }}
//                       >
                        
//                         <div>
//                           {formData.consignee_address}
//                         </div>
//                       </td>
//                     </tr>
//                     <tr>
//                       <td className="gray-background">
//                         <strong>  GSTIN/UIN:</strong>{formData.buyer_gst}
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>

//               <div className="col-6">
//                 <table className="table table-bordered black-bordered">
//                   <tbody>
//                     <tr>
//                       <td style={{ width: "50%" }}>Invoice No.</td>
//                       <td>
//                         {" "}
//                         {`${String(invoice_Number).padStart(
//                           2,
//                           "0"
//                         )}-${invoiceYear}`}
//                       </td>
//                     </tr>
//                     <tr>
//                       <td>Date</td>
//                       <td>{formData.invoice_date}</td>
//                     </tr>
//                     <tr>
//                       <td>Delivery Note</td>
//                       <td>{formData.delivery_note}</td>
//                     </tr>
//                     <tr>
//                       <td>Mode/Terms of Payment</td>
//                       <td>{formData.payment_mode}</td>
//                     </tr>
//                     <tr>
//                       <td>Delivery Note Date</td>
//                       <td>{formData.delivery_note_date}</td>
//                     </tr>
//                     <tr>
//                       <td>Destination</td>
//                       <td>{formData.destination}</td>
//                     </tr>
//                   </tbody>
//                 </table>

//                 <table className="table table-bordered black-bordered">
//                   <tbody style={{ width: "100%" }}>
//                     <tr>
//                       <td className="gray-background" >
//                         <strong>Terms to Delivery:</strong>
//                       </td>
//                     </tr>
//                     <tr>
//                       <td  style={{
//                           maxWidth: "250px",
//                           overflowWrap: "break-word",
//                           height:"150px",
//                         }}>{formData.Terms_to_delivery}</td>
//                     </tr>
//                   </tbody>
//                 </table>

//                 <div className="relative w-72">
//                   {/* Selected Country (Dropdown Trigger) */}
//                   <p>
//                     <strong>Country and currency:</strong>
//                   </p>
//                   <div
//                     className="border border-gray-300 p-2 rounded flex items-center justify-between cursor-pointer bg-white"
//                     onClick={() => setIsOpen(!isOpen)}
//                   >
//                     <div
//                       className="flex items-center"
//                       style={{ height: "30px" }}
//                     >
//                       <span className="mr-2">
//                         {selectedCountry.name} - {selectedCountry.currency}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Dropdown Menu */}
//                   {isOpen && (
//                     <div className="absolute bg-white border border-gray-300 w-full mt-1 rounded shadow-lg z-10">
//                       <input
//                         type="text"
//                         className="w-full p-2 border-b border-gray-200 focus:outline-none"
//                         placeholder="Search..."
//                         value={search}
//                         onChange={(e) => setSearch(e.target.value)}
//                       />

//                       {/* Country List */}
//                       <ul
//                         className="overflow-y-auto list-group"
//                         style={{ height: "200px" }}
//                       >
//                         {filteredCountries.map((country, index) => (
//                           <li
//                             key={index}
//                             className="p-2 flex items-center hover:bg-gray-100 cursor-pointer"
//                             onClick={() => {
//                               setSelectedCountry(country);
//                               setIsOpen(false);
//                               setSearch(""); // Clear search after selection
//                             }}
//                           >
//                             {country.name} - {country.currency}
//                           </li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}
//                 </div>

//                 {/* Keep "Declare under LUT" separate, so it doesn't slide when dropdown opens */}
//                 <div className="mt-4 ">
//                   {selectedCountry.name !== "India" && (
//                     <div className="lut">
//                       <p style={{ margin: "0px" }}>Declare under LUT</p>
//                     </div>
//                   )}
//                 </div>

//                 <input type="hidden" id="currencyTitle" value="INR" />
//                 <input type="hidden" id="currencySymbol" value="₹" />
//               </div>
//             </div>

//             <div className="row">
//               <div className="col-xs-12">
//                 <table className="table table-bordered black-bordered">
//                   <thead>
//                     <tr className="trbody">
//                       <th>SI No.</th>
//                       <th>Particulars</th>
//                       <th>HSN/SAC</th>
//                       <th>Hours</th>
//                       <th>Rate</th>
//                       <th>Amount</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr style={{ height: "111px" }}>
//                       <td>1</td>
//                       <td>{formData.Particulars}</td>
//                       <td style={{ width: "130px" }}>{formData.hsn_code}</td>
//                       <td style={{ width: "10%" }}>{formData.total_hours}</td>

//                       <td style={{ width: "10%" }}>{formData.rate}</td>

//                       <td style={{ width: "200px" }}>
//                         <span className="currency-sym">
//                           {selectedCountry.currency}
//                         </span>
//                         {formData.base_amount}
//                       </td>
//                     </tr>
//                     {selectedCountry.name === "India" && (
//                       <tr className="inside-india">
//                         <td></td>
//                         <td>
//                           <span style={{ float: "right" }}>CGST @ 9%</span>
//                         </td>
//                         <td></td>
//                         <td></td>
//                         <td>9%</td>
//                         <td id="cgst">
//                           <span className="currency-sym">₹</span>
//                           {formData.cgst}
//                         </td>
//                       </tr>
//                     )}

//                     {selectedCountry.name === "India" && (
//                       <tr className="inside-india">
//                         <td></td>
//                         <td>
//                           <span style={{ float: "right" }}>SGST @ 9%</span>
//                         </td>
//                         <td></td>
//                         <td></td>
//                         <td>9%</td>
//                         <td id="sgst">
//                           <span className="currency-sym">₹</span>
//                           {formData.sgst}
//                         </td>
//                       </tr>
//                     )}
//                     <tr>
//                       <td colSpan="5" className="text-right">
//                         <strong>Total</strong>
//                       </td>
//                       <td>
//                         <strong id="total-with-gst">
//                           <span className="currency-sym">
//                             {selectedCountry.currency}
//                           </span>{" "}
//                           {formData.total_with_gst}
//                         </strong>
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <div className="row">
//               <div className="col-xs-12">
//                 <div className="table-bordered black-bordered amount-box">
//                   <div>
//                     <p>
//                       <strong>Amount Chargeable (in words):</strong>
//                     </p>
//                     <h4 className="total-in-words">
//                       <span className="currency-text">INR</span>{" "}
//                       {numberToWords(Math.floor(formData.total_with_gst))}
//                     </h4>
//                     <div className="top-right-corner">
//                       <span>E. & O.E</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {selectedCountry.name === "India" && (
//               <div className="row">
//                 <div className="col-xs-12 inside-india">
//                   <table className="table table-bordered invoice-table">
//                     <thead>
//                       <tr>
//                         <th rowSpan="2">HSN/SAC</th>
//                         <th rowSpan="2">Taxable Value</th>
//                         <th colSpan="2">Central Tax</th>
//                         <th colSpan="2">State Tax</th>
//                         <th colSpan="2" rowSpan="2">
//                           Total Tax Amount
//                         </th>
//                       </tr>
//                       <tr>
//                         <th>Rate</th>
//                         <th>Amount</th>
//                         <th>Rate</th>
//                         <th>Amount</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       <tr>
//                         <td>
//                           <span className="hns_select_text">{selectedHsn}</span>
//                         </td>
//                         <td className="taxable-value">
//                           {formData.base_amount}
//                         </td>
//                         <td>9%</td>
//                         <td className="tax-cgst">{formData.cgst}</td>
//                         <td>9%</td>
//                         <td className="tax-sgst">{formData.sgst}</td>
//                         <td className="all-tax-amount">{formData.taxtotal}</td>
//                       </tr>
//                       <tr className="total-row">
//                         <td>Total</td>

//                         <td className="total-taxable">
//                           {formData.base_amount}
//                         </td>
//                         <td></td>
//                         <td className="total-tax-cgst">{formData.cgst}</td>
//                         <td></td>
//                         <td className="total-tax-sgst">{formData.sgst}</td>
//                         <td className="total-tax-amount">
//                           {formData.taxtotal}
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>
//                 <div style={{ padding: "0 0 0 10px" }}>
//                   <div className="col-xs-12 inside-india">
//                     <div>
//                       <strong>Tax Amount (in words):</strong>
//                       <span className="total-tax-in-words">
//                         <span className="currency-text">INR</span>{" "}
//                         {numberToWords(Math.floor(formData.total_with_gst))}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="col-xs-12">
//                     <div>
//                       <h4>
//                         <strong>Remarks:</strong>
//                       </h4>
//                       <h5 className="html-remark">{formData.remark}</h5>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="row">
//               <div className="col-x-12">
//                 <div className="hr">
//                   <strong>Company's Bank Details</strong>
//                   <br />
//                   A/c Holder's Name: {data.bank_account_holder}
//                   <br />
//                   Bank Name:{data.bank_name}
//                   <br />
//                   A/c No.:{data.account_number}
//                   <br />
//                   IFS Code:{data.ifsc_code}
//                   <br />
//                   Branch: {data.branch}
//                   <br />
//                   SWIFT Code:{data.swift_code}
//                 </div>
//                 <div className="text-right signatory">
//                   {data.logo && (
//                     <img
//                       src={`http://127.0.0.1:8000${data.logo}`}
//                       alt="Company Logo"
//                       className="logo-image"
//                     />
//                   )}

//                   <p>for Grabsolve Infotech</p>
//                   <p>Authorized Signatory</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <p className="text-center">This is a Computer Generated Invoice</p>
//         </div>
//       </div>
//       <div className="pdfbutton">
//         <button
//           onClick={handleSubmit}
//           className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
//         >
//           Download PDF
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Taxinvoice;