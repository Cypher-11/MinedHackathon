import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";
import Tickets from "./Tickets"; 

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Dashboard = ({ user }) => {
  
  const [activeTab, setActiveTab] = useState("dashboard");

  const [inverters, setInverters] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("status");
  const [filterValue, setFilterValue] = useState("All");

  const [tickets, setTickets] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [selectedInverter, setSelectedInverter] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const [formData, setFormData] = useState({
    inverter_id: "",
    location: "Block A",
    current_status: "Healthy"
  });

  const [successMsg, setSuccessMsg] = useState("");

  const [isPredicting, setIsPredicting] = useState(false);

  const [qnaInput, setQnaInput] = useState("");
  const [qnaResponse, setQnaResponse] = useState("");
  const [isQnaLoading, setIsQnaLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/"; 
  };
  
  const fetchInverters = async () => {
    try {
      const res = await axios.get("http://10.77.125.61:8000/api/inverters");
      setInverters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = async () => {
    try {
      console.log("Fetching tickets data from backend...");
      const res = await axios.get("http://10.77.125.61:8000/api/getTickets");
      setTickets(res.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  useEffect(() => {
    fetchInverters();
    fetchTickets();
  }, []);

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchInverters();
    } else if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [activeTab]);


  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://10.77.125.61:8000/api/inverters", formData);
      setSuccessMsg("Inverter Added Successfully");
      setShowAddModal(false);
      setFormData({ inverter_id: "", location: "Block A", current_status: "Healthy" });
      fetchInverters();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const openDeleteModal = (inv) => {
    setSelectedInverter(inv);
    setDeleteInput("");
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteInput !== selectedInverter.inverter_id) {
      alert("Inverter ID does not match");
      return;
    }
    try {
      await axios.delete(`http://10.77.125.61:8000/api/inverters/${selectedInverter._id}`);
      setShowDeleteModal(false);
      fetchInverters();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePredict = async () => {
    try {
      setIsPredicting(true); 
      console.log("Predict button clicked. Triggering ML prediction...");
      const res = await axios.post("http://10.77.125.61:8000/api/predict");
      setSuccessMsg("Prediction completed successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchInverters();
    } catch (err) {
      console.error("Prediction failed:", err);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleRaiseTicket = async (inv) => {
    try {
      console.log(`Raising ticket for ${inv.inverter_id}...`);
      const ticketsRes = await axios.get("http://10.77.125.61:8000/api/getNextTicketId");
      const newTicketId = ticketsRes.data.ticket_id || ticketsRes.data;

      const isCleaning = inv.current_status === "Needs Cleaning";
      const assignedRole = isCleaning ? "Cleaner" : "Engineer";
      const issueSummary = isCleaning
        ? "According to the risk score we need cleaning of the given inverter"
        : "According to the risk score we need repairing of the given inverter";

      const ticketPayload = {
        ticket_id: newTicketId,
        inverter_id: inv.inverter_id,
        assigned_role: assignedRole,
        status: "Open",
        issue_summary: issueSummary,
        created_at: new Date().toISOString(),
        resolved_at: null
      };

      await axios.post("http://10.77.125.61:8000/api/createTicket", ticketPayload);
      setSuccessMsg(`Ticket ${newTicketId} raised successfully!`);
      setTimeout(() => setSuccessMsg(""), 3000);
      
      fetchTickets();
    } catch (err) {
      console.error("Error raising ticket:", err);
      alert("Failed to raise ticket. Please check the console.");
    }
  };

  const handleQnaSubmit = async () => {
    if (!qnaInput.trim()) return;
    setIsQnaLoading(true);
    setQnaResponse("");
    try {
      const url = `http://10.77.125.61:8000/api/chat`;
      const payload = { question: qnaInput };
      console.log(`Sending post request to backend`);
      const res = await axios.post(url, payload);
      let finalResponseText = "";
      if (res.data && res.data.answer) {
        finalResponseText = res.data.answer;
      } else if (res.data && res.data.explaination) {
        finalResponseText = res.data.explaination;
      } else if (typeof res.data === 'object') {
        finalResponseText = JSON.stringify(res.data, null, 2);
      } else {
        finalResponseText = res.data;
      }
      setQnaResponse(finalResponseText);
    } catch (error) {
      console.error("QnA API Error:", error);
      const errorMessage = error.response?.data?.detail || error.message;
      setQnaResponse(`Error: ${errorMessage}`);
    } finally {
      setIsQnaLoading(false);
    }
  };

  const filteredInverters = inverters.filter((inv) => {
    const matchesSearch = inv.inverter_id.toLowerCase().includes(search.toLowerCase());
    if (filterType === "status") {
      return (filterValue === "All" || inv.current_status === filterValue) && matchesSearch;
    }
    if (filterType === "block") {
      return (filterValue === "All" || inv.location === filterValue) && matchesSearch;
    }
    return matchesSearch;
  });

  const healthyCount = inverters.filter(i => i.current_status === "Healthy").length;
  const cleaningCount = inverters.filter(i => i.current_status === "Needs Cleaning").length;
  const repairCount = inverters.filter(i => i.current_status === "Needs Repair").length;

  const pieData = [
    { name: "Healthy", value: healthyCount, color: "#10b981" },
    { name: "Needs Cleaning", value: cleaningCount, color: "#f59e0b" },
    { name: "Needs Repair", value: repairCount, color: "#ef4444" }
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Healthy': return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', label: 'Healthy', dotColor: '#10b981' };
      case 'Needs Cleaning': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'Needs Cleaning', dotColor: '#f59e0b' };
      case 'Needs Repair': return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', label: 'Needs Repair', dotColor: '#ef4444' };
      default: return { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', label: status, dotColor: '#94a3b8' };
    }
  };

  return (
    <div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => setActiveTab("dashboard")}
            style={{ 
              padding: "8px 16px", cursor: "pointer", borderRadius: "6px", border: "none", fontWeight: "600",
              background: activeTab === "dashboard" ? "#3b82f6" : "transparent",
              color: activeTab === "dashboard" ? "#fff" : "#475569"
            }}
          >
            Inverter Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("tickets")}
            style={{ 
              padding: "8px 16px", cursor: "pointer", borderRadius: "6px", border: "none", fontWeight: "600",
              background: activeTab === "tickets" ? "#3b82f6" : "transparent",
              color: activeTab === "tickets" ? "#fff" : "#475569"
            }}
          >
            View Tickets 
            {tickets.length > 0 && <span style={{ marginLeft: "8px", background: activeTab === "tickets" ? "#fff" : "#3b82f6", color: activeTab === "tickets" ? "#3b82f6" : "#fff", padding: "2px 6px", borderRadius: "10px", fontSize: "12px" }}>{tickets.length}</span>}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {user && (
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
              Role: <strong>{user.role}</strong>
            </span>
          )}
          
          <button 
            onClick={handleLogout}
            style={{ 
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", cursor: "pointer", borderRadius: "6px", 
              border: "1px solid #ef4444", background: "transparent", 
              color: "#ef4444", fontWeight: "600", transition: "0.2s"
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>

      {activeTab === "tickets" ? (
        <Tickets user={user} tickets={tickets} fetchTickets={fetchTickets} />
      ) : (
        <div className="so-page">
          <div className="so-page-header">
            <div>
              <h1 className="so-page-title">Inverter Overview</h1>
              <p className="so-page-subtitle">Real-time monitoring and AI-powered diagnostics for your solar fleet</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              
              <button 
                className="so-predict-btn" 
                onClick={handlePredict}
                disabled={isPredicting}
                style={{ opacity: isPredicting ? 0.7 : 1, cursor: isPredicting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {!isPredicting && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                )}
                {isPredicting ? "Predicting..." : "Run Prediction"}
                {isPredicting && <div className="btn-buffer-spinner"></div>}
              </button>

              {user?.role !== "Manager" && (
                <button className="so-add-inv-btn" onClick={() => setShowAddModal(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Inverter
                </button>
              )}
            </div>
          </div>

          {successMsg && (
            <div className="so-alert so-alert-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              {successMsg}
            </div>
          )}

          <div className="so-stats-row">
            <div className="so-stat-card">
              <div className="so-stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <div>
                <div className="so-stat-number">{inverters.length}</div>
                <div className="so-stat-label">Total Inverters</div>
              </div>
            </div>
            <div className="so-stat-card">
              <div className="so-stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <div className="so-stat-number">{healthyCount}</div>
                <div className="so-stat-label">Healthy</div>
              </div>
            </div>
            <div className="so-stat-card">
              <div className="so-stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <div>
                <div className="so-stat-number">{cleaningCount}</div>
                <div className="so-stat-label">Needs Cleaning</div>
              </div>
            </div>
            <div className="so-stat-card">
              <div className="so-stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div className="so-stat-number">{repairCount}</div>
                <div className="so-stat-label">Needs Repair</div>
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#1e293b", fontSize: "16px" }}>Status Distribution</h3>
            <div style={{ width: "100%", height: "250px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} Inverters`, name]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* ========================================== */}

          <div className="so-controls">
            <div className="so-search-wrap">
              <svg className="so-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className="so-search"
                placeholder="Search inverter ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="so-select"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setFilterValue("All"); }}
            >
              <option value="status">Filter by Status</option>
              <option value="block">Filter by Block</option>
            </select>

            <select
              className="so-select"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            >
              <option value="All">All</option>
              {filterType === "status" && (
                <>
                  <option value="Healthy">Healthy</option>
                  <option value="Needs Cleaning">Needs Cleaning</option>
                  <option value="Needs Repair">Needs Repair</option>
                </>
              )}
              {filterType === "block" && (
                <>
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                </>
              )}
            </select>
          </div>

          <div className="so-inv-grid">
            {filteredInverters.map((inv) => {
              const sc = getStatusConfig(inv.current_status);
              const isHovered = hoveredCard === inv._id;
              return (
                <div
                  key={inv._id}
                  className={`so-inv-card ${isHovered ? 'expanded' : ''}`}
                  style={{ borderColor: isHovered ? sc.border : 'transparent' }}
                  onMouseEnter={() => setHoveredCard(inv._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="so-card-accent" style={{ background: sc.color }} />

                  <div className="so-inv-card-header">
                    <div>
                      <h3 className="so-inv-id">{inv.inverter_id}</h3>
                      <span className="so-inv-location">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {inv.location}
                      </span>
                    </div>
                    <span className="so-inv-status-badge" style={{ color: sc.color, background: sc.bg }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dotColor, display: 'inline-block', marginRight: 5 }} />
                      {inv.current_status}
                    </span>
                  </div>

                  <div className="so-inv-updated">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {inv.last_updated ? new Date(inv.last_updated).toLocaleString() : "No update yet"}
                  </div>

                  {isHovered && (
                    <div className="so-inv-expanded">
                      <div className="so-divider" />
                      {inv.latest_prediction ? (
                        <>
                          <div className="so-risk-row">
                            <span className="so-risk-label">Risk Score</span>
                            <span className="so-risk-value" style={{ color: sc.color }}>
                              {inv.latest_prediction.risk_score.toFixed(2)}%
                            </span>
                          </div>
                          <div className="so-risk-bar-bg">
                            <div className="so-risk-bar-fill" style={{ width: `${Math.min(inv.latest_prediction.risk_score, 100)}%`, background: sc.color }} />
                          </div>

                          <div className="so-features-grid">
                            <div className="so-feature-item">
                              <span className="so-feature-label">Power</span>
                              <span className="so-feature-val">{inv.latest_prediction.top_features?.power}</span>
                            </div>
                            <div className="so-feature-item">
                              <span className="so-feature-label">Efficiency</span>
                              <span className="so-feature-val">{inv.latest_prediction.top_features?.efficiency?.toFixed(4)}</span>
                            </div>
                            <div className="so-feature-item">
                              <span className="so-feature-label">Temp Delta</span>
                              <span className="so-feature-val">{inv.latest_prediction.top_features?.temp_delta}</span>
                            </div>
                          </div>

                          <div className="so-genai-block">
                            <div className="so-genai-header">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                              GenAI Insight
                            </div>
                            <p className="so-genai-text">{inv.latest_prediction.genai_context_string}</p>
                          </div>
                        </>
                      ) : (
                        <p className="so-no-prediction">No prediction data yet. Click "Run Prediction" to generate.</p>
                      )}

                      {inv.current_status !== "Healthy" && user?.role !== "Manager" && (
                        <button className="so-raise-btn" onClick={() => handleRaiseTicket(inv)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                          Raise Ticket
                        </button>
                      )}
                    </div>
                  )}

                  {user?.role !== "Manager" && (
                    <button className="so-delete-inv-btn" onClick={() => openDeleteModal(inv)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="so-qna-section">
            <div className="so-qna-header">
              <div className="so-qna-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div>
                <h3 className="so-qna-title">GenAI Diagnostics Assistant</h3>
                <p className="so-qna-subtitle">Ask questions about your inverter data and risk scores</p>
              </div>
            </div>
            <div className="so-qna-input-row">
              <div className="so-qna-input-wrap">
                <svg className="so-qna-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <input
                  type="text"
                  placeholder="e.g. Which inverter has the highest risk score?"
                  value={qnaInput}
                  onChange={(e) => setQnaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQnaSubmit()}
                  className="so-qna-input"
                />
              </div>
              <button
                onClick={handleQnaSubmit}
                disabled={isQnaLoading || !qnaInput.trim()}
                className="so-qna-submit"
              >
                {isQnaLoading ? (
                  <>
                    <span className="so-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Submit
                  </>
                )}
              </button>
            </div>
            {qnaResponse && (
              <div className="so-qna-response">
                <div className="so-qna-response-header">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  AI Response
                </div>
                <pre className="so-qna-response-text">{qnaResponse}</pre>
              </div>
            )}
          </div>

          {showAddModal && (
            <div className="so-modal-overlay" onClick={() => setShowAddModal(false)}>
              <div className="so-modal" onClick={e => e.stopPropagation()}>
                <div className="so-modal-header">
                  <h3>Add New Inverter</h3>
                  <button className="so-modal-close" onClick={() => setShowAddModal(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <form onSubmit={handleAdd} className="so-modal-form">
                  <div className="so-modal-field">
                    <label>Inverter ID</label>
                    <input
                      placeholder="e.g. INV-001"
                      required
                      value={formData.inverter_id}
                      onChange={(e) => setFormData({ ...formData, inverter_id: e.target.value })}
                    />
                  </div>
                  <div className="so-modal-field">
                    <label>Location</label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    >
                      <option>Block A</option>
                      <option>Block B</option>
                      <option>Block C</option>
                    </select>
                  </div>
                  <div className="so-modal-field">
                    <label>Status</label>
                    <select
                      value={formData.current_status}
                      onChange={(e) => setFormData({ ...formData, current_status: e.target.value })}
                    >
                      <option>Healthy</option>
                      <option>Needs Cleaning</option>
                      <option>Needs Repair</option>
                    </select>
                  </div>
                  <div className="so-modal-actions">
                    <button type="button" className="so-modal-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="so-modal-confirm">Add Inverter</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showDeleteModal && (
            <div className="so-modal-overlay" onClick={() => setShowDeleteModal(false)}>
              <div className="so-modal" onClick={e => e.stopPropagation()}>
                <div className="so-modal-header">
                  <h3>Delete Inverter</h3>
                  <button className="so-modal-close" onClick={() => setShowDeleteModal(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div className="so-modal-body">
                  <div className="so-delete-warning">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <p className="so-delete-confirm-text">
                    Type <strong>{selectedInverter?.inverter_id}</strong> to confirm deletion
                  </p>
                  <input
                    className="so-delete-input"
                    placeholder="Type inverter ID here..."
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                  />
                </div>
                <div className="so-modal-actions">
                  <button className="so-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button className="so-modal-delete" onClick={confirmDelete}>Delete Inverter</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;