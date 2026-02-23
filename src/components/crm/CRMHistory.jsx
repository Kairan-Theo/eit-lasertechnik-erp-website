import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, RefreshCw, Calendar, Search, Paperclip, Trash2, Info } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const CRMHistory = () => {
  const [activeSubTab, setActiveSubTab] = useState('emails'); // 'emails' or 'movements'
  const [emailLogs, setEmailLogs] = useState([]);
  const [dealHistory, setDealHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeSubTab === 'emails' 
        ? `${API_BASE_URL}/api/email_logs/` 
        : `${API_BASE_URL}/api/deal_history/`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (activeSubTab === 'emails') {
          setEmailLogs(data);
        } else {
          setDealHistory(data);
        }
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    try {
      const endpoint = type === 'email' 
        ? `${API_BASE_URL}/api/email_logs/${id}/` 
        : `${API_BASE_URL}/api/deal_history/${id}/`;
        
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (type === 'email') {
          setEmailLogs(prev => prev.filter(item => item.id !== id));
        } else {
          setDealHistory(prev => prev.filter(item => item.id !== id));
        }
      } else {
        console.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const filteredEmails = emailLogs.filter(log => 
    (log.recipient && log.recipient.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.subject && log.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredHistory = dealHistory.filter(h => 
    (h.deal_title && h.deal_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (h.from_stage && h.from_stage.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (h.to_stage && h.to_stage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('emails')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSubTab === 'emails'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Sent Emails
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab('movements')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSubTab === 'movements'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Pipeline Movements
            </div>
          </button>
        </div>

        {activeSubTab === 'emails' && (
          <div className="flex items-center gap-4">
            {/* Comment: Creative email counter pill showing how many sent emails match the current filter */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 via-sky-50 to-emerald-50 border border-blue-100 shadow-sm">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Emails
              </span>
              <span className="text-xs font-bold text-blue-700">
                {filteredEmails.length}
              </span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : activeSubTab === 'emails' ? (
          /* 
             Display Sent Emails as a list of detailed cards.
             Each card shows the Subject, Recipient, Date, and the Body content in a structured box.
          */
          <div className="flex flex-col gap-4 p-4 bg-slate-50/50">
            {filteredEmails.map((log) => (
              <div 
                key={log.id} 
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 transition-all hover:shadow-md"
              >
                {/* Header: Subject, Recipient and Date */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div className="flex-1">
                     <h3 className="text-base font-semibold text-slate-900">{log.subject}</h3>
                     <p className="text-sm text-slate-500 mt-1">
                       <span className="font-medium text-slate-700">To:</span> {log.recipient}
                     </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium whitespace-nowrap bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(log.sent_at).toLocaleString()}
                    </div>
                    <button 
                      onClick={() => handleDelete(log.id, 'email')}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Email Log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Content: Displayed in a distinct box with whitespace preservation */}
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 leading-relaxed whitespace-pre-wrap border border-slate-100 font-mono">
                   {/* 
                      Comment: Render the saved email body as HTML when it contains tags
                      so that Gmail-style <div> and <br> structures are preserved exactly.
                      For plain-text bodies, convert newline characters into <br /> tags.
                   */}
                   {(() => {
                     if (!log.body) return null;
                     const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(log.body);
                     let html;
                     if (hasHtmlTags) {
                       // Comment: Body already HTML (from our editor or email client) — use as-is
                       html = log.body;
                     } else {
                       // Comment: Plain text body — keep original line breaks by turning \n into <br />
                       const normalized = log.body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                       html = normalized
                         .split('\n')
                         .map(line => (line === "" ? "&nbsp;" : line))
                         .join("<br />");
                     }
                     return <span dangerouslySetInnerHTML={{ __html: html }} />;
                   })()}
                </div>

                {/* Attachments Section: Display any files attached to the email */}
                {log.attachments && log.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {log.attachments.map((att) => (
                      <a 
                        key={att.id} 
                        href={att.file} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-200 shadow-sm hover:shadow group"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <span className="truncate max-w-[200px]">{att.filename.split('/').pop()}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Empty State for Emails */}
            {filteredEmails.length === 0 && (
               <div className="p-12 text-center text-slate-500 bg-white rounded-xl border-2 border-slate-100 border-dashed">
                <div className="flex justify-center mb-3">
                  <Mail className="w-8 h-8 text-slate-300" />
                </div>
                <p>No email logs found</p>
              </div>
            )}
          </div>
        ) : (
          /* 
             Display Deal History as a list of notification-style cards instead of a table.
             Each card represents a movement of a deal from one stage to another.
          */
          <div className="flex flex-col gap-3 p-4 bg-slate-50/50">
            {filteredHistory.map((history) => (
              <div 
                key={history.id} 
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md group"
              >
                {/* Visual Indicator: Blue Info Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1">
                  {/* 
                      Main Content: 
                      Line 1: CRM Movement: "company name":"deal name" was moved:
                      Line 2: from "sales pipeline" to "sales pipeline"
                  */}
                  <p className="text-slate-900 font-medium text-sm">
                    CRM Movement: "{history.company_name || 'Unknown Company'}":"{history.deal_title || `Deal #${history.deal}`}" was moved:
                  </p>
                  
                  <p className="text-slate-500 text-xs mt-1">
                    from "{history.from_stage}" to "{history.to_stage}"
                  </p>
                  
                  {/* Timestamp */}
                  <p className="text-slate-400 text-[10px] mt-1 font-medium">
                    {new Date(history.changed_at).toLocaleString()}
                  </p>
                </div>

                <button 
                  onClick={() => handleDelete(history.id, 'history')}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete History Log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {/* Empty State: Shown when no history records match the filter */}
            {filteredHistory.length === 0 && (
              <div className="p-12 text-center text-slate-500 bg-white rounded-xl border-2 border-slate-100 border-dashed">
                <div className="flex justify-center mb-3">
                  <RefreshCw className="w-8 h-8 text-slate-300" />
                </div>
                <p>No history found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CRMHistory;
