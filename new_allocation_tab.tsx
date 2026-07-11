        {activeTab === "allocation" && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-800">Room & Vehicle Allocation</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage room sharing groups and vehicle seat allotments with manual shuffling</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleTriggerAutoAllocate} className="h-8.5 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] shadow-sm flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Run Auto-Allocation
                </Button>
              </div>
            </div>

            {/* Step 2: Vehicle Fleet Input */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4 text-[#F97316]" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Step 2: Vehicle Fleet Input
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Add available tempos/cars for this departure</span>
              </div>

              <form onSubmit={handleAddVehicle} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Vehicle Type</label>
                  <select
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value)}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  >
                    <option value="13 Seater Tempo">13 Seater Tempo</option>
                    <option value="17 Seater Tempo">17 Seater Tempo</option>
                    <option value="6 Seater Car">6 Seater Car</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Name (e.g. Tempo 1)</label>
                  <input
                    type="text"
                    required
                    placeholder="Tempo 1"
                    value={newVehicleName}
                    onChange={(e) => setNewVehicleName(e.target.value)}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Cost (Rs)</label>
                  <input
                    type="number"
                    required
                    placeholder="45000"
                    value={newVehicleCost}
                    onChange={(e) => setNewVehicleCost(e.target.value)}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Vendor</label>
                  <input
                    type="text"
                    placeholder="ABC Travels"
                    value={newVehicleVendor}
                    onChange={(e) => setNewVehicleVendor(e.target.value)}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <Button type="submit" className="h-8 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded">
                  + Add Vehicle
                </Button>
              </form>

              {/* Active Fleet List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {allocFleet.map((v) => (
                  <div key={v.id} className="border border-slate-100 rounded-lg p-2.5 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-800">{v.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{v.vehicleType} ({v.capacity} Seats)</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Rs.{v.cost.toLocaleString('en-IN')} - {v.vendor}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteVehicle(v.id)} className="h-7 w-7 text-rose-500 hover:bg-rose-50 rounded">
                      <Trash className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Auto-Allocation Rules Config */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sliders className="w-4 h-4 text-[#F97316]" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Step 3: Auto-Allocation Engine Rules
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                {/* Rule 1: Room Sharing Choice */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Room Sharing Basis</label>
                  <select
                    value={sharingPref}
                    onChange={(e) => setSharingPref(e.target.value)}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2.5 text-xs font-bold text-slate-700 bg-white cursor-pointer outline-none hover:bg-slate-50"
                  >
                    <option value="2">2-Sharing (Double)</option>
                    <option value="3">3-Sharing (Triple)</option>
                    <option value="4">4-Sharing (Quad)</option>
                  </select>
                </div>

                {/* Rule 2: Gender Segregation */}
                <div className="flex items-center gap-2 pt-4 sm:pt-0">
                  <input
                    type="checkbox"
                    id="rule-same-gender"
                    checked={sameGenderEnforced}
                    onChange={(e) => setSameGenderEnforced(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-200 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                  />
                  <label htmlFor="rule-same-gender" className="text-[11px] font-bold text-slate-650 cursor-pointer select-none">
                    Enforce same-gender rooms (Male/Male, Female/Female)
                  </label>
                </div>

                {/* Rule 3: Prioritize couples */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <input
                    type="checkbox"
                    id="rule-prioritize-couples"
                    checked={prioritizeCouples}
                    onChange={(e) => setPrioritizeCouples(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-200 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                  />
                  <label htmlFor="rule-prioritize-couples" className="text-[11px] font-bold text-slate-650 cursor-pointer select-none">
                    Prioritize couples for 2-sharing rooms
                  </label>
                </div>

                {/* Rule 4: Fallback to Quad */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <input
                    type="checkbox"
                    id="rule-fallback-quad"
                    checked={fallbackToQuad}
                    onChange={(e) => setFallbackToQuad(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-200 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                  />
                  <label htmlFor="rule-fallback-quad" className="text-[11px] font-bold text-slate-650 cursor-pointer select-none">
                    Fallback leftover travelers into 4-sharing
                  </label>
                </div>
              </div>
            </div>

            {/* FLAGS & WARNINGS Box */}
            <div className="bg-red-50 border border-red-150 rounded-[6px] p-4 shadow-3xs space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h4 className="text-xs font-black text-red-800 uppercase tracking-wider">
                  FLAGS ({allPassengers.filter(p => !passengerAllocations[p.name]?.room || passengerAllocations[p.name]?.room === "—").length > 0 ? "Issues" : "0 Issues"} Need Manual Review)
                </h4>
              </div>
              <ul className="text-[11px] text-red-750 font-bold space-y-1.5 pl-6 list-disc">
                {allPassengers.filter(p => !passengerAllocations[p.name]?.room || passengerAllocations[p.name]?.room === "—").map(p => (
                  <li key={p.name}>{p.name} unallocated to group room/tempo - assign manually below</li>
                ))}
                {allPassengers.filter(p => !passengerAllocations[p.name]?.room || passengerAllocations[p.name]?.room === "—").length === 0 && (
                  <p className="text-slate-500 font-semibold list-none -ml-6">All passengers successfully matched. No flags active.</p>
                )}
              </ul>
            </div>

            {/* WhatsApp Generated Lists Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-[6px] p-4 flex items-center justify-between text-white shadow-sm">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider">Step 5: Output - Auto-Generated WhatsApp Lists</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ready to copy and paste directly into WhatsApp departure groups.</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCopyTempoList} className="h-8.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase flex items-center gap-1.5 rounded border border-slate-700">
                  <Copy className="w-3.5 h-3.5" /> Copy Tempo List
                </Button>
                <Button size="sm" onClick={handleCopyRoomList} className="h-8.5 bg-[#F97316] hover:bg-[#E05E00] text-white font-bold text-xs uppercase flex items-center gap-1.5 rounded">
                  <Copy className="w-3.5 h-3.5" /> Copy Room List
                </Button>
              </div>
            </div>

            {/* Assignments Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hotel Group Assignments */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  Hotel Group Assignments
                </h3>
                {computedRoomAllocations.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-4 text-center">No group assignments. Use the shuffler below or Auto-Allocate.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(
                      computedRoomAllocations.reduce((acc: Record<string, any>, r) => {
                        if (!acc[r.roomNumber]) acc[r.roomNumber] = { type: r.roomType, gender: r.genderGroup, members: [] };
                        acc[r.roomNumber].members.push(r.travelerName);
                        return acc;
                      }, {})
                    ).map(([roomNum, rData]: any) => (
                      <div key={roomNum} className="border border-slate-100 rounded-lg p-3 bg-slate-50 hover:border-emerald-250 transition-colors">
                        <p className="text-[10px] font-extrabold text-slate-800 flex items-center justify-between">
                          <span>{roomNum}</span>
                          <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-black uppercase border",
                            rData.gender === 'BOYS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            rData.gender === 'GIRLS' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                            rData.gender === 'COUPLE' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          )}>{rData.gender}</span>
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {rData.members.map((m: string, i: number) => (
                            <li key={i} className="text-[11px] font-bold text-slate-655 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full shrink-0" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transport Vehicle Assignments */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  Transport Assignments
                </h3>
                {computedVehicleAllocations.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-4 text-center">No transport assignments. Use the shuffler below or Auto-Allocate.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(
                      computedVehicleAllocations.reduce((acc: Record<string, any>, v) => {
                        if (!acc[v.fleetId]) acc[v.fleetId] = [];
                        acc[v.fleetId].push(v);
                        return acc;
                      }, {})
                    ).map(([fleetId, travelers]: any) => {
                      const fleetItem = allocFleet.find(f => f.id === fleetId);
                      return (
                        <div key={fleetId} className="border border-slate-100 rounded-lg p-3 bg-slate-50 hover:border-blue-250 transition-colors">
                          <p className="text-[10px] font-extrabold text-slate-800 flex items-center justify-between">
                            <span>{fleetItem?.name || "Tempo Traveller"} ({fleetItem?.vehicleType})</span>
                            <span className="text-[9px] font-black text-slate-450 uppercase font-mono">{travelers.length} / {fleetItem?.capacity || 17} Seats Filled</span>
                          </p>
                          <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
                            {travelers.map((t: any, i: number) => (
                              <p key={i} className="text-[11px] font-bold text-slate-650 truncate flex items-center gap-2">
                                <span className="text-[9px] font-black font-mono text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded shrink-0">#{t.seatNumber || i + 1}</span>
                                {t.travelerName}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Travelers Allocation Shuffler Panel */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Travelers Manual Allocation Shuffler
                </h3>
                <p className="text-[10px] text-slate-455 font-semibold mt-0.5 font-sans">Assign room sharing groups and vehicle seats directly. Shuffling updates both previews instantly.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                    <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">
                      <th className="p-2.5 border-r border-slate-100">Traveler Name</th>
                      <th className="p-2.5 border-r border-slate-100">Gender / Age</th>
                      <th className="p-2.5 border-r border-slate-100">Room Assignment</th>
                      <th className="p-2.5 border-r border-slate-100">Vehicle Assignment</th>
                      <th className="p-2.5 text-center">Seat Number</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {allPassengers.map((p) => {
                      const current = passengerAllocations[p.name] || { room: "—", vehicle: "—", seat: "—" };
                      return (
                        <tr key={p.name} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-2.5 border-r border-slate-100 font-bold text-slate-800">
                            {p.name}
                          </td>
                          <td className="p-2.5 border-r border-slate-100 font-medium text-slate-600">
                            {p.gender} / {p.age} Yrs
                          </td>
                          <td className="p-2.5 border-r border-slate-100">
                            <select
                              value={current.room}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPassengerAllocations(prev => ({
                                  ...prev,
                                  [p.name]: { ...current, room: val }
                                }));
                                toast.success(`Moved ${p.name} to ${val}`);
                              }}
                              className="h-7 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 w-full cursor-pointer"
                            >
                              <option value="—">Unassigned</option>
                              <option value="Group No. 1">Group No. 1</option>
                              <option value="Group No. 2">Group No. 2</option>
                              <option value="Group No. 3">Group No. 3</option>
                              <option value="Group No. 4">Group No. 4</option>
                              <option value="Group No. 5">Group No. 5</option>
                            </select>
                          </td>
                          <td className="p-2.5 border-r border-slate-100">
                            <select
                              value={current.vehicle}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPassengerAllocations(prev => ({
                                  ...prev,
                                  [p.name]: { ...current, vehicle: val }
                                }));
                                toast.success(`Assigned ${p.name} to ${val}`);
                              }}
                              className="h-7 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 w-full cursor-pointer"
                            >
                              <option value="—">Unassigned</option>
                              {allocFleet.map(f => (
                                <option key={f.id} value={f.name}>{f.name} ({f.vehicleType})</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5">
                            <select
                              value={current.seat}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPassengerAllocations(prev => ({
                                  ...prev,
                                  [p.name]: { ...current, seat: val }
                                }));
                                toast.success(`Assigned ${p.name} to Seat #${val}`);
                              }}
                              className="h-7 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 w-24 mx-auto block cursor-pointer"
                            >
                              <option value="—">Unassigned</option>
                              {[...Array(17)].map((_, i) => (
                                <option key={i + 1} value={String(i + 1)}>Seat #{i + 1}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}