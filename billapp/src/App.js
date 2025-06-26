import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import YearDetails from "./Components/YearDetails";
import Clients from "./Components/Clients";
import Dashboard from "./Components/Dashboard";
import Address from "./Components/Address.js";
import Billsfilters from "./Components/Billsfilters.js";
import FilteredResults from "./Components/FilteredResults";
import TaxInvoice from "./Components/TaxInvoice";
import Setting from "./Components/Setting";
import Login from "./Components/loginpage";
import Signup from "./Components/signup";
import ForgotPassword from "./Components/ForgotPassword";
import ViewInvoice from "./Components/ViewInvoice";
import InvoiceDetails from "./Components/InvoiceDetails";
import BillManager from "./Components/BillManager";
import ViewsDetailsInfo from "./Components/ViewsDetailsInfo";
import Billsyears from "./Components/YearTable";
import ViewsButton from "./Components/Viewsbutton";
import Banking from "./Components/Banking.js";
import BalanceSheet from "./Components/BalanceSheet.js";
import Profile from "./Components/Profile.js";
import ClientInvoices from "./Components/ClientInvoices.js";
import Buyer from "./Components/Buyer.js";
import EditInvoice from "./Components/EditInvoice.js";
import Employee from "./Components/Employee.js";
import EmployeeDetails from "./Components/EmployeeDetails.js";
import IncomeExpenditure from "./Components/IncomeExpenditure.js";
// import OtherTransactionDetails from "./Components/OtherTransactionDetails.js";
import OtherTypeTransactions from "./Components/OtherTransactionDetails.js";
import CompanyTransactions from "./Components/CompanyTransactions.js";
import BankAdd from "./Components/BankAdd.js";
import BuyerTransaction from "./Components/BuyerTransaction.js";
// import IncomeExpenditure from "./Components/CorrectFileName.js"; // use correct file name
// import IncomeExpenditure from "./Components/IncomeExpenditure.js";

const shouldShowState = (state) => {
  return (state || "").trim().toLowerCase() !== "gujarat";
};

const AppContent = () => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  const hideSidebar = location.pathname === "/" || location.pathname === "/si" || location.pathname === "/forgot-password";

  return (
    <div>
      {!hideSidebar && isAuthenticated && <Sidebar />}
      <div className="flex-grow-1 w-100">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/si" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/year-table" element={<Billsyears />} />
          <Route path="/:yearRange" element={<YearDetails />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/address" element={<Address />} />
          <Route path="/view-invoice/:name" element={<ViewInvoice />} />
          <Route path="/billsfilter" element={<Billsfilters />} />
          <Route path="/filtered-results" element={<FilteredResults />} />
          <Route path="/tax-invoice" element={<TaxInvoice />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/invoice-details/:id" element={<InvoiceDetails />} />
          <Route path="/billmanager" element={<BillManager />} />
          <Route path="/bills/:buyer_name" element={<ViewsDetailsInfo />} />
          <Route path="/invoice-detail/:id" element={<ViewsButton />} />
          <Route path="/banking" element={<Banking />} />
          <Route path="/balancesheet" element={<BalanceSheet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/client-invoices" element={<ClientInvoices />} />
          <Route path="/buyer" element={<Buyer />} />
          <Route path="/edit-invoice/:invoiceId" element={<EditInvoice />} />
          <Route path="/employee" element={<Employee />} />
          <Route path="/employee-details/:id" element={<EmployeeDetails />} />
          <Route path="/incomeExpenditure" element={<IncomeExpenditure />} />
          {/* <Route path="/banking/other/:id" element={<OtherTransactionDetails />} /> */}
          <Route path="/banking/other-type/:type" element={<OtherTypeTransactions />} />
          <Route path="/banking/company/:companyName" element={<CompanyTransactions />} />
          <Route path="/bankadd" element={<BankAdd />} />
          <Route path="/banking/buyer/:buyerName" element={<BuyerTransaction />} />



        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;