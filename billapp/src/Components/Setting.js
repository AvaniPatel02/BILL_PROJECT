import React, { useState, useEffect } from "react";
import "./setting.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    company_name: "",
    seller_address: "",
    seller_pan: "",
    seller_gstin: "",
    seller_email: "",
    bank_account_holder: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch: "",
    swift_code: "",
    company_code: "",
    HSN_codes: [],
    logo: null,
    logoUrl: "",
  });

  const [newHsn, setNewHsn] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        logo: file,
        logoUrl: URL.createObjectURL(file),
      }));
    }
  };

const addHsnCode = () => {
  if (newHsn.trim() && !formData.HSN_codes.includes(newHsn.trim())) {
    setFormData(prev => ({
      ...prev,
      HSN_codes: [...prev.HSN_codes, newHsn.trim()]
    }));
    setNewHsn("");
  }
};

  const removeHsnCode = (index) => {
    setFormData((prev) => ({
      ...prev,
      HSN_codes: prev.HSN_codes.filter((_, i) => i !== index),
    }));
  };

 const handleSave = async () => {
  setLoading(true);
  
  try {
    const token = localStorage.getItem("access_token");
    const formDataToSend = new FormData();
    
    // Convert HSN_codes array to JSON string
    formDataToSend.append('HSN_codes', JSON.stringify(formData.HSN_codes));
    
    // Append other fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'HSN_codes' && key !== 'logo' && key !== 'logoUrl') {
        formDataToSend.append(key, value);
      }
    });
    
    if (formData.logo instanceof File) {
      formDataToSend.append('logo', formData.logo);
    }

    const response = await fetch("http://localhost:8000/api/settings/", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formDataToSend
    });

    if (!response.ok) throw new Error("Failed to save settings");
    
    const result = await response.json();
    toast.success("Settings saved successfully!");
    
  } catch (error) {
    toast.error(error.message || "Failed to save settings");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("http://localhost:8000/api/settings/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }

        let data = await response.json();

        if (Array.isArray(data) && data.length === 0) {
          const createResponse = await fetch(
            "http://localhost:8000/api/settings/",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            }
          );

          if (!createResponse.ok) {
            throw new Error("Failed to create default settings");
          }

          data = await createResponse.json();
        }

        // Robustly get the settings object, whether it's an array or a single object
        const setting = Array.isArray(data) ? (data.length > 0 ? data[0] : {}) : data;

        setFormData({
          company_name: setting.company_name || "Your Company",
          seller_address: setting.seller_address || "Your Address",
          seller_pan: setting.seller_pan || "",
          seller_gstin: setting.seller_gstin || "",
          seller_email: setting.seller_email || "",
          bank_account_holder: setting.bank_account_holder || "",
          bank_name: setting.bank_name || "",
          account_number: setting.account_number || "",
          ifsc_code: setting.ifsc_code || "",
          branch: setting.branch || "",
          swift_code: setting.swift_code || "",
          company_code: setting.company_code || "",
          HSN_codes: setting.HSN_codes || [],
          logo: null,
          logoUrl: setting.logo ? `http://localhost:8000${setting.logo}` : "",
        });
      } catch (error) {
        console.error("Failed to fetch settings", error);
        toast.error(error.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  return (
    <div style={{ paddingLeft: "60px" }}>
      <ToastContainer />
      <h1 className="hedding">Your Company details</h1>

      <div className="formbody">
        <div className="form-box">
          <div className="form-row">
            <div className="fastinput">
              <label>Company name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="fastinput">
              <label>PAN Number</label>
              <input
                type="text"
                name="seller_pan"
                value={formData.seller_pan}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Seller Address</label>
              <textarea
                name="seller_address"
                value={formData.seller_address}
                onChange={handleChange}
                rows={4}
                placeholder="Enter seller address"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>GST Number</label>
              <input
                type="text"
                name="seller_gstin"
                value={formData.seller_gstin}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="fastinput">
              <label>Email</label>
              <input
                type="email"
                name="seller_email"
                value={formData.seller_email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>Bank Name</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="fastinput">
              <label>Account Number</label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>IFSC Code</label>
              <input
                type="text"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="fastinput">
              <label>A/c Holder's Name</label>
              <input
                type="text"
                name="bank_account_holder"
                value={formData.bank_account_holder}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>Branch</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="fastinput">
              <label>SWIFT Code</label>
              <input
                type="text"
                name="swift_code"
                value={formData.swift_code}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>Company Code</label>
              <input
                type="text"
                name="company_code"
                value={formData.company_code}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="hsn-section">
              <label>HSN Codes</label>
              <div className="hsn-input-group">
                <input
                  type="text"
                  value={newHsn}
                  onChange={(e) => setNewHsn(e.target.value)}
                  disabled={loading}
                />
                <button className="hsn-add-btn" onClick={addHsnCode} disabled={loading}>Add</button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>Upload Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
              />
              {formData.logoUrl && (
                <img src={formData.logoUrl} alt="Preview" className="preview-image" />
              )}
            </div>

            <div className="fastinput" style={{marginTop: "30px"}}>
              <div className="hsn-code-list">
                {formData.HSN_codes.map((code, index) => (
                  <div key={index} className="hsn-code-item">
                    <span>{code}</span>
                    <button className="hsn-remove-btn" onClick={() => removeHsnCode(index)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="buttonuplod">
            <button
              className="button-sumbit-banking btn-all"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
