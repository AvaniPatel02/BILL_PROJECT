import React, { useState, useEffect, useRef } from "react";

const BankAdd = () => {
  // State variables
  const [showForm, setShowForm] = useState(false);
  const [showCashForm, setShowCashForm] = useState(false);
  const [banks, setBanks] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [deletedBanks, setDeletedBanks] = useState([]);
  const [deletedCashEntries, setDeletedCashEntries] = useState([]);
  const [editingBank, setEditingBank] = useState(null);
  const [editingCashEntry, setEditingCashEntry] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showDeletedCash, setShowDeletedCash] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    confirm_account_number: "",
    amount: "",
  });

  const [cashFormData, setCashFormData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });

  const toastRef = useRef();

  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
    fetchBanks();
    fetchDeletedBanks();
    fetchCashEntries();
    fetchDeletedCashEntries();
  }, []);

  // API functions
  const fetchBanks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch("http://127.0.0.1:8000/api/bank-accounts/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch banks");

      const data = await response.json();
      setBanks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch("http://127.0.0.1:8000/api/cash-entries/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch cash entries");

      const data = await response.json();
      setCashEntries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedBanks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch("http://127.0.0.1:8000/api/bank-accounts/deleted/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch deleted banks");

      const data = await response.json();
      setDeletedBanks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedCashEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch("http://127.0.0.1:8000/api/cash-entries/deleted/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // If 404, it means no deleted entries exist yet, which is fine
        if (response.status === 404) {
          setDeletedCashEntries([]);
          return;
        }
        throw new Error("Failed to fetch deleted cash entries");
      }

      const data = await response.json();
      setDeletedCashEntries(data);
    } catch (err) {
      // Only show error if it's not a 404 (which is expected when no deleted entries exist)
      if (err.message !== "Failed to fetch deleted cash entries" || !err.message.includes("404")) {
        console.error("Error fetching deleted cash entries:", err);
      }
      setDeletedCashEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBank = async (bankId) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`http://127.0.0.1:8000/api/bank-accounts/${bankId}/restore/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to restore bank");

      setSuccess("Bank restored successfully!");
      showToast("Bank restored successfully!");
      fetchBanks();
      fetchDeletedBanks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCashEntry = async (entryId) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`http://127.0.0.1:8000/api/cash-entries/${entryId}/restore/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to restore cash entry");

      setSuccess("Cash entry restored successfully!");
      showToast("Cash entry restored successfully!");
      fetchCashEntries();
      fetchDeletedCashEntries();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCashChange = (e) => {
    const { name, value } = e.target;
    setCashFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.account_number !== formData.confirm_account_number) {
      setError("Account numbers do not match!");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const { confirm_account_number, ...payload } = formData;
      payload.amount = parseFloat(payload.amount);

      let response;
      if (editingBank) {
        response = await fetch(`http://127.0.0.1:8000/api/bank-accounts/${editingBank.id}/`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("http://127.0.0.1:8000/api/bank-accounts/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save bank");
      }

      setSuccess(editingBank ? "Bank updated successfully!" : "Bank added successfully!");
      showToast(editingBank ? "Bank updated successfully!" : "Bank added successfully!");
      fetchBanks();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCashSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const payload = {
        ...cashFormData,
        amount: parseFloat(cashFormData.amount)
      };

      let response;
      if (editingCashEntry) {
        response = await fetch(`http://127.0.0.1:8000/api/cash-entries/${editingCashEntry.id}/`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("http://127.0.0.1:8000/api/cash-entries/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save cash entry");
      }

      setSuccess(editingCashEntry ? "Cash entry updated successfully!" : "Cash entry added successfully!");
      showToast(editingCashEntry ? "Cash entry updated successfully!" : "Cash entry added successfully!");
      fetchCashEntries();
      resetCashForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (bankId) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`http://127.0.0.1:8000/api/bank-accounts/${bankId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to delete bank");

      setSuccess("Bank deleted successfully!");
      showToast("Bank deleted successfully!");
      fetchBanks();
      fetchDeletedBanks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCashEntry = async (entryId) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`http://127.0.0.1:8000/api/cash-entries/${entryId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to delete cash entry");

      setSuccess("Cash entry deleted successfully!");
      showToast("Cash entry deleted successfully!");
      fetchCashEntries();
      fetchDeletedCashEntries();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBank = (bank) => {
    setEditingBank(bank);
    setFormData({
      bank_name: bank.bank_name,
      account_number: bank.account_number,
      confirm_account_number: bank.account_number,
      amount: bank.amount.toString(),
    });
    setShowForm(true);
    setError("");
  };

  const handleEditCashEntry = (entry) => {
    setEditingCashEntry(entry);
    setCashFormData({
      amount: entry.amount.toString(),
      date: entry.date,
      description: entry.description || ""
    });
    setShowCashForm(true);
    setError("");
  };

  const resetForm = () => {
    setFormData({
      bank_name: "",
      account_number: "",
      confirm_account_number: "",
      amount: "",
    });
    setEditingBank(null);
    setShowForm(false);
  };

  const resetCashForm = () => {
    setCashFormData({
      amount: "",
      date: new Date().toISOString().split('T')[0],
      description: ""
    });
    setEditingCashEntry(null);
    setShowCashForm(false);
  };

  const showToast = (message) => {
    const toast = new window.bootstrap.Toast(toastRef.current);
    toastRef.current.querySelector(".toast-body").textContent = message;
    toast.show();
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container mt-4" style={{ boxShadow: " 0 2px 6px #6f7172fd", borderRadius: "20px", backgroundColor: "rgba(249, 249, 250, 0.99)" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Bank & Cash Management</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => setShowDeleted(!showDeleted)}>
            {showDeleted ? "Hide Deleted Items" : "View Deleted Items"}
          </button>
          <button
            className="new-bill-btn me-2"
            onClick={() => {
              resetCashForm();
              setShowCashForm(!showCashForm);
              setShowForm(false)
            }}
            disabled={loading}
          >
            {showCashForm ? "Cancel Cash Entry" : "Add Cash Entry"}
          </button>
          <button
            className="new-bill-btn me-2"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
              setShowCashForm(false)
            }}
            disabled={loading}
          >
            {showForm ? "Cancel Bank Form" : "Add Bank"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close"></button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 border p-3 rounded">
          <h5>{editingBank ? "Edit Bank" : "Add Bank"}</h5>
          <div className="mb-3">
            <label className="form-label">Bank Name</label>
            <input
              type="text"
              className="form-control"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Account Number</label>
            <input
              type="text"
              className="form-control"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Account Number</label>
            <input
              type="text"
              className="form-control"
              name="confirm_account_number"
              value={formData.confirm_account_number}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Amount</label>
            <input
              type="number"
              className="form-control"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              step="0.01"
            />
          </div>
          <button type="submit" className="btn btn-success me-2" style={{ backgroundColor: "#195277" }} disabled={loading}>
            {loading ? "Processing..." : editingBank ? "Update" : "Add"} Bank
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
            Cancel
          </button>
        </form>
      )}

      {showCashForm && (
        <form onSubmit={handleCashSubmit} className="mb-4 border p-3 rounded bg-light">
          <h5>{editingCashEntry ? "Edit Cash Entry" : "Add Cash Entry"}</h5>
          <div className="mb-3">
            <label className="form-label">Amount</label>
            <input
              type="number"
              className="form-control"
              name="amount"
              value={cashFormData.amount}
              onChange={handleCashChange}
              required
              step="0.01"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              name="date"
              value={cashFormData.date}
              onChange={handleCashChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-control"
              name="description"
              value={cashFormData.description}
              onChange={handleCashChange}
              rows="3"
            />
          </div>
          <button type="submit" className="btn btn-success me-2" style={{ backgroundColor: "#195277" }} disabled={loading}>
            {loading ? "Processing..." : editingCashEntry ? "Update" : "Add"} Cash Entry
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetCashForm} disabled={loading}>
            Cancel
          </button>
        </form>
      )}

      {!showDeleted && (
        <>
          <div className="mb-4">
            <h3>Bank Accounts</h3>
            {loading && banks.length === 0 ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : banks.length > 0 ? (
              <div className="table-responsive">
                <table className="statement-table ">
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Bank Name</th>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Account Number</th>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Amount</th>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banks.map((bank) => (
                      <tr key={bank.id}>
                        <td style={{ border: "1px solid #a09e9e", width: "210px" }} className="text-center">{bank.bank_name}</td>
                        <td style={{ border: "1px solid #a09e9e", width: "236px" }} className="text-center">{bank.account_number}</td>
                        <td style={{ border: "1px solid #a09e9e", width: "215px" }} className="text-center">{bank.amount}</td>
                        <td style={{ border: "1px solid #a09e9e", width: "191px" }} className="text-center">
                          <div className="tooltip-container">
                            <button
                              className="action-btn edit"
                              onClick={() => handleEditBank(bank)}
                              disabled={loading}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <span className="tooltip-text"style={{top:"20px",left:"60px"}}>Edit</span>
                          </div>
                          <div className="tooltip-container">
                            <button
                              className="action-btn delete"
                              data-bs-toggle="modal"
                              data-bs-target={`#deleteBankModal-${bank.id}`}
                              disabled={loading}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                            <span className="tooltip-text"style={{top:"20px",left:"60px"}}>Delete</span>
                          </div>

                          <div
                            className="modal fade"
                            id={`deleteBankModal-${bank.id}`}
                            tabIndex="-1"
                            aria-labelledby={`deleteBankModalLabel-${bank.id}`}
                            aria-hidden="true"
                          >
                            <div className="modal-dialog modal-dialog-centered">
                              <div className="modal-content">
                                <div className="modal-header">
                                  <h5 className="modal-title" id={`deleteBankModalLabel-${bank.id}`}>
                                    Confirm Delete
                                  </h5>
                                  <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                  ></button>
                                </div>
                                <div className="modal-body">
                                  Are you sure you want to delete this bank account?
                                </div>
                                <div className="modal-footer">
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    data-bs-dismiss="modal"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    data-bs-dismiss="modal"
                                    onClick={() => handleDeleteBank(bank.id)}
                                    disabled={loading}
                                  >
                                    {loading ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">No bank accounts found. Add one to get started.</div>
            )}
          </div>

          <div className="mb-4">
            <h3>Cash Entries</h3>
            {loading && cashEntries.length === 0 ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : cashEntries.length > 0 ? (
              <div className="table-responsive">
                <table className="statement-table ">
                  <thead >
                    <tr>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Date</th>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Description</th>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Amount</th>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td style={{ border: "1px solid #a09e9e", width: "210px" }} className="text-center">{formatDate(entry.date)}</td>
                        <td style={{ border: "1px solid #a09e9e", width: "236px" }} className="text-center">{entry.description || "-"}</td>
                        <td style={{ border: "1px solid #a09e9e", width: "215px" }} className="text-center">{entry.amount}</td>
                        <td style={{ border: "1px solid #a09e9e", width: "191px" }} className="text-center">
                          <div className="tooltip-container">
                            <button
                              className="action-btn edit"
                              onClick={() => handleEditCashEntry(entry)}
                              disabled={loading}
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <span className="tooltip-text" style={{top:"20px",left:"60px"}}>Edit</span>
                          </div>
                          <div className="tooltip-container">
                            <button
                              className="action-btn delete"
                              data-bs-toggle="modal"
                              data-bs-target={`#deleteCashModal-${entry.id}`}
                              disabled={loading}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                            <span className="tooltip-text" style={{top:"20px",left:"60px"}}>Delete</span>
                          </div>

                          <div
                            className="modal fade"
                            id={`deleteCashModal-${entry.id}`}
                            tabIndex="-1"
                            aria-labelledby={`deleteCashModalLabel-${entry.id}`}
                            aria-hidden="true"
                          >
                            <div className="modal-dialog modal-dialog-centered">
                              <div className="modal-content">
                                <div className="modal-header">
                                  <h5 className="modal-title" id={`deleteCashModalLabel-${entry.id}`}>
                                    Confirm Delete
                                  </h5>
                                  <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                  ></button>
                                </div>
                                <div className="modal-body">
                                  Are you sure you want to delete this cash entry?
                                </div>
                                <div className="modal-footer">
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    data-bs-dismiss="modal"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    data-bs-dismiss="modal"
                                    onClick={() => handleDeleteCashEntry(entry.id)}
                                    disabled={loading}
                                  >
                                    {loading ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">No cash entries found. Add one to get started.</div>
            )}
          </div>
        </>
      )}

      {showDeleted && (
        <div className="mt-4">
          <div className="mb-4">
            <h3>Deleted Banks</h3>
            {loading && deletedBanks.length === 0 ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : deletedBanks.length > 0 ? (
              <div className="table-responsive">
                <table className="statement-table">
                  <thead >
                    <tr>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Bank Name</th>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Account Number</th>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Amount</th>
                      {/* <th style={{backgroundColor:"#afafaf",border:"1px solid #a09e9e"}}>Deleted At</th> */}
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedBanks.map((bank) => (
                      <tr key={bank.id}>
                        <td style={{ border: "1px solid #a09e9e", width: "210px" }} className="text-center">{bank.bank_name}</td>
                        <td style={{ border: "1px solid #a09e9e", width: "236px", width: "215px" }} className="text-center">{bank.account_number}</td>
                        <td style={{ border: "1px solid #a09e9e", width: "215px" }} className="text-center">{bank.amount}</td>
                        {/* <td style={{border:"1px solid #a09e9e"}} className="text-center">{bank.deleted_at ? formatDate(bank.deleted_at) : "N/A"}</td> */}
                        <td style={{ border: "1px solid #a09e9e", width: "191px" }} className="text-center">
                          <div className="tooltip-container">
                            <button
                              className="btn btn-sm" style={{ backgroundColor: "wheat", fontSize: "20px" }}
                              onClick={() => handleRestoreBank(bank.id)}
                              disabled={loading}
                            >
                              {loading ? "Restoring..." : <i className="fa-solid fa-trash-arrow-up fa-bounce"></i>}
                            </button>
                            <span className="tooltip-text" style={{top:"20px",left:"60px"}}>Delete</span>
                          </div>

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">No deleted bank accounts found.</div>
            )}
          </div>

          <div className="mb-4">
            <h3>Deleted Cash Entries</h3>
            {loading && deletedCashEntries.length === 0 ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : deletedCashEntries.length > 0 ? (
              <div className="table-responsive">
                <table className="statement-table ">
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Date</th>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Amount</th>
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Description</th>
                      {/* <th style={{backgroundColor:"#afafaf",border:"1px solid #a09e9e"}}>Deleted At</th> */}
                      <th style={{ backgroundColor: "#afafaf", border: "1px solid #a09e9e" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedCashEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td style={{ border: "1px solid #a09e9e", width: "210px" }} className="text-center">{entry.amount}</td>
                        <td style={{ border: "1px solid #a09e9e", width: "236px" }} className="text-center">{formatDate(entry.date)}</td>
                        <td style={{ border: "1px solid #a09e9e", width: "215px" }} className="text-center">{entry.description || "-"}</td>
                        {/* <td style={{border:"1px solid #a09e9e"}} className="text-center">{entry.deleted_at ? formatDate(entry.deleted_at) : "N/A"}</td> */}
                        <td style={{ border: "1px solid #a09e9e", width: "191px" }} className="text-center">
                          <button
                            className="btn btn-sm" style={{ backgroundColor: "black" }}
                            onClick={() => handleRestoreCashEntry(entry.id)}
                            disabled={loading}
                          >
                            {loading ? "Restoring..." : <i className="fa-solid fa-trash-arrow-up fa-bounce"></i>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">No deleted cash entries found.</div>
            )}
          </div>
        </div>
      )}

      <div
        ref={toastRef}
        className="toast align-items-center text-bg-success border-0 position-fixed bottom-0 end-0 m-3"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="d-flex">
          <div className="toast-body"></div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  );
};

export default BankAdd;