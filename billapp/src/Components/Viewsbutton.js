import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './Address.css';
import "./Taxinvoice.css";

// Force browser cache refresh - country flag and company code display improved
const ViewsButton = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [countries, setCountries] = useState([]);
    const countriesRef = useRef([]);
    const [selectedCountry, setSelectedCountry] = useState({
        name: "India",
        currency: "₹",
        currencyCode: "INR",
        flag: "https://flagcdn.com/in.svg"
    });
    const [states, setStates] = useState([]);
    const [selectedState, setSelectedState] = useState("");

    // Optimized fetchCountries function (from TaxInvoice.js)
    const fetchCountries = async () => {
        try {
            const response = await fetch("https://restcountries.com/v3.1/all");
            const data = await response.json();
            const countryList = data.map((country) => {
                const currencyCode = country.currencies ? Object.keys(country.currencies)[0] : "";
                const currencySymbol = country.currencies?.[currencyCode]?.symbol || "";
                return {
                    name: country.name.common,
                    currency: currencySymbol,
                    currencyCode: currencyCode,
                    flag: country.flags?.svg
                };
            }).filter(country => country.currencyCode);
            countryList.sort((a, b) => a.name.localeCompare(b.name));
            return countryList;
        } catch (error) {
            return [
                { name: "India", currency: "₹", currencyCode: "INR", flag: "https://flagcdn.com/in.svg" }
            ];
        }
    };

    // Helper function to get country flag
    const getCountryFlag = (countryName) => {
        if (!countryName || !countriesRef.current || !Array.isArray(countriesRef.current) || countriesRef.current.length === 0) {
            return "https://flagcdn.com/in.svg"; // Default flag
        }
        const country = countriesRef.current.find(c => c.name === countryName);
        return country ? country.flag : "https://flagcdn.com/in.svg"; // Default flag if not found
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

    const fetchStatesForCountry = async (countryName) => {
        try {
            const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ country: countryName }),
            });
            const data = await response.json();
            if (data && data.data && data.data.states) {
                setStates(data.data.states);
            } else {
                setStates([]);
            }
        } catch (error) {
            setStates([]);
        }
    };

    // Fetch countries on mount
    useEffect(() => {
        const getCountries = async () => {
            try {
                const data = await fetchCountries();
                if (data && Array.isArray(data)) {
                    setCountries(data);
                    countriesRef.current = data;
                } else {
                    // Fallback to default countries if API fails
                    const fallbackCountries = [
                        { name: "India", currency: "₹", currencyCode: "INR", flag: "https://flagcdn.com/in.svg" }
                    ];
                    setCountries(fallbackCountries);
                    countriesRef.current = fallbackCountries;
                }
            } catch (error) {
                console.error("Error fetching countries:", error);
                // Fallback to default countries if API fails
                const fallbackCountries = [
                    { name: "India", currency: "₹", currencyCode: "INR", flag: "https://flagcdn.com/in.svg" }
                ];
                setCountries(fallbackCountries);
                countriesRef.current = fallbackCountries;
            }
        };
        getCountries();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/login");
            return;
        }

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        Promise.all([
            fetch(`http://localhost:8000/api/invoices/${id}/`, { headers }),
            fetch("http://localhost:8000/api/settings/", { headers }),
        ])
            .then(async ([invoiceRes, settingsRes]) => {
                if (!invoiceRes.ok) {
                    const errText = await invoiceRes.text();
                    throw new Error(`Invoice fetch failed: ${errText}`);
                }
                if (!settingsRes.ok) {
                    const errText = await settingsRes.text();
                    throw new Error(`Settings fetch failed: ${errText}`);
                }
                
                const invoiceData = await invoiceRes.json();
                const settingsData = await settingsRes.json();

                setInvoice(invoiceData);

                // Handle different possible response formats by always taking the first object if it's an array
                const settingsObject = Array.isArray(settingsData) && settingsData.length > 0 ? settingsData[0] : settingsData;
                
                if (settingsObject && typeof settingsObject === 'object') {
                    setSettings(settingsObject);
                } else {
                    // Initialize with empty/default settings if fetch fails or data is empty
                    setSettings({}); 
                    throw new Error("Settings data format is invalid or empty");
                }
                
                setError("");
            })
            .catch((err) => {
                console.error("Error fetching data:", err);
                setError(err.message || "Failed to fetch data");
                
                // Handle authentication errors
                if (err.message.includes("401") || err.message.includes("403")) {
                    navigate("/login");
                }
            })
            .finally(() => setLoading(false));
    }, [id, navigate]);

    useEffect(() => {
        if (selectedCountry && selectedCountry.name) {
            fetchStatesForCountry(selectedCountry.name);
        } else {
            setStates([]);
            setSelectedState("");
        }
    }, [selectedCountry]);

    // Update selectedCountry and selectedState when invoice data is loaded
    useEffect(() => {
        if (invoice && countries && countries.length > 0) {
            // Update country
            if (invoice.country) {
                const countryData = countries.find(c => c.name === invoice.country);
                if (countryData) {
                    setSelectedCountry({
                        name: countryData.name,
                        currency: countryData.currency,
                        currencyCode: countryData.currencyCode,
                        flag: countryData.flag
                    });
                } else {
                    // Fallback if country not found in countries list
                    setSelectedCountry({
                        name: invoice.country,
                        currency: "₹",
                        currencyCode: invoice.currency || "INR",
                        flag: "https://flagcdn.com/in.svg"
                    });
                }
            }
            
            // Update state
            if (invoice.state) {
                setSelectedState(invoice.state);
            }
        } else if (invoice && (!countries || countries.length === 0)) {
            // If countries haven't loaded yet, set basic country info from invoice
            if (invoice.country) {
                setSelectedCountry({
                    name: invoice.country,
                    currency: "₹",
                    currencyCode: invoice.currency || "INR",
                    flag: "https://flagcdn.com/in.svg"
                });
            }
            
            if (invoice.state) {
                setSelectedState(invoice.state);
            }
        }
    }, [invoice, countries]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}-${month}-${year}`;
    };

    if (loading) {
        return <div>Loading invoice and settings...</div>;
    }

    if (error) {
        return (
            <div style={{ color: "red", padding: "20px" }}>
                <h3>Error: {error}</h3>
                <p>Please check the console for more details.</p>
                <button onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        );
    }

    if (!invoice || !settings || !countries || countries.length === 0) {
        return <div>Loading data...</div>;
    }

    return (
        <div style={{ paddingLeft: "100px" }}>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                limit={1}
            />
            <div style={{ paddingRight: "10px" }}>
                <h2 className="text-center">TAX INVOICE</h2>
                <div className="table-bordered black-bordered main-box" style={{backgroundColor:"white"}}>
                    <div className="row date-tables">
                        <div className="col-6">
                            {/* Seller Info */}
                            <table className="table table-bordered black-bordered">
                                <tbody style={{border: "2px solid"}}>
                                    <tr>
                                        <td className="gray-background">
                                            <strong style={{ fontSize: "15px" }}>
                                                {settings.company_name}:
                                            </strong>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            {settings.seller_address}
                                            <br />
                                            Email: {settings.seller_email}
                                            <br />
                                            PAN: {settings.seller_pan}
                                            <br />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>GSTIN/UIN:</strong> {settings.seller_gstin}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Buyer Info */}
                            <table className="table table-bordered black-bordered">
                                <tbody style={{border: "2px solid"}}>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>Buyer (Bill to):</strong> {invoice.buyer_name}
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
                                            {invoice.buyer_address}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>GSTIN/UIN:</strong> {invoice.buyer_gst}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Consignee Info */}
                            <table className="table table-bordered black-bordered">
                                <tbody style={{border: "2px solid"}}>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>Consignee (Ship to):</strong> {invoice.consignee_name}
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
                                            {invoice.consignee_address}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>GSTIN/UIN:</strong> {invoice.consignee_gst}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="col-6">
                            <table className="table table-bordered black-bordered">
                                <tbody style={{border: "2px solid"}}>
                                    <tr>
                                        <td style={{ width: "50%" }}>Invoice No.</td>
                                        <td>{invoice.invoice_number}</td>
                                    </tr>
                                    <tr>
                                        <td>Date</td>
                                        <td>{formatDate(invoice.invoice_date)}</td>
                                    </tr>
                                    <tr>
                                        <td>Delivery Note</td>
                                        <td>{invoice.delivery_note}</td>
                                    </tr>
                                    <tr>
                                        <td>Mode/Terms of Payment</td>
                                        <td>{invoice.payment_mode}</td>
                                    </tr>
                                    <tr>
                                        <td>Delivery Note Date</td>
                                        <td>{formatDate(invoice.delivery_note_date)}</td>
                                    </tr>
                                    <tr>
                                        <td>Destination</td>
                                        <td>{invoice.destination}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="table table-bordered black-bordered">
                                <tbody style={{ width: "100%", border: "2px solid"}}>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>Terms to Delivery:</strong>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{
                                            maxWidth: "250px",
                                            overflowWrap: "break-word",
                                            height: "150px",
                                        }}>
                                            {invoice.Terms_to_delivery}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="relative w-72">
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 24,
                                    marginBottom: 8,
                                    width: "fit-content"
                                }}>
                                    <div style={{
                                        border: "1px solid #ccc",
                                        borderRadius: 4,
                                        padding: "4px 12px",
                                        background: "#f9f9f9",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                    }}>
                                        <img
                                            src={getCountryFlag(selectedCountry?.name) || "https://flagcdn.com/in.svg"}
                                            alt={`${selectedCountry?.name || 'Country'} flag`}
                                            style={{
                                                width: 32,
                                                height: 24,
                                                border: "1px solid #ccc",
                                                objectFit: "cover",
                                                marginRight: 8
                                            }}
                                        />
                                        <span>{selectedCountry?.name || 'India'}</span>
                                        <span>-</span>
                                        <span>
                                            {selectedCountry?.currency || '₹'} ({selectedCountry?.currencyCode || 'INR'})
                                        </span>
                                    </div>
                                    {selectedState && selectedState !== "Gujarat" && (
                                        <div style={{
                                            border: "1px solid #ccc",
                                            borderRadius: 4,
                                            padding: "4px 12px",
                                            background: "#f9f9f9",
                                            display: "flex",
                                            alignItems: "center"
                                        }}>
                                            <span><strong>State:</strong> {selectedState}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <input type="hidden" id="currencyTitle" value="INR" />
                            <input type="hidden" id="currencySymbol" value="₹" />
                        </div>
                    </div>

                    {/* Rest of the component remains the same */}
                    <div className="row">
                        <div className="col-xs-12">
                            <table className="table table-bordered black-bordered">
                                <thead>
                                    <tr className="trbody" style={{border:"2px solid"}}>
                                        <th>SI No.</th>
                                        <th>Particulars</th>
                                        <th>HSN/SAC</th>
                                        <th>Hours</th>
                                        <th>Rate</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody style={{border: "2px solid"}}>
                                    <tr style={{ height: "111px" }}>
                                        <td>1</td>
                                        <td>{invoice.Particulars}</td>
                                        <td style={{ width: "130px" }}>{invoice.hsn_code || invoice.hsn_sac_code}</td>
                                        <td style={{ width: "10%" }}>{isNaN(invoice.total_hours) ? '' : invoice.total_hours}</td>
                                        <td style={{ width: "10%" }}>{isNaN(invoice.rate) ? '' : invoice.rate}</td>
                                        <td style={{ width: "200px" }}>
                                            <span className="currency-sym">
                                                {invoice.currency} {isNaN(invoice.base_amount) ? '' : invoice.base_amount}
                                            </span>
                                        </td>
                                    </tr>
                                    {invoice.country === "India" && (
                                        <>
                                            {invoice.state === "Gujarat" ? (
                                                <>
                                                    {/* CGST Row */}
                                                    <tr className="inside-india">
                                                        <td></td>
                                                        <td><span style={{ float: "right" }}>CGST @ 9%</span></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td>9%</td>
                                                        <td id="cgst">
                                                            <span className="currency-sym">{invoice.currency} {isNaN(invoice.cgst) ? '' : invoice.cgst}</span>
                                                        </td>
                                                    </tr>
                                                    {/* SGST Row */}
                                                    <tr className="inside-india">
                                                        <td></td>
                                                        <td><span style={{ float: "right" }}>SGST @ 9%</span></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td>9%</td>
                                                        <td id="sgst">
                                                            <span className="currency-sym">{invoice.currency} {isNaN(invoice.sgst) ? '' : invoice.sgst}</span>
                                                        </td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <>
                                                    {/* IGST Row */}
                                                    <tr className="inside-india">
                                                        <td></td>
                                                        <td><span style={{ float: "right" }}>IGST @ 18%</span></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td>18%</td>
                                                        <td id="igst">
                                                            <span className="currency-sym">{invoice.currency} {isNaN(invoice.taxtotal) ? '' : invoice.taxtotal}</span>
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </>
                                    )}
                                    <tr>
                                        <td colSpan="6">
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                {/* Left side: INR Equivalent (if applicable) */}
                                                {invoice.country !== "India" && invoice.inr_equivalent && (
                                                    <div style={{ whiteSpace: 'nowrap' }}>
                                                        INR Equivalent: INR {isNaN(invoice.inr_equivalent) ? '' : invoice.inr_equivalent.toFixed(2)}
                                                    </div>
                                                )}

                                                {/* Right side: Total (always right aligned) */}
                                                <div style={{ whiteSpace: 'nowrap', marginLeft: 'auto', textAlign: 'right' }}>
                                                    <strong>Total:</strong> &nbsp;
                                                    <strong id="total-with-gst">
                                                        <span className="currency-sym">{invoice.currency} </span>
                                                        {isNaN(invoice.total_with_gst) ? '' : invoice.total_with_gst}
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
                                        <span className="currency-text">{invoice.currency} </span>
                                        {numberToWords(Math.floor(isNaN(invoice.total_with_gst) ? 0 : invoice.total_with_gst))} Only
                                    </h4>
                                    <div className="top-right-corner">
                                        <span>E. & O.E</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {invoice.country === "India" && (
                        <div className="row">
                            <div className="col-xs-12 inside-india">
                                <table className="table table-bordered invoice-table">
                                    <thead style={{border:"2px solid"}}>
                                        {invoice.state === "Gujarat" ? (
                                            <>
                                                <tr>
                                                    <th rowSpan="2">HSN/SAC</th>
                                                    <th rowSpan="2">Taxable Value</th>
                                                    <th colSpan="2">Central Tax</th>
                                                    <th colSpan="2">State Tax</th>
                                                    <th rowSpan="2">Total Tax Amount</th>
                                                </tr>
                                                <tr>
                                                    <th>Rate</th>
                                                    <th>Amount</th>
                                                    <th>Rate</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </>
                                        ) : (
                                            <>
                                                <tr>
                                                    <th rowSpan="2">HSN/SAC</th>
                                                    <th rowSpan="2">Taxable Value</th>
                                                    <th colSpan="2">Integrated Tax</th>
                                                    <th rowSpan="2">Total Tax Amount</th>
                                                </tr>
                                                <tr>
                                                    <th>Rate</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </>
                                        )}
                                    </thead>
                                    <tbody style={{ border: "2px solid" }}>
                                      <tr>
                                        <td>{invoice.hsn_code || invoice.hsn_sac_code}</td>
                                        <td>{isNaN(invoice.base_amount) ? '' : invoice.base_amount}</td>
                                        {invoice.state === "Gujarat" ? (
                                          <>
                                            <td>9%</td>
                                            <td>{isNaN(invoice.cgst) ? '' : invoice.cgst}</td>
                                            <td>9%</td>
                                            <td>{isNaN(invoice.sgst) ? '' : invoice.sgst}</td>
                                            <td>{isNaN(invoice.taxtotal) ? '' : invoice.taxtotal}</td>
                                          </>
                                        ) : (
                                          <>
                                            <td>18%</td>
                                            <td>{isNaN(invoice.taxtotal) ? '' : invoice.taxtotal}</td>
                                            <td>{isNaN(invoice.taxtotal) ? '' : invoice.taxtotal}</td>
                                          </>
                                        )}
                                      </tr>
                                      <tr className="total-row">
                                        <td>Total</td>
                                        <td>{isNaN(invoice.base_amount) ? '' : invoice.base_amount}</td>
                                        {invoice.state === "Gujarat" ? (
                                          <>
                                            <td></td>
                                            <td>{isNaN(invoice.cgst) ? '' : invoice.cgst}</td>
                                            <td></td>
                                            <td>{isNaN(invoice.sgst) ? '' : invoice.sgst}</td>
                                            <td>{isNaN(invoice.taxtotal) ? '' : invoice.taxtotal}</td>
                                          </>
                                        ) : (
                                          <>
                                            <td></td>
                                            <td>{isNaN(invoice.taxtotal) ? '' : invoice.taxtotal}</td>
                                            <td>{isNaN(invoice.taxtotal) ? '' : invoice.taxtotal}</td>
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
                                            <span className="currency-text">{invoice.currency} </span>
                                            {numberToWords(Math.floor(isNaN(invoice.total_with_gst) ? 0 : invoice.total_with_gst))} Only
                                        </span>
                                    </div>
                                </div>
                                <div className="col-xs-12">
                                    <div>
                                        <h4>
                                            <strong>Remarks:</strong>
                                        </h4>
                                        <h5 className="html-remark">{invoice.remark}</h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        <div className="col-x-12">
                            <div className="hr">
                                <strong>Company's Bank Details</strong>
                                <br />
                                A/c Holder's Name: {settings.bank_account_holder}
                                <br />
                                Bank Name: {settings.bank_name}
                                <br />
                                A/c No.: {settings.account_number}
                                <br />
                                IFS Code: {settings.ifsc_code}
                                <br />
                                Branch: {settings.branch}
                                <br />
                                SWIFT Code: {settings.swift_code}
                            </div>
                            <div className="text-right signatory">
                                {settings.logo && (
                                    <img 
                                        className="logo-image" 
                                        src={`http://localhost:8000${settings.logo}`} 
                                        alt="Logo" 
                                        height={100} 
                                    />
                                )}
                                <p>for {settings.company_name}</p>
                                <p>Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-center">This is a Computer Generated Invoice</p>
            </div>
        </div>
    );
};

export default ViewsButton;