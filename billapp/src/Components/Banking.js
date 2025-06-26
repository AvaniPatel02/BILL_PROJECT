import React, { useState, useEffect } from 'react';
import './style/banking.css'


const Banking = () => {
  // State variables
  const [visibleButton, setVisibleButton] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualBankEntry, setManualBankEntry] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');
  const [bankName, setBankName] = useState('');
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [bankOptions, setBankOptions] = useState([]);
  const [manualBuyers, setManualBuyers] = useState([]);
  const [buyerNames, setBuyerNames] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState("");
  const [buyerInvoices, setBuyerInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [buyerNotice, setBuyerNotice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDate, setCompanyDate] = useState("");
  const [companyAmount, setCompanyAmount] = useState("");
  const [companyNotice, setCompanyNotice] = useState("");
  const [salaryName, setSalaryName] = useState("");
  const [salary, setSalaryAmount] = useState("");
  const [salaryDate, setSalaryDate] = useState("");
  const [salaryInvoices, setSalaryInvoices] = useState([]);
  const [selectedSalaryInvoice, setSelectedSalaryInvoice] = useState("");
  const [otherDate, setOtherDate] = useState("");
  const [otherNotice, setOtherNotice] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [otherSelector, setOtherSelector] = useState('');
  const [otherNoticeSelector, setOtherNoticeSelector] = useState('');
  const [otherNoticeOptions, setOtherNoticeOptions] = useState([]);
  const [transactionType, setTransactionType] = useState('debit');
  const [allInvoices, setAllInvoices] = useState([]);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositFormAmount, setDepositFormAmount] = useState("");
  const [depositFormDate, setDepositFormDate] = useState("");
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [showAddTypeInput, setShowAddTypeInput] = useState(false);
  const [newType, setNewType] = useState("");
  const [typeOptions, setTypeOptions] = useState(["Fast Expand", "Profit", "Other"]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [paymentType, setPaymentType] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [bankList, setBankList] = useState([]);
  const [companyPaymentType, setCompanyPaymentType] = useState("");
  const [companySelectedBank, setCompanySelectedBank] = useState("");
  const [salaryPaymentType, setSalaryPaymentType] = useState("");
  const [salarySelectedBank, setSalarySelectedBank] = useState("");
  const [otherPaymentType, setOtherPaymentType] = useState("");
  const [otherSelectedBank, setOtherSelectedBank] = useState("");
  const [otherImage, setOtherImage] = useState(null);
  const [otherImagePreview, setOtherImagePreview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showNewNameInput, setShowNewNameInput] = useState(false);

  // Helper functions
  const handleResponse = (response) => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  };

  const handleError = (error) => {
    console.error("API Error:", error);
    alert("An error occurred. Please try again.");
  };

  const validateRequiredFields = (fields) => {
    if (fields.some(field => !field)) {
      alert("Please fill all required fields.");
      return false;
    }
    return true;
  };

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  });

  const handleApiResponse = async (response, entity) => {
    if (!response.ok) {
      const error = await response.json();
      alert(`Error: ${JSON.stringify(error)}`);
      return false;
    }
    alert(`${entity} saved successfully!`);
    return true;
  };

  const resetBuyerForm = () => {
    setSelectedBuyer("");
    setSelectedInvoice("");
    setSelectedDate("");
    setBuyerNotice("");
    setDepositAmount("");
  };

  const handleSubmissionError = (error, entity) => {
    console.error(`${entity} submission error:, error`);
    alert(`Please try again balance is not funding`);
  };

  // Data fetching functions
  const fetchBuyerNames = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/banking/buyer/', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      const uniqueBuyers = [...new Set(data.map(item => item.buyer_name))];
      setBuyerOptions(uniqueBuyers);
    } catch (error) {
      console.error('Error fetching buyer names:', error);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/bank-accounts/", {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const bankNames = data.map(bank => bank.bank_name);
        setBankList(bankNames);
        setBankOptions(data);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
      setBankList([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/banking/company/", {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const loadTransactionTypes = () => {
    setIsLoadingTypes(true);
    fetch("http://localhost:8000/api/banking/other/", {
      headers: getAuthHeaders()
    })
      .then(handleResponse)
      .then((data) => {
        const existingTypes = data.map(item => item.other_type);
        const uniqueTypes = [...new Set(existingTypes)];
        const defaultTypes = ["partner", "Fixed Assets", "Loan"];
        const allTypes = [...defaultTypes];

        uniqueTypes.forEach(type => {
          if (!allTypes.includes(type)) {
            allTypes.push(type);
          }
        });

        setTypeOptions(allTypes);
      })
      .catch(handleError)
      .finally(() => setIsLoadingTypes(false));
  };

  const loadOtherNoticeOptions = async (selectedType) => {
    if (!selectedType) {
      setOtherNoticeOptions([]);
      setOtherNoticeSelector('');
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/banking/other/", {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      // Filter data by selected type and get unique other_notice values
      const filteredData = data.filter(item => item.other_type === selectedType);
      const uniqueNotices = [...new Set(filteredData.map(item => item.other_notice).filter(notice => notice))];

      setOtherNoticeOptions(uniqueNotices);
    } catch (error) {
      console.error("Error fetching other notice options:", error);
      setOtherNoticeOptions([]);
    }
  };

  // Handler functions
  const handleCompanyBillSubmit = async () => {
    if (!validateRequiredFields([selectedBuyer, selectedDate, depositAmount, companyPaymentType])) return;

    if (companyPaymentType === "Banking" && !companySelectedBank) {
      alert("Please select a bank for banking transactions");
      return;
    }

    try {
      // First submit the company bill
      const response = await fetch("http://localhost:8000/api/banking/company/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          company_name: selectedBuyer,
          invoice_id: selectedInvoice,
          transaction_date: selectedDate,
          notice: buyerNotice,
          amount: parseFloat(depositAmount),
          payment_method: companyPaymentType,
          bank_name: companyPaymentType === "Banking" ? companySelectedBank : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      // Only process banking transactions if payment method is Banking
      if (companyPaymentType === "Banking") {
        // Find the bank in our local state first
        const matchingBank = bankOptions.find(bank =>
          bank.bank_name.toLowerCase() === companySelectedBank.toLowerCase()
        );

        if (matchingBank) {
          const newAmount = parseFloat(matchingBank.amount) + parseFloat(depositAmount);

          // Update the bank account
          const updateResponse = await fetch(
            `http://127.0.0.1:8000/api/bank-accounts/${matchingBank.id}/`,
            {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                ...matchingBank,
                amount: newAmount
              })
            }
          );

          if (!updateResponse.ok) {
            throw new Error('Failed to update bank account');
          }

          // Update local state to reflect the change
          setBankOptions(bankOptions.map(bank =>
            bank.id === matchingBank.id ? { ...bank, amount: newAmount } : bank
          ));
        }
      }

      alert("Company bill saved and bank account updated successfully!");
      resetBuyerForm();
      setCompanyPaymentType("");
      setCompanySelectedBank("");
    } catch (error) {
      console.error("Submission failed:", error);
      alert(`Failed to save company bill: ${error.message}`);
    }
  };

  const handleBuyerBillSubmit = async () => {
    // Determine which buyer name to use based on manual entry
    const currentBuyerName = buyerName;
    const currentDate = transactionDate;
    const currentAmount = amount;
    const currentNotice = notice;
    const currentPaymentType = paymentMethod;
    const currentSelectedBank = bankName;

    if (!currentBuyerName || !currentDate || !currentAmount || !currentPaymentType) {
      alert("Please fill all required fields.");
      return;
    }

    if (currentPaymentType === "Banking" && !currentSelectedBank) {
      alert("Please select a bank for banking transactions");
      return;
    }

    try {
      // First submit the buyer transaction
      const response = await fetch("http://localhost:8000/api/banking/buyer/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          buyer_name: currentBuyerName,
          transaction_date: currentDate,
          amount: parseFloat(currentAmount),
          notice: currentNotice || "No remarks",
          payment_method: currentPaymentType,
          bank_name: currentPaymentType === "Banking" ? currentSelectedBank : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      // If payment method is Banking, update the bank account
      if (currentPaymentType === "Banking") {
        // Find the bank in our local state
        const matchingBank = bankOptions.find(bank =>
          bank.bank_name.toLowerCase() === currentSelectedBank.toLowerCase()
        );

        if (matchingBank) {
          const newAmount = parseFloat(matchingBank.amount) - parseFloat(currentAmount);

          if (newAmount < 0) {
            throw new Error('Insufficient funds in bank account');
          }

          // Update the bank account on server
          const updateResponse = await fetch(
            `http://127.0.0.1:8000/api/bank-accounts/${matchingBank.id}/`,
            {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                ...matchingBank,
                amount: newAmount
              })
            }
          );

          if (!updateResponse.ok) {
            throw new Error('Failed to update bank account');
          }

          // Update local state to reflect the change
          setBankOptions(bankOptions.map(bank =>
            bank.id === matchingBank.id ? { ...bank, amount: newAmount } : bank
          ));
        }
      }

      alert("Buyer transaction saved successfully!");

      // Reset form
      setBuyerName("");
      setTransactionDate("");
      setAmount("");
      setNotice("");
      setPaymentMethod("");
      setBankName("");
      setManualEntry(false);
    } catch (error) {
      console.error("Submission failed:", error);
      alert(`Failed to save buyer transaction: ${error.message}`);
    }
  };

  const handleSalarySubmit = async () => {
    if (!validateRequiredFields([salaryName, salary, salaryDate, salaryPaymentType])) return;

    if (salaryPaymentType === "Banking" && !salarySelectedBank) {
      alert("Please select a bank for banking transactions");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/banking/salary/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          salary_name: salaryName,
          salary_amount: parseFloat(salary),
          salary_date: salaryDate,
          salary_invoice: selectedSalaryInvoice || null,
          payment_method: salaryPaymentType,
          bank_name: salaryPaymentType === "Banking" ? salarySelectedBank : null,
        }),
      });

      const success = await handleApiResponse(response, "Salary data");

      if (success && salaryPaymentType === "Banking") {
        // Find matching bank
        const matchingBank = bankOptions.find(
          (bank) => bank.bank_name.toLowerCase() === salarySelectedBank.toLowerCase()
        );

        if (matchingBank) {
          const newAmount = parseFloat(matchingBank.amount) - parseFloat(salary);

          if (newAmount < 0) {
            throw new Error("Insufficient funds in bank account");
          }

          // Update bank on backend
          const updateResponse = await fetch(
            `http://127.0.0.1:8000/api/bank-accounts/${matchingBank.id}/`,
            {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                ...matchingBank,
                amount: newAmount,
              }),
            }
          );

          if (!updateResponse.ok) {
            throw new Error("Failed to update bank account after salary submission");
          }

          // Update local bankOptions state
          setBankOptions(
            bankOptions.map((bank) =>
              bank.id === matchingBank.id ? { ...bank, amount: newAmount } : bank
            )
          );
        }
      }

      // Clear form
      setSalaryName("");
      setSalaryAmount("");
      setSalaryDate("");
      setSelectedSalaryInvoice("");
      setSalaryPaymentType("");
      setSalarySelectedBank("");
    } catch (error) {
      handleSubmissionError(error, "salary data");
    }
  };

  const handleOtherImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOtherImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOtherImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOtherSubmit = async () => {
    // Check if otherNoticeSelector is empty or if "add_new" was selected but no new name entered
    if (!otherNoticeSelector || otherNoticeSelector === "add_new") {
      alert("Please select a name or enter a new name.");
      return;
    }

    if (!validateRequiredFields([otherDate, otherAmount, otherSelector, transactionType, otherPaymentType])) return;

    if (otherPaymentType === "Banking" && !otherSelectedBank) {
      alert("Please select a bank for banking transactions");
      return;
    }

    const finalAmount = transactionType === 'debit'
      ? -Math.abs(parseFloat(otherAmount))
      : Math.abs(parseFloat(otherAmount));

    try {
      const formData = new FormData();
      formData.append('other_type', otherSelector);
      formData.append('other_date', otherDate);
      formData.append('other_notice', otherNoticeSelector);
      formData.append('other_amount', finalAmount);
      formData.append('transaction_type', transactionType);
      formData.append('payment_method', otherPaymentType);
      if (otherPaymentType === "Banking") {
        formData.append('bank_name', otherSelectedBank);
      }
      if (otherImage) {
        formData.append('image', otherImage);
      }

      const response = await fetch("http://localhost:8000/api/banking/other/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      const success = await handleApiResponse(response, "Other data");

      if (success && otherPaymentType === "Banking") {
        const matchingBank = bankOptions.find(
          (bank) => bank.bank_name.toLowerCase() === otherSelectedBank.toLowerCase()
        );

        if (matchingBank) {
          const currentBankAmount = parseFloat(matchingBank.amount);
          const adjustmentAmount = parseFloat(otherAmount);

          const newAmount =
            transactionType === "debit"
              ? currentBankAmount - adjustmentAmount
              : currentBankAmount + adjustmentAmount;

          if (newAmount < 0) {
            throw new Error("Insufficient funds in bank account");
          }

          const updateResponse = await fetch(
            `http://127.0.0.1:8000/api/bank-accounts/${matchingBank.id}/`,
            {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                ...matchingBank,
                amount: newAmount,
              }),
            }
          );

          if (!updateResponse.ok) {
            throw new Error("Failed to update bank account after 'Other' transaction");
          }

          // Update local bank state
          setBankOptions(
            bankOptions.map((bank) =>
              bank.id === matchingBank.id ? { ...bank, amount: newAmount } : bank
            )
          );
        }
      }

      // Reset form
      setOtherSelector('');
      setOtherDate('');
      setOtherNoticeSelector('');
      setOtherNoticeOptions([]);
      setShowNewNameInput(false);
      setOtherAmount('');
      setTransactionType('debit');
      setOtherPaymentType('');
      setOtherSelectedBank('');
      setOtherImage(null);
      setOtherImagePreview(null);
      loadTransactionTypes();

    } catch (error) {
      handleSubmissionError(error, "other data");
    }
  };

  const handleDepositSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/add-deposit/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: depositFormAmount,
          date: depositFormDate,
        }),
      });

      if (await handleApiResponse(response, "Deposit")) {
        setShowDepositForm(false);
        setDepositFormAmount('');
        setDepositFormDate('');
      }
    } catch (error) {
      handleSubmissionError(error, "deposit");
    }
  };

  const handleAddType = async () => {
    const trimmed = newType.trim();
    if (!trimmed) return;

    if (typeOptions.includes(trimmed)) {
      setOtherSelector(trimmed);
      setNewType("");
      setShowAddTypeInput(false);
      return;
    }

    setTypeOptions(prev => [...prev, trimmed]);
    setOtherSelector(trimmed);
    setNewType("");
    setShowAddTypeInput(false);
  };

  // useEffect hooks
  useEffect(() => {
    if ([1, 2, 3].includes(visibleButton)) {
      fetch("http://localhost:8000/api/invoices/", {
        headers: getAuthHeaders()
      })
        .then(handleResponse)
        .then((data) => {
          const names = data.map(item => item.buyer_name);
          const uniqueNames = [...new Set(names)];
          setBuyerNames(uniqueNames);
          setAllInvoices(data);
        })
        .catch(handleError);

      fetchBuyerNames();
    }

    if (visibleButton === 4) {
      loadTransactionTypes();
    }

    fetchBanks();
    fetchCompanies();
  }, [visibleButton]);

  useEffect(() => {
    const filtered = allInvoices.filter(inv => inv.buyer_name === selectedBuyer);
    setBuyerInvoices(filtered);
    setSelectedInvoice("");
  }, [selectedBuyer, allInvoices]);

  useEffect(() => {
    const filtered = allInvoices.filter(inv => inv.buyer_name === salaryName);
    setSalaryInvoices(filtered);
    setSelectedSalaryInvoice("");
  }, [salaryName, allInvoices]);

  useEffect(() => {
    if (visibleButton === 3) {
      setIsLoadingEmployees(true);
      fetch("http://localhost:8000/api/banking/employee/", {
        headers: getAuthHeaders()
      })
        .then(handleResponse)
        .then((data) => setEmployees(data))
        .catch(handleError)
        .finally(() => setIsLoadingEmployees(false));
    }
  }, [visibleButton]);

  return (
    <div className="year_container">
      <div className="form-container">

        <div className="button-group">
          <button className=" btn-all" onClick={() => setVisibleButton(1)}>Company Bill</button>
          <button className=" btn-all" onClick={() => setVisibleButton(2)}>Buyer</button>
          <button className=" btn-all" onClick={() => setVisibleButton(3)}>Salary</button>
          <button className=" btn-all" onClick={() => setVisibleButton(4)}>Other</button>

        </div>

        <div>
          {visibleButton === 1 && (
            <>
              <h3 className="mb-2 font-semibold">Company Bill</h3>
              <select
                className="border px-4 py-2 rounded w-full mb-3"
                value={selectedBuyer}
                onChange={(e) => setSelectedBuyer(e.target.value)}
                required
              >
                <option value="">-- Select Company --</option>
                {buyerNames.map((name, index) => (
                  <option key={index} value={name}>{name}</option>
                ))}
              </select>

              <select
                className="border px-4 py-2 rounded w-full mb-3"
                value={selectedInvoice}
                onChange={(e) => setSelectedInvoice(e.target.value)}
              >
                <option value="">-- Select Invoice (Optional) --</option>
                {buyerInvoices.map(inv => (
                  <option key={inv.id} value={inv.invoice_number}>{inv.invoice_number}</option>
                ))}
              </select>

              <input
                type="date"
                className="border px-4 py-2 rounded w-full mb-3"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Notice (Optional)"
                className="border px-4 py-2 rounded w-full mb-3"
                value={buyerNotice}
                onChange={(e) => setBuyerNotice(e.target.value)}
              />

              <input
                type="number"
                placeholder="Deposit Amount*"
                className="border px-4 py-2 rounded w-full mb-3"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
              />

              <select
                className="border px-4 py-2 rounded w-full mb-3"
                value={companyPaymentType}
                onChange={(e) => setCompanyPaymentType(e.target.value)}
                required
              >
                <option value="">-- Select Payment Type --</option>
                <option value="Cash">Cash</option>
                <option value="Banking">Banking</option>
              </select>

              {companyPaymentType === "Banking" && (
                <select
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={companySelectedBank}
                  onChange={(e) => setCompanySelectedBank(e.target.value)}
                  required
                >
                  <option value="">-- Select Bank --</option>
                  {bankOptions.map((bank) => (
                    <option key={bank.id} value={bank.bank_name}>
                      {bank.bank_name} (Current: {Math.abs(bank.amount)})
                    </option>
                  ))}
                </select>
              )}

              <button
                className="button-sumbit-banking btn-all"
                onClick={handleCompanyBillSubmit}
              >
                Submit Company Bill
              </button>
            </>
          )}

          {visibleButton === 2 && (
            <>
              <h3 className="mb-2 font-semibold">Buyer Bill</h3>
              <label className="mb-1 font-medium flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={manualEntry}
                  onChange={() => {
                    setManualEntry(!manualEntry);
                    setBuyerName("");
                  }}
                /> Enter Buyer Name Manually
              </label>

              {manualEntry ? (
                <input
                  type="text"
                  placeholder="Buyer Name*"
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                />
              ) : (
                <select
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                >
                  <option value="">-- Select Buyer --</option>
                  {buyerOptions.map((buyer, index) => (
                    <option key={index} value={buyer}>{buyer}</option>
                  ))}
                </select>
              )}

              <input
                type="date"
                className="border px-4 py-2 rounded w-full mb-3"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
              />

              <input
                type="number"
                placeholder="Amount*"
                className="border px-4 py-2 rounded w-full mb-3"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Notice (Optional)"
                className="border px-4 py-2 rounded w-full mb-3"
                value={notice}
                onChange={(e) => setNotice(e.target.value)}
              />

              <select
                className="border px-4 py-2 rounded w-full mb-3"
                value={paymentMethod}
                onChange={(e) => {
                  const value = e.target.value;
                  setPaymentMethod(value);
                  if (value !== "Banking") {
                    setBankName("");
                  }
                }}
                required
              >
                <option value="">-- Select Payment Type --</option>
                <option value="Cash">Cash</option>
                <option value="Banking">Banking</option>
              </select>

              {paymentMethod === "Banking" && (
                <select
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                >
                  <option value="">-- Select Bank --</option>
                  {bankOptions.map((bank) => (
                    <option key={bank.id} value={bank.bank_name}>
                      {bank.bank_name} (Current: {Math.abs(bank.amount)})
                    </option>
                  ))}
                </select>
              )}

              <button
                className="button-sumbit-banking btn-all"
                onClick={handleBuyerBillSubmit}
              >
                Submit Buyer Bill
              </button>
            </>
          )}

          {visibleButton === 3 && (
            <>
              <h3 className="mb-2 font-semibold">Salary</h3>
              {isLoadingEmployees ? (
                <p>Loading employees...</p>
              ) : employees.length === 0 ? (
                <p>No employees found</p>
              ) : (
                <>
                  <select className="border px-4 py-2 rounded w-full mb-3"
                    value={salaryName} onChange={(e) => {
                      const selected = e.target.value;
                      setSalaryName(selected);
                      const emp = employees.find(emp => emp.name === selected);
                      if (emp) setSalaryAmount(emp.salary || "");
                    }}>
                    <option value="">-- Select Employee --</option>
                    {employees.map((emp, index) => (
                      <option key={index} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Enter amount" className="border px-4 py-2 rounded w-full mb-3"
                    value={salary} onChange={(e) => setSalaryAmount(e.target.value)} />
                  <input type="date" className="border px-4 py-2 rounded w-full mb-3"
                    value={salaryDate} onChange={(e) => setSalaryDate(e.target.value)} />

                  <select
                    className="border px-4 py-2 rounded w-full mb-3"
                    value={salaryPaymentType}
                    onChange={(e) => setSalaryPaymentType(e.target.value)}
                    required
                  >
                    <option value="">-- Select Payment Type --</option>
                    <option value="Cash">Cash</option>
                    <option value="Banking">Banking</option>
                  </select>

                  {salaryPaymentType === "Banking" && (
                    <select
                      className="border px-4 py-2 rounded w-full mb-3"
                      value={salarySelectedBank}
                      onChange={(e) => setSalarySelectedBank(e.target.value)}
                      required
                    >
                      <option value="">-- Select Bank --</option>
                      {bankOptions.map((bank) => (
                        <option key={bank.id} value={bank.bank_name}>
                          {bank.bank_name} (Current: {Math.abs(bank.amount)})
                        </option>
                      ))}
                    </select>
                  )}

                  <button className="button-sumbit-banking btn-all" onClick={handleSalarySubmit}>
                    Submit
                  </button>
                </>
              )}
            </>
          )}

          {visibleButton === 4 && (
            <>
              <h3 className="mb-2 font-semibold">Other</h3>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <button
                  className="button-add-banking"
                  onClick={() => setShowAddTypeInput(!showAddTypeInput)}
                >
                  {showAddTypeInput ? "Cancel" : "Add New Type"}
                </button>

                {showAddTypeInput && (
                  <>
                    <input
                      type="text"
                      placeholder="New type"
                      className="border px-3 py-1 rounded"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                    />
                    <button
                      className="button-add-banking"
                      onClick={handleAddType}
                    >
                      Add
                    </button>
                  </>
                )}
              </div>

              <div className="mb-3">
                <label className="block mb-2 font-medium">Transaction Type*</label>

              </div>

              {isLoadingTypes ? (
                <p>Loading transaction types...</p>
              ) : (
                <select
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={otherSelector}
                  onChange={(e) => {
                    setOtherSelector(e.target.value);
                    loadOtherNoticeOptions(e.target.value);
                  }}
                  required
                >
                  <option value="">Select Account</option>
                  {typeOptions.map((option, i) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                </select>
              )}

              {otherSelector && (
                <select
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={otherNoticeSelector}
                  onChange={(e) => {
                    const value = e.target.value;
                    setOtherNoticeSelector(value);
                    if (value === "add_new") {
                      setShowNewNameInput(true);
                      setOtherNoticeSelector('');
                    } else {
                      setShowNewNameInput(false);
                    }
                  }}
                  required
                >
                  <option value="">Select Name*</option>
                  {otherNoticeOptions.map((option, i) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                  <option value="add_new">+ Add New Name</option>
                </select>
              )}

              {showNewNameInput && (
                <input
                  type="text"
                  placeholder="Enter new name"
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={otherNoticeSelector}
                  onChange={(e) => setOtherNoticeSelector(e.target.value)}
                />
              )}

              <input type="date" className="border px-4 py-2 rounded w-full mb-3"
                value={otherDate} onChange={(e) => setOtherDate(e.target.value)} />
              <input type="number" placeholder="Enter amount" className="border px-4 py-2 rounded w-full mb-3"
                value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} />
              <div className="flex">
                <label className="flex items-center" style={{marginRight:"10px"}}>
                  <input
                    type="radio"
                    name="transactionType"
                    value="credit"
                    checked={transactionType === 'credit'}
                    onChange={() => setTransactionType('credit')}
                    style={{ width: '15px', height: '15px',marginRight:"5px"}}
                    className="mr-2"
                  />
                  Credit
                </label>
                <label className="flex items-center" style={{marginRight:"10px"}}>
                  <input
                    type="radio"
                    name="transactionType"
                    value="debit"
                    checked={transactionType === 'debit'}
                    onChange={() => setTransactionType('debit')}
                    style={{ width: '15px', height: '15px',marginRight:"5px"}}
                    className="mr-2"
                  />
                  Debit
                </label>
              </div>

              {/* <div className="mb-3">
                <label className="block mb-2 font-medium">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOtherImageChange}
                  className="border px-4 py-2 rounded w-full"
                />
                {otherImagePreview && (
                  <div className="mt-2">
                    <img
                      src={otherImagePreview}
                      alt="Preview"
                      className="max-w-xs max-h-48 object-contain"
                    />
                  </div>
                )}
              </div> */}

              <select
                className="border px-4 py-2 rounded w-full mb-3"
                value={otherPaymentType}
                onChange={(e) => setOtherPaymentType(e.target.value)}
                required
              >
                <option value="">-- Select Payment Type --</option>
                <option value="Cash">Cash</option>
                <option value="Banking">Banking</option>
              </select>

              {otherPaymentType === "Banking" && (
                <select
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={otherSelectedBank}
                  onChange={(e) => setOtherSelectedBank(e.target.value)}
                  required
                >
                  <option value="">-- Select Bank --</option>
                  {bankOptions.map((bank) => (
                    <option key={bank.id} value={bank.bank_name}>
                      {bank.bank_name} (Current: {Math.abs(bank.amount)})
                    </option>
                  ))}
                </select>
              )}

              <button className="button-sumbit-banking btn-all" onClick={handleOtherSubmit}>
                Submit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banking;