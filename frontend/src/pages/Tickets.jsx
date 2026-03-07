import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Tickets = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [viewFilter, setViewFilter] = useState("Pending");
  const [successMsg, setSuccessMsg] = useState("");

  const userRole = user?.role?.toLowerCase() || "";
  const isManager = userRole === "manager";

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/"; 
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
    fetchTickets();
  }, []);

  const handleResolve = async (ticket_id) => {
    try {
      await axios.patch("http://10.77.125.61:8000/api/resolveTicket", { ticket_id });
      setSuccessMsg("Ticket is resolved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchTickets();
    } catch (err) {
      console.error("Error resolving ticket:", err);
      alert("Failed to resolve ticket.");
    }
  };

  const handleEscalate = async (ticket_id) => {
    try {
      await axios.patch("http://10.77.125.61:8000/api/escalateTicket", { ticket_id });
      setSuccessMsg("Ticket is passed to engineer!");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchTickets();
    } catch (err) {
      console.error("Error escalating ticket:", err);
      alert("Failed to escalate ticket.");
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = viewFilter === "All" || ticket.status !== "Resolved";

    const ticketRole = ticket.assigned_role?.toLowerCase() || "";
    const matchesRole = isManager || ticketRole === userRole;

    return matchesStatus && matchesRole;
  });

  const roleFilteredTickets = isManager ? tickets : tickets.filter(t => (t.assigned_role || "").toLowerCase() === userRole);
  const pendingCount = roleFilteredTickets.filter(t => t.status !== "Resolved").length;
  const resolvedCount = roleFilteredTickets.filter(t => t.status === "Resolved").length;
  const engineerCount = isManager
    ? tickets.filter(t => t.assigned_role === "Engineer").length
    : (userRole === "engineer" ? roleFilteredTickets.length : 0);
  const totalCount = roleFilteredTickets.length;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Resolved': return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' };
      case 'Open': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' };
      case 'In Progress': return { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', dot: '#3b82f6' };
      default: return { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', dot: '#94a3b8' };
    }
  };

  const getRoleConfig = (role) => {
    switch (role) {
      case 'Engineer': return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' };
      case 'Cleaner': return { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' };
      case 'Manager': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
      default: return { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
    }
  };

  return (
    <div className="so-page">
  
      <div className="so-page-header">
        <div>
          <h1 className="so-page-title">Operations Tickets</h1>
          <p className="so-page-subtitle">Track and manage maintenance requests across your inverter fleet</p>
        </div>
        
  
        {isManager ? ("") : (<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="so-refresh-btn" onClick={fetchTickets}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
          
          <button 
            onClick={handleLogout}
            style={{ 
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", cursor: "pointer", borderRadius: "6px", 
              border: "1px solid #ef4444", background: "transparent", 
              color: "#ef4444", fontWeight: "600", transition: "0.2s",
              height: "fit-content"
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>)}
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="so-alert so-alert-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          {successMsg}
        </div>
      )}

      {/* Stats Row */}
      <div className="so-stats-row">
        <div className="so-stat-card">
          <div className="so-stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div className="so-stat-number">{pendingCount}</div>
            <div className="so-stat-label">Pending</div>
          </div>
        </div>
        <div className="so-stat-card">
          <div className="so-stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div className="so-stat-number">{resolvedCount}</div>
            <div className="so-stat-label">Resolved</div>
          </div>
        </div>
        <div className="so-stat-card">
          <div className="so-stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            <div className="so-stat-number">{engineerCount}</div>
            <div className="so-stat-label">Engineer Queue</div>
          </div>
        </div>
        <div className="so-stat-card">
          <div className="so-stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <div className="so-stat-number">{totalCount}</div>
            <div className="so-stat-label">Total Tickets</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="so-controls">
        <div className="so-filter-group">
          <span className="so-filter-label">View:</span>
          <div className="so-segmented">
            <button
              className={`so-seg-btn ${viewFilter === 'Pending' ? 'active' : ''}`}
              onClick={() => setViewFilter('Pending')}
            >
              <span className="so-seg-dot" style={{ background: '#f59e0b' }} />
              Pending
            </button>
            <button
              className={`so-seg-btn ${viewFilter === 'All' ? 'active' : ''}`}
              onClick={() => setViewFilter('All')}
            >All Tickets</button>
          </div>
        </div>
        <div className="so-result-count">
          Showing <strong>{filteredTickets.length}</strong> ticket{filteredTickets.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <div className="so-empty">
          <div className="so-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <h3>No tickets found</h3>
          <p>There are no tickets matching your current filter and role.</p>
        </div>
      ) : (
        <div className="so-tickets-grid">
          {filteredTickets.map((ticket) => {
            const statusConfig = getStatusConfig(ticket.status);
            const roleConfig = getRoleConfig(ticket.assigned_role);
            return (
              <div key={ticket._id} className="so-ticket-card">
                <div className="so-ticket-header">
                  <div className="so-ticket-id">
                    <span className="so-ticket-id-text">{ticket.ticket_id}</span>
                    <span className="so-ticket-inv">{ticket.inverter_id}</span>
                  </div>
                  <span className="so-status-badge" style={{ color: statusConfig.color, background: statusConfig.bg }}>
                    <span className="so-status-dot" style={{ background: statusConfig.dot }} />
                    {ticket.status}
                  </span>
                </div>

                <div className="so-ticket-body">
                  <div className="so-ticket-row">
                    <span className="so-ticket-meta-label">Assigned To</span>
                    <span className="so-role-badge" style={{ color: roleConfig.color, background: roleConfig.bg }}>
                      {ticket.assigned_role}
                    </span>
                  </div>
                  <div className="so-ticket-row">
                    <span className="so-ticket-meta-label">Created</span>
                    <span className="so-ticket-meta-value">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div className="so-ticket-summary">
                    <span className="so-ticket-meta-label">Summary</span>
                    <p className="so-ticket-summary-text">{ticket.issue_summary}</p>
                  </div>
                </div>

                {/* HIDE ACTION BUTTONS IF USER IS MANAGER */}
                {!isManager && ticket.status !== "Resolved" && (
                  <div className="so-ticket-actions">
                    <button
                      className="so-btn-resolve"
                      onClick={() => handleResolve(ticket.ticket_id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Resolve Issue
                    </button>
                    {ticket.assigned_role !== "Engineer" && (
                      <button
                        className="so-btn-escalate"
                        onClick={() => handleEscalate(ticket.ticket_id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                        Raise to Engineer
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tickets;