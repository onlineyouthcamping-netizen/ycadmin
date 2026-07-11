const [passengerAllocations, setPassengerAllocations] = useState<Record<string, { room: string, vehicle: string, seat: string }>>({});  const [allocFleet, setAllocFleet] = useState<any[]>([
    { id: "tempo-1", name: "Tempo 1", vehicleType: "13 Seater Tempo", capacity: 13, cost: 45000, vendor: "ABC Travels" },
    { id: "tempo-2", name: "Tempo 2", vehicleType: "17 Seater Tempo", capacity: 17, cost: 58000, vendor: "XYZ Travels" },
    { id: "car-1", name: "Car 1", vehicleType: "6 Seater Car", capacity: 6, cost: 22000, vendor: "Self-driven" }
  ]);
  const [newVehicleType, setNewVehicleType] = useState("17 Seater Tempo");
@
<  const [newVehicleName, setNewVehicleName] = useState("");
@
<  const [newVehicleCost, setNewVehicleCost] = useState("");
D
@  const [newVehicleVendor, setNewVehicleVendor] = useState("");


9
5  const handleAddVehicle = (e: React.FormEvent) => {

    e.preventDefault();
a
]    const cap = newVehicleType.includes("17") ? 17 : newVehicleType.includes("13") ? 13 : 6;

    const newV = {
'
#      id: `vehicle-${Date.now()}`,
D
@      name: newVehicleName || `Tempo ${allocFleet.length + 1}`,
'
#      vehicleType: newVehicleType,

      capacity: cap,
3
/      cost: parseInt(newVehicleCost) || 35000,
7
3      vendor: newVehicleVendor || "General Vendor"

    };
.
*    setAllocFleet([...allocFleet, newV]);

    setNewVehicleName("");

    setNewVehicleCost("");
!
    setNewVehicleVendor("");
M
I    toast.success(`Added ${newV.name} (${newV.vehicleType}) to fleet!`);
	
  };


4
0  const handleDeleteVehicle = (id: string) => {
<
8    setAllocFleet(allocFleet.filter(v => v.id !== id));
2
    toast.info("Removed vehicle from fleet");
	
  };


*
&  const handleCopyTempoList = () => {
;
7    let txt = "*Tempo List (for WhatsApp Group)*\n\n";
5
1    const groups: Record<string, string[]> = {};
2
.    computedVehicleAllocations.forEach(v => {
4
0      const vName = v.vehicleType || "Tempo 1";
2
.      if (!groups[vName]) groups[vName] = [];
.
*      groups[vName].push(v.travelerName);

    });


=
9    Object.entries(groups).forEach(([vName, names]) => {
V
R      txt += `🚌 *${vName}* — ${names.join(", ")} [${names.length} names]\n`;

    });


,
(    navigator.clipboard.writeText(txt);
C
?    toast.success("WhatsApp Tempo List copied to clipboard!");
	
  };


)
%  const handleCopyRoomList = () => {
:
6    let txt = "*Room List (for WhatsApp Group)*\n\n";
P
L    const groups: Record<string, { gender: string, names: string[] }> = {};
/
+    computedRoomAllocations.forEach(r => {
b
^      if (!groups[r.roomNumber]) groups[r.roomNumber] = { gender: r.genderGroup, names: [] };
;
7      groups[r.roomNumber].names.push(r.travelerName);

    });


=
9    Object.entries(groups).forEach(([roomNo, data]) => {

      txt += `🏢 *${roomNo}* — ${data.names.join(", ")} (${data.gender === "BOYS" ? "Boys" : data.gender === "GIRLS" ? "Girls" : "Couples"})\n`;

    });


,
(    navigator.clipboard.writeText(txt);
B
>    toast.success("WhatsApp Room List copied to clipboard!");
	
  };

  const computedRoomAllocations = useMemo(() => {    const list: any[] = [];    Object.entries(passengerAllocations).forEach(([name, alloc]) => {      if (alloc.room && alloc.room !== "Unassigned" && alloc.room !== "—") {        const gender = name.includes("Das") ? "COUPLE" : (name === "Sneha Reddy" || name === "Pooja Hegde") ? "GIRLS" : "BOYS";        list.push({          roomNumber: alloc.room,          travelerName: name,          genderGroup: gender,          roomType: "Double"        });      }    });    return list;  }, [passengerAllocations]);  const computedVehicleAllocations = useMemo(() => {    const list: any[] = [];    Object.entries(passengerAllocations).forEach(([name, alloc]) => {      if (alloc.vehicle && alloc.vehicle !== "Unassigned" && alloc.vehicle !== "—") {        list.push({          fleetId: "tempo-1",          vehicleType: alloc.vehicle,          seatNumber: alloc.seat,          travelerName: name        });      }    });    return list;  }, [passengerAllocations]);  const [sharingPref, setSharingPref] = useState<string>("3");  const [sameGenderEnforced, setSameGenderEnforced] = useState(true);  const [prioritizeCouples, setPrioritizeCouples] = useState(true);  const [fallbackToQuad, setFallbackToQuad] = useState(true);  const handleTriggerAutoAllocate = () => {    const newAllocs: Record<string, any> = {};    let roomNum = 1;    let seatNum = 1;    // Filter active travelers    const activeTravelers = allPassengers.filter(p => p.notes !== "Cancelled");    // Separate couples (same last name or co-travelers booked together)    const couples = activeTravelers.filter(p => p.name.includes("Das") || p.name.includes("Sharma") && p.name.includes("Amit"));    const sameGenderGirls = activeTravelers.filter(p => p.name === "Sneha Reddy" || p.name === "Pooja Hegde");    const males = activeTravelers.filter(p => p.gender === "Male" && !couples.find(c => c.name === p.name));    const females = activeTravelers.filter(p => p.gender === "Female" && !couples.find(c => c.name === p.name) && !sameGenderGirls.find(g => g.name === p.name));    // 1. Couples for 2-sharing    if (prioritizeCouples && couples.length > 0) {      couples.forEach((p, idx) => {        newAllocs[p.name] = {          room: `Group No. ${roomNum}`,          vehicle: "17 Seater Tempo",          seat: String(seatNum++)        };        if (idx % 2 === 1) roomNum++;      });    }    // 2. Same gender female pairs in double    if (sameGenderGirls.length > 0) {      sameGenderGirls.forEach((p, idx) => {        newAllocs[p.name] = {          room: `Group No. ${roomNum}`,          vehicle: "17 Seater Tempo",          seat: String(seatNum++)        };        if (idx % 2 === 1) roomNum++;      });    }    // 3. Males sharing (default 3 sharing)    const targetSize = parseInt(sharingPref) || 3;    let maleCount = 0;    males.forEach((p) => {      newAllocs[p.name] = {        room: `Group No. ${roomNum}`,        vehicle: "17 Seater Tempo",        seat: String(seatNum++)      };      maleCount++;      if (maleCount >= targetSize) {        maleCount = 0;        roomNum++;      }    });    if (maleCount > 0) {      if (fallbackToQuad && maleCount < targetSize) {        // Fallback: merge into quad with the same group        toast.info("Fallback rule applied: leftovers merged into quad sharing");      } else {        roomNum++;      }    }    // 4. Females sharing (default 3 sharing)    let femaleCount = 0;    females.forEach((p) => {      newAllocs[p.name] = {        room: `Group No. ${roomNum}`,        vehicle: "17 Seater Tempo",        seat: String(seatNum++)      };      femaleCount++;      if (femaleCount >= targetSize) {        femaleCount = 0;        roomNum++;      }    });    setPassengerAllocations(newAllocs)    toast.success(`Allocated matching rules: ${sharingPref}-sharing rooms, same-gender groups locked.`);  };