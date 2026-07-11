const [passengerAllocations, setPassengerAllocations] = useState<Record<string, { room: string, vehicle: string, seat: string }>>({});
<
8  const [allocFleet, setAllocFleet] = useState<any[]>([H
D    { id: "tempo-1", vehicleType: "17 Seater Tempo", capacity: 17 }

  ]);~
z    { id: "tempo-1", name: "Tempo 1", vehicleType: "13 Seater Tempo", capacity: 13, cost: 45000, vendor: "ABC Travels" },~
z    { id: "tempo-2", name: "Tempo 2", vehicleType: "17 Seater Tempo", capacity: 17, cost: 58000, vendor: "XYZ Travels" },v
r    { id: "car-1", name: "Car 1", vehicleType: "6 Seater Car", capacity: 6, cost: 22000, vendor: "Self-driven" },

  ]);
O
K  const [newVehicleType, setNewVehicleType] = useState("17 Seater Tempo");@
<  const [newVehicleName, setNewVehicleName] = useState("");@
<  const [newVehicleCost, setNewVehicleCost] = useState("");D
@  const [newVehicleVendor, setNewVehicleVendor] = useState("");
9
5  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();a
]    const cap = newVehicleType.includes("17") ? 17 : newVehicleType.includes("13") ? 13 : 6;
    const newV = {'
#      id: `vehicle-${Date.now()}`,D
@      name: newVehicleName || `Tempo ${allocFleet.length + 1}`,'
#      vehicleType: newVehicleType,
      capacity: cap,3
/      cost: parseInt(newVehicleCost) || 35000,7
3      vendor: newVehicleVendor || "General Vendor"
    };.
*    setAllocFleet([...allocFleet, newV]);
    setNewVehicleName("");
    setNewVehicleCost("");!
    setNewVehicleVendor("");M
I    toast.success(`Added ${newV.name} (${newV.vehicleType}) to fleet!`);	
  };
4
0  const handleDeleteVehicle = (id: string) => {<
8    setAllocFleet(allocFleet.filter(v => v.id !== id));2
.    toast.info("Removed vehicle from fleet");	
  };
*
&  const handleCopyTempoList = () => {;
7    let txt = "*Tempo List (for WhatsApp Group)*\n\n";5
1    const groups: Record<string, string[]> = {};2
.    computedVehicleAllocations.forEach(v => {4
0      const vName = v.vehicleType || "Tempo 1";2
.      if (!groups[vName]) groups[vName] = [];.
*      groups[vName].push(v.travelerName);
    });
=
9    Object.entries(groups).forEach(([vName, names]) => {V
R      txt += ` *${vName}*  ${names.join(", ")} [${names.length} names]\n`;
    });
,
(    navigator.clipboard.writeText(txt);C
?    toast.success("WhatsApp Tempo List copied to clipboard!");	
  };
)
%  const handleCopyRoomList = () => {:
6    let txt = "*Room List (for WhatsApp Group)*\n\n";P
L    const groups: Record<string, { gender: string, names: string[] }> = {};/
+    computedRoomAllocations.forEach(r => {b
^      if (!groups[r.roomNumber]) groups[r.roomNumber] = { gender: r.genderGroup, names: [] };;
7      groups[r.roomNumber].names.push(r.travelerName);
    });
=
9    Object.entries(groups).forEach(([roomNo, data]) => {
      txt += ` *${roomNo}*  ${data.names.join(", ")} (${data.gender === "BOYS" ? "Boys" : data.gender === "GIRLS" ? "Girls" : "Couples"})\n`;
    });
,
(    navigator.clipboard.writeText(txt);B
>    toast.success("WhatsApp Room List copied to clipboard!");	
  };
6
2  const computedRoomAllocations = useMemo(() => { 
    const list: any[] = [];J
F    Object.entries(passengerAllocations).forEach(([name, alloc]) => {S
O      if (alloc.room && alloc.room !== "Unassigned" && alloc.room !== "") {
        const gender = name.includes("Das") ? "COUPLE" : (name === "Sneha Reddy" || name === "Pooja Hegde") ? "GIRLS" : "BOYS";
        list.push({&
"          roomNumber: alloc.room,"
          travelerName: name,#
          genderGroup: gender,!
          roomType: "Double"
        });
      }
    });
    return list;"
  }, [passengerAllocations]);
9
5  const computedVehicleAllocations = useMemo(() => { 
    const list: any[] = [];J
F    Object.entries(passengerAllocations).forEach(([name, alloc]) => {\
X      if (alloc.vehicle && alloc.vehicle !== "Unassigned" && alloc.vehicle !== "") {
        list.push({"
          fleetId: "tempo-1",*
&          vehicleType: alloc.vehicle,&
"          seatNumber: alloc.seat,!
          travelerName: name
        });
      }
    });
    return list;"
  }, [passengerAllocations]);
C
?  const [sharingPref, setSharingPref] = useState<string>("3");J
F  const [sameGenderEnforced, setSameGenderEnforced] = useState(true);H
D  const [prioritizeCouples, setPrioritizeCouples] = useState(true);B
>  const [fallbackToQuad, setFallbackToQuad] = useState(true);
0
,  const handleTriggerAutoAllocate = () => {3
/    const newAllocs: Record<string, any> = {};
    let roomNum = 1;
    let seatNum = 1;
#
    // Filter active travelersT
P    const activeTravelers = allPassengers.filter(p => p.notes !== "Cancelled");
M
I    // Separate couples (same last name or co-travelers booked together)
    const couples = activeTravelers.filter(p => p.name.includes("Das") || p.name.includes("Sharma") && p.name.includes("Amit"));s
o    const sameGenderGirls = activeTravelers.filter(p => p.name === "Sneha Reddy" || p.name === "Pooja Hegde");q
m    const males = activeTravelers.filter(p => p.gender === "Male" && !couples.find(c => c.name === p.name));
    const females = activeTravelers.filter(p => p.gender === "Female" && !couples.find(c => c.name === p.name) && !sameGenderGirls.find(g => g.name === p.name));
$
     // 1. Couples for 2-sharing7
3    if (prioritizeCouples && couples.length > 0) {(
$      couples.forEach((p, idx) => {"
        newAllocs[p.name] = {,
(          room: `Group No. ${roomNum}`,*
&          vehicle: "17 Seater Tempo",&
"          seat: String(seatNum++)
        };*
&        if (idx % 2 === 1) roomNum++;

      });

    }
1
-    // 2. Same gender female pairs in double*
&    if (sameGenderGirls.length > 0) {0
,      sameGenderGirls.forEach((p, idx) => {"
        newAllocs[p.name] = {,
(          room: `Group No. ${roomNum}`,*
&          vehicle: "17 Seater Tempo",&
"          seat: String(seatNum++)
        };*
&        if (idx % 2 === 1) roomNum++;

      });

    }
0
,    // 3. Males sharing (default 3 sharing)7
3    const targetSize = parseInt(sharingPref) || 3;
    let maleCount = 0;
    males.forEach((p) => { 
      newAllocs[p.name] = {*
&        room: `Group No. ${roomNum}`,(
$        vehicle: "17 Seater Tempo",$
         seat: String(seatNum++)
	      };
      maleCount++;)
%      if (maleCount >= targetSize) {
        maleCount = 0;
        roomNum++;
      }
    });

    if (maleCount > 0) {:
6      if (fallbackToQuad && maleCount < targetSize) {=
9        // Fallback: merge into quad with the same groupU
Q        toast.info("Fallback rule applied: leftovers merged into quad sharing");
      } else {
        roomNum++;
      }

    }
2
.    // 4. Females sharing (default 3 sharing)
    let femaleCount = 0;!
    females.forEach((p) => { 
      newAllocs[p.name] = {*
&        room: `Group No. ${roomNum}`,(
$        vehicle: "17 Seater Tempo",$
         seat: String(seatNum++)
	      };
      femaleCount++;+
'      if (femaleCount >= targetSize) {
        femaleCount = 0;
        roomNum++;
      }
    });
,
(    setPassengerAllocations(newAllocs);m
i    toast.success(`Allocated matching rules: ${sharingPref}-sharing rooms, same-gender groups locked.`);	
  };
6
2  const handleHotelEditClick = (idx: number) => {!
    setEditingHotelIdx(idx);-
)    const hotel = hotelsList[idx] || {};
    setEditingHotelData({$
       hotel: hotel.hotel || "","
      dest: hotel.dest || "","
      type: hotel.type || "",:
6      plan: hotel.plan || "MAP (Breakfast + Dinner)",-
)      roomsCount: hotel.roomsCount || 5,0
,      guestsCount: hotel.guestsCount || 10,%
!      nights: hotel.nights || 1,-
)      status: hotel.status || "PENDING",(
$      voucher: hotel.voucher || "",
      amt: hotel.amt || 0,&
"      paidAmt: hotel.paidAmt || 0
    });!
    setHotelModalOpen(true);	
  };
<
8  const handleSaveHotelEdit = (e: React.FormEvent) => {
    e.preventDefault();.
*    if (editingHotelIdx === null) return;)
%    const updated = [...hotelsList];%
!    updated[editingHotelIdx] = {'
#      ...updated[editingHotelIdx],
      ...editingHotelData,9
5      rooms: `${editingHotelData.roomsCount} Rooms`,<
8      roomSub: `${editingHotelData.guestsCount} Guests`
    }; 
    setHotelsList(updated);"
    setHotelModalOpen(false);N
J    toast.success(`Updated stay details for Day ${editingHotelIdx + 1}`);	
  };
K
G  const [roadVehiclesList, setRoadVehiclesList] = useState<any[]>([]);[
W  const [editingTransportIdx, setEditingTransportIdx] = useState<number | null>(null);K
G  const [transportModalOpen, setTransportModalOpen] = useState(false);N
J  const [editingTransportData, setEditingTransportData] = useState<any>({
    type: "",
    cap: "",
    capacityNum: 26,
    seatsBooked: 26,
    plate: "",
    model: "",
    total: "",
    paid: ""

  });
:
6  const handleTransportEditClick = (idx: number) => {%
!    setEditingTransportIdx(idx);2
.    const item = roadVehiclesList[idx] || {};"
    setEditingTransportData({0
,      type: item.type || "Tempo Traveller",(
$      cap: item.cap || "26 Seater",/
+      capacityNum: item.capacityNum || 26,/
+      seatsBooked: item.seatsBooked || 26,#
      plate: item.plate || "",#
      model: item.model || "",;
7      total: item.total?.replace(/,/g, '') || "63000",4
0      paid: item.paid?.replace(/,/g, '') || "0"
    });%
!    setTransportModalOpen(true);	
  };
@
<  const handleSaveTransportEdit = (e: React.FormEvent) => {
    e.preventDefault();2
.    if (editingTransportIdx === null) return;/
+    const updated = [...roadVehiclesList];D
@    const totalVal = parseInt(editingTransportData.total) || 0;B
>    const paidVal = parseInt(editingTransportData.paid) || 0;+
'    const dueVal = totalVal - paidVal;
)
%    updated[editingTransportIdx] = {+
'      ...updated[editingTransportIdx],#
      ...editingTransportData,^
Z      seats: `${editingTransportData.seatsBooked} / ${editingTransportData.capacityNum}`,3
/      total: totalVal.toLocaleString('en-IN'),1
-      paid: paidVal.toLocaleString('en-IN'),.
*      due: dueVal.toLocaleString('en-IN')
    };&
"    setRoadVehiclesList(updated);&
"    setTransportModalOpen(false);A
=    toast.success(`Updated transport details successfully`);	
  };

  useEffect(() => {B
>    const transAssignments = tripVendors.filter((v: any) => {P
L      const vendorObj = typeof v.vendorId === 'object' ? v.vendorId : null;>
:      const type = vendorObj?.type || v.vendorType || '';'
#      return type === 'transport';
    });
+
'    if (transAssignments.length > 0) {G
C      const list = transAssignments.map((v: any, idx: number) => {l
h        const vendorObj = typeof v.vendorId === 'object' ? v.vendorId : { name: 'Assigned Transport' };$
         const dayNum = idx + 1;I
E        const { wd, date } = getDayDateAndWd(departureDateStr, idx);<
8        const dest = tripDetails?.location || "Manali";
        return {
          id: v.id,'
#          type: "Tempo Traveller",.
*          cap: v.capacity || "26 Seater",V
R          plate: v.notes || "17 Seater Tempo = 63000 (15th till 23rd July 2026)",3
/          model: v.model || "Force Traveller",&
"          vendor: vendorObj.name,;
7          phone: vendorObj.phone || "+91 98765 43210",!
          from: "Ahmedabad",Q
M          fromTime: `${date.split(" ")[0]} ${date.split(" ")[1]}, 06:00 AM`,
          to: dest,O
K          toTime: `${date.split(" ")[0]} ${date.split(" ")[1]}, 06:00 PM`,C
?          days: `${date.split(" ")[0]} ${date.split(" ")[1]}`,#
          daysCount: "2 Days",H
D          seats: `${v.seatsBooked || 26} / ${v.capacityNum || 26}`,0
,          seatsBooked: v.seatsBooked || 26,0
,          capacityNum: v.capacityNum || 26,H
D          total: v.agreedCost?.toLocaleString('en-IN') || "63,000",B
>          paid: v.paidAmount?.toLocaleString('en-IN') || "0",\
X          due: ((v.agreedCost || 63000) - (v.paidAmount || 0)).toLocaleString('en-IN'),D
@          status: v.paymentStatus?.toUpperCase() || 'CONFIRMED'
        };

      });%
!      setRoadVehiclesList(list);
    } else { 
      setRoadVehiclesList([

        {!
          id: "road-mock-1",'
#          type: "Tempo Traveller", 
          cap: "26 Seater",K
G          plate: "17 Seater Tempo = 63000 (15th till 23rd July 2026)",(
$          model: "Force Traveller",)
%          vendor: "17 Seater Tempo",(
$          phone: "+91 98765 43210",!
          from: "Ahmedabad",,
(          fromTime: "14 Jul, 06:00 AM",&
"          to: "Himachal Pradesh",*
&          toTime: "14 Jul, 06:00 PM",
          days: "14 Jul",#
          daysCount: "2 Days", 
          seats: "26 / 26",
          seatsBooked: 26,
          capacityNum: 26,
          total: "63,000",
          paid: "0",
          due: "63,000","
          status: "CONFIRMED"

        }

      ]);

    }8
4  }, [tripVendors, departureDateStr, tripDetails]);
5
1  const transportVehiclesLabel = useMemo(() => {T
P    const count = tripVendors.filter(v => v.vendorType === 'transport').length;N
J    return count > 0 ? `${count} Vehicles Assigned` : "Assign Transport";
  }, [tripVendors]);
3
/  const dateAndDurationLabel = useMemo(() => {

    try {8
4      const startDate = new Date(departureDateStr);J
F      const daysMatch = tripDetails?.duration?.match(/(\d+)\s*Day/i);F
B      const numDays = daysMatch ? parseInt(daysMatch[1], 10) : 9;_
[      const endDate = new Date(startDate.getT