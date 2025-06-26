import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const CompanyTransactions = () => {
    const { companyName } = useParams();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            const token = localStorage.getItem("access_token");
            try {
                const res = await fetch("http://localhost:8000/api/banking/company/", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                const filtered = data.filter(txn => txn.company_name === companyName);
                setTransactions(filtered);
            } catch (error) {
                console.error("Failed to fetch company transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [companyName]);

    // Calculate total amount
    const totalAmount = transactions.reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);

    return (
        <div style={{ padding: "20px" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Transactions for {companyName}</h3>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                    ← Back
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : transactions.length === 0 ? (
                <p>No transactions found.</p>
            ) : (
                <table className="table table-bordered table-hover text-center">
                    <thead className="table-dark">
                        <tr>
                            <th>No.</th>
                            <th>Name</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((txn, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{txn.company_name}</td>
                                <td>{txn.amount}</td>
                                <td>{new Date(txn.transaction_date).toLocaleDateString("en-GB")}</td>
                                <td>{txn.notice || "-"}</td>
                            </tr>
                        ))}
                        <tr className="table-warning fw-bold">
                            <td colSpan="2">Total</td>
                            <td>{totalAmount.toFixed(2)}</td>
                            <td colSpan="2"></td>
                        </tr>
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default CompanyTransactions;
