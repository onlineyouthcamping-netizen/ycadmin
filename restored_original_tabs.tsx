        {/* ──────────────────────── GUIDES ──────────────────────── */}
        {activeTab === "guides" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-800">Guides</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage and track guides assigned to this departure</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toast.info("View Timeline")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" /> View as Timeline
                </button>
                <button onClick={() => toast.info("Download")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">
                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {[
                { v: "1", l: "Lead Guide", sub: "Assigned", bg: "bg-blue-50/50" },
                { v: "3", l: "Support Guides", sub: "Assigned", bg: "bg-emerald-50/50" },
                { v: "1", l: "Trip Captain", sub: "Assigned", bg: "bg-purple-50/50" },
                { v: "1", l: "Drivers", sub: "Assigned", bg: "bg-amber-50/50" },
                { v: "100%", l: "Coverage", sub: "All roles assigned", bg: "bg-cyan-50/50" },
              ].map(k => (
                <div key={k.l} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs">
                  <p className="text-2xl font-black text-slate-800">{k.v}</p>
                  <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-0.5">{k.l}</p>
                  <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
              {[
                { label: "All Guides", count: 6 },
                { label: "Lead Guide", count: 1 },
                { label: "Support Guides", count: 3 },
                { label: "Drivers", count: 1 },
                { label: "Trip Captain", count: 1 }
              ].map((t, idx) => (
                <button key={t.label} className={cn("px-3 py-1.5 text-[11px] font-bold rounded-[4px] flex items-center gap-1.5 transition-colors",
                  idx === 0 ? "bg-[#F97316]/10 text-[#F97316] font-extrabold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}>
                  {t.label}
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded-full",
                    idx === 0 ? "bg-[#F97316]/20 text-[#F97316]" : "bg-slate-100 text-slate-500"
                  )}>{t.count}</span>
                </button>
              ))}
            </div>

            {/* Filter selectors row */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Roles</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Status</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Assignments</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Experience</option>
              </select>
              <div className="relative flex-1 max-w-xs min-w-[150px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                <input type="text" placeholder="Search guide by name or phone..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
              </div>
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 bg-white hover:bg-slate-50 text-slate-750 flex items-center gap-1.5 ml-auto shadow-3xs">
                <Sliders className="w-3.5 h-3.5 text-slate-450" /> More Filters
              </button>
            </div>

            {/* Guides Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">
                    <th className="p-3 border-r border-slate-100 w-8 text-center"></th>
                    <th className="p-3 border-r border-slate-100">GUIDE</th>
                    <th className="p-3 border-r border-slate-100">ROLE</th>
                    <th className="p-3 border-r border-slate-100">ASSIGNMENT</th>
                    <th className="p-3 border-r border-slate-100">PHONE</th>
                    <th className="p-3 border-r border-slate-100">EXPERIENCE</th>
                    <th className="p-3 border-r border-slate-100">STATUS</th>
                    <th className="p-3 border-r border-slate-100">DOCUMENTS</th>
                    <th className="p-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {computedGuides.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center border-r border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] uppercase">
                          {row.name.split(" ").map(n => n[0]).join("")}
                        </div>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{row.name}</span>
                          {row.lead && <span className="text-[7.5px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.2 rounded-full uppercase tracking-wider">LEAD</span>}
                        </div>
                      </td>
                      <td className="p-3 border-r border-slate-100 text-slate-600 font-semibold">{row.role}</td>
                      <td className="p-3 border-r border-slate-100">
                        <p className="font-bold text-slate-800">{row.assign}</p>
                        <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{row.date}</p>
                      </td>
                      <td className="p-3 border-r border-slate-100 font-mono text-slate-500">{row.phone}</td>
                      <td className="p-3 border-r border-slate-100">
                        <p className="font-bold text-slate-800">{row.exp}</p>
                        <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{row.trips}</p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider block w-fit">CONFIRMED</span>
                        <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{row.sub}</p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <div className="flex items-center gap-2 text-[9px] font-bold">
                          {Object.entries(row.docs).map(([k, has]) => (
                            <span key={k} className={cn("inline-flex items-center gap-1 uppercase select-none",
                              has ? "text-emerald-650" : "text-amber-600"
                            )}>
                              {has ? "✓" : "!"} {k}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <select className="h-7 text-[10px] font-bold border border-slate-200 rounded-[4px] px-1.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                            <option>View</option>
                          </select>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom summary bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-3 flex items-center justify-between text-xs font-semibold">
              <span>Showing 1 to 6 of 6 guides</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Show</span>
                <select className="h-7 text-[10px] font-bold border border-slate-200 bg-white rounded px-1 cursor-pointer">
                  <option>10</option>
                </select>
                <span className="text-slate-400">per page</span>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── ACTIVITIES ──────────────────────── */}
        {activeTab === "activities" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-800">Activities</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage day wise activities and inclusions for this departure</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toast.info("View Timeline")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" /> View as Timeline
                </button>
                <button onClick={() => toast.info("Download")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">
                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                </button>
              </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {[
                { label: "Total Activities", value: computedActivities.length, desc: "Across departure days", bg: "bg-blue-50/50" },
                { label: "Confirmed", value: computedActivities.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length, desc: `${((computedActivities.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length / (computedActivities.length || 1))*100).toFixed(1)}%`, bg: "bg-emerald-50/50" },
                { label: "Pending", value: computedActivities.filter(a => a.status === 'PENDING').length, desc: "Action required", bg: "bg-amber-50/50" },
                { label: "Cancelled", value: computedActivities.filter(a => a.status === 'CANCELLED').length, desc: "Inactive", bg: "bg-red-50/50" },
                { label: "Optional Activities", value: computedActivities.filter(a => a.isOptional).length, desc: "Exclusions", bg: "bg-purple-50/50" }
              ].map(kpi => (
                <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs">
                  <p className="text-2xl font-black text-slate-800">{kpi.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{kpi.label}</p>
                  <p className="text-[9.5px] text-slate-400 mt-1">{kpi.desc}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Days</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Activity Type</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Status</option>
              </select>
              <div className="relative flex-1 max-w-xs min-w-[150px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                <input type="text" placeholder="Search activity..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
              </div>
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 bg-white hover:bg-slate-50 text-slate-750 flex items-center gap-1.5 ml-auto shadow-3xs">
                <Sliders className="w-3.5 h-3.5 text-slate-450" /> More Filters
              </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">
                    <th className="p-3 border-r border-slate-100">DAY</th>
                    <th className="p-3 border-r border-slate-100">ACTIVITY</th>
                    <th className="p-3 border-r border-slate-100 w-28">TYPE</th>
                    <th className="p-3 border-r border-slate-100">INCLUDED</th>
                    <th className="p-3 border-r border-slate-100">TIME</th>
                    <th className="p-3 border-r border-slate-100">LOCATION</th>
                    <th className="p-3 border-r border-slate-100">STATUS</th>
                    <th className="p-3 text-center w-24">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {computedActivities.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 border-r border-slate-100">
                        <p className="font-bold text-slate-800">{a.day}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{a.wd}</p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <p className="font-bold text-slate-800">{a.act}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{a.sub}</p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <span className={cn("text-[8.5px] font-black px-2 py-0.5 rounded-[3px] border uppercase tracking-wider block w-fit",
                          a.type === "TRAVEL" ? "bg-blue-50 text-blue-600 border-blue-100" :
                          a.type === "SIGHTSEEING" ? "bg-purple-50 text-purple-600 border-purple-100" :
                          "bg-amber-50 text-amber-600 border-amber-100"
                        )}>{a.type}</span>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        {a.inc ? (
                          <span className="flex items-center gap-1.5 text-[10.5px] text-emerald-650 font-bold">✓ Included</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-semibold">✗ Not Included</span>
                        )}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-slate-600 font-semibold">{a.time}</td>
                      <td className="p-3 border-r border-slate-100 text-slate-650 font-medium">{a.loc}</td>
                      <td className="p-3 border-r border-slate-100">
                        <span className={cn("text-[8.5px] font-black px-1.5 py-0.5 rounded-[3px] border uppercase tracking-wider block w-fit", a.statusClass)}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <select className="h-7 text-[10px] font-bold border border-slate-200 rounded-[4px] px-1.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                            <option>View</option>
                          </select>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom summary bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-3 flex items-center justify-between text-xs font-semibold">
              <span>Showing 1 to 10 of 18 activities</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Show</span>
                <select className="h-7 text-[10px] font-bold border border-slate-200 bg-white rounded px-1 cursor-pointer">
                  <option>10</option>
                </select>
                <span className="text-slate-400">per page</span>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── PAYMENTS ──────────────────────── */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-800">Payments</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Track all customer payments for this departure</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>toast.info("Payment summary")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-slate-400" /> Payment Summary</button>
                <button onClick={() => handleDownloadCSV(computedPayments, "payments_log.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>
              </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label:"Total Received",     value:`₹${paymentKpis.received.toLocaleString("en-IN")}`, sub:`${((paymentKpis.received/paymentKpis.total)*100).toFixed(1)}% of total`, icon:<TrendingUp className="w-5 h-5" />, bg:"bg-emerald-50", color:"text-emerald-600" },
                { label:"Pending Collection", value:`₹${paymentKpis.pending.toLocaleString("en-IN")}`,  sub:`${((paymentKpis.pending/paymentKpis.total)*100).toFixed(1)}% of total`, icon:<Clock className="w-5 h-5" />,       bg:"bg-blue-50",    color:"text-blue-600" },
                { label:"Overdue",            value:`₹${paymentKpis.overdue.toLocaleString("en-IN")}`,  sub:"2 Bookings",                                                              icon:<AlertTriangle className="w-5 h-5" />,bg:"bg-amber-50",   color:"text-amber-600" },
                { label:"Total Refunds",      value:`₹${paymentKpis.refunds.toLocaleString("en-IN")}`,  sub:`${((paymentKpis.refunds/paymentKpis.total)*100).toFixed(1)}% of total`, icon:<RefreshCw className="w-5 h-5" />,    bg:"bg-purple-50",  color:"text-purple-600" },
                { label:"Paid Bookings",      value:`${paymentKpis.paidCount}/${paymentKpis.totalCount}`,sub:"95.0% of bookings",                                                    icon:<Users className="w-5 h-5" />,         bg:"bg-slate-100",  color:"text-slate-700" },
              ].map(kpi=>(
                <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>{kpi.icon}</div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                    <p className={cn("text-lg font-black mt-0.5", kpi.color)}>{kpi.value}</p>
                    <p className="text-[10px] text-slate-400">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm p-3 flex flex-wrap gap-2">
              {[["All","All Status"],["PAID","Paid"],["PARTIALLY PAID","Partially Paid"],["UNPAID","Unpaid"],["REFUNDED","Refunded"]].map(([v,l])=>(
                <button key={v} onClick={()=>setPayStatusFilter(v)}
                  className={cn("h-8 text-[11px] font-bold rounded-[4px] px-3 border transition-colors", payStatusFilter===v?"bg-[#F97316] text-white border-[#F97316]":"bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}>
                  {l}
                </button>
              ))}
              <div className="relative ml-auto min-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Search by name, booking ID..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 outline-none" />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3 w-10"><input type="checkbox" className="rounded-[2px] border-slate-300" /></th>
                    {["BOOKING ID","PASSENGER","PAYMENT PLAN","AMOUNT (₹)","PAID (₹)","PENDING (₹)","PAYMENT MODE","STATUS","LAST PAYMENT","ACTION"].map(h=>(
                      <th key={h} className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredPayments.map(p=>(
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3"><input type="checkbox" className="rounded-[2px] border-slate-300" /></td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-700 text-[10px]">{p.id}</div>
                        <StatusBadge status={p.bookingStatus} />
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{p.passenger}</div>
                        <div className="text-[10px] text-slate-400">{p.pax} Pax · +91 {p.phone}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-700">{p.plan}</div>
                        <div className="text-[10px] text-slate-400">₹ {(p.amount/p.pax).toLocaleString("en-IN")} / Pax</div>
                      </td>
                      <td className="p-3 font-black text-slate-800">₹ {p.amount.toLocaleString("en-IN")}</td>
                      <td className="p-3 font-black text-emerald-600">₹ {p.paid.toLocaleString("en-IN")}<div className="text-[9px] font-bold text-slate-400">{p.amount>0?Math.round((p.paid/p.amount)*100):0}%</div></td>
                      <td className={cn("p-3 font-black", p.pending>0?"text-red-600":"text-slate-400")}>₹ {p.pending.toLocaleString("en-IN")}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-700">{p.mode}</div>
                        <div className="text-[10px] text-slate-400">{p.modeDetail}</div>
                      </td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{p.lastPayment}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleOpenBookingDetails(p.id)} className="text-[10px] font-bold text-slate-600 border border-slate-200 rounded-[3px] px-2 py-0.5 hover:bg-slate-50">View</button>
                          {p.status==="UNPAID"&&<button className="text-[10px] font-bold text-[#F97316] border border-[#F97316]/30 rounded-[3px] px-2 py-0.5 hover:bg-orange-50">Remind</button>}
                          <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-[#E2E8F0]">
                  <tr>
                    <td colSpan={4} className="p-3 text-[11px] font-bold text-slate-600">Showing 1 to {filteredPayments.length} of {MOCK_PAYMENTS.length} bookings</td>
                    <td className="p-3 font-black text-slate-800 text-[11px]">₹ {filteredPayments.reduce((s,p)=>s+p.amount,0).toLocaleString("en-IN")}</td>
                    <td className="p-3 font-black text-emerald-600 text-[11px]">₹ {filteredPayments.reduce((s,p)=>s+p.paid,0).toLocaleString("en-IN")}</td>
                    <td className="p-3 font-black text-red-600 text-[11px]">₹ {filteredPayments.reduce((s,p)=>s+p.pending,0).toLocaleString("en-IN")}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ──────────────────────── TASKS ──────────────────────── */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-800">Tasks</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage and track all tasks for this departure</p>
              </div>
              <div className="flex gap-2">
                <button className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-slate-400" /> View as Kanban</button>
                <button onClick={() => handleDownloadCSV(computedTasks, "checklist_tasks.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>
              </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label:"Total Tasks",  value:taskKpis.total,     sub:"Across all categories", icon:<ClipboardList className="w-5 h-5" />, bg:"bg-blue-50",    color:"text-blue-600" },
                { label:"Completed",    value:taskKpis.completed,  sub:`${Math.round((taskKpis.completed/taskKpis.total)*100)}% of total`,  icon:<CheckCircle2 className="w-5 h-5" />, bg:"bg-emerald-50",color:"text-emerald-600" },
                { label:"In Progress",  value:taskKpis.inProgress, sub:"25% of total",          icon:<Clock className="w-5 h-5" />,           bg:"bg-amber-50",   color:"text-amber-600" },
                { label:"Pending",      value:taskKpis.pending,    sub:"8.33% of total",         icon:<PauseCircle className="w-5 h-5" />,     bg:"bg-slate-100",  color:"text-slate-600" },
                { label:"Overdue",      value:taskKpis.overdue,    sub:"8.33% of total",         icon:<AlertTriangle className="w-5 h-5" />,   bg:"bg-red-50",     color:"text-red-600" },
              ].map(kpi=>(
                <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>{kpi.icon}</div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                    <p className={cn("text-2xl font-black", kpi.color)}>{kpi.value}</p>
                    <p className="text-[10px] text-slate-400">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm p-3 flex flex-wrap gap-2">
              {[
                {value:taskStatusFilter,   setter:setTaskStatusFilter,   opts:["All","IN PROGRESS","COMPLETED","PENDING","OVERDUE","NOT STARTED"].map(v=>[v,v==="All"?"All Status":v])},
                {value:taskCategoryFilter, setter:setTaskCategoryFilter, opts:[["All","All Categories"],["PAYMENTS","Payments"],["DOCUMENTS","Documents"],["HOTELS","Hotels"],["TRANSPORT","Transport"],["GUIDES","Guides"],["OPERATIONS","Operations"],["COMMUNICATION","Communication"]]},
              ].map((f,i)=>(
                <select key={i} value={f.value} onChange={e=>f.setter(e.target.value)}
                  className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">
                  {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Search task..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 outline-none" />
              </div>
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 ml-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> More Filters
              </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3 w-10"><input type="checkbox" className="rounded-[2px] border-slate-300" /></th>
                    {["TASK","CATEGORY","ASSIGNED TO","ASSIGNED BY","PRIORITY","DUE DATE","STATUS","CREATED ON","ACTION"].map(h=>(
                      <th key={h} className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredTasks.map(t=>(
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="rounded-[2px] border-slate-300 cursor-pointer"
                          checked={t.status === "COMPLETED"}
                          onChange={() => t.rawTask && handleToggleTask(t.rawTask)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{t.task}</div>
                        <div className="text-[10px] text-slate-400">{t.sub}</div>
                      </td>
                      <td className="p-3"><TypeBadge type={t.category} /></td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Avatar initials={t.assignee.split(" ").map((n:string)=>n[0]).join("")} className="bg-slate-700 w-6 h-6 text-[8px]" />
                          <div>
                            <div className="font-bold text-slate-800">{t.assignee}</div>
                            <div className="text-[10px] text-slate-400">{t.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-700">{t.dueDate}</div>
                        <div className={cn("text-[10px] font-bold", t.status==="OVERDUE"?"text-red-500":"text-amber-600")}>{t.dueNote}</div>
                      </td>
                      <td className="p-3"><StatusBadge status={t.status} /></td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{t.createdOn}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button className="text-[10px] font-bold text-slate-600 border border-slate-200 rounded-[3px] px-2 py-0.5 hover:bg-slate-50">View</button>
                          <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-[#E2E8F0] text-[11px] text-slate-500">
                Showing 1 to {filteredTasks.length} of {MOCK_TASKS.length} tasks
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── DOCUMENTS ──────────────────────── */}