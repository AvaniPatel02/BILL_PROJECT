import React, { useState } from "react";
import './style/incomeexpenditure.css'

const IncomeExpenditure = () => {
    const [data, setData] = useState([]);
    const [selectedButton, setSelectedButton] = useState("");
    const [loading, setLoading] = useState(false);

    const buttons = [
        { name: "Company Bill", api: "http://localhost:8000/api/banking/buyer/" },
        { name: "Buyer", api: "http://localhost:8000/api/banking/company/" },
        { name: "Salary", api: "http://localhost:8000/api/banking/salary/" },
        { name: "Other", api: "http://localhost:8000/api/banking/other/" },
    ];

    const fetchData = async (apiUrl) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");

            const response = await fetch(apiUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const jsonData = await response.json();
            setData(jsonData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex" style={{ height: "100vh" }}>
            {/* Left Sidebar */}
            <div
                className="bg-light border-end d-flex flex-column"
                style={{ width: "350px", paddingLeft: "80px" }} >
                <div className="p-3 border-bottom">
                    <h4>Income & Expenditure</h4>
                </div>
                <div className="d-flex flex-column align-items-center justify-content-around flex-grow-1">
                    {buttons.map((button, index) => (
                        <button
                            key={index}
                            className={`button-sumbit-banking btn-all mb-3 ${selectedButton === button.name ? "active" : ""}`}
                            onClick={() => {
                                setSelectedButton(button.name);
                                fetchData(button.api);
                            }}
                            style={{
                                backgroundColor: selectedButton === button.name ? "#2a75a730" : "#2a75a7",
                                color: selectedButton === button.name ? "#2a75a7" : "#ffffff",
                                height: "70px", width: "80%"
                            }}
                        >
                            {button.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Content */}
            {/* Right Content */}
            <div className="p-4 w-75 mx-auto">
                {loading ? (
                    <div className="text-center">Loading...</div>
                ) : data.length > 0 ? (
                        <table className="table rounded-4 overflow-hidden table-bordered table-hover table-sm w-100 expenditure-table">
                            <thead >
                                <tr >    
                                    {Object.keys(data[0]).map((key) => (
                                        <th key={key}>{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={index}>
                                        {Object.entries(item).map(([key, value], i) => {
                                            let displayValue = value;

                                            // Convert valid date to dd/mm/yyyy
                                            if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                                                const date = new Date(value);
                                                if (!isNaN(date)) {
                                                    const day = String(date.getDate()).padStart(2, '0');
                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                    const year = date.getFullYear();
                                                    displayValue = `${day}/${month}/${year}`;
                                                }
                                            }

                                            return <td key={i}>{displayValue}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                   
                ) : (
                    <div className="text-center mt-5">
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
                            alt="No data"
                            style={{ width: "120px", opacity: 0.5 }}
                        />
                        <h5 className="mt-3 text-muted">No data to display</h5>
                        <p className="text-secondary">Select a category from the sidebar to get started.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default IncomeExpenditure;
