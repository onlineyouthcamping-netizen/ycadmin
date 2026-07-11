import React, { useEffect, useState, useMemo } from "react";8
4import { useSearchParams } from "react-router-dom";
	import {B
>  Users, Calendar, User, Compass, Upload, Download, FileText,B
>  ClipboardList, CheckCircle2, MoreHorizontal, MessageSquare,>
:  PhoneCall, ChevronDown, Info, Search, X, Plus, Printer,A
=  Bed, Bus, Sliders, FileSpreadsheet, ClipboardCheck, Check,P
L  AlertTriangle, Clock, MapPin, Star, Link2, Paperclip, Image as ImageIcon,L
H  Smile, AtSign, Send, Shield, Folder, Filter, RefreshCw, MoreVertical,X
T  ArrowRight, CheckSquare, Circle, PauseCircle, XCircle, ChevronLeft, ChevronRight,X
T  TrendingUp, DollarSign, CreditCard, BarChart2, Activity, CalendarCheck, Sparkles,
  History as HistoryIcon
} from "lucide-react";&
"import { cn } from "@/lib/utils";&
"import api from "@/services/api";$
 import { toast } from "sonner";5
1import { Button } from "@/components/ui/button";3
/import { Input } from "@/components/ui/input";D
@import ReportsConsole from "@/components/admin/ReportsConsole";N
Jimport BookingDetailsModal from "@/components/admin/BookingDetailsModal";r
nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem ,
(} from "@/components/ui/dropdown-menu";9
5// ─── Spiti Valley Mock Itineraries ───#
const MOCK_SPITI_ITINERARY = [
  { day: "Day 1", wd: "MON", date: "14 Jul 2026", plan: "Delhi → Shimla", sub: "Drive to Shimla", stay: "Shimla", stayType: "Hotel Ridge View", stayBadge: "DELUXE", travel: "340 KM", travelSub: "8 Hrs", meals: "Dinner", activities: "Mall Road Stroll", status: "ON TIME" },
  { day: "Day 2", wd: "TUE", date: "15 Jul 2026", plan: "Shimla → Sangla", sub: "Scenic Kinnaur Highway", stay: "Sangla", stayType: "Kinner Camps", stayBadge: "CAMP", travel: "220 KM", travelSub: "7 Hrs", meals: "Breakfast Dinner", activities: "Sangla Valley View", status: "ON TIME" },
  { day: "Day 3", wd: "WED", date: "16 Jul 2026", plan: "Sangla → Chitkul → Kalpa", sub: "Visit Last Indian Village", stay: "Kalpa", stayType: "Hotel Kinner Kailash", stayBadge: "DELUXE", travel: "90 KM", travelSub: "4 Hrs", meals: "Breakfast Dinner", activities: "Chitkul Village, Kalpa Fort", status: "ON TIME" },
  { day: "Day 4", wd: "THU", date: "17 Jul 2026", plan: "Kalpa → Nako → Tabo → Kaza", sub: "Enter Spiti Valley", stay: "Kaza", stayType: "Spiti Heritage Hotel", stayBadge: "DELUXE", travel: "200 KM", travelSub: "8 Hrs", meals: "Breakfast Dinner", activities: "Nako Lake, Tabo Monastery", status: "ON TIME" },
  { day: "Day 5", wd: "FRI", date: "18 Jul 2026", plan: "Kaza Local Sightseeing", sub: "Key Monastery & Kibber", stay: "Kaza", stayType: "Spiti Heritage Hotel", stayBadge: "DELUXE", travel: "Local", travelSub: "50 KM", meals: "Breakfast Dinner", activities: "Key Monastery, Kibber Village", status: "ON TIME" },
  { day: "Day 6", wd: "SAT", date: "19 Jul 2026", plan: "Kaza → Hikkim → Komic → Langza", sub: "Highest Post Office & Fossils", stay: "Kaza", stayType: "Spiti Heritage Hotel", stayBadge: "DELUXE", travel: "Local", travelSub: "60 KM", meals: "Breakfast Dinner", activities: "Highest Post Office, Langza Buddha", status: "ON TIME" },
  { day: "Day 7", wd: "SUN", date: "20 Jul 2026", plan: "Kaza → Chandra Taal", sub: "Drive to Crescent Moon Lake", stay: "Chandra Taal", stayType: "Parasol Camps", stayBadge: "CAMP", travel: "100 KM", travelSub: "5 Hrs", meals: "Breakfast Dinner", activities: "Chandra Taal Lake Walk", status: "ON TIME" },
  { day: "Day 8", wd: "MON", date: "21 Jul 2026", plan: "Chandra Taal → Manali", sub: "Cross Kunzum Pass & Rohtang", stay: "Manali", stayType: "Hotel Mountain View", stayBadge: "DELUXE", travel: "120 KM", travelSub: "6 Hrs", meals: "Breakfast Dinner", activities: "Manali Local Markets", status: "ON TIME" },
  { day: "Day 9", wd: "TUE", date: "22 Jul 2026", plan: "Manali → Delhi", sub: "Overnight Volvo Return", stay: "—", stayType: "", travel: "Volvo Bus", travelSub: "Departure: 06:00 PM", meals: "Breakfast", activities: "—", status: "ON TIME" }
];
$
 const MOCK_SPITI_ACTIVITIES = [
  { day: "Day 1", wd: "14 Jul, Mon", act: "Delhi to Shimla Transfer", sub: "Scenic mountain drive", type: "TRAVEL", inc: true, time: "07:00 AM - 04:00 PM", loc: "Shimla", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 2", wd: "15 Jul, Tue", act: "Sangla Transfer", sub: "Drive along Sutlej river", type: "TRAVEL", inc: true, time: "08:00 AM - 03:00 PM", loc: "Sangla", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 3", wd: "16 Jul, Wed", act: "Chitkul Excursion", sub: "Visit Chitkul & Kalpa transfer", type: "SIGHTSEEING", inc: true, time: "09:00 AM - 05:00 PM", loc: "Chitkul", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 4", wd: "17 Jul, Thu", act: "Kaza Transfer", sub: "Enroute Tabo & Nako", type: "TRAVEL", inc: true, time: "07:30 AM - 05:30 PM", loc: "Kaza", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 5", wd: "18 Jul, Fri", act: "Key Monastery Visit", sub: "Explore Key & Kibber", type: "SIGHTSEEING", inc: true, time: "10:00 AM - 04:00 PM", loc: "Key", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 6", wd: "19 Jul, Sat", act: "Hikkim & Komic Post Offices", sub: "Send a postcard, Langza Buddha", type: "SIGHTSEEING", inc: true, time: "09:30 AM - 05:00 PM", loc: "Hikkim", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 7", wd: "20 Jul, Sun", act: "Chandra Taal Transfer", sub: "Cross Kunzum Pass", type: "TRAVEL", inc: true, time: "08:00 AM - 03:00 PM", loc: "Chandra Taal", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 8", wd: "21 Jul, Mon", act: "Manali Transfer", sub: "Enroute Rohtang tunnel", type: "TRAVEL", inc: true, time: "08:00 AM - 04:00 PM", loc: "Manali", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 9", wd: "22 Jul, Tue", act: "Delhi Return", sub: "Volvo from Manali", type: "TRAVEL", inc: true, time: "06:00 PM", loc: "Manali", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" }
];


const MOCK_ACTIVITIES = [
  { id:"a1", day:"Day 1", date:"05 Jul, Sat", activity:"Volvo Journey",           sub:"Ahmedabad → Chandigarh",         type:"TRAVEL",      included:true,  time:"09:00 PM", location:"Ahmedabad",    status:"CONFIRMED" },
  { id:"a2", day:"Day 2", date:"06 Jul, Sun", activity:"Manali Local Sightseeing", sub:"Hidimba Temple, Mall Road",      type:"SIGHTSEEING", included:true,  time:"10:00 AM - 06:00 PM", location:"Manali",       status:"CONFIRMED" },
  { id:"a3", day:"Day 3", date:"07 Jul, Mon", activity:"Solang Valley Visit",      sub:"Ropeway, Snow Point (if Open)",  type:"SIGHTSEEING", included:true,  time:"09:30 AM - 05:00 PM", location:"Solang Valley", status:"CONFIRMED" },
  { id:"a4", day:"Day 4", date:"08 Jul, Tue", activity:"Kasol Visit",              sub:"Kasol Market, Cafes",            type:"SIGHTSEEING", included:true,  time:"11:00 AM - 07:00 PM", location:"Kasol",        status:"CONFIRMED" },
  { id:"a5", day:"Day 5", date:"09 Jul, Wed", activity:"Kullu → Manikaran Sahib",  sub:"Hot Springs & Gurudwara",       type:"SIGHTSEEING", included:true,  time:"08:30 AM - 05:30 PM", location:"Manikaran",    status:"CONFIRMED" },
  { id:"a6", day:"Day 6", date:"10 Jul, Thu", activity:"Kasol to Amritsar Transfer",sub:"Enroute sightseeing",          type:"TRAVEL",      included:true,  time:"08:00 AM - 08:00 PM", location:"Amritsar",     status:"CONFIRMED" },
  { id:"a7", day:"Day 7", date:"11 Jul, Fri", activity:"Golden Temple Visit",      sub:"Darshan & Palki Sahib",          type:"SIGHTSEEING", included:true,  time:"05:00 AM - 09:00 AM", location:"Amritsar",     status:"CONFIRMED" },
  { id:"a8", day:"Day 8", date:"12 Jul, Sat", activity:"Wagah Border Ceremony",    sub:"Beating Retreat Ceremony",       type:"SIGHTSEEING", included:true,  time:"04:30 PM - 06:00 PM", location:"Wagah Border", status:"PENDING" },
  { id:"a9", day:"Day 9", date:"13 Jul, Sun", activity:"Train Journey",            sub:"Amritsar → Ahmedabad",           type:"TRAVEL",      included:false, time:"07:00 PM", location:"Amritsar",     status:"CANCELLED" },
  { id:"a10",day:"Optional",date:"",         activity:"River Rafting",             sub:"Beas River (Extra Cost)",        type:"ADVENTURE",   included:false, time:"—",        location:"Kullu",        status:"OPTIONAL" },
];

const MOCK_PAYMENTS = [
  { id:"YC/MKA/0705/001", passenger:"Rohit Patel",    pax:2, phone:"98765 43210", plan:"Standard Plan", amount:28000, paid:28000, pending:0,     mode:"UPI",           modeDetail:"UPI ID: rohit@okaxis",      status:"PAID",         lastPayment:"28 Jun 2027, 09:30 AM", bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/002", passenger:"Anjali Mehta",   pax:1, phone:"98765 43211", plan:"Standard Plan", amount:14000, paid:7000,  pending:7000,  mode:"Bank Transfer", modeDetail:"HDFC - 4567",               status:"PARTIALLY PAID",lastPayment:"20 Jun 2027, 03:42 PM", bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/003", passenger:"Devang Shah",    pax:3, phone:"98765 43212", plan:"Standard Plan", amount:42000, paid:42000, pending:0,     mode:"Credit Card",   modeDetail:"**** **** **** 1234",       status:"PAID",         lastPayment:"18 Jun 2027, 11:07 AM", bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/004", passenger:"Priya Joshi",    pax:1, phone:"98765 43213", plan:"Standard Plan", amount:14000, paid:0,     pending:14000, mode:"—",             modeDetail:"—",                         status:"UNPAID",       lastPayment:"—",                     bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/005", passenger:"Harsh Vora",     pax:2, phone:"98765 43214", plan:"Standard Plan", amount:28000, paid:14000, pending:14000, mode:"UPI",           modeDetail:"UPI ID: harshvora@okicici", status:"PARTIALLY PAID",lastPayment:"25 Jun 2027, 08:30 PM", bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/006", passenger:"Khyati Desai",   pax:1, phone:"98765 43215", plan:"Standard Plan", amount:14000, paid:14000, pending:0,     mode:"Net Banking",   modeDetail:"ICICI – 7890",              status:"PAID",         lastPayment:"22 Jun 2027, 10:11 PM", bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/007", passenger:"Manan Trivedi",  pax:1, phone:"98765 43216", plan:"Standard Plan", amount:14000, paid:14000, pending:0,     mode:"UPI",           modeDetail:"—",                         status:"REFUNDED",     lastPayment:"26 Jun 2027, 05:20 PM", bookingStatus:"CANCELLED" },
  { id:"YC/MKA/0705/008", passenger:"Aayushi Rawal",  pax:2, phone:"98765 43217", plan:"Standard Plan", amount:28000, paid:14000, pending:14000, mode:"Bank Transfer", modeDetail:"SBI – 1122",                status:"PARTIALLY PAID",lastPayment:"19 Jun 2027, 02:55 PM", bookingStatus:"CONFIRMED" },
];

const MOCK_TASKS = [
  { id:"t1",  task:"Collect balance payments from 6 passengers", sub:"Booking IDs: 002, 004, 005, 008, 011, 013", category:"PAYMENTS",   assignee:"Suresh Kumar",  role:"Accounting",   priority:"HIGH",   dueDate:"02 Jul 2027", dueNote:"2 days left",    status:"IN PROGRESS",  createdOn:"28 Jun 2027, 10:15 AM" },
  { id:"t2",  task:"Verify ID proofs of all passengers",         sub:"Aadhar / PAN / Passport",                   category:"DOCUMENTS",  assignee:"Neeki Patel",   role:"Operations",   priority:"MEDIUM", dueDate:"01 Jul 2027", dueNote:"Tomorrow",       status:"IN PROGRESS",  createdOn:"28 Jun 2027, 11:30 AM" },
  { id:"t3",  task:"Confirm hotel bookings & vouchers",          sub:"All 9 nights",                              category:"HOTELS",     assignee:"Parth Rathod",  role:"Operations",   priority:"HIGH",   dueDate:"29 Jun 2027", dueNote:"Today",          status:"OVERDUE",      createdOn:"27 Jun 2027, 04:45 PM" },
  { id:"t4",  task:"Confirm tempo & driver details",             sub:"Vehicle: GJ01XX1234, GJ01XX5678",           category:"TRANSPORT",  assignee:"Neeki Patel",   role:"Operations",   priority:"MEDIUM", dueDate:"29 Jun 2027", dueNote:"Today",          status:"COMPLETED",    createdOn:"27 Jun 2027, 02:20 PM" },
  { id:"t5",  task:"Share final trip details with guides",       sub:"Itinerary, contact list, SOPs",             category:"GUIDES",     assignee:"Dikshu Sharma", role:"Lead Guide",   priority:"LOW",    dueDate:"30 Jun 2027", dueNote:"1 day left",     status:"PENDING",      createdOn:"27 Jun 2027, 01:10 PM" },
  { id:"t6",  task:"Medical kit check & restock",                sub:"All items as per checklist",                category:"OPERATIONS", assignee:"Neeki Patel",   role:"Operations",   priority:"MEDIUM", dueDate:"01 Jul 2027", dueNote:"Tomorrow",       status:"PENDING",      createdOn:"28 Jun 2027, 12:05 PM" },
  { id:"t7",  task:"Prepare guest welcome kit",                  sub:"T-shirts, badges, itinerary",              category:"OPERATIONS", assignee:"Parth Rathod",  role:"Operations",   priority:"LOW",    dueDate:"03 Jul 2027", dueNote:"3 days left",    status:"NOT STARTED",  createdOn:"28 Jun 2027, 05:20 PM" },
  { id:"t8",  task:"Create WhatsApp group & add members",        sub:"Share group rules & itinerary",            category:"COMMUNICATION",assignee:"Neel Mehta",   role:"Support",      priority:"LOW",    dueDate:"30 Jun 2027", dueNote:"1 day left",     status:"COMPLETED",    createdOn:"27 Jun 2027, 03:00 PM" },
];
"
const MOCK_DOC_CATEGORIES = [N
J  { id:"all",    label:"All Documents",        count:128, active: true },?
;  { id:"bk",     label:"Bookings & Payments",  count:24 },?
;  { id:"cust",   label:"Customer Documents",   count:28 },?
;  { id:"trans",  label:"Transport",            count:16 },?
;  { id:"hotels", label:"Hotels",               count:18 },?
;  { id:"guides", label:"Guides",               count:12 },?
;  { id:"ops",    label:"Operations",           count:14 },?
;  { id:"fin",    label:"Finance",              count:8  },?
;  { id:"legal",  label:"Legal & Compliance",   count:6  },?
;  { id:"mktg",   label:"Marketing",            count:4  },?
;  { id:"other",  label:"Other",                count:2  },?
;  { id:"arch",   label:"Archived",             count:8  },
];

const MOCK_DOCUMENTS = [
  { id:"d1",  name:"MKA-0705 Booking Summary",   sub:"v1.2",                  category:"Bookings & Payments", subcat:"Booking Summary",  uploadedBy:"Suresh Kumar",  role:"Accounting",  uploadedOn:"28 Jun 2027, 10:15 AM", status:"VERIFIED" },
  { id:"d2",  name:"Passenger List",              sub:"Total 57 Pax",          category:"Customer Documents",  subcat:"Passenger List",   uploadedBy:"Neeki Patel",   role:"Operations",  uploadedOn:"28 Jun 2027, 09:40 AM", status:"VERIFIED" },
  { id:"d3",  name:"Payment Received Report",     sub:"As on 28 Jun 2027",     category:"Finance",             subcat:"Collection Report",uploadedBy:"Suresh Kumar",  role:"Accounting",  uploadedOn:"28 Jun 2027, 09:20 AM", status:"VERIFIED" },
  { id:"d4",  name:"Hotel Booking Vouchers",      sub:"All 9 Nights",          category:"Hotels",              subcat:"Vouchers",         uploadedBy:"Neeki Patel",   role:"Operations",  uploadedOn:"27 Jun 2027, 06:30 PM", status:"PENDING" },
  { id:"d5",  name:"Vehicle Details & RC",        sub:"2 Tempo Travellers",    category:"Transport",           subcat:"Vehicle Documents",uploadedBy:"Parth Rathod",  role:"Operations",  uploadedOn:"27 Jun 2027, 04:10 PM", status:"VERIFIED" },
  { id:"d6",  name:"Guide ID Proofs",             sub:"All Guide Documents",   category:"Guides",              subcat:"ID Proof",         uploadedBy:"Parth Rathod",  role:"Operations",  uploadedOn:"27 Jun 2027, 03:15 PM", status:"ACTION REQUIRED" },
  { id:"d7",  name:"Itinerary – Final",           sub:"Day wise plan",         category:"Operations",          subcat:"Itinerary",        uploadedBy:"Dikshu Sharma", role:"Lead Guide",  uploadedOn:"26 Jun 2027, 11:45 AM", status:"VERIFIED" },
  { id:"d8",  name:"Emergency Contact List",      sub:"Team & Vendors",        category:"Operations",          subcat:"Emergency",        uploadedBy:"Neel Mehta",    role:"Support",     uploadedOn:"26 Jun 2027, 10:20 AM", status:"PENDING" },
];

const MOCK_CONV_LIST = [
  { id:"g1",  name:"MKA-0705 – General Group", sub:"Dikshu Sharma: Meeting point details for...", time:"10:30 AM", unread:1,  type:"group",  icon:"🏕️" },
  { id:"g2",  name:"Pre-Departure Info",        sub:"Kumar: Please carry original ID proofs.",   time:"Yesterday",unread:3,  type:"group",  icon:"📋" },
  { id:"g3",  name:"Dikshu Sharma (Lead Guide)",sub:"You: Please share the expected weather...", time:"Yesterday",unread:0,  type:"direct", icon:"👤" },
  { id:"g4",  name:"Suresh Kumar (Accounting)", sub:"Suresh: Payment received from 3 passengers",time:"28 Jun",  unread:0,  type:"direct", icon:"💼" },
  { id:"g5",  name:"Important Updates",         sub:"Neeki Patel: Hotel change in Manali day 3", time:"27 Jun",  unread:0,  type:"group",  icon:"📢" },
  { id:"g6",  name:"Parth Rathod (Operations)", sub:"You: Vehicle details confirmed?",            time:"27 Jun",  unread:0,  type:"direct", icon:"👤" },
  { id:"g7",  name:"All Guides Group",          sub:"Dikshu: Guide briefing tomorrow 8 PM.",     time:"26 Jun",  unread:0,  type:"group",  icon:"🧭" },
  { id:"g8",  name:"MKA-0705 – Batch 1",        sub:"Passenger: Reached Delhi airport.",          time:"26 Jun",  unread:0,  type:"group",  icon:"✈️" },
];

const MOCK_MESSAGES = [
  { id:"m1", sender:"Dikshu Sharma", role:"Lead Guide", avatar:"DS", time:"10:10 AM", text:"Good morning everyone! 👋\nPlease find the meeting point details below.\nReach at 6:00 AM sharp at Majnu Ka Tilla, Delhi.\nOur team will be there with the Tempo Traveller.", reactions:[{emoji:"👍",count:8}], isMine:false },
  { id:"m2", convId:"g1", sender:"Neeki Patel",   role:"Operations", avatar:"NP", time:"10:22 AM", text:"Please carry your original ID proofs.\nAlso ensure your luggage is not more than 15 kg.\nFor any queries, contact us on the given numbers.", reactions:[{emoji:"👍",count:6}], isMine:false },
  { id:"m3", convId:"g2", sender:"Parth Rathod", role:"Operations", avatar:"PR", time:"10:28 AM", text:"Weather update for Manali (Day 2 to Day 4):\nMin 12°C / Max 23°C, light rain expected.\nPlease carry raincoat and proper shoes.", reactions:[], isMine:false },
  { id:"m4", sender:"Hemal Patel",  role:"You",        avatar:"HP", time:"10:30 AM", text:"Thanks team! Have a safe journey everyone.\nSee you all tomorrow! 😊", reactions:[{emoji:"❤️",count:1},{emoji:"👍",count:2}], isMine:true },
];
 
const MOCK_PARTICIPANTS = [H
D  { name:"Dikshu Sharma", role:"Lead Guide",       badge:"Admin" },H
D  { name:"Neeki Patel",   role:"Operations",       badge:"Admin" },H
D  { name:"Suresh Kumar",  role:"Accounting",       badge:"Admin" },H
D  { name:"Parth Rathod",  role:"Operations",       badge:"Admin" },H
D  { name:"Hemal Patel",   role:"You",              badge:"Admin" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
>
:const StatusBadge = ({ status }: { status: string }) => {,
(  const map: Record<string, string> = {P
L    "CONFIRMED":       "bg-emerald-50 text-emerald-700 border-emerald-200",J
F    "PENDING":         "bg-amber-50 text-amber-700 border-amber-200",K
G    "CANCELLED":       "bg-slate-100 text-slate-500 border-slate-200",M
I    "OPTIONAL":        "bg-purple-50 text-purple-700 border-purple-200",P
L    "PAID":            "bg-emerald-50 text-emerald-700 border-emerald-200",J
F    "PARTIALLY PAID":  "bg-amber-50 text-amber-700 border-amber-200",D
@    "UNPAID":          "bg-red-50 text-red-600 border-red-200",G
C    "REFUNDED":        "bg-blue-50 text-blue-700 border-blue-200",G
C    "IN PROGRESS":     "bg-blue-50 text-blue-700 border-blue-200",P
L    "COMPLETED":       "bg-emerald-50 text-emerald-700 border-emerald-200",D
@    "OVERDUE":         "bg-red-50 text-red-600 border-red-200",K
G    "NOT STARTED":     "bg-slate-100 text-slate-500 border-slate-200",P
L    "VERIFIED":        "bg-emerald-50 text-emerald-700 border-emerald-200",D
@    "ACTION REQUIRED": "bg-red-50 text-red-600 border-red-200",	
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-[3px] border text-[9px] font-black uppercase tracking-wider whitespace-nowrap", map[status] || "bg-slate-50 text-slate-500 border-slate-200")}>
      {status}
    </span>	
  );
};
8
4const TypeBadge = ({ type }: { type: string }) => {,
(  const map: Record<string, string> = {2
.    TRAVEL:      "bg-blue-100 text-blue-700",6
2    SIGHTSEEING: "bg-indigo-100 text-indigo-700",6
2    ADVENTURE:   "bg-orange-100 text-orange-700",3
/    COMMUNICATION:"bg-pink-100 text-pink-700",8
4    PAYMENTS:    "bg-emerald-100 text-emerald-700",6
2    DOCUMENTS:   "bg-purple-100 text-purple-700",4
0    HOTELS:      "bg-amber-100 text-amber-700",2
.    TRANSPORT:   "bg-cyan-100 text-cyan-700",2
.    GUIDES:      "bg-teal-100 text-teal-700",4
0    OPERATIONS:  "bg-slate-200 text-slate-700",	
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider", map[type] || "bg-slate-100 text-slate-600")}>
      {type}
    </span>	
  );
};
D
@const PriorityBadge = ({ priority }: { priority: string }) => {,
(  const map: Record<string, string> = {+
'    HIGH:   "bg-red-100 text-red-700",/
+    MEDIUM: "bg-amber-100 text-amber-700",/
+    LOW:    "bg-slate-100 text-slate-600",	
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider", map[priority] || "bg-slate-100 text-slate-600")}>
      {priority}
    </span>	
  );
};
\
Xconst Avatar = ({ initials, className }: { initials: string; className?: string }) => (
  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0", className || "bg-[#F97316]")}>
    {initials}
	  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
B
>// Helper to generate mock bookings for offline/fallback dataQ
Mconst generateMockBookings = (tripId: string, departureDateStr: string) => {
  const mockNames = [
    { name: "Aarav Mehta", gender: "Male", age: 24, phone: "9876543210", pickup: "Ahmedabad", email: "aarav.mehta@example.com" },
    { name: "Priya Sharma", gender: "Female", age: 22, phone: "9812345678", pickup: "Delhi", email: "priya.sharma@example.com" },
    { name: "Rahul Patel", gender: "Male", age: 27, phone: "9901234567", pickup: "Mumbai", email: "rahul.patel@example.com" },
    { name: "Sneha Reddy", gender: "Female", age: 23, phone: "8899887766", pickup: "Bangalore", email: "sneha.reddy@example.com" },
    { name: "Rohan Gupta", gender: "Male", age: 25, phone: "7766554433", pickup: "Vadodara", email: "rohan.gupta@example.com" },
}    { name: "Ananya Rao", gender: "Female", age: 21, phone: "9012345678", pickup: "Delhi", email: "ananya.rao@example.com" }	
  ];
 
  const bookingsArray = [];T
P  const statusOptions = ["Paid in Full", "Partial Payment", "Payment Pending"];

  let passengerCount = 0;%
!  for (let i = 0; i < 40; i++) {=
9    const primaryName = mockNames[i % mockNames.length];#
    const totalAmount = 14500;@
<    const status = statusOptions[i % statusOptions.length];'
#    let advancePaid = totalAmount;,
(    if (status === "Partial Payment") {
      advancePaid = 6000;3
/    } else if (status === "Payment Pending") {
      advancePaid = 0;

    }
z
v    const coTravelersCount = (i % 5 === 0 && passengerCount < 55) ? 2 : (i % 3 === 0 && passengerCount < 56) ? 1 : 0;+
'    const coTravelersList: any[] = [];5
1    for (let c = 0; c < coTravelersCount; c++) {D
@      const coName = mockNames[(i + c + 7) % mockNames.length];!
      coTravelersList.push({,
(        name: coName.name + " (Guest)",#
        gender: coName.gender,6
2        age: coName.age + (c % 2 === 0 ? 1 : -1),!
        phone: coName.phone,(
$        pickupPoint: coName.pickup, 
        email: coName.email

      });
      passengerCount++;

    }
    passengerCount++;

    bookingsArray.push({ 
      id: `BK-${1000 + i}`,&
"      fullName: primaryName.name,&
"      gender: primaryName.gender, 
      age: primaryName.age,$
       phone: primaryName.phone,$
       email: primaryName.email,*
&      pickupCity: primaryName.pickup,
      tripId: tripId,>
:      departureDate: departureDateStr + "T00:00:00.000Z",$
       totalAmount: totalAmount,$
       advancePaid: advancePaid,1
-      createdAt: "2027-06-15T00:00:00.000Z",
      passengers: {
        details: {A
=          roomAllocation: `Room ${101 + Math.floor(i / 3)}`,"
          idProof: "Uploaded"
        },%
!        persons: coTravelersList
      }
    });
  }
  return bookingsArray;
};
1
-export default function DepartureHubPage() {A
=  const [searchParams, setSearchParams] = useSearchParams();?
;  const tripId = searchParams.get("tripId") || "MKA-0705";R
N  const departureDateStr = searchParams.get("departureDate") || "2027-07-05";?
;  const activeTab = searchParams.get("tab") || "overview";o
k  const setActiveTab = (tab: string) => setSearchParams({ tripId, departureDate: departureDateStr, tab });

  // Data states;
7  const [bookings, setBookings] = useState<any[]>([]);E
A  const [itineraryList, setItineraryList] = useState<any[]>([]);5
1  const [loading, setLoading] = useState(false);H
D  const [tripDetails, setTripDetails] = useState<any | null>(null);A
=  const [tripVendors, setTripVendors] = useState<any[]>([]);L
H  const [vendorSummary, setVendorSummary] = useState<any | null>(null);N
J  const [chatMessages, setChatMessages] = useState<any[]>(MOCK_MESSAGES);9
5  const [dbTasks, setDbTasks] = useState<any[]>([]);G
C  const [checklistTasks, setChecklistTasks] = useState<any[]>([]);
"
  // Passengers filter states6
2  const [paxSearch, setPaxSearch] = useState("");A
=  const [paymentFilter, setPaymentFilter] = useState("All");?
;  const [pickupFilter, setPickupFilter] = useState("All");?
;  const [genderFilter, setGenderFilter] = useState("All");+
'  const [page, setPage] = useState(1);

  // Tasks filterG
C  const [taskStatusFilter, setTaskStatusFilter] = useState("All");K
G  const [taskCategoryFilter, setTaskCategoryFilter] = useState("All");

  // Documents filter=
9  const [docCategory, setDocCategory] = useState("all");6
2  const [docSearch, setDocSearch] = useState("");

  // Communication:
6  const [activeConv, setActiveConv] = useState("g1");6
2  const [chatInput, setChatInput] = useState("");9
5  const [chatTab, setChatTab] = useState("message");;
7  const [convFilter, setConvFilter] = useState("All");

  // Payments filterE
A  const [payStatusFilter, setPayStatusFilter] = useState("All");

  // Activities filterD
@  const [actDayFilter, setActDayFilter] = useState("All Days");O
K  const [actTypeFilter, setActTypeFilter] = useState("All Activity Type");L
H  const [actStatusFilter, setActStatusFilter] = useState("All Status");6
2  const [actSearch, setActSearch] = useState("");

  useEffect(() => {(
$    const fetchData = async () => {
      setLoading(true);
      try {b
^        const bookingsRes = await api.get(`/bookings?status=all&tripId=${tripId}&limit=100`);>
:        const allBookings = bookingsRes.data?.data || [];:
6        let filtered = allBookings.filter((b: any) =>\
X          b.tripId === tripId && b.departureDate?.substring(0, 10) === departureDateStr
        );b
^        if (filtered.length === 0) filtered = generateMockBookings(tripId, departureDateStr);#
        setBookings(filtered);
i
e        const itinRes = await api.get(`/ops/itinerary/${tripId}?departureDate=${departureDateStr}`);8
4        setItineraryList(itinRes.data?.data || []);
!
        // Load trip detailsQ
M        const tripRes = await api.get(`/trips/${tripId}`).catch(() => null);*
&        if (tripRes?.data?.success) {1
-          setTripDetails(tripRes.data.data);

        }
=
9        // Load operations hotels, transport, and guides
        const hotelsRes = await api.get(`/ops/hotels/${tripId}?departureDate=${departureDateStr}`).catch(() => ({ data: { data: [] } }));
        const transportRes = await api.get(`/ops/transport/${tripId}?departureDate=${departureDateStr}`).catch(() => ({ data: { data: [] } }));
        const guidesRes = await api.get(`/ops/guides/${tripId}?departureDate=${departureDateStr}`).catch(() => ({ data: { data: [] } }));
7
3        const hotels = hotelsRes.data?.data || [];>
:        const transports = transportRes.data?.data || [];7
3        const guides = guidesRes.data?.data || [];
7
3        // Combine them into tripVendors structure$
         const mappedVendors = [+
'          ...hotels.map((h: any) => ({
            id: h.id,%
!            vendorType: 'hotel',
            vendorId: {%
!              name: h.hotelName,(
$              location: h.location,!
              notes: h.notes
            },Q
M            paymentStatus: h.confirmed === 'CONFIRMED' ? 'paid' : 'pending', 
            notes: h.notes,+
'            agreedCost: h.totalAmount,+
'            paidAmount: h.advancePaid,,
(            balanceDue: h.balanceAmount
          })),/
+          ...transports.map((t: any) => ({
            id: t.id,)
%            vendorType: 'transport',
            vendorId: {'
#              name: t.vehicleType,6
2              location: t.driverName || 'Driver',!
              notes: t.notes
            },K
G            paymentStatus: t.balanceAmount === 0 ? 'paid' : 'pending', 
            notes: t.notes,+
'            agreedCost: t.totalAmount,+
'            paidAmount: t.advancePaid,,
(            balanceDue: t.balanceAmount
          })),+
'          ...guides.map((g: any) => ({
            id: g.id,%
!            vendorType: 'guide',
            vendor: {%
!              name: g.guideName, 
              type: 'guide'
            },P
L            paymentStatus: g.paymentStatus === 'PAID' ? 'paid' : 'pending',,
(            agreedCost: g.agreedAmount,+
'            paidAmount: g.advancePaid,,
(            balanceDue: g.balanceAmount
          }))
        ];
+
'        setTripVendors(mappedVendors);
}
y        const checkRes = await api.get(`/ops/checklists/${tripId}?departureDate=${departureDateStr}`).catch(() => null);L
H        if (checkRes?.data?.success && checkRes.data.data.length > 0) {5
1          setChecklistTasks(checkRes.data.data);
        } else {
          const initRes = await api.post(`/ops/checklists/${tripId}/initialize?departureDate=${departureDateStr}`).catch(() => null);,
(          if (initRes?.data?.success) {6
2            setChecklistTasks(initRes.data.data);
          }

        }-
)      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    fetchData();&
"  }, [tripId, departureDateStr]);
6
2  const handleToggleTask = async (task: any) => {

    try {0
,      const isCompleted = task.isCompleted;`
\      const endpoint = isCompleted ? "/ops/checklists/reopen" : "/ops/checklists/complete";x
t      const notes = isCompleted ? "Reopened via departure hub checklist" : "Completed via departure hub checklist";H
D      const res = await api.post(endpoint, { id: task.id, notes });#
      if (res.data?.success) {[
W        toast.success(`Task ${isCompleted ? 'reopened' : 'completed'} successfully!`);}
y        const checkRes = await api.get(`/ops/checklists/${tripId}?departureDate=${departureDateStr}`).catch(() => null);+
'        if (checkRes?.data?.success) {5
1          setChecklistTasks(checkRes.data.data);

        }
      }
    } catch (err) {:
6      toast.error("Failed to update checklist item");

    }	
  };
P
L  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);G
C  const [bookingModalOpen, setBookingModalOpen] = useState(false);
@
<  const handleOpenBookingDetails = (bookingId: string) => {a
]    const b = bookings.find((bk: any) => bk.id === bookingId || bk.bookingId === bookingId);
    if (b) {!
      setSelectedBooking(b);%
!      setBookingModalOpen(true);
    } else {4
0      toast.error("Booking details not found");

    }	
  };
(
$  const handleSendMessage = () => {'
#    if (!chatInput.trim()) return;
    const newMsg = {(
$      id: `msg-sent-${Date.now()}`,
      convId: activeConv,"
      sender: "Suresh Kumar",
      avatar: "SK",&
"      role: "Operations Manager",
      text: chatInput,`
\      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
      reactions: []
    };4
0    setChatMessages(prev => [...prev, newMsg]);
    setChatInput("");(
$    toast.success("Message sent!");	
  };
G
C  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);:
6  const [newTaskName, setNewTaskName] = useState("");G
C  const [newTaskStage, setNewTaskStage] = useState("PRE_TRIP_7D");<
8  const [newTaskNotes, setNewTaskNotes] = useState("");
?
;  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();#
    if (!newTaskName.trim()) {0
,      toast.error("Task name is required");
      return;

    }

    try {t
p      const res = await api.post(`/ops/checklists/create?tripId=${tripId}&departureDate=${departureDateStr}`, {#
        taskName: newTaskName,!
        stage: newTaskStage, 
        notes: newTaskNotes

      });#
      if (res.data?.success) {9
5        toast.success("Task created successfully!");}
y        const checkRes = await api.get(`/ops/checklists/${tripId}?departureDate=${departureDateStr}`).catch(() => null);+
'        if (checkRes?.data?.success) {5
1          setChecklistTasks(checkRes.data.data);

        }(
$        setAddTaskModalOpen(false); 
        setNewTaskName("");!
        setNewTaskNotes("");
      }
    } catch (err) {:
6      toast.error("Failed to create checklist task");

    }	
  };
?
;  const [timelineView, setTimelineView] = useState(false);I
E  const [editDepartureOpen, setEditDepartureOpen] = useState(false);G
C  const [addPassengerOpen, setAddPassengerOpen] = useState(false);E
A  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
"
  // New Passenger Form State8
4  const [newPaxName, setNewPaxName] = useState("");:
6  const [newPaxPhone, setNewPaxPhone] = useState("");8
4  const [newPaxAge, setNewPaxAge] = useState("24");@
<  const [newPaxGender, setNewPaxGender] = useState("Male");A
=  const [newPaxAmount, setNewPaxAmount] = useState("14000");
+
'  // Edit Departure Details Form State>
:  const [editGuideName, setEditGuideName] = useState("");^
Z  const [editVehicleDetails, setEditVehicleDetails] = useState("Tempo Traveller 17 Str");A
=  const [editStatus, setEditStatus] = useState("CONFIRMED");

  // Hotel Edit StatesA
=  const [editHotelOpen, setEditHotelOpen] = useState(false);B
>  const [selectedHotelId, setSelectedHotelId] = useState("");>
:  const [hotelNameForm, setHotelNameForm] = useState("");F
B  const [hotelLocationForm, setHotelLocationForm] = useState("");F
B  const [hotelRoomTypeForm, setHotelRoomTypeForm] = useState("");?
;  const [hotelRoomsForm, setHotelRoomsForm] = useState(1);=
9  const [hotelCostForm, setHotelCostForm] = useState(0);=
9  const [hotelPaidForm, setHotelPaidForm] = useState(0);S
O  const [hotelConfirmedForm, setHotelConfirmedForm] = useState("UNCONFIRMED");@
<  const [hotelNotesForm, setHotelNotesForm] = useState("");

  // Transport Edit StatesI
E  const [editTransportOpen, setEditTransportOpen] = useState(false);J
F  const [selectedTransportId, setSelectedTransportId] = useState("");B
>  const [vehicleTypeForm, setVehicleTypeForm] = useState("");<
8  const [capacityForm, setCapacityForm] = useState(13);6
2  const [routeForm, setRouteForm] = useState("");@
<  const [driverNameForm, setDriverNameForm] = useState("");B
>  const [driverPhoneForm, setDriverPhoneForm] = useState("");E
A  const [transportCostForm, setTransportCostForm] = useState(0);E
A  const [transportPaidForm, setTransportPaidForm] = useState(0);H
D  const [transportNotesForm, setTransportNotesForm] = useState("");
2
.  const handleOpenEditHotel = (row: any) => {-
)    const raw = row.rawAssignment || {};$
     setSelectedHotelId(row.id);<
8    setHotelNameForm(raw.hotelName || row.hotel || "");=
9    setHotelLocationForm(raw.location || row.sub || "");I
E    setHotelRoomTypeForm(raw.roomType || row.type || "Deluxe Stay");3
/    setHotelRoomsForm(raw.numberOfRooms || 1);0
,    setHotelCostForm(raw.totalAmount || 0);0
,    setHotelPaidForm(raw.advancePaid || 0);l
h    setHotelConfirmedForm(raw.confirmed || (row.status === "CONFIRMED" ? "CONFIRMED" : "UNCONFIRMED"));,
(    setHotelNotesForm(raw.notes || ""); 
    setEditHotelOpen(true);	
  };
6
2  const handleOpenEditTransport = (row: any) => {-
)    const raw = row.rawAssignment || {};(
$    setSelectedTransportId(row.id);?
;    setVehicleTypeForm(raw.vehicleType || row.type || "");-
)    setCapacityForm(raw.capacity || 13);'
#    setRouteForm(raw.route || "");1
-    setDriverNameForm(raw.driverName || "");3
/    setDriverPhoneForm(raw.driverPhone || "");4
0    setTransportCostForm(raw.totalAmount || 0);4
0    setTransportPaidForm(raw.advancePaid || 0);0
,    setTransportNotesForm(raw.notes || "");$
     setEditTransportOpen(true);	
  };
D
@  const handleEditHotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {V
R      await api.post(`/ops/hotels/${tripId}?departureDate=${departureDateStr}`, {!
        id: selectedHotelId,&
"        hotelName: hotelNameForm,)
%        location: hotelLocationForm,)
%        roomType: hotelRoomTypeForm,+
'        numberOfRooms: hotelRoomsForm,(
$        totalAmount: hotelCostForm,(
$        advancePaid: hotelPaidForm,+
'        confirmed: hotelConfirmedForm,"
        notes: hotelNotesForm

      });@
<      toast.success("Hotel details updated successfully!");#
      setEditHotelOpen(false);
      // Refresh$
       window.location.reload();
    } catch (err) {
      console.error(err);:
6      toast.error("Failed to update hotel details.");

    }	
  };
H
D  const handleEditTransportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {Y
U      await api.post(`/ops/transport/${tripId}?departureDate=${departureDateStr}`, {%
!        id: selectedTransportId,*
&        vehicleType: vehicleTypeForm,$
         capacity: capacityForm,
        route: routeForm,(
$        driverName: driverNameForm,*
&        driverPhone: driverPhoneForm,,
(        totalAmount: transportCostForm,,
(        advancePaid: transportPaidForm,&
"        notes: transportNotesForm

      });D
@      toast.success("Transport details updated successfully!");'
#      setEditTransportOpen(false);
      // Refresh$
       window.location.reload();
    } catch (err) {
      console.error(err);>
:      toast.error("Failed to update transport details.");

    }	
  };

  // Train Booking StatesA
=  const [trainBookings, setTrainBookings] = useState(() => {D
@    const key = `train_bookings_${tripId}_${departureDateStr}`;1
-    const saved = localStorage.getItem(key);
    if (saved) {
      try {&
"        return JSON.parse(saved);
      } catch (e) {}

    }
    return [
      {
        id: "train-1",/
+        trainName: "14416 / SHATABDI EXP",#
        pnr: "2456 7890 1234",$
         from: "Amritsar (ASR)",#
        to: "Ahmedabad (ADI)",!
        depTime: "04:10 PM",!
        arrTime: "09:45 PM",
        depStation: "ASR",
        arrStation: "ADI",!
        date: "13 Jul 2027",
        dayWd: "Sun",
        seats: "57 / 60", 
        status: "CONFIRMED"
      }
    ];

  });
A
=  const [editTrainOpen, setEditTrainOpen] = useState(false);B
>  const [selectedTrainId, setSelectedTrainId] = useState("");>
:  const [trainNameForm, setTrainNameForm] = useState("");<
8  const [trainPnrForm, setTrainPnrForm] = useState("");>
:  const [trainFromForm, setTrainFromForm] = useState("");:
6  const [trainToForm, setTrainToForm] = useState("");D
@  const [trainDepTimeForm, setTrainDepTimeForm] = useState("");D
@  const [trainArrTimeForm, setTrainArrTimeForm] = useState("");>
:  const [trainDateForm, setTrainDateForm] = useState("");@
<  const [trainSeatsForm, setTrainSeatsForm] = useState("");K
G  const [trainStatusForm, setTrainStatusForm] = useState("CONFIRMED");
4
0  const handleOpenEditTrain = (train: any) => {&
"    setSelectedTrainId(train.id);+
'    setTrainNameForm(train.trainName);$
     setTrainPnrForm(train.pnr);&
"    setTrainFromForm(train.from);"
    setTrainToForm(train.to);,
(    setTrainDepTimeForm(train.depTime);,
(    setTrainArrTimeForm(train.arrTime);&
"    setTrainDateForm(train.date);(
$    setTrainSeatsForm(train.seats);*
&    setTrainStatusForm(train.status); 
    setEditTrainOpen(true);	
  };
>
:  const handleEditTrainSubmit = (e: React.FormEvent) => {
    e.preventDefault();8
4    const updated = trainBookings.map((t: any) => {*
&      if (t.id === selectedTrainId) {
        return {
          ...t,(
$          trainName: trainNameForm,!
          pnr: trainPnrForm,#
          from: trainFromForm,
          to: trainToForm,)
%          depTime: trainDepTimeForm,)
%          arrTime: trainArrTimeForm,#
          date: trainDateForm,%
!          seats: trainSeatsForm,&
"          status: trainStatusForm
        };
      }
      return t;
    });#
    setTrainBookings(updated);g
c    localStorage.setItem(`train_bookings_${tripId}_${departureDateStr}`, JSON.stringify(updated));F
B    toast.success("Train booking details updated successfully!");!
    setEditTrainOpen(false);	
  };
*
&  const handlePrintManifest = () => {7
3    const printWindow = window.open("", "_blank");
    if (!printWindow) {Q
M      toast.error("Popup blocker prevented printing. Please allow popups.");
      return;

    }	
    7
3    const rowsHtml = allPassengers.map((p, i) => `9
5      <tr style="border-bottom: 1px solid #E2E8F0;">Z
V        <td style="padding: 10px; text-align: center; font-size: 11px;">${i + 1}</td>Z
V        <td style="padding: 10px; font-weight: bold; font-size: 11px;">${p.name}</td>L
H        <td style="padding: 10px; font-size: 11px;">${p.bookingId}</td>k
g        <td style="padding: 10px; font-size: 11px; font-weight: bold; color: #1E293B;">${p.phone}</td>T
P        <td style="padding: 10px; font-size: 11px;">${p.gender} (${p.age})</td>N
J        <td style="padding: 10px; font-size: 11px;">${p.pickupPoint}</td>t
p        <td style="padding: 10px; font-family: monospace; font-size: 11px; font-weight: bold;">${p.roomNo}</td>
      </tr>
    `).join("");

    const manifestHtml = `
      <html>
        <head>R
N          <title>Passenger Manifest - ${tripId} (${departureDateStr})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #1E293B; }o
k            table { width: 100%; border-collapse: collapse; margin-top: 25px; border: 1px solid #E2E8F0; }
            th { background-color: #F8FAFC; border-bottom: 2px solid #E2E8F0; padding: 12px 10px; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #475569; text-align: left; }m
i            h1 { font-size: 22px; margin: 0; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; }
            .header-meta { display: flex; gap: 30px; margin-top: 12px; font-size: 11px; color: #475569; border-bottom: 2px dashed #E2E8F0; padding-bottom: 18px; }P
L            .meta-item { display: flex; flex-direction: column; gap: 3px; }n
j            .meta-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #94A3B8; }R
N            .meta-val { font-size: 12px; font-weight: bold; color: #0F172A; }
          </style>
        </head>
        <body>*
&          <h1>DEPARTURE MANIFEST</h1>(
$          <div class="header-meta">~
z            <div class="meta-item"><span class="meta-label">Trip Code</span><span class="meta-val">${tripId}</span></div>
            <div class="meta-item"><span class="meta-label">Itinerary</span><span class="meta-val">${tripDetails?.title || "Spiti Valley Road Trip"}</span></div>
            <div class="meta-item"><span class="meta-label">Date</span><span class="meta-val">${departureDateStr}</span></div>
            <div class="meta-item"><span class="meta-label">Tour Lead</span><span class="meta-val">${leadGuideName}</span></div>
            <div class="meta-item"><span class="meta-label">Pax Count</span><span class="meta-val">${allPassengers.length} Verified</span></div>
          </div>
          <table>
            <thead>
              <tr>K
G                <th style="width: 40px; text-align: center;">S.No</th>,
(                <th>Passenger Name</th>(
$                <th>Booking ID</th>*
&                <th>Phone Number</th>*
&                <th>Gender (Age)</th>*
&                <th>Pickup Point</th>-
)                <th>Room Allocation</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>-
)            window.onload = function() {"
              window.print();"
              window.close();
            };
          </script>
        </body>
      </html>
    `;2
.    printWindow.document.write(manifestHtml);&
"    printWindow.document.close();	
  };
E
A  const handleDownloadCSV = (data: any[], filename: string) => {*
&    if (!data || data.length === 0) {6
2      toast.error("No data available to export");
      return;

    }-
)    const cleanData = data.map(item => {(
$      const cleanObj = { ...item };#
      delete cleanObj.rawTask;
      delete cleanObj.id;
      return cleanObj;
    });=
9    const headers = Object.keys(cleanData[0]).join(",");+
'    const rows = cleanData.map(item =>
      Object.values(item)@
<        .map(val => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );[
W    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");2
.    const encodedUri = encodeURI(csvContent);2
.    const link = document.createElement("a");/
+    link.setAttribute("href", encodedUri);1
-    link.setAttribute("download", filename);)
%    document.body.appendChild(link);
    link.click();)
%    document.body.removeChild(link);=
9    toast.success(`${filename} exported successfully!`);	
  };
G
C  const handleAddPassengerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();9
5    if (!newPaxName.trim() || !newPaxPhone.trim()) {6
2      toast.error("Name and Phone are required");
      return;

    }6
2    // Simulate creating passenger booking record
    const dummyBooking = {&
"      id: `bk-new-${Date.now()}`,J
F      bookingId: `BK-${Math.floor(100000 + Math.random() * 900000)}`, 
      fullName: newPaxName,
      name: newPaxName,
      phone: newPaxPhone,
      mobile: newPaxPhone,*
&      age: parseInt(newPaxAge) || 24, 
      gender: newPaxGender,
      tripId,D
@      tripName: tripDetails?.title || "Spiti Valley Road Trip",+
'      departureDate: departureDateStr,8
4      totalAmount: parseInt(newPaxAmount) || 14000,
      advancePaid: 0,<
8      remainingAmount: parseInt(newPaxAmount) || 14000,
      status: "confirmed",/
+      createdAt: new Date().toISOString(),
      passengers: {
        details: {
          idProof: null,$
           roomAllocation: "TBD"
        },
        persons: []
      }
    };6
2    setBookings(prev => [dummyBooking, ...prev]);N
J    toast.success("Passenger added successfully to departure hub list!");$
     setAddPassengerOpen(false);
    setNewPaxName("");
    setNewPaxPhone("");	
  };
B
>  const handleEditDepartureSubmit = (e: React.FormEvent) => {
    e.preventDefault();)
%    setLeadGuideName(editGuideName);B
>    toast.success("Departure details updated successfully!");%
!    setEditDepartureOpen(false);	
  };
'
#  // Dynamic Overview Calculations$
   const stats = useMemo(() => {Y
U    const confirmedBookings = bookings.filter((b: any) => b.status !== "cancelled");	
    '
#    // Revenue & Customer Payments{
w    const totalRevenue = confirmedBookings.reduce((sum: number, b: any) => sum + (b.totalAmount || b.amount || 0), 0);o
k    const customerPaid = confirmedBookings.reduce((sum: number, b: any) => sum + (b.advancePaid || 0), 0);z
v    const customerOutstanding = confirmedBookings.reduce((sum: number, b: any) => sum + (b.remainingAmount || 0), 0);z
v    const totalParticipants = confirmedBookings.reduce((sum: number, b: any) => sum + (b.numberOfTravelers || 1), 0);x
t    const outstandingParticipantsCount = confirmedBookings.filter((b: any) => (b.remainingAmount || 0) > 0).length;
=
9    // Vendor Payments (filtered from tripVendors state)
{    const hotelsCost = tripVendors.filter(v => v.vendorType === 'hotel').reduce((sum, v) => sum + (v.agreedCost || 0), 0);
{    const hotelsPaid = tripVendors.filter(v => v.vendorType === 'hotel').reduce((sum, v) => sum + (v.paidAmount || 0), 0);
    const transportsCost = tripVendors.filter(v => v.vendorType === 'transport').reduce((sum, v) => sum + (v.agreedCost || 0), 0);
    const transportsPaid = tripVendors.filter(v => v.vendorType === 'transport').reduce((sum, v) => sum + (v.paidAmount || 0), 0);
{    const guidesCost = tripVendors.filter(v => v.vendorType === 'guide').reduce((sum, v) => sum + (v.agreedCost || 0), 0);
{    const guidesPaid = tripVendors.filter(v => v.vendorType === 'guide').reduce((sum, v) => sum + (v.paidAmount || 0), 0);
J
F    const totalVendorCost = hotelsCost + transportsCost + guidesCost;J
F    const totalVendorPaid = hotelsPaid + transportsPaid + guidesPaid;G
C    const totalVendorPayables = totalVendorCost - totalVendorPaid;
:
6    const estProfit = totalRevenue - totalVendorCost;f
b    const profitPercent = totalRevenue > 0 ? ((estProfit / totalRevenue) * 100).toFixed(1) : "0";
o
k    const customerPaidPercent = totalRevenue > 0 ? ((customerPaid / totalRevenue) * 100).toFixed(1) : "0";}
y    const customerOutstandingPercent = totalRevenue > 0 ? ((customerOutstanding / totalRevenue) * 100).toFixed(1) : "0";v
r    const vendorPaidPercent = totalVendorCost > 0 ? ((totalVendorPaid / totalVendorCost) * 100).toFixed(1) : "0";}
y    const vendorPayablePercent = totalVendorCost > 0 ? ((totalVendorPayables / totalVendorCost) * 100).toFixed(1) : "0";

    return {
      totalRevenue,
      customerPaid,
      customerOutstanding,
      totalParticipants,(
$      outstandingParticipantsCount,
      totalVendorCost,
      totalVendorPaid,
      totalVendorPayables,
      estProfit,
      profitPercent,
      customerPaidPercent,&
"      customerOutstandingPercent,
      vendorPaidPercent,
      vendorPayablePercent
    };#
  }, [bookings, tripVendors]);
7
3  // Find lead guide and vehicles from tripVendorsJ
F  const [leadGuideName, setLeadGuideName] = useState("Assign Guide");g
c  const [itineraryViewMode, setItineraryViewMode] = useState<"customer" | "internal">("internal");W
S  const [expandedDescs, setExpandedDescs] = useState<Record<number, boolean>>({});U
Q  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});K
G  const [quickEditModalOpen, setQuickEditModalOpen] = useState(false);O
K  const [editingDayIdx, setEditingDayIdx] = useState<number | null>(null);B
>  const [editingDayData, setEditingDayData] = useState<any>({
    title: "",
    stay: "",
    meals: "",
    activities: "",
    departureTime: "",
    arrivalTime: "",
    distance: "",
    drivingHours: "",
    assignedVehicle: "",
    description: ""

  });K
G  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  useEffect(() => {F
B    const lead = tripVendors.find(v => v.vendorType === 'guide');
    if (lead) {.
*      setLeadGuideName(lead.vendor.name);

    }
  }, [tripVendors]);
?
;  const handleQuickAdd = (idx: number, field: string) => {
    setEditingDayIdx(idx);6
2    const rawItin = tripDetails?.itinerary || [];(
$    const day = rawItin[idx] || {};
    setEditingDayData({2
.      title: day.title || day.location || "", 
      stay: day.stay || "","
      meals: day.meals || "",h
d      activities: Array.isArray(day.activities) ? day.activities.join(", ") : day.activities || "",2
.      departureTime: day.departureTime || "",.
*      arrivalTime: day.arrivalTime || "",(
$      distance: day.distance || "",0
,      drivingHours: day.drivingHours || "",6
2      assignedVehicle: day.assignedVehicle || "",-
)      description: day.description || ""
    });%
!    setQuickEditModalOpen(true);	
  };
B
>  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();<
8    if (editingDayIdx === null || !tripDetails) return;


    try {G
C      const updatedItinerary = [...(tripDetails.itinerary || [])];
      =
9      while (updatedItinerary.length <= editingDayIdx) {$
         updatedItinerary.push({0
,          day: updatedItinerary.length + 1,
          title: "",
          description: "",
          stay: "",
          meals: "",
          activities: ""
        });
      }
.
*      updatedItinerary[editingDayIdx] = {0
,        ...updatedItinerary[editingDayIdx],$
         day: editingDayIdx + 1,)
%        title: editingDayData.title,'
#        stay: editingDayData.stay,)
%        meals: editingDayData.meals,3
/        activities: editingDayData.activities,9
5        departureTime: editingDayData.departureTime,5
1        arrivalTime: editingDayData.arrivalTime,/
+        distance: editingDayData.distance,7
3        drivingHours: editingDayData.drivingHours,=
9        assignedVehicle: editingDayData.assignedVehicle,4
0        description: editingDayData.description
	      };
B
>      const res = await api.put(`/trips/${tripDetails.id}`, {(
$        itinerary: updatedItinerary

      });
5
1      if (res.data?.success || res.data?.data) {+
'        setTripDetails(res.data.data);B
>        toast.success("Itinerary day updated successfully!");*
&        setQuickEditModalOpen(false);
      } else {<
8        toast.error("Failed to update itinerary day.");
      }
    } catch (err: any) {
      console.error(err);H
D      toast.error("An error occurred while saving the itinerary.");

    }	
  };
S
O  const [editingHotelIdx, setEditingHotelIdx] = useState<number | null>(null);C
?  const [hotelModalOpen, setHotelModalOpen] = useState(false);F
B  const [editingHotelData, setEditingHotelData] = useState<any>({
    hotel: "",
    dest: "",
    type: "",*
&    plan: "MAP (Breakfast + Dinner)",
    roomsCount: 5,
    guestsCount: 10,
    nights: 1,
    status: "PENDING",
    voucher: "",
    amt: 0,
    paidAmt: 0

  });

  const [passengerAllocations, setPassengerAllocations] = useState<Record<string, { room: string, vehicle: string, seat: string }>>({});
<
8  const [allocFleet, setAllocFleet] = useState<any[]>([H
D    { id: "tempo-1", vehicleType: "17 Seater Tempo", capacity: 17 }

  ]);~
z    { id: "tempo-1", name: "Tempo 1", vehicleType: "13 Seater Tempo", capacity: 13, cost: 45000, vendor: "ABC Travels" },~
z    { id: "tempo-2", name: "Tempo 2", vehicleType: "17 Seater Tempo", capacity: 17, cost: 58000, vendor: "XYZ Travels" },v
r    { id: "car-1", name: "Car 1", vehicleType: "6 Seater Car", capacity: 6, cost: 22000, vendor: "Self-driven" },

  ]);
O
K  const [newVehicleType, setNewVehicleType] = useState("17 Seater Tempo");@
<  const [newVehicleName, setNewVehicleName] = useState("");@
<  const [newVehicleCost, setNewVehicleCost] = useState("");D
@  const [newVehicleVendor, setNewVehicleVendor] = useState("");
9
5  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();a
]    const cap = newVehicleType.includes("17") ? 17 : newVehicleType.includes("13") ? 13 : 6;
    const newV = {'
#      id: `vehicle-${Date.now()}`,D
@      name: newVehicleName || `Tempo ${allocFleet.length + 1}`,'
#      vehicleType: newVehicleType,
      capacity: cap,3
/      cost: parseInt(newVehicleCost) || 35000,7
3      vendor: newVehicleVendor || "General Vendor"
    };.
*    setAllocFleet([...allocFleet, newV]);
    setNewVehicleName("");
    setNewVehicleCost("");!
    setNewVehicleVendor("");M
I    toast.success(`Added ${newV.name} (${newV.vehicleType}) to fleet!`);	
  };
4
0  const handleDeleteVehicle = (id: string) => {<
8    setAllocFleet(allocFleet.filter(v => v.id !== id));2
.    toast.info("Removed vehicle from fleet");	
  };
*
&  const handleCopyTempoList = () => {;
7    let txt = "*Tempo List (for WhatsApp Group)*\n\n";5
1    const groups: Record<string, string[]> = {};2
.    computedVehicleAllocations.forEach(v => {4
0      const vName = v.vehicleType || "Tempo 1";2
.      if (!groups[vName]) groups[vName] = [];.
*      groups[vName].push(v.travelerName);
    });
=
9    Object.entries(groups).forEach(([vName, names]) => {V
R      txt += `🚌 *${vName}* — ${names.join(", ")} [${names.length} names]\n`;
    });
,
(    navigator.clipboard.writeText(txt);C
?    toast.success("WhatsApp Tempo List copied to clipboard!");	
  };
)
%  const handleCopyRoomList = () => {:
6    let txt = "*Room List (for WhatsApp Group)*\n\n";P
L    const groups: Record<string, { gender: string, names: string[] }> = {};/
+    computedRoomAllocations.forEach(r => {b
^      if (!groups[r.roomNumber]) groups[r.roomNumber] = { gender: r.genderGroup, names: [] };;
7      groups[r.roomNumber].names.push(r.travelerName);
    });
=
9    Object.entries(groups).forEach(([roomNo, data]) => {
      txt += `🏢 *${roomNo}* — ${data.names.join(", ")} (${data.gender === "BOYS" ? "Boys" : data.gender === "GIRLS" ? "Girls" : "Couples"})\n`;
    });
,
(    navigator.clipboard.writeText(txt);B
>    toast.success("WhatsApp Room List copied to clipboard!");	
  };
6
2  const computedRoomAllocations = useMemo(() => { 
    const list: any[] = [];J
F    Object.entries(passengerAllocations).forEach(([name, alloc]) => {S
O      if (alloc.room && alloc.room !== "Unassigned" && alloc.room !== "—") {
        const gender = name.includes("Das") ? "COUPLE" : (name === "Sneha Reddy" || name === "Pooja Hegde") ? "GIRLS" : "BOYS";
        list.push({&
"          roomNumber: alloc.room,"
          travelerName: name,#
          genderGroup: gender,!
          roomType: "Double"
        });
      }
    });
    return list;"
  }, [passengerAllocations]);
9
5  const computedVehicleAllocations = useMemo(() => { 
    const list: any[] = [];J
F    Object.entries(passengerAllocations).forEach(([name, alloc]) => {\
X      if (alloc.vehicle && alloc.vehicle !== "Unassigned" && alloc.vehicle !== "—") {
        list.push({"
          fleetId: "tempo-1",*
&          vehicleType: alloc.vehicle,&
"          seatNumber: alloc.seat,!
          travelerName: name
        });
      }
    });
    return list;"
  }, [passengerAllocations]);
C
?  const [sharingPref, setSharingPref] = useState<string>("3");J
F  const [sameGenderEnforced, setSameGenderEnforced] = useState(true);H
D  const [prioritizeCouples, setPrioritizeCouples] = useState(true);B
>  const [fallbackToQuad, setFallbackToQuad] = useState(true);
0
,  const handleTriggerAutoAllocate = () => {3
/    const newAllocs: Record<string, any> = {};
    let roomNum = 1;
    let seatNum = 1;
#
    // Filter active travelersT
P    const activeTravelers = allPassengers.filter(p => p.notes !== "Cancelled");
M
I    // Separate couples (same last name or co-travelers booked together)
    const couples = activeTravelers.filter(p => p.name.includes("Das") || p.name.includes("Sharma") && p.name.includes("Amit"));s
o    const sameGenderGirls = activeTravelers.filter(p => p.name === "Sneha Reddy" || p.name === "Pooja Hegde");q
m    const males = activeTravelers.filter(p => p.gender === "Male" && !couples.find(c => c.name === p.name));
    const females = activeTravelers.filter(p => p.gender === "Female" && !couples.find(c => c.name === p.name) && !sameGenderGirls.find(g => g.name === p.name));
$
     // 1. Couples for 2-sharing7
3    if (prioritizeCouples && couples.length > 0) {(
$      couples.forEach((p, idx) => {"
        newAllocs[p.name] = {,
(          room: `Group No. ${roomNum}`,*
&          vehicle: "17 Seater Tempo",&
"          seat: String(seatNum++)
        };*
&        if (idx % 2 === 1) roomNum++;

      });

    }
1
-    // 2. Same gender female pairs in double*
&    if (sameGenderGirls.length > 0) {0
,      sameGenderGirls.forEach((p, idx) => {"
        newAllocs[p.name] = {,
(          room: `Group No. ${roomNum}`,*
&          vehicle: "17 Seater Tempo",&
"          seat: String(seatNum++)
        };*
&        if (idx % 2 === 1) roomNum++;

      });

    }
0
,    // 3. Males sharing (default 3 sharing)7
3    const targetSize = parseInt(sharingPref) || 3;
    let maleCount = 0;
    males.forEach((p) => { 
      newAllocs[p.name] = {*
&        room: `Group No. ${roomNum}`,(
$        vehicle: "17 Seater Tempo",$
         seat: String(seatNum++)
	      };
      maleCount++;)
%      if (maleCount >= targetSize) {
        maleCount = 0;
        roomNum++;
      }
    });

    if (maleCount > 0) {:
6      if (fallbackToQuad && maleCount < targetSize) {=
9        // Fallback: merge into quad with the same groupU
Q        toast.info("Fallback rule applied: leftovers merged into quad sharing");
      } else {
        roomNum++;
      }

    }
2
.    // 4. Females sharing (default 3 sharing)
    let femaleCount = 0;!
    females.forEach((p) => { 
      newAllocs[p.name] = {*
&        room: `Group No. ${roomNum}`,(
$        vehicle: "17 Seater Tempo",$
         seat: String(seatNum++)
	      };
      femaleCount++;+
'      if (femaleCount >= targetSize) {
        femaleCount = 0;
        roomNum++;
      }
    });
,
(    setPassengerAllocations(newAllocs);m
i    toast.success(`Allocated matching rules: ${sharingPref}-sharing rooms, same-gender groups locked.`);	
  };
6
2  const handleHotelEditClick = (idx: number) => {!
    setEditingHotelIdx(idx);-
)    const hotel = hotelsList[idx] || {};
    setEditingHotelData({$
       hotel: hotel.hotel || "","
      dest: hotel.dest || "","
      type: hotel.type || "",:
6      plan: hotel.plan || "MAP (Breakfast + Dinner)",-
)      roomsCount: hotel.roomsCount || 5,0
,      guestsCount: hotel.guestsCount || 10,%
!      nights: hotel.nights || 1,-
)      status: hotel.status || "PENDING",(
$      voucher: hotel.voucher || "",
      amt: hotel.amt || 0,&
"      paidAmt: hotel.paidAmt || 0
    });!
    setHotelModalOpen(true);	
  };
<
8  const handleSaveHotelEdit = (e: React.FormEvent) => {
    e.preventDefault();.
*    if (editingHotelIdx === null) return;)
%    const updated = [...hotelsList];%
!    updated[editingHotelIdx] = {'
#      ...updated[editingHotelIdx],
      ...editingHotelData,9
5      rooms: `${editingHotelData.roomsCount} Rooms`,<
8      roomSub: `${editingHotelData.guestsCount} Guests`
    }; 
    setHotelsList(updated);"
    setHotelModalOpen(false);N
J    toast.success(`Updated stay details for Day ${editingHotelIdx + 1}`);	
  };
K
G  const [roadVehiclesList, setRoadVehiclesList] = useState<any[]>([]);[
W  const [editingTransportIdx, setEditingTransportIdx] = useState<number | null>(null);K
G  const [transportModalOpen, setTransportModalOpen] = useState(false);N
J  const [editingTransportData, setEditingTransportData] = useState<any>({
    type: "",
    cap: "",
    capacityNum: 26,
    seatsBooked: 26,
    plate: "",
    model: "",
    total: "",
    paid: ""

  });
:
6  const handleTransportEditClick = (idx: number) => {%
!    setEditingTransportIdx(idx);2
.    const item = roadVehiclesList[idx] || {};"
    setEditingTransportData({0
,      type: item.type || "Tempo Traveller",(
$      cap: item.cap || "26 Seater",/
+      capacityNum: item.capacityNum || 26,/
+      seatsBooked: item.seatsBooked || 26,#
      plate: item.plate || "",#
      model: item.model || "",;
7      total: item.total?.replace(/,/g, '') || "63000",4
0      paid: item.paid?.replace(/,/g, '') || "0"
    });%
!    setTransportModalOpen(true);	
  };
@
<  const handleSaveTransportEdit = (e: React.FormEvent) => {
    e.preventDefault();2
.    if (editingTransportIdx === null) return;/
+    const updated = [...roadVehiclesList];D
@    const totalVal = parseInt(editingTransportData.total) || 0;B
>    const paidVal = parseInt(editingTransportData.paid) || 0;+
'    const dueVal = totalVal - paidVal;
)
%    updated[editingTransportIdx] = {+
'      ...updated[editingTransportIdx],#
      ...editingTransportData,^
Z      seats: `${editingTransportData.seatsBooked} / ${editingTransportData.capacityNum}`,3
/      total: totalVal.toLocaleString('en-IN'),1
-      paid: paidVal.toLocaleString('en-IN'),.
*      due: dueVal.toLocaleString('en-IN')
    };&
"    setRoadVehiclesList(updated);&
"    setTransportModalOpen(false);A
=    toast.success(`Updated transport details successfully`);	
  };

  useEffect(() => {B
>    const transAssignments = tripVendors.filter((v: any) => {P
L      const vendorObj = typeof v.vendorId === 'object' ? v.vendorId : null;>
:      const type = vendorObj?.type || v.vendorType || '';'
#      return type === 'transport';
    });
+
'    if (transAssignments.length > 0) {G
C      const list = transAssignments.map((v: any, idx: number) => {l
h        const vendorObj = typeof v.vendorId === 'object' ? v.vendorId : { name: 'Assigned Transport' };$
         const dayNum = idx + 1;I
E        const { wd, date } = getDayDateAndWd(departureDateStr, idx);<
8        const dest = tripDetails?.location || "Manali";
        return {
          id: v.id,'
#          type: "Tempo Traveller",.
*          cap: v.capacity || "26 Seater",V
R          plate: v.notes || "17 Seater Tempo = 63000 (15th till 23rd July 2026)",3
/          model: v.model || "Force Traveller",&
"          vendor: vendorObj.name,;
7          phone: vendorObj.phone || "+91 98765 43210",!
          from: "Ahmedabad",Q
M          fromTime: `${date.split(" ")[0]} ${date.split(" ")[1]}, 06:00 AM`,
          to: dest,O
K          toTime: `${date.split(" ")[0]} ${date.split(" ")[1]}, 06:00 PM`,C
?          days: `${date.split(" ")[0]} ${date.split(" ")[1]}`,#
          daysCount: "2 Days",H
D          seats: `${v.seatsBooked || 26} / ${v.capacityNum || 26}`,0
,          seatsBooked: v.seatsBooked || 26,0
,          capacityNum: v.capacityNum || 26,H
D          total: v.agreedCost?.toLocaleString('en-IN') || "63,000",B
>          paid: v.paidAmount?.toLocaleString('en-IN') || "0",\
X          due: ((v.agreedCost || 63000) - (v.paidAmount || 0)).toLocaleString('en-IN'),D
@          status: v.paymentStatus?.toUpperCase() || 'CONFIRMED'
        };

      });%
!      setRoadVehiclesList(list);
    } else { 
      setRoadVehiclesList([

        {!
          id: "road-mock-1",'
#          type: "Tempo Traveller", 
          cap: "26 Seater",K
G          plate: "17 Seater Tempo = 63000 (15th till 23rd July 2026)",(
$          model: "Force Traveller",)
%          vendor: "17 Seater Tempo",(
$          phone: "+91 98765 43210",!
          from: "Ahmedabad",,
(          fromTime: "14 Jul, 06:00 AM",&
"          to: "Himachal Pradesh",*
&          toTime: "14 Jul, 06:00 PM",
          days: "14 Jul",#
          daysCount: "2 Days", 
          seats: "26 / 26",
          seatsBooked: 26,
          capacityNum: 26,
          total: "63,000",
          paid: "0",
          due: "63,000","
          status: "CONFIRMED"

        }

      ]);

    }8
4  }, [tripVendors, departureDateStr, tripDetails]);
5
1  const transportVehiclesLabel = useMemo(() => {T
P    const count = tripVendors.filter(v => v.vendorType === 'transport').length;N
J    return count > 0 ? `${count} Vehicles Assigned` : "Assign Transport";
  }, [tripVendors]);
3
/  const dateAndDurationLabel = useMemo(() => {

    try {8
4      const startDate = new Date(departureDateStr);J
F      const daysMatch = tripDetails?.duration?.match(/(\d+)\s*Day/i);F
B      const numDays = daysMatch ? parseInt(daysMatch[1], 10) : 9;_
[      const endDate = new Date(startDate.getTime() + (numDays - 1) * 24 * 60 * 60 * 1000);
      ^
Z      const formatOptions = { day: '2-digit', month: 'short', year: 'numeric' } as const;Q
M      const startStr = startDate.toLocaleDateString('en-US', formatOptions);M
I      const endStr = endDate.toLocaleDateString('en-US', formatOptions);V
R      return `${startStr} – ${endStr} (${tripDetails?.duration || '9D / 8N'})`;
    } catch {:
6      return `05 Jul 2027 – 13 Jul 2027 (9D / 8N)`;

    }+
'  }, [departureDateStr, tripDetails]);
.
*  const hasDateMismatch = useMemo(() => {

    try {6
2      const depDate = new Date(departureDateStr);6
2      const createdDate = new Date("2027-06-15");<
8      return depDate.getTime() < createdDate.getTime();
    } catch {
      return false;

    }
  }, [departureDateStr]);
,
(  const timelineSteps = useMemo(() => {Y
U    const confirmedBookings = bookings.filter((b: any) => b.status !== "cancelled");
    const sortedBookings = [...confirmedBookings].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());	
    
    const firstBookingDate = sortedBookings[0] ? new Date(sortedBookings[0].createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "TBD";
    const bookingStartedStr = sortedBookings[0] ? new Date(new Date(sortedBookings[0].createdAt).getTime() - 2 * 60 * 60 * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "TBD";	
    :
6    const capacity = tripDetails?.maxGroupSize || 30;`
\    const filledPercentage = capacity > 0 ? (stats.totalParticipants / capacity) * 100 : 0;
    const seats50PercentStr = sortedBookings[Math.floor(sortedBookings.length / 2)] ? new Date(sortedBookings[Math.floor(sortedBookings.length / 2)].createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "TBD";
J
F    const hotels = tripVendors.filter(v => v.vendorType === 'hotel');g
c    const allHotelsConfirmed = hotels.length > 0 && hotels.every(h => h.paymentStatus === 'paid');\
X    const hotelsConfirmStr = allHotelsConfirmed ? "Confirmed" : "Pending Confirmation";
4
0    const depDate = new Date(departureDateStr);
    const departureDayStr = depDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return [t
p      { title: "Booking Started", date: bookingStartedStr, user: "System", active: sortedBookings.length > 0 },
      { title: "First Booking Received", date: firstBookingDate, user: sortedBookings[0]?.name || "System", active: sortedBookings.length > 0 },v
r      { title: "50% Seats Filled", date: seats50PercentStr, user: "Sales Desk", active: filledPercentage >= 50 },s
o      { title: "All Hotels Confirmed", date: hotelsConfirmStr, user: "Ops Desk", active: allHotelsConfirmed },
      { title: "Balance Collection In Progress", date: stats.totalVendorPayables > 0 ? "In Progress" : "Completed", user: "Accounts Desk", current: true },L
H      { title: "Departure Day", date: departureDayStr, pending: true },
    ];I
E  }, [bookings, tripVendors, tripDetails, departureDateStr, stats]);

J
F  const getDayDateAndWd = (startStr: string, offsetDays: number) => {

    try {(
$      const d = new Date(startStr);/
+      d.setDate(d.getDate() + offsetDays);N
J      const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];s
o      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      +
'      const wd = dayNames[d.getDay()];z
v      const dateFormatted = `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;.
*      return { wd, date: dateFormatted };
    } catch (err) {5
1      return { wd: "SAT", date: "05 Jul 2027" };

    }	
  };
0
,  const computedItinerary = useMemo(() => {W
S    const baseItin = (tripDetails?.itinerary && tripDetails.itinerary.length > 0) 6
2      ? tripDetails.itinerary.map((it: any) => ({$
           day: `Day ${it.day}`,-
)          plan: it.title || it.location,)
%          sub: it.description || "",&
"          stay: it.stay || "—",M
I          stayType: it.stay && it.stay !== "—" ? "Standard Stay" : "",I
E          stayBadge: it.stay && it.stay !== "—" ? "STANDARD" : "",*
&          travel: "Local / Transfer",-
)          travelSub: "Planned Transfer",(
$          meals: it.meals || "—",k
g          activities: Array.isArray(it.activities) ? it.activities.join(" ") : it.activities || "—", 
          status: "ON TIME"
        }))M
I      : (tripId.toLowerCase().includes("spt") ? MOCK_SPITI_ITINERARY : [
          { day: "Day 1", plan: "Ahmedabad → Chandigarh", sub: "Overnight Journey by Volvo", stay: "—", stayType: "", travel: "Volvo Bus", travelSub: "Departure: 08:00 PM", meals: "—", activities: "—", status: "ON TIME" },
          { day: "Day 2", plan: "Chandigarh → Manali", sub: "Enroute Sightseeing", stay: "Manali", stayType: "Hotel Mountain View", stayBadge: "DELUXE", travel: "280 KM", travelSub: "7-8 Hrs", meals: "Breakfast Dinner", activities: "Hadimba Temple Mall Road Visit", status: "ON TIME" },
          { day: "Day 3", plan: "Manali Local Sightseeing", sub: "Solang Valley & Rohtang Pass (if open)", stay: "Manali", stayType: "Hotel Mountain View", stayBadge: "DELUXE", travel: "Local", travelSub: "70 KM", meals: "Breakfast Dinner", activities: "Solang Valley Rohtang Pass", status: "ON TIME" },
          { day: "Day 4", plan: "Manali → Kasol", sub: "Scenic Drive", stay: "Kasol", stayType: "Riverside Camp", stayBadge: "CAMP", travel: "80 KM", travelSub: "3-4 Hrs", meals: "Breakfast Dinner", activities: "Parvati Valley Kasol Market", status: "ON TIME" },
          { day: "Day 5", plan: "Kasol → Kullu → Manikaran", sub: "Hot Springs Visit", stay: "Kasol", stayType: "Riverside Camp", stayBadge: "CAMP", travel: "60 KM", travelSub: "2-3 Hrs", meals: "Breakfast Dinner", activities: "Manikaran Sahib Hot Springs", status: "ON TIME" },
          { day: "Day 6", plan: "Kasol → Amritsar", sub: "Overnight Journey by Volvo", stay: "—", stayType: "", travel: "Volvo Bus", travelSub: "Departure: 08:00 PM", meals: "Breakfast", activities: "—", status: "ON TIME" },
          { day: "Day 7", plan: "Amritsar Sightseeing", sub: "Heritage & Wagah Border", stay: "Amritsar", stayType: "Hotel Grand Amritsar", stayBadge: "DELUXE", travel: "Local", travelSub: "60 KM", meals: "Breakfast Dinner", activities: "Golden Temple Wagah Border", status: "ON TIME" },
          { day: "Day 8", plan: "Amritsar → Delhi", sub: "Overnight Journey by Train", stay: "—", stayType: "", travel: "Shatabdi Express", travelSub: "Departure: 07:00 PM", meals: "Breakfast", activities: "—", status: "ON TIME" },
          { day: "Day 9", plan: "Delhi → Ahmedabad", sub: "Arrival in Ahmedabad", stay: "—", stayType: "", travel: "Flight", travelSub: "Arrival: 06:30 AM", meals: "—", activities: "—", status: "ON TIME" },
        ]);
:
6    return baseItin.map((item: any, idx: number) => {G
C      const { wd, date } = getDayDateAndWd(departureDateStr, idx);
      return {
        ...item,
        wd,
        date
	      };
    });3
/  }, [tripDetails, departureDateStr, tripId]);
1
-  const computedActivities = useMemo(() => {4
0    if (tripId.toLowerCase().includes("spt")) {(
$      return MOCK_SPITI_ACTIVITIES;

    }
    return [
      { day: "Day 1", wd: "05 Jul, Sat", act: "Volvo Journey", sub: "Ahmedabad → Chandigarh", type: "TRAVEL", inc: true, time: "09:00 PM", loc: "Ahmedabad", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
      { day: "Day 2", wd: "06 Jul, Sun", act: "Manali Local Sightseeing", sub: "Hidimba Temple, Mall Road", type: "SIGHTSEEING", inc: true, time: "10:00 AM - 06:00 PM", loc: "Manali", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
      { day: "Day 3", wd: "07 Jul, Mon", act: "Solang Valley Visit", sub: "Ropeway, Snow Point (if Open)", type: "SIGHTSEEING", inc: true, time: "09:30 AM - 05:00 PM", loc: "Solang Valley", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
      { day: "Day 4", wd: "08 Jul, Tue", act: "Kasol Visit", sub: "Kasol Market, Cafes", type: "SIGHTSEEING", inc: true, time: "11:00 AM - 07:00 PM", loc: "Kasol", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
      { day: "Day 5", wd: "09 Jul, Wed", act: "Kullu → Manikaran Sahib", sub: "Hot Springs & Gurudwara", type: "SIGHTSEEING", inc: true, time: "08:30 AM - 05:30 PM", loc: "Manikaran", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-650 border-emerald-100" },
      { day: "Day 6", wd: "10 Jul, Thu", act: "Kasol to Amritsar Transfer", sub: "Enroute sightseeing", type: "TRAVEL", inc: true, time: "08:00 AM - 08:00 PM", loc: "Amritsar", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
      { day: "Day 7", wd: "11 Jul, Fri", act: "Golden Temple Visit", sub: "Darshan & Palki Sahib", type: "SIGHTSEEING", inc: true, time: "05:00 AM - 09:00 AM", loc: "Amritsar", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
      { day: "Day 8", wd: "12 Jul, Sat", act: "Wagah Border Ceremony", sub: "Beating Retreat Ceremony", type: "SIGHTSEEING", inc: true, time: "04:30 PM - 06:00 PM", loc: "Wagah Border", status: "PENDING", statusClass: "bg-amber-50 text-amber-600 border-amber-100" },
      { day: "Day 9", wd: "13 Jul, Sun", act: "Train Journey", sub: "Amritsar → Ahmedabad", type: "TRAVEL", inc: false, time: "07:00 PM", loc: "Amritsar", status: "CANCELLED", statusClass: "bg-red-50 text-red-650 border-red-100" },
      { day: "Optional", wd: "", act: "River Rafting", sub: "Beas River (Extra Cost)", type: "ADVENTURE", inc: false, time: "—", loc: "Kullu", status: "OPTIONAL", statusClass: "bg-blue-50 text-blue-600 border-blue-100" }
    ];
  }, [tripId]);
<
8  const [hotelsList, setHotelsList] = useState<any[]>([

    {
      day: "Day 1",
      wd: "TUE",
      date: "14 Jul",
      dest: "Kasol",(
$      hotel: "The Riverwood Kasol",#
      sub: "Riverside, Kasol",'
#      rating: "4.6 (128 reviews)",
      type: "Deluxe Room",,
(      plan: "MAP (Breakfast + Dinner)",$
       paxSub: "2 Pax per room",
      rooms: "5 Rooms", 
      roomSub: "10 Guests",
      roomsCount: 5,
      guestsCount: 10,
      nights: 1,
      status: "CONFIRMED",)
%      voucher: "Hotel Voucher Sent",
      amt: 17000,
      paidAmt: 17000
    },

    {
      day: "Day 2",
      wd: "WED",
      date: "15 Jul",
      dest: "Kaza",!
      hotel: "Hotel Deyzor",)
%      sub: "Near Main Market, Kaza",&
"      rating: "4.4 (96 reviews)",%
!      type: "Super Deluxe Room",,
(      plan: "MAP (Breakfast + Dinner)",$
       paxSub: "2 Pax per room",
      rooms: "6 Rooms", 
      roomSub: "12 Guests",
      roomsCount: 6,
      guestsCount: 12,
      nights: 1,
      status: "CONFIRMED",)
%      voucher: "Hotel Voucher Sent",
      amt: 22800,
      paidAmt: 22800
    },

    {
      day: "Day 3",
      wd: "THU",
      date: "16 Jul",
      dest: "Kaza",'
#      hotel: "Himalayan Eco Stay",
      sub: "Kaza, Spiti",&
"      rating: "4.2 (74 reviews)",
      type: "Deluxe Room",,
(      plan: "MAP (Breakfast + Dinner)",$
       paxSub: "2 Pax per room",
      rooms: "6 Rooms", 
      roomSub: "12 Guests",
      roomsCount: 6,
      guestsCount: 12,
      nights: 1,
      status: "CONFIRMED",)
%      voucher: "Hotel Voucher Sent",
      amt: 21600,
      paidAmt: 21600
    },

    {
      day: "Day 4",
      wd: "FRI",
      date: "17 Jul",
      dest: "Tabo",*
&      hotel: "Tabo Heights Homestay",'
#      sub: "Near Monastery, Tabo",&
"      rating: "4.5 (63 reviews)",!
      type: "Standard Room",,
(      plan: "MAP (Breakfast + Dinner)",$
       paxSub: "2 Pax per room",
      rooms: "5 Rooms", 
      roomSub: "10 Guests",
      roomsCount: 5,
      guestsCount: 10,
      nights: 1,
      status: "CONFIRMED",)
%      voucher: "Hotel Voucher Sent",
      amt: 15000,
      paidAmt: 15000
    },

    {
      day: "Day 5",
      wd: "SAT",
      date: "18 Jul",
      dest: "Dhankar",'
#      hotel: "Dhankar View Hotel","
      sub: "Dhankar Village",
      rating: "—",
      type: "Deluxe Room",,
(      plan: "MAP (Breakfast + Dinner)",$
       paxSub: "2 Pax per room",
      rooms: "5 Rooms", 
      roomSub: "10 Guests",
      roomsCount: 5,
      guestsCount: 10,
      nights: 1,
      status: "PENDING",/
+      voucher: "Waiting for Confirmation",
      amt: 0,
      paidAmt: 0
    },

    {
      day: "Day 6",
      wd: "SUN",
      date: "19 Jul",
      dest: "Komic",'
#      hotel: "Komic Village Stay",
      sub: "Komic, Spiti",&
"      rating: "4.3 (51 reviews)",!
      type: "Standard Room",,
(      plan: "MAP (Breakfast + Dinner)",$
       paxSub: "2 Pax per room",
      rooms: "5 Rooms", 
      roomSub: "10 Guests",
      roomsCount: 5,
      guestsCount: 10,
      nights: 1,
      status: "CONFIRMED",)
%      voucher: "Hotel Voucher Sent",
      amt: 15500,
      paidAmt: 15500
    },

    {
      day: "Day 7",
      wd: "MON",
      date: "20 Jul",
      dest: "Langza",$
       hotel: "Langza Homestay",!
      sub: "Langza Village",&
"      rating: "4.6 (41 reviews)",!
      type: "Standard Room",,
(      plan: "MAP (Breakfast + Dinner)",$
       paxSub: "2 Pax per room",
      rooms: "5 Rooms", 
      roomSub: "10 Guests",
      roomsCount: 5,
      guestsCount: 10,
      nights: 1,
      status: "CONFIRMED",)
%      voucher: "Hotel Voucher Sent",
      amt: 15000,
      paidAmt: 15000
    },

    {
      day: "Day 8",
      wd: "TUE",
      date: "21 Jul",
      dest: "Kaza",'
#      hotel: "Himalayan Eco Stay",
      sub: "Kaza, Spiti",&
"      rating: "4.2 (74 reviews)",
      type: "Deluxe Room",,
(      plan: "MAP (Breakfast + Dinner)",$
       paxSub: "2 Pax per room",
      rooms: "5 Rooms", 
      roomSub: "10 Guests",
      roomsCount: 5,
      guestsCount: 10,
      nights: 1,
      status: "CONFIRMED",)
%      voucher: "Hotel Voucher Sent",
      amt: 21600,
      paidAmt: 21600

    }

  ]);
-
)  const computedHotels = useMemo(() => {&
"    return hotelsList.map(h => ({
      ...h,W
S      amt: h.amt === 0 || !h.amt ? "—" : `₹ ${h.amt.toLocaleString('en-IN')}`,m
i      amtSub: h.amt === 0 || !h.amt ? "Not Paid" : `Paid: ₹${h.paidAmt?.toLocaleString('en-IN') || 0}`
	    }));
  }, [hotelsList]);
0
,  const computedTransport = useMemo(() => {!
    return roadVehiclesList;
  }, [roadVehiclesList]);
-
)  const computedGuides = useMemo(() => {B
>    const guideAssignments = tripVendors.filter((v: any) => {,
(      const vendorObj = v.vendor || {};=
9      const type = vendorObj.type || v.vendorType || '';T
P      return type.toLowerCase() === 'guide' || type.toLowerCase() === 'leader';
    });
+
'    if (guideAssignments.length > 0) {A
=      return guideAssignments.map((v: any, idx: number) => {F
B        const vendorObj = v.vendor || { name: 'Assigned Guide' };$
         const dayNum = idx + 1;I
E        const { wd, date } = getDayDateAndWd(departureDateStr, idx);
	        
        return {$
           name: vendorObj.name,
          lead: idx === 0,T
P          role: vendorObj.type === 'leader' ? 'Trip Captain' : 'Support Guide',#
          assign: 'Full Trip',~
z          date: `${date.split(" ")[0]} ${date.split(" ")[1]}, ${wd.charAt(0).toUpperCase()}${wd.slice(1).toLowerCase()}`,/
+          phone: vendorObj.phone || '—',/
+          exp: vendorObj.notes || 'Guide',*
&          trips: 'Active Assignment',E
A          status: v.paymentStatus?.toUpperCase() || 'CONFIRMED',W
S          sub: `Assigned on ${new Date(v.createdAt).toLocaleDateString('en-IN')}`,H
D          docs: { id: true, dl: true, police: true, medical: true }
        };

      });

    }
    return [];+
'  }, [tripVendors, departureDateStr]);
7
3  const handlePrintVendorReceipt = (row: any) => {7
3    const printWindow = window.open('', '_blank');"
    if (!printWindow) return;
I
E    const vendorName = row.vendor || row.hotel || "Assigned Vendor";:
6    const serviceType = row.type || "Vendor Service";7
3    const totalCost = row.total || row.amt || "0";b
^    const paidAmount = row.paid || row.amtSub?.replace("Paid: ₹", "") || row.amtSub || "0";
    const balanceDue = row.due || ((parseFloat(totalCost.replace(/,/g, '')) || 0) - (parseFloat(paidAmount.replace(/,/g, '')) || 0)).toLocaleString('en-IN');0
,    const status = row.status || "PENDING";2
.    const phone = row.phone || row.sub || "";	
    
    const receiptHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>'
#          <meta charset="UTF-8" />W
S          <meta name="viewport" content="width=device-width, initial-scale=1.0" />F
B          <title>Vendor Settlement Record - ${vendorName}</title>
          <style>
            body {P
L              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;"
              color: #1e293b; 
              margin: 40px;$
               line-height: 1.6;
            }"
            .receipt-header {4
0              border-bottom: 2px solid #e2e8f0;(
$              padding-bottom: 20px;'
#              margin-bottom: 30px;!
              display: flex;2
.              justify-content: space-between;'
#              align-items: center;
            }!
            .receipt-title {#
              font-size: 20px;$
               font-weight: 900;-
)              text-transform: uppercase;"
              color: #1e293b;
            }
            .info-grid {!
              display: grid;2
.              grid-template-columns: 1fr 1fr;
              gap: 20px;'
#              margin-bottom: 30px;
            }
            .info-card {'
#              background: #f8fafc;-
)              border: 1px solid #e2e8f0;!
              padding: 15px;&
"              border-radius: 6px;
            }
            .card-title {#
              font-size: 10px;$
               font-weight: 900;"
              color: #94a3b8;-
)              text-transform: uppercase;4
0              border-bottom: 1px solid #e2e8f0;'
#              padding-bottom: 5px;'
#              margin-bottom: 10px;
            }
            table {
              width: 100%;-
)              border-collapse: collapse;'
#              margin-bottom: 30px;
            }
            th {'
#              background: #f1f5f9;$
               text-align: left;!
              padding: 10px;#
              font-size: 11px;"
              color: #64748b;4
0              border-bottom: 2px solid #e2e8f0;
            }
            td {!
              padding: 10px;4
0              border-bottom: 1px solid #e2e8f0;#
              font-size: 13px;
            }
            .totals-box { 
              width: 300px;%
!              margin-left: auto;-
)              border: 1px solid #e2e8f0;&
"              border-radius: 6px;$
               overflow: hidden;
            }
            .totals-row {!
              display: flex;2
.              justify-content: space-between;%
!              padding: 8px 12px;#
              font-size: 12px;
            }$
             .totals-row.grand {'
#              background: #1e293b;
              color: #fff;%
!              font-weight: bold;
            }
            .footer {&
"              text-align: center;$
               margin-top: 50px;#
              font-size: 10px;"
              color: #94a3b8;1
-              border-top: 1px solid #e2e8f0;%
!              padding-top: 15px;
            }
          </style>
        </head>
        <body>+
'          <div class="receipt-header">
            <div>g
c              <span style="font-size:20px; font-weight:900; color:#1e293b;">YOUTHCAMPING OS</span>r
n              <p style="font-size:10px; color:#64748b; margin-top:2px;">INTERNAL VENDOR SETTLEMENT RECORD</p>
            </div>0
,            <div style="text-align: right">N
J              <div class="receipt-title">Payment Settlement Receipt</div>r
n              <p style="font-size: 11px; color: #64748b;">Date: ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>&
"          <div class="info-grid">(
$            <div class="info-card">?
;              <div class="card-title">Vendor details</div>Q
M              <p style="font-size:14px; font-weight:bold;">${vendorName}</p>d
`              ${phone ? `<p style="font-size:12px; color:#64748b;">Contact: ${phone}</p>` : ''}
            </div>(
$            <div class="info-card">=
9              <div class="card-title">Trip context</div>X
T              <p style="font-size:13px; font-weight:bold;">Departure: ${tripId}</p>d
`              <p style="font-size:12px; color:#64748b;">Departure Date: ${departureDateStr}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>1
-                <th>Service Description</th>C
?                <th style="text-align: right">Agreed Cost</th>C
?                <th style="text-align: right">Paid Amount</th>K
G                <th style="text-align: right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>7
3                <td>${serviceType} Allocation</td>K
G                <td style="text-align: right">&#8377;${totalCost}</td>[
W                <td style="text-align: right; color:#059669">&#8377;${paidAmount}</td>[
W                <td style="text-align: right; color:#e11d48">&#8377;${balanceDue}</td>
              </tr>
            </tbody>
          </table>'
#          <div class="totals-box">m
i            <div class="totals-row"><span>Agreed Settlement</span><span>&#8377;${totalCost}</span></div>
            <div class="totals-row" style="color:#059669"><span>Total Cleared</span><span>&minus;&#8377;${paidAmount}</span></div>n
j            <div class="totals-row grand"><span>Balance Due</span><span>&#8377;${balanceDue}</span></div>
          </div>#
          <div class="footer">O
K            <p>Authorized and issued by YouthCamping OS Accounts Desk.</p>p
l            <p>This is a system-generated settlement receipt and does not require a physical signature.</p>
          </div>
          <script>p
l            window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 800); };
          </script>
        </body>
      </html>
    `;1
-    printWindow.document.write(receiptHtml);&
"    printWindow.document.close();	
  };
/
+  const computedPayments = useMemo(() => {Y
U    const confirmedBookings = bookings.filter((b: any) => b.status !== "cancelled");3
/    return confirmedBookings.map((b: any) => {!
      let status = "UNPAID";
      if (b.paymentStatus === "Paid" || b.paymentStatus === "paid" || b.paymentStatus === "Paid in Full" || b.remainingAmount === 0) {
        status = "PAID";*
&      } else if (b.advancePaid > 0) {'
#        status = "PARTIALLY PAID";
      }
      
      return {K
G        id: b.bookingId || `BK-${b.id.substring(0, 6).toUpperCase()}`,<
8        passenger: b.name || b.fullName || "Passenger",+
'        pax: b.numberOfTravelers || 1,1
-        phone: b.mobile || b.phone || "—",1
-        plan: b.tripName || "Standard Plan",4
0        amount: b.totalAmount || b.amount || 0,&
"        paid: b.advancePaid || 0,-
)        pending: b.remainingAmount || 0,>
:        mode: b.paymentMode || b.payment_method || "UPI",Q
M        modeDetail: b.upi_reference ? `UPI Ref: ${b.upi_reference}` : "—",
        status: status,
        lastPayment: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "—",B
>        bookingStatus: b.status?.toUpperCase() || "CONFIRMED"
	      };
    });
  }, [bookings]);
0
,  const computedDocuments = useMemo(() => { 
    const list: any[] = [];	
    %
!    // 1. Dynamic Hotel VouchersQ
M    const hotels = tripVendors.filter((v: any) => v.vendorType === 'hotel');2
.    hotels.forEach((h: any, idx: number) => {4
0      const name = h.vendorId?.name || "Hotel";
      list.push({ 
        id: `doc-h-${idx}`,R
N        name: `hotel_voucher_${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        sub: name, 
        category: "Hotels",
        subcat: "Voucher",
        type: "PDF",
        size: "245 KB",$
         uploadedBy: "Ops Desk",=
9        date: h.createdAt?.substring(0, 10) || "Recent",H
D        status: h.paymentStatus === "paid" ? "VERIFIED" : "PENDING"

      });
    });
+
'    // 2. Dynamic Transport Permits/RCY
U    const transports = tripVendors.filter((v: any) => v.vendorType === 'transport');6
2    transports.forEach((t: any, idx: number) => {>
:      const name = t.vendorId?.name || "Tempo Traveller";
      list.push({#
        id: `doc-t-rc-${idx}`,L
H        name: `rc_book_${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        sub: `${name}`,#
        category: "Transport",
        subcat: "RC Book",
        type: "PDF",
        size: "380 KB",$
         uploadedBy: "Ops Desk",
        date: "Recent",
        status: "VERIFIED"

      });
    });
7
3    // 3. Dynamic Customer ID Proofs from Bookings'
#    bookings.forEach((b: any) => {=
9      if (b.passengers?.details?.idProof || b.idProof) {>
:        const name = b.fullName || b.name || "Passenger";
        list.push({#
          id: `doc-b-${b.id}`,O
K          name: `id_proof_${name.toLowerCase().replace(/\s+/g, '_')}.jpg`,6
2          sub: `Booking: ${b.bookingId || b.id}`,.
*          category: "Customer Documents",*
&          subcat: "Aadhar / ID Card",
          type: "Image",
          size: "1.2 MB", 
          uploadedBy: name,?
;          date: b.createdAt?.substring(0, 10) || "Recent",!
          status: "VERIFIED"
        });
      }
      6
2      if (Array.isArray(b.passengers?.persons)) {D
@        b.passengers.persons.forEach((p: any, idx: number) => {
          if (p.idProof) {
            list.push({.
*              id: `doc-p-${b.id}-${idx}`,U
Q              name: `id_proof_${p.name.toLowerCase().replace(/\s+/g, '_')}.jpg`,H
D              sub: `Booking: ${b.bookingId || b.id} (Co-traveler)`,2
.              category: "Customer Documents",.
*              subcat: "Aadhar / ID Card",!
              type: "Image","
              size: "1.1 MB",&
"              uploadedBy: p.name,(
$              uploadedOn: "Recent",%
!              status: "VERIFIED"
            });
          }
        });
      }
    });	
    
    return list;5
1  }, [bookings, tripVendors, departureDateStr]);
,
(  const computedTasks = useMemo(() => {+
'    if (checklistTasks.length === 0) {
      return MOCK_TASKS;

    }0
,    return checklistTasks.map((t: any) => {'
#      let category = "OPERATIONS";D
@      if (t.stage.includes("30D")) category = "PRE-TRIP (30D)";G
C      else if (t.stage.includes("7D")) category = "PRE-TRIP (7D)";G
C      else if (t.stage.includes("1D")) category = "PRE-TRIP (1D)";N
J      else if (t.stage.includes("DEPARTURE")) category = "DEPARTURE DAY";I
E      else if (t.stage.includes("DURING")) category = "DURING TRIP";E
A      else if (t.stage.includes("POST")) category = "POST-TRIP";
i
e      const priority = t.stage.includes("30D") ? "HIGH" : t.stage.includes("7D") ? "MEDIUM" : "LOW";B
>      const status = t.isCompleted ? "COMPLETED" : "PENDING";
      
      return {
        id: t.id,
        task: t.taskName,9
5        sub: t.notes || "Checklist item assignment",
        category,9
5        assignee: t.completedBy?.name || "Ops Desk",#
        role: "System Action",
        priority,b
^        dueDate: t.completedAt ? new Date(t.completedAt).toLocaleDateString('en-IN') : "TBD",F
B        dueNote: t.isCompleted ? "Completed" : "Action Required",
        status,
        rawTask: t
	      };
    });
  }, [checklistTasks]);
4
0  const computedConversations = useMemo(() => {
    return [
      { id:"g1",  name:`${tripId} – General Group`, sub:`${leadGuideName || 'Guide'}: Meeting point details...`, time:"10:30 AM", unread:1,  type:"group",  icon:"🏕️" },
      { id:"g2",  name:"Pre-Departure Info",        sub:"Operations: Please carry original ID proofs.",   time:"Yesterday",unread:3,  type:"group",  icon:"📋" },
      { id:"g3",  name:`${leadGuideName || 'Guide'} (Lead Guide)`,sub:"You: Please share the expected weather...", time:"Yesterday",unread:0,  type:"direct", icon:"👤" },
      { id:"g4",  name:"Suresh Kumar (Accounting)", sub:"Suresh: Payment received from travelers",time:"28 Jun",  unread:0,  type:"direct", icon:"💼" },
      { id:"g5",  name:"Important Updates",         sub:"Ops Desk: Hotel updates for trip", time:"27 Jun",  unread:0,  type:"group",  icon:"📢" },
    ];#
  }, [tripId, leadGuideName]);
/
+  const computedMessages = useMemo(() => {{
w    const travelerNames = bookings.filter((b: any) => b.status !== "cancelled").map((b: any) => b.fullName || b.name);<
8    const primaryTraveler = travelerNames[0] || "Jeel";@
<    const secondaryTraveler = travelerNames[1] || "Vatsal";<
8    const guideName = leadGuideName || "Dikshu Sharma";

    return [
      { id: "m1", convId: "g1", sender: guideName, role: "Lead Guide", avatar: "DS", time: "10:10 AM", text: `Good morning everyone! 👋\nWelcome to the ${tripDetails?.title || 'Spiti Valley Road Trip'} group.\nReach at 6:00 AM sharp at the meeting point.\nOur team will be there with the vehicles.`, reactions: [{ emoji: "👍", count: 8 }], isMine: false },
      { id: "m2", convId: "g1", sender: primaryTraveler, role: "Traveler", avatar: "PT", time: "10:22 AM", text: "Thanks team! Excited for the trip en route.", reactions: [{ emoji: "👍", count: 6 }], isMine: false },
      { id: "m3", convId: "g2", sender: "Ops Desk", role: "Operations", avatar: "OD", time: "10:28 AM", text: "Please carry your original ID proofs.\nAlso ensure your luggage is not more than 15 kg.", reactions: [], isMine: false },
      { id: "m4", convId: "g1", sender: "Suresh Kumar", role: "You", avatar: "SK", time: "10:30 AM", text: "Thanks team! Have a safe journey everyone. See you all tomorrow! 😊", reactions: [{ emoji: "❤️", count: 1 }, { emoji: "👍", count: 2 }], isMine: true },
    ];2
.  }, [bookings, leadGuideName, tripDetails]);

  useEffect(() => {#
    if (bookings.length > 0) {-
)      setChatMessages(computedMessages);

    }(
$  }, [bookings, computedMessages]);
)
%  const hotelStats = useMemo(() => {U
Q    const totalNights = hotelsList.reduce((sum, h) => sum + (h.nights || 1), 0);
{    const confirmedNights = hotelsList.filter(h => h.status === 'CONFIRMED').reduce((sum, h) => sum + (h.nights || 1), 0);=
9    const pendingNights = totalNights - confirmedNights;
    const totalRooms = 42;Y
U    const roomsBooked = hotelsList.reduce((sum, h) => sum + (h.roomsCount || 0), 0);`
\    const occupancy = totalRooms > 0 ? ((roomsBooked / totalRooms) * 100).toFixed(1) : "0";
R
N    const totalAmount = hotelsList.reduce((sum, h) => sum + (h.amt || 0), 0);T
P    const totalPaid = hotelsList.reduce((sum, h) => sum + (h.paidAmt || 0), 0);6
2    const totalPending = totalAmount - totalPaid;

    return {
      totalNights,
      confirmedNights,
      pendingNights,
      totalRooms,
      roomsBooked,
      occupancy,
      totalAmount,
      totalPaid,
      totalPending
    };
  }, [hotelsList]);
,
(  const allPassengers = useMemo(() => {
    const arr: any[] = [];'
#    bookings.forEach((b: any) => {C
?      const due = (b.totalAmount || 0) - (b.advancePaid || 0);v
r      const paymentLabel = due <= 0 ? "Paid in Full" : b.advancePaid > 0 ? "Partial Payment" : "Payment Pending";
      const base = { bookingId: b.id, bookingDate: b.createdAt?.substring(0,10) || "2027-06-15", departureDate: b.departureDate?.substring(0,10) || departureDateStr, batchGroup:"Batch 1", gender:b.gender||"Male", age:b.age||24, phone:b.phone||b.mobile||"—", email:b.email||"—", pickupPoint:b.pickupCity||"Ahmedabad", dropPoint:"Manali", roomSharing:"Triple", roomType:"Deluxe", emergencyContact:"9876543211", roomNo:b.passengers?.details?.roomAllocation||"—", paymentStatus:paymentLabel, amount:b.totalAmount||12000, paidAmount:b.advancePaid||0, balance:due>0?due:0, paymentMode:"UPI", paymentDate:"2027-06-16", idProofType:"Aadhar Card", guideName:"Dikshu Sharma", transportDetails:"Tempo Traveller AC", notes:"No special requirements", hasDocs:!!b.passengers?.details?.idProof };C
?      arr.push({ id:b.id, name:b.fullName||b.name, ...base });6
2      if (Array.isArray(b.passengers?.persons)) {D
@        b.passengers.persons.forEach((p: any, idx: number) => {
          arr.push({ id:`${b.id}-co-${idx}`, name:p.name, ...base, phone:p.phone||b.phone||"—", email:p.email||"—", pickupPoint:p.pickupPoint||b.pickupCity||"Ahmedabad", amount:0, paidAmount:0, balance:0, notes:"Co-traveler" });
        });
      }
    });
    return arr;(
$  }, [bookings, departureDateStr]);

  useEffect(() => {9
5    if (allPassengers && allPassengers.length > 0) {_
[      const initial: Record<string, { room: string, vehicle: string, seat: string }> = {};.
*      allPassengers.forEach((p, idx) => {1
-        if (!passengerAllocations[p.name]) {o
k          if (idx === 0) initial[p.name] = { room: "Group No. 1", vehicle: "17 Seater Tempo", seat: "1" };t
p          else if (idx === 1) initial[p.name] = { room: "Group No. 1", vehicle: "17 Seater Tempo", seat: "2" };t
p          else if (idx === 2) initial[p.name] = { room: "Group No. 2", vehicle: "17 Seater Tempo", seat: "3" };t
p          else if (idx === 3) initial[p.name] = { room: "Group No. 2", vehicle: "17 Seater Tempo", seat: "4" };t
p          else if (idx === 4) initial[p.name] = { room: "Group No. 3", vehicle: "17 Seater Tempo", seat: "5" };t
p          else if (idx === 5) initial[p.name] = { room: "Group No. 3", vehicle: "17 Seater Tempo", seat: "6" };S
O          else initial[p.name] = { room: "—", vehicle: "—", seat: "—" };
        } else {>
:          initial[p.name] = passengerAllocations[p.name];

        }

      });-
)      setPassengerAllocations(prev => ({
        ...initial,
        ...prev
      }));

    }
  }, [allPassengers]);
3
/  const computedParticipants = useMemo(() => {0
,    return allPassengers.map((p: any) => ({#
      name: p.name || "Guest",M
I      role: p.notes === "Co-traveler" ? "Co-traveler" : "Lead Traveler",
      badge: p.paymentStatus === "Paid in Full" ? "PAID" : p.paymentStatus === "Partial Payment" ? "PARTIALLY PAID" : "PENDING"
	    }));
  }, [allPassengers]);
-
)  const passengerStats = useMemo(() => {,
(    const total = allPassengers.length;a
]    const paidInFull = allPassengers.filter(p => p.paymentStatus === "Paid in Full").length;a
]    const partial = allPassengers.filter(p => p.paymentStatus === "Partial Payment").length;a
]    const pending = allPassengers.filter(p => p.paymentStatus === "Payment Pending").length;
    const outstandingPartial = allPassengers.filter(p => p.paymentStatus === "Partial Payment").reduce((s,p) => s+p.balance, 0);
    const outstandingPending = allPassengers.filter(p => p.paymentStatus === "Payment Pending").reduce((s,p) => s+p.balance, 0);
    return { total, paidInFull, paidPercent: total>0 ? ((paidInFull/total)*100).toFixed(1) : "0", partial, outstandingPartial, pending, outstandingPending };
  }, [allPassengers]);
,
(  const pickupOptions = useMemo(() => {
    const s = new Set<string>(); allPassengers.forEach(p => { if (p.pickupPoint) s.add(p.pickupPoint); }); return Array.from(s);
  }, [allPassengers]);
/
+  const filteredPassengers = useMemo(() =>$
     allPassengers.filter(p => {u
q      const matchSearch = p.name.toLowerCase().includes(paxSearch.toLowerCase()) || p.phone.includes(paxSearch);]
Y      const matchPayment = paymentFilter === "All" || p.paymentStatus === paymentFilter;X
T      const matchPickup = pickupFilter === "All" || p.pickupPoint === pickupFilter;o
k      const matchGender = genderFilter === "All" || p.gender.toLowerCase() === genderFilter.toLowerCase();L
H      return matchSearch && matchPayment && matchPickup && matchGender;T
P    }), [allPassengers, paxSearch, paymentFilter, pickupFilter, genderFilter]);
}
y  const paginatedPassengers = useMemo(() => filteredPassengers.slice((page-1)*10, page*10), [filteredPassengers, page]);

  // Payment stats*
&  const paymentKpis = useMemo(() => {D
@    const total = computedPayments.reduce((s,p)=>s+p.amount,0);E
A    const received = computedPayments.reduce((s,p)=>s+p.paid,0);G
C    const pending = computedPayments.reduce((s,p)=>s+p.pending,0);f
b    const overdue = computedPayments.filter(p=>p.status==="UNPAID").reduce((s,p)=>s+p.pending,0);e
a    const refunds = computedPayments.filter(p=>p.status==="REFUNDED").reduce((s,p)=>s+p.paid,0);P
L    const paidCount = computedPayments.filter(p=>p.status==="PAID").length;n
j    return { total, received, pending, overdue, refunds, paidCount, totalCount:computedPayments.length };
  }, [computedPayments]);
-
)  const filteredPayments = useMemo(() =>a
]    computedPayments.filter(p => payStatusFilter === "All" || p.status === payStatusFilter),.
*    [computedPayments, payStatusFilter]);

  // Task stats(
$  const taskKpis = useMemo(() => ({%
!    total: computedTasks.length,K
G    completed: computedTasks.filter(t=>t.status==="COMPLETED").length,N
J    inProgress: computedTasks.filter(t=>t.status==="IN PROGRESS").length,G
C    pending: computedTasks.filter(t=>t.status==="PENDING").length,G
C    overdue: computedTasks.filter(t=>t.status==="OVERDUE").length,
  }), [computedTasks]);
*
&  const filteredTasks = useMemo(() =>"
    computedTasks.filter(t =>K
G      (taskStatusFilter === "All" || t.status === taskStatusFilter) &&N
J      (taskCategoryFilter === "All" || t.category === taskCategoryFilter)C
?    ), [computedTasks, taskStatusFilter, taskCategoryFilter]);


  // Docs)
%  const filteredDocs = useMemo(() =>#
    MOCK_DOCUMENTS.filter(d =>W
S      (docCategory === "all" || d.category.toLowerCase().includes(docCategory)) &&W
S      (docSearch === "" || d.name.toLowerCase().includes(docSearch.toLowerCase()))&
"    ), [docCategory, docSearch]);

  // Activities/
+  const filteredActivities = useMemo(() =>$
     MOCK_ACTIVITIES.filter(a =>E
A      (actDayFilter === "All Days" || a.day === actDayFilter) &&Q
M      (actTypeFilter === "All Activity Type" || a.type === actTypeFilter) &&P
L      (actStatusFilter === "All Status" || a.status === actStatusFilter) &&[
W      (actSearch === "" || a.activity.toLowerCase().includes(actSearch.toLowerCase()))G
C    ), [actDayFilter, actTypeFilter, actStatusFilter, actSearch]);
V
R  const actKpis = { total:18, confirmed:16, pending:1, cancelled:1, optional:3 };

  const tabs = [3
/    { id:"overview",       label:"Overview" },5
1    { id:"passengers",     label:"Passengers" },4
0    { id:"itinerary",      label:"Itinerary" },M
I    { id:"hotels",         label:"Hotels",     badge:null, check:true },4
0    { id:"transport",      label:"Transport" },B
>    { id:"allocation",     label:"Room & Tempo Allocation" },1
-    { id:"guides",         label:"Guides" },5
1    { id:"activities",     label:"Activities" },p
l    { id:"payments",       label:"Payments",   badge: computedPayments.filter(p => p.pending > 0).length },x
t    { id:"tasks",          label:"Tasks",      badge: computedTasks.filter(t => t.status !== "COMPLETED").length },V
R    { id:"documents",      label:"Documents",  badge: computedDocuments.length },8
4    { id:"communication",  label:"Communication" },2
.    { id:"reports",        label:"Reports" },	
  ];

  // CTA label by tab0
,  const ctaLabel: Record<string,string> = {S
O    activities:"+ Add Activity", payments:"+ Add Payment", tasks:"+ Add Task",F
B    documents:"+ Upload Document", communication:"+ New Message",A
=    overview:"Edit Departure", passengers:"+ Add Passenger",P
L    itinerary:"+ Add Day", hotels:"+ Add Hotel", transport:"+ Add Vehicle",*
&    allocation:"Run Auto-Allocation",<
8    guides:"+ Assign Guide", reports:"Download Report",	
  };

  return (q
m    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F7FB] text-[#162B45] font-sans antialiased"> 
      {hasDateMismatch && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-[#B45309] shrink-0">L
H          <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <span>
            Warning: The departure date (14 Jul 2026) occurs before the creation date (15 Jun 2027) of this departure workspace. Please verify the scheduling.
          </span>
        </div>
	      )}

      {/* ═══════════════════════════════════════════ HEADER ═══════════════════════════════════════════ */}I
E      <div className="bg-white border-b border-[#E2E8F0] shadow-xs">
        {/* Breadcrumb */}k
g        <div className="px-6 pt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">Z
V          <span className="hover:text-slate-600 cursor-pointer">Departures Hub</span>7
3          <ChevronRight className="w-3.5 h-3.5" />T
P          <span className="hover:text-slate-600 cursor-pointer">{tripId}</span>7
3          <ChevronRight className="w-3.5 h-3.5" />W
S          <span className="text-slate-700 font-bold capitalize">{activeTab}</span>
        </div>

        {/* Title row */}m
i        <div className="px-6 pt-2 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">8
4          <div className="flex items-center gap-3">u
q            <div className="w-8 h-8 rounded-[4px] bg-[#FFF0E6] flex items-center justify-center text-[#F97316]">2
.              <Compass className="w-5 h-5" />
            </div>F
B            <div className="flex items-center gap-2.5 flex-wrap">a
]              <h1 className="text-xl font-black text-slate-900 tracking-tight">{tripId}</h1>
              <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">CONFIRMED</span>>
:              <span className="text-slate-300">•</span>
|              <span className="text-sm text-slate-600 font-semibold">{tripDetails?.title || "Manali Kasol Amritsar"}</span>
            </div>
          </div>
J
F          <div className="flex items-center gap-2 shrink-0 relative">
            <buttonc
_              onClick={() => { setEditGuideName(leadGuideName); setEditDepartureOpen(true); }}
              className="text-[11px] font-bold border border-slate-200 rounded-[4px] bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 transition-colors"
            >!
              Edit Departure
            </button>+
'            <div className="relative">
              <buttonI
E                onClick={() => setMoreActionsOpen(!moreActionsOpen)}
                className="text-[11px] font-bold border border-slate-200 rounded-[4px] bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 flex items-center gap-1 transition-colors"
              >E
A                More Actions <ChevronDown className="w-3 h-3" />
              </button>(
$              {moreActionsOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-[4px] shadow-lg py-1 z-50 text-left">
                  <button^
Z                    onClick={() => { handlePrintManifest(); setMoreActionsOpen(false); }}j
f                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >'
#                    Print Manifest 
                  </button>
                  <buttonx
t                    onClick={() => { toast.success("Departure locked successfully!"); setMoreActionsOpen(false); }}j
f                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >'
#                    Lock Departure 
                  </button>
                  <button}
y                    onClick={() => { toast.error("Cancellation requires Senior Approval"); setMoreActionsOpen(false); }}f
b                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >)
%                    Cancel Departure 
                  </button>
                </div>
              )}
            </div>
            <button#
              onClick={() => {6
2                if (activeTab === "passengers") {1
-                  setAddPassengerOpen(true);8
4                } else if (activeTab === "tasks") {1
-                  setAddTaskModalOpen(true);<
8                } else if (activeTab === "documents") {E
A                  const input = document.createElement("input");+
'                  input.type = "file";5
1                  input.onchange = (e: any) => {8
4                    const file = e.target.files[0];$
                     if (file) {[
W                      toast.success(`Document "${file.name}" uploaded successfully!`);
                    }
                  };%
!                  input.click();@
<                } else if (activeTab === "communication") {}
y                  const input = document.querySelector("input[placeholder='Type your message...']") as HTMLInputElement;0
,                  if (input) input.focus();
                } else {V
R                  toast.success(`${ctaLabel[activeTab] || "Action"} triggered!`);
                }
              }}
              className="text-[11px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-4 py-1.5 flex items-center gap-1.5 transition-colors shadow-sm"
            >3
/              <Plus className="w-3.5 h-3.5" />4
0              {ctaLabel[activeTab] || "Action"}
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="px-6 py-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-semibold text-slate-500 border-t border-slate-100 mt-2">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {dateAndDurationLabel}</span>
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> {passengerStats.total} / {tripDetails?.maxGroupSize || 30} Participants</span>
          <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> Lead Guide: {leadGuideName}</span>
          <span className="flex items-center gap-1.5"><Bus className="w-3.5 h-3.5 text-slate-400" /> {transportVehiclesLabel}</span>t
p          <span className="ml-auto text-slate-400 hidden lg:block">Created by Suresh Bhai on 15 Jun 2027</span>
        </div>

        {/* Tab bar */}
}        <div className="px-6 flex gap-0 text-[11.5px] font-semibold overflow-x-auto no-scrollbar border-t border-slate-100">#
          {tabs.map((tab) => {7
3            const isActive = activeTab === tab.id;
            return (
              <button!
                key={tab.id}9
5                onClick={() => setActiveTab(tab.id)}#
                className={cn(n
j                  "pb-3 pt-3 px-3 transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5",
                  isActiveF
B                    ? "text-[#F97316] border-[#F97316] font-bold"j
f                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                )}
              > 
                {tab.label}R
N                {tab.check && <Check className="w-3 h-3 text-emerald-500" />}$
                 {tab.badge && (
                  <span className={cn("text-[8px] font-extrabold px-1.5 rounded-full h-4 min-w-[16px] flex items-center justify-center", isActive ? "bg-[#F97316] text-white" : "bg-red-500 text-white")}>$
                     {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ CONTENT ═══════════════════════════════════════════ */}A
=      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* ──────────────────────── OVERVIEW ──────────────────────── */}+
'        {activeTab === "overview" && (*
&          <div className="space-y-4">;
7            {/* Top Stat Row matching Screenshot 5 */}J
F            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">3
/              {/* Departure Readiness card */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex items-center gap-4 col-span-1">c
_                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">K
G                  <svg className="w-full h-full transform -rotate-90">n
j                    <circle cx="32" cy="32" r="28" stroke="#E2E8F0" strokeWidth="6" fill="transparent" />k
g                    <circle cx="32" cy="32" r="28" stroke="#12B76A" strokeWidth="6" fill="transparent"=
9                      strokeDasharray={2 * Math.PI * 28}N
J                      strokeDashoffset={2 * Math.PI * 28 * (1 - 0.91)} />
                  </svg>^
Z                  <span className="absolute text-sm font-black text-slate-800">91%</span>
                </div>
                <div>e
a                  <h4 className="text-[11px] font-black text-slate-700">Departure Readiness</h4>~
z                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Great! You're almost ready to depart.</p>
                  <button onClick={() => toast.info("Checklist")} className="text-[10px] font-bold text-blue-600 hover:underline mt-1.5 flex items-center gap-0.5">View Readiness Checklist</button>
                </div>
              </div>
-
)              {/* Total Revenue card */}a
]              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">G
C                <div className="flex items-start justify-between">
                  <div>
}                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">₹ {stats.totalRevenue.toLocaleString('en-IN')}</h3>v
r                    <p className="text-[9px] text-slate-400 mt-1">From {stats.totalParticipants} participants</p>
                  </div>
                  <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center text-blue-600 text-sm">₹</div>
                </div>
{                <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">View details</button>
              </div>
3
/              {/* Outstanding Balance card */}a
]              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">G
C                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
                    <h3 className="text-lg font-black text-[#EA580C] mt-1 font-mono">₹ {stats.customerOutstanding.toLocaleString('en-IN')}</h3>
}                    <p className="text-[9px] text-slate-400 mt-1">From {stats.outstandingParticipantsCount} participants</p>
                  </div>
                  <div className="w-7 h-7 rounded bg-amber-50 flex items-center justify-center text-[#EA580C] text-sm">₹</div>
                </div>
{                <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">View details</button>
              </div>
/
+              {/* Vendor Payables card */}a
]              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">G
C                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Vendor Payables</span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">₹ {stats.totalVendorPayables.toLocaleString('en-IN')}</h3>X
T                    <p className="text-[9px] text-slate-400 mt-1">Total pending</p>
                  </div>t
p                  <div className="w-7 h-7 rounded bg-slate-50 flex items-center justify-center text-slate-600">6
2                    <Users className="w-4 h-4" />
                  </div>
                </div>
{                <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">View details</button>
              </div>
*
&              {/* Profit Est card */}a
]              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">G
C                <div className="flex items-start justify-between">
                  <div>
}                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Profit (Est.)</span>
                    <h3 className="text-lg font-black text-emerald-600 mt-1">₹ {stats.estProfit.toLocaleString('en-IN')}</h3>l
h                    <p className="text-[9px] text-slate-400 mt-1">{stats.profitPercent}% of revenue</p>
                  </div>x
t                  <div className="w-7 h-7 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">;
7                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
{                <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">View details</button>
              </div>
            </div>
<
8            {/* Dashboard grid mapping Screenshot 5 */}H
D            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              7
3              {/* Column 1: Departure Timeline */}
{              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                <div>p
l                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
}                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Departure Timeline</h3>
                  </div>h
d                  <div className="relative pl-5 border-l-2 border-slate-100 ml-1.5 space-y-4 py-1"><
8                    {timelineSteps.map((step, idx) => (?
;                      <div key={idx} className="relative">2
.                        {/* Bullet points */}w
s                        <div className={cn("absolute -left-[27px] top-0.5 w-3 h-3 rounded-full border-2 bg-white",R
N                          step.active ? "border-emerald-500 bg-emerald-500" :_
[                          step.current ? "border-blue-600 bg-blue-50" : "border-slate-200""
                        )} />U
Q                        <div className="flex justify-between items-start gap-2">$
                           <div>
                            <p className={cn("text-[11px] font-bold", step.pending ? "text-slate-400" : "text-slate-700")}>{step.title}</p>b
^                            <p className="text-[9.5px] text-slate-400 mt-0.5">{step.date}</p>%
!                          </div>
                          {step.user && <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-[4px]">{step.user}</span>}#
                        </div>!
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => toast.info("Full timeline")} className="text-[10px] font-black text-blue-600 hover:underline mt-4 text-left">View full timeline</button>
              </div>
6
2              {/* Column 2: Itinerary Summary */}
{              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                <div>p
l                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
|                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Itinerary Summary</h3>
                    <button onClick={() => setActiveTab("itinerary")} className="text-[10px] font-bold text-blue-600 hover:underline">View full itinerary</button>
                  </div>B
>                  <div className="divide-y divide-slate-100">
                    {[
                      { day: "Day 1", date: "05 Jul", desc: "Ahmedabad → Chandigarh (Overnight Journey)", status: "ON TIME" },n
j                      { day: "Day 2", date: "06 Jul", desc: "Chandigarh → Manali", status: "ON TIME" },q
m                      { day: "Day 3", date: "07 Jul", desc: "Manali Local Sightseeing", status: "ON TIME" },i
e                      { day: "Day 4", date: "08 Jul", desc: "Manali → Kasol", status: "ON TIME" },v
r                      { day: "Day 5", date: "09 Jul", desc: "Kasol → Kullu → Manikaran", status: "ON TIME" },k
g                      { day: "Day 6", date: "10 Jul", desc: "Kasol → Amritsar", status: "ON TIME" },m
i                      { day: "Day 7", date: "11 Jul", desc: "Amritsar Sightseeing", status: "ON TIME" },
{                      { day: "Day 8", date: "12 Jul", desc: "Amritsar → Delhi (Overnight Journey)", status: "ON TIME" },l
h                      { day: "Day 9", date: "13 Jul", desc: "Delhi → Ahmedabad", status: "ON TIME" },.
*                    ].map((row, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-700">O
K                        <div className="flex items-center gap-2 shrink-0">
                          <span className="bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 px-1.5 py-0.5 rounded-[4px]">{row.day}</span>g
c                          <span className="text-[10px] font-bold text-slate-400">{row.date}</span>#
                        </div>o
k                        <p className="truncate flex-1 font-medium text-slate-600 text-left">{row.desc}</p>
                        <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 py-0.5 rounded-[3px] shrink-0 uppercase tracking-wider">{row.status}</span>!
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => toast.info("Itinerary plans")} className="text-[10px] font-black text-blue-600 hover:underline mt-4 text-left">View full itinerary & day plans</button>
              </div>
B
>              {/* Column 3: Quick Actions + Team Contacts */}.
*              <div className="space-y-4">/
+                {/* Quick Actions Grid */}c
_                <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                  <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-3">Quick Actions</h3>?
;                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Add Expense", icon: <Sliders className="w-4 h-4 text-slate-500" />, action: () => toast.success("Add expense") },
                      { label: "Add Payment", icon: <CreditCard className="w-4 h-4 text-[#F97316]" />, action: () => toast.success("Add payment") },
                      { label: "Add Task", icon: <CheckSquare className="w-4 h-4 text-blue-600" />, action: () => toast.success("Add task") },
                      { label: "Upload Document", icon: <Folder className="w-4 h-4 text-purple-600" />, action: () => toast.success("Upload document") },
                      { label: "Send Message", icon: <MessageSquare className="w-4 h-4 text-emerald-600" />, action: () => toast.success("Send message") },
                      { label: "Download Report", icon: <Download className="w-4 h-4 text-slate-500" />, action: () => toast.success("Download report") },.
*                    ].map((act, idx) => (
                      <button key={idx} onClick={act.action} className="flex flex-col items-center justify-center p-2.5 border border-slate-100 hover:bg-slate-50 rounded-[6px] transition-colors gap-2 text-center h-[72px] bg-white">'
#                        {act.icon}u
q                        <span className="text-[9.5px] font-bold text-slate-600 leading-tight">{act.label}</span>$
                       </button>
                    ))}
                  </div>
                </div>
,
(                {/* Team & Contacts */}c
_                <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">p
l                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">~
z                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Team & Contacts</h3>
                    <button onClick={() => toast.info("View contacts")} className="text-[10px] font-bold text-blue-600 hover:underline">View all contacts</button>
                  </div>2
.                  <div className="space-y-3">
                    {[^
Z                      { name: "Dikshu Sharma", role: "Guide", phone: "+91 98765 43210" },d
`                      { name: "Suresh Kumar", role: "Trip Captain", phone: "+91 98765 56789" },d
`                      { name: "Driver 1 - Ramesh", role: "Tempo 1", phone: "+91 98765 11111" },c
_                      { name: "Driver 2 - Pawan", role: "Tempo 2", phone: "+91 98765 22222" },,
(                    ].map((c, idx) => (j
f                      <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">F
B                        <div className="flex items-center gap-2">
                          <Avatar initials={c.name.split(" ").map(n=>n[0]).join("")} className="bg-slate-700 w-6 h-6 text-[8px]" />$
                           <div>U
Q                            <p className="font-bold text-slate-800">{c.name}</p>d
`                            <p className="text-[9px] text-slate-400 font-semibold">{c.role}</p>%
!                          </div>#
                        </div>F
B                        <div className="flex items-center gap-2">f
b                          <span className="font-mono text-slate-500 text-[10px]">{c.phone}</span>{
w                          <PhoneCall className="w-3.5 h-3.5 text-blue-500 hover:opacity-85 cursor-pointer shrink-0" />#
                        </div>!
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
>
:            {/* Bottom Row Grid matching Screenshot 5 */}H
D            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">3
/              {/* Box 1: Top Pending Tasks */}
{              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                <div>p
l                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
|                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Top Pending Tasks</h3>
                    <button onClick={() => setActiveTab("tasks")} className="text-[10px] font-bold text-blue-600 hover:underline">View all tasks</button>
                  </div>2
.                  <div className="space-y-3">
                    {[t
p                      { title: "Collect balance from 18 participants", priority: "High", date: "02 Jul 2027" },o
k                      { title: "Guide briefing & kit handover", priority: "Medium", date: "04 Jul 2027" },n
j                      { title: "WhatsApp group final message", priority: "Medium", date: "04 Jul 2027" },i
e                      { title: "Emergency contacts sharing", priority: "Low", date: "04 Jul 2027" },/
+                    ].map((task, idx) => (x
t                      <div key={idx} className="flex items-center justify-between gap-3 text-[11px] font-semibold">N
J                        <div className="flex items-center gap-2 min-w-0">Y
U                          <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />t
p                          <p className="truncate font-medium text-slate-700 min-w-0 text-left">{task.title}</p>#
                        </div>O
K                        <div className="flex items-center gap-2 shrink-0">x
t                          <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-[3px] border uppercase",e
a                            task.priority === "High" ? "bg-red-50 text-red-600 border-red-100" :m
i                            task.priority === "Medium" ? "bg-amber-50 text-amber-600 border-amber-100" :N
J                            "bg-slate-50 text-slate-500 border-slate-150"8
4                          )}>{task.priority}</span>i
e                          <span className="text-[9.5px] text-slate-400 font-bold">{task.date}</span>#
                        </div>!
                      </div>
                    ))}
                  </div>
                </div>
              </div>
3
/              {/* Box 2: Payments Overview */}
{              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                <div>p
l                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
|                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Payments Overview</h3>
                    <button onClick={() => setActiveTab("payments")} className="text-[10px] font-bold text-blue-600 hover:underline">View all payments</button>
                  </div>4
0                  <div className="space-y-3.5">
                    {[
                      { label: "Customer Payments Received", value: `₹ ${stats.customerPaid.toLocaleString('en-IN')}`, percent: `${stats.customerPaidPercent}%`, color: "text-emerald-600" },
                      { label: "Customer Outstanding", value: `₹ ${stats.customerOutstanding.toLocaleString('en-IN')}`, percent: `${stats.customerOutstandingPercent}%`, color: "text-[#EA580C]" },
                      { label: "Vendor Payments Made", value: `₹ ${stats.totalVendorPaid.toLocaleString('en-IN')}`, percent: `${stats.vendorPaidPercent}%`, color: "text-slate-700" },
                      { label: "Vendor Payables", value: `₹ ${stats.totalVendorPayables.toLocaleString('en-IN')}`, percent: `${stats.vendorPayablePercent}%`, color: "text-slate-700" },/
+                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-3 text-[11px] font-bold text-slate-800">i
e                        <span className="font-semibold text-slate-500 text-left">{item.label}</span>H
D                        <div className="flex items-center gap-2.5">N
J                          <span className="font-mono">{item.value}</span>x
t                          <span className={cn("text-[10px] font-black shrink-0", item.color)}>{item.percent}</span>#
                        </div>!
                      </div>
                    ))}
                  </div>
                </div>
              </div>
1
-              {/* Box 3: Important Notes */}
{              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                <div>p
l                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">~
z                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Important Notes</h3>
                    <button onClick={() => toast.success("Add Note")} className="text-[10px] font-bold text-blue-600 hover:underline">+ Add Note</button>
                  </div>>
:                  <div className="space-y-3 text-[11px]">
                    {[
                      { text: "Some participants are arriving late in Manali. Monitor arrival timings.", user: "Neeki", date: "29 Jun 2027", bg: "bg-amber-50/50 border-amber-100" },
                      { text: "Hotel Mountain View – 6 rooms upgraded to super deluxe category.", user: "Suresh Bhai", date: "28 Jun 2027", bg: "bg-blue-50/30 border-blue-100" },/
+                    ].map((note, idx) => (`
\                      <div key={idx} className={cn("p-2.5 rounded-[4px] border", note.bg)}>p
l                        <p className="font-medium text-slate-700 text-left leading-relaxed">{note.text}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1.5 text-left">Added by {note.user} on {note.date}</p>!
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => toast.info("View notes")} className="text-[10px] font-black text-blue-600 hover:underline mt-4 text-left">View all notes</button>
              </div>

            </div>
          </div>
        )}

        {/* ──────────────────────── PASSENGERS ──────────────────────── */}-
)        {activeTab === "passengers" && (*
&          <div className="space-y-4">D
@            <div className="flex items-center justify-between">
              <div>X
T                <h2 className="text-base font-black text-slate-800">Passengers</h2>u
q                <p className="text-[11px] text-slate-500 mt-0.5">All confirmed passengers for this departure</p>
              </div>/
+              <div className="flex gap-2">
                <button className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5">S
O                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                </button>
              </div>
            </div>
"
            {/* KPI cards */}H
D            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label:"Total Passengers",  value:passengerStats.total,        sub:"Total confirmed",          color:"text-slate-800" },
                { label:"Paid in Full",       value:passengerStats.paidInFull,   sub:`${passengerStats.paidPercent}% of total`, color:"text-emerald-600" },
                { label:"Partial Payment",    value:passengerStats.partial,      sub:`₹${passengerStats.outstandingPartial.toLocaleString("en-IN")} due`, color:"text-amber-600" },
                { label:"Payment Pending",    value:passengerStats.pending,      sub:`₹${passengerStats.outstandingPending.toLocaleString("en-IN")} due`, color:"text-red-600" },
                { label:"Cancelled",          value:0,                           sub:"0% of total",             color:"text-slate-400" },!
              ].map(kpi => (s
o                <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm">x
t                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>Z
V                  <p className={cn("text-2xl font-black", kpi.color)}>{kpi.value}</p>U
Q                  <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </div>
 
            {/* Filters */}
}            <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm p-3 flex flex-wrap gap-2 items-center">K
G              <div className="relative flex-1 min-w-[200px] max-w-xs">q
m                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Search by name, phone..." value={paxSearch} onChange={e => { setPaxSearch(e.target.value); setPage(1); }}
                  className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#F97316]/30" />
              </div>
              {[
                { value:paymentFilter, setter:setPaymentFilter, opts:[["All","All Payment Status"],["Paid in Full","Paid in Full"],["Partial Payment","Partial Payment"],["Payment Pending","Payment Pending"]] },
                { value:pickupFilter,  setter:setPickupFilter,  opts:[["All","All Pickup Points"],...pickupOptions.map(p=>[p,p])] },
                { value:genderFilter,  setter:setGenderFilter,  opts:[["All","All Genders"],["Male","Male"],["Female","Female"]] },#
              ].map((f,i) => (i
e                <select key={i} value={f.value} onChange={e=>{f.setter(e.target.value);setPage(1);}}
                  className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">V
R                  {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 ml-auto">S
O                <Filter className="w-3.5 h-3.5 text-slate-400" /> More Filters
              </button>
            </div>

            {/* Table */}k
g            <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">O
K              <table className="w-full text-left text-xs border-collapse">N
J                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr>{
w                    <th className="p-3 w-10"><input type="checkbox" className="rounded-[2px] border-slate-300" /></th>y
u                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">PASSENGER</th>u
q                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">PHONE</th>v
r                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">PICKUP</th>
                    w
s                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">PAYMENT</th>
}                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right">AMOUNT</th>
~                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right">BALANCE</th>
|                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-center">DOCS</th>
~                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-center">ACTION</th>
                  </tr>
                </thead>B
>                <tbody className="divide-y divide-[#E2E8F0]">=
9                  {paginatedPassengers.map((p, idx) => ([
W                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">x
t                      <td className="p-3"><input type="checkbox" className="rounded-[2px] border-slate-300" /></td>/
+                      <td className="p-3">
                        <div className="font-bold text-slate-800 hover:text-blue-600 hover:underline cursor-pointer" onClick={() => handleOpenBookingDetails(p.bookingId || p.id)}>(
$                           {p.name}$
                          </div>f
b                        <div className="text-[10px] text-slate-400">{p.gender}, {p.age} yrs</div> 
                      </td>V
R                      <td className="p-3 font-mono text-slate-600">{p.phone}</td>`
\                      <td className="p-3 font-semibold text-slate-700">{p.pickupPoint}</td>
                      
                      <td className="p-3"><StatusBadge status={p.paymentStatus === "Paid in Full" ? "PAID" : p.paymentStatus === "Partial Payment" ? "PARTIALLY PAID" : "UNPAID"} /></td>}
y                      <td className="p-3 text-right font-bold text-slate-700">₹{p.amount.toLocaleString("en-IN")}</td>
                      <td className={cn("p-3 text-right font-bold", p.balance>0?"text-red-600":"text-emerald-600")}>₹{p.balance.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-center"><FileText className={cn("w-4 h-4 mx-auto", p.hasDocs?"text-emerald-500":"text-slate-300")} /></td>;
7                      <td className="p-3 text-center">H
D                        <div className="flex gap-2 justify-center">s
o                          <MessageSquare className="w-4 h-4 text-green-500 cursor-pointer hover:opacity-80" />r
n                          <PhoneCall className="w-3.5 h-3.5 text-blue-500 cursor-pointer hover:opacity-80" />t
p                          <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer hover:opacity-80" />#
                        </div> 
                      </td>
                    </tr>
                  ))}=
9                  {paginatedPassengers.length === 0 && (
                    <tr><td colSpan={10} className="text-center p-10 text-slate-400 font-semibold">No passengers found.</td></tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-500">
                <span>Showing {(page-1)*10+1} to {Math.min(page*10,filteredPassengers.length)} of {filteredPassengers.length} passengers</span>>
:                <div className="flex items-center gap-1">
                  <button disabled={page===1} onClick={()=>setPage(p=>Math.max(p-1,1))} className="border border-slate-200 rounded-[4px] p-1 bg-white hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>d
`                  {[...Array(Math.min(5,Math.ceil(filteredPassengers.length/10)))].map((_,i)=>(
                    <button key={i+1} onClick={()=>setPage(i+1)} className={cn("w-7 h-7 rounded-[4px] text-[11px] font-bold border", page===i+1?"bg-[#F97316] text-white border-[#F97316]":"bg-white border-slate-200 hover:bg-slate-50 text-slate-700")}>{i+1}</button>
                  ))}
                  <button disabled={page>=Math.ceil(filteredPassengers.length/10)} onClick={()=>setPage(p=>Math.min(p+1,Math.ceil(filteredPassengers.length/10)))} className="border border-slate-200 rounded-[4px] p-1 bg-white hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── ITINERARY ──────────────────────── */},
(        {activeTab === "itinerary" && (*
&          <div className="space-y-4">D
@            <div className="flex items-center justify-between">
              <div>W
S                <h2 className="text-base font-black text-slate-800">Itinerary</h2>l
h                <p className="text-[11px] text-slate-500 mt-0.5">Day by day plan for this departure</p>
              </div><
8              <div className="flex items-center gap-2">4
0                {/* Segmented View Switcher */}r
n                <div className="flex bg-slate-100 p-0.5 rounded-[4px] border border-slate-200 shrink-0 mr-2">
                  <buttonI
E                    onClick={() => setItineraryViewMode("internal")}'
#                    className={cn(Z
V                      "text-[10px] font-bold px-3 py-1 rounded-[3px] transition-all",;
7                      itineraryViewMode === "internal"B
>                        ? "bg-white text-slate-800 shadow-xs"D
@                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >&
"                    Internal View 
                  </button>
                  <buttonI
E                    onClick={() => setItineraryViewMode("customer")}'
#                    className={cn(Z
V                      "text-[10px] font-bold px-3 py-1 rounded-[3px] transition-all",;
7                      itineraryViewMode === "customer"B
>                        ? "bg-white text-slate-800 shadow-xs"D
@                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >&
"                    Customer View 
                  </button>
                </div>
                <button onClick={() => toast.info("View Timeline")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">Z
V                  <Sliders className="w-3.5 h-3.5 text-slate-400" /> View as Timeline
                </button>
                <button onClick={() => handleDownloadCSV(computedItinerary, "itinerary_details.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">]
Y                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download Itinerary
                </button>
                <button onClick={() => setVersionHistoryOpen(true)} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">]
Y                  <HistoryIcon className="w-3.5 h-3.5 text-slate-400" /> Version History
                </button>
              </div>
            </div>
&
"            {/* Metrics cards */}J
F            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[
                { v: "9 Days / 8 Nights", l: "Duration & Stays", icon: <Calendar className="w-4 h-4 text-blue-600" />, bg: "bg-blue-50/50" },
                { v: "7 Destinations", l: "Places to be visited", icon: <MapPin className="w-4 h-4 text-emerald-600" />, bg: "bg-emerald-50/50" },
                { v: "~1,320 KM", l: "Total Travel Distance", icon: <Bus className="w-4 h-4 text-cyan-600" />, bg: "bg-cyan-50/50" },
                { v: "6 Activities", l: "Included in itinerary", icon: <Star className="w-4 h-4 text-amber-600" />, bg: "bg-amber-50/50" },!
              ].map(kpi => (
                <div key={kpi.l} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", kpi.bg)}>{kpi.icon}</div>
                  <div>c
_                    <p className="text-xs font-black text-slate-800 leading-tight">{kpi.v}</p>a
]                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{kpi.l}</p>
                  </div>
                </div>
              ))}
            </div>
#
            {/* Grid Table */}k
g            <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">O
K              <table className="w-full text-left text-xs border-collapse">N
J                <thead className="bg-slate-50 border-b border-[#E2E8F0]">f
b                  <tr className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wider">`
\                    <th className="p-3 text-center border-r border-slate-100 w-16">DAY</th>U
Q                    <th className="p-3 border-r border-slate-100 w-28">DATE</th>f
b                    <th className="p-3 border-r border-slate-100 w-[24%]">PLAN & DESTINATION</th>b
^                    <th className="p-3 border-r border-slate-100 w-[18%]">OVERNIGHT STAY</th>?
;                    {itineraryViewMode === "internal" && (d
`                      <th className="p-3 border-r border-slate-100 w-[16%]">TRAVEL DETAILS</th>
                    )}V
R                    <th className="p-3 border-r border-slate-100 w-24">MEALS</th>^
Z                    <th className="p-3 border-r border-slate-100 w-[18%]">ACTIVITIES</th>c
_                    <th className="p-3 border-r border-slate-100 w-20 text-center">STATUS</th>I
E                    <th className="p-3 text-center w-12">ACTION</th>
                  </tr>
                </thead>B
>                <tbody className="divide-y divide-[#E2E8F0]">=
9                  {computedItinerary.map((row, idx) => {C
?                    const isDescExpanded = expandedDescs[idx];O
K                    const shouldTruncate = row.sub && row.sub.length > 80;O
K                    const displayText = shouldTruncate && !isDescExpanded >
:                      ? row.sub.substring(0, 80) + "..." %
!                      : row.sub;
M
I                    const isStayEmpty = !row.stay || row.stay === "—";P
L                    const isMealsEmpty = !row.meals || row.meals === "—";q
m                    const isActEmpty = !row.activities || row.activities === "—" || row.activities === "";
!
                    return (5
1                      <React.Fragment key={idx}>T
P                        <tr className="hover:bg-slate-50/50 transition-colors">r
n                          <td className="p-3 text-center border-r border-slate-100 font-bold text-slate-700">[
W                            <div className="flex items-center justify-center gap-1.5">I
E                              {itineraryViewMode === "internal" && (,
(                                <buttonp
l                                  onClick={() => setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }))}h
d                                  className="text-slate-400 hover:text-slate-650 transition-colors"&
"                                >
                                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expandedRows[idx] && "rotate-180")} />.
*                                </button>%
!                              )}(
$                              <div>M
I                                <span className="block">{row.day}</span>q
m                                <span className="text-[9px] text-slate-400 font-bold mt-0.5">{row.wd}</span>)
%                              </div>'
#                            </div>$
                           </td>u
q                          <td className="p-3 border-r border-slate-100 font-mono text-slate-500">{row.date}</td>M
I                          <td className="p-3 border-r border-slate-100">[
W                            <div className="font-bold text-slate-800">{row.plan}</div>t
p                            <div className="text-[10px] text-slate-400 font-medium mt-0.5 whitespace-pre-line">0
,                              {displayText}7
3                              {shouldTruncate && (,
(                                <buttonq
m                                  onClick={() => setExpandedDescs(prev => ({ ...prev, [idx]: !prev[idx] }))}y
u                                  className="text-blue-500 font-bold ml-1 hover:underline text-[9.5px] inline-block"&
"                                >V
R                                  {isDescExpanded ? "Show Less" : "View Details"}.
*                                </button>%
!                              )}'
#                            </div>$
                           </td>M
I                          <td className="p-3 border-r border-slate-100">1
-                            {isStayEmpty ? (*
&                              <buttonW
S                                onClick={() => handleQuickAdd(row.rawIdx, "stay")}
                                className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-600 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"$
                               >O
K                                <Plus className="w-2.5 h-2.5" /> Not Added,
(                              </button>&
"                            ) : (%
!                              <>_
[                                <div className="font-bold text-slate-800">{row.stay}</div>7
3                                {row.stayType && (Y
U                                  <div className="flex items-center gap-1.5 mt-0.5">w
s                                    <span className="text-[10px] text-slate-400 font-medium">{row.stayType}</span>
                                    <span className={cn("text-[7.5px] font-black px-1.5 py-0.2 rounded-full border tracking-wider",
                                      row.stayBadge === "DELUXE" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"B
>                                    )}>{row.stayBadge}</span>-
)                                  </div>'
#                                )}&
"                              </>#
                            )}$
                           </td>E
A                          {itineraryViewMode === "internal" && (O
K                            <td className="p-3 border-r border-slate-100">5
1                              {!row.distance ? (,
(                                <button]
Y                                  onClick={() => handleQuickAdd(row.rawIdx, "distance")}
                                  className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-600 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"&
"                                >Q
M                                  <Plus className="w-2.5 h-2.5" /> Not Added.
*                                </button>(
$                              ) : ('
#                                <>c
_                                  <div className="font-bold text-slate-800">{row.travel}</div>{
w                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{row.travelSub}</div>(
$                                </>%
!                              )}&
"                            </td>!
                          )}M
I                          <td className="p-3 border-r border-slate-100">2
.                            {isMealsEmpty ? (*
&                              <buttonX
T                                onClick={() => handleQuickAdd(row.rawIdx, "meals")}
                                className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-600 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"$
                               >O
K                                <Plus className="w-2.5 h-2.5" /> Not Added,
(                              </button>&
"                            ) : (d
`                              <span className="text-slate-600 font-semibold">{row.meals}</span>#
                            )}$
                           </td>M
I                          <td className="p-3 border-r border-slate-100">0
,                            {isActEmpty ? (*
&                              <button]
Y                                onClick={() => handleQuickAdd(row.rawIdx, "activities")}
                                className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-650 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"$
                               >O
K                                <Plus className="w-2.5 h-2.5" /> Not Added,
(                              </button>&
"                            ) : (g
c                              <span className="text-slate-650 font-medium">{row.activities}</span>#
                            )}$
                           </td>Y
U                          <td className="p-3 border-r border-slate-100 text-center">5
1                            <span className={cn(w
s                              "text-[8px] font-black border px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider",?
;                              row.status === "INCOMPLETE" U
Q                                ? "bg-amber-50 text-amber-600 border-amber-200" Z
V                                : "bg-emerald-50 text-emerald-700 border-emerald-200"$
                             )}>/
+                              {row.status}(
$                            </span>$
                           </td>?
;                          <td className="p-3 text-center">/
+                            <DropdownMenu>@
<                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded">M
I                                  <MoreHorizontal className="w-4 h-4" />.
*                                </Button>9
5                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36 bg-white border border-slate-200 rounded-[4px] shadow-lg py-1 z-50">6
2                                <DropdownMenuItemY
U                                  onClick={() => handleQuickAdd(row.rawIdx, "edit")}j
f                                  className="text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"&
"                                >7
3                                  Edit Day Details8
4                                </DropdownMenuItem>9
5                              </DropdownMenuContent>0
,                            </DropdownMenu>$
                           </td>"
                        </tr>X
T                        {expandedRows[idx] && itineraryViewMode === "internal" && (>
:                          <tr className="bg-slate-50/50">
                            <td colSpan={itineraryViewMode === "internal" ? 9 : 8} className="p-3.5 border-t border-b border-slate-100">
}                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[11px] font-medium text-slate-650">*
&                                <div>
                                  <span className="block text-[9.5px] uppercase font-bold text-slate-400">Departure Time</span>=
9                                  {row.departureTime ? (r
n                                    <span className="text-slate-800 font-semibold">{row.departureTime}</span>,
(                                  ) : (
                                    <button onClick={() => handleQuickAdd(row.rawIdx, "departureTime")} className="text-blue-500 hover:underline mt-0.5 block">+ Add Departure Time</button>)
%                                  )}+
'                                </div>*
&                                <div>
~                                  <span className="block text-[9.5px] uppercase font-bold text-slate-400">Arrival Time</span>;
7                                  {row.arrivalTime ? (p
l                                    <span className="text-slate-800 font-semibold">{row.arrivalTime}</span>,
(                                  ) : (
                                    <button onClick={() => handleQuickAdd(row.rawIdx, "arrivalTime")} className="text-blue-500 hover:underline mt-0.5 block">+ Add Arrival Time</button>)
%                                  )}+
'                                </div>*
&                                <div>~
z                                  <span className="block text-[9.5px] uppercase font-bold text-slate-400">Distance</span>8
4                                  {row.distance ? (m
i                                    <span className="text-slate-800 font-semibold">{row.distance}</span>,
(                                  ) : (
                                    <button onClick={() => handleQuickAdd(row.rawIdx, "distance")} className="text-blue-500 hover:underline mt-0.5 block">+ Add Distance</button>)
%                                  )}+
'                                </div>*
&                                <div>
                                  <span className="block text-[9.5px] uppercase font-bold text-slate-400">Driving Hours</span><
8                                  {row.drivingHours ? (q
m                                    <span className="text-slate-800 font-semibold">{row.drivingHours}</span>,
(                                  ) : (
                                    <button onClick={() => handleQuickAdd(row.rawIdx, "drivingHours")} className="text-blue-500 hover:underline mt-0.5 block">+ Add Driving Hours</button>)
%                                  )}+
'                                </div>*
&                                <div>
                                  <span className="block text-[9.5px] uppercase font-bold text-slate-400">Assigned Vehicle</span>?
;                                  {row.assignedVehicle ? (t
p                                    <span className="text-slate-800 font-semibold">{row.assignedVehicle}</span>,
(                                  ) : (
                                    <button onClick={() => handleQuickAdd(row.rawIdx, "assignedVehicle")} className="text-blue-500 hover:underline mt-0.5 block">+ Assign Vehicle</button>)
%                                  )}+
'                                </div>)
%                              </div>&
"                            </td>$
                           </tr>
                        )},
(                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
|
x            <div className="flex gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-[6px] p-3.5">N
J              <Info className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />}
y              <span>All times are tentative and subject to change due to weather, traffic or operational reasons.</span>
            </div>
          </div>
        )}
3
/        {/* Quick Edit Itinerary Day Modal */}T
P        <Dialog open={quickEditModalOpen} onOpenChange={setQuickEditModalOpen}>f
b          <DialogContent className="max-w-md bg-white p-5 rounded-[6px] border border-slate-200">
            <DialogHeader>N
J              <DialogTitle className="text-sm font-black text-slate-800">[
W                Edit Itinerary - Day {editingDayIdx !== null ? editingDayIdx + 1 : ""}!
              </DialogTitle>M
I              <DialogDescription className="text-[11px] text-slate-400">V
R                Update the plan, stay, meals, activities, and operational fields.'
#              </DialogDescription> 
            </DialogHeader>Y
U            <form onSubmit={handleSaveQuickEdit} className="space-y-3 mt-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Plan & Destination</label>
                <Input3
/                  value={editingDayData.title}m
i                  onChange={e => setEditingDayData((prev: any) => ({ ...prev, title: e.target.value }))}:
6                  placeholder="e.g. Delhi → Shimla".
*                  className="h-8 text-xs"
                  required
                />
              </div>;
7              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Overnight Stay</label>
                  <Input4
0                    value={editingDayData.stay}n
j                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, stay: e.target.value }))}<
8                    placeholder="e.g. Hotel Ridge View"0
,                    className="h-8 text-xs"
                  />
                </div>
                <div>
|                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Meals</label>
                  <Input5
1                    value={editingDayData.meals}o
k                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, meals: e.target.value }))}=
9                    placeholder="e.g. Breakfast, Dinner"0
,                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Activities (comma-separated)</label>
                <Input8
4                  value={editingDayData.activities}r
n                  onChange={e => setEditingDayData((prev: any) => ({ ...prev, activities: e.target.value }))}G
C                  placeholder="e.g. Mall Road Stroll, Sightseeing".
*                  className="h-8 text-xs"
                />
              </div>;
7              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Departure Time</label>
                  <Input=
9                    value={editingDayData.departureTime}w
s                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, departureTime: e.target.value }))}4
0                    placeholder="e.g. 09:00 AM"0
,                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Arrival Time</label>
                  <Input;
7                    value={editingDayData.arrivalTime}u
q                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, arrivalTime: e.target.value }))}4
0                    placeholder="e.g. 06:00 PM"0
,                    className="h-8 text-xs"
                  />
                </div>
              </div>;
7              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Distance</label>
                  <Input8
4                    value={editingDayData.distance}r
n                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, distance: e.target.value }))}2
.                    placeholder="e.g. 340 KM"0
,                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Driving Hours</label>
                  <Input<
8                    value={editingDayData.drivingHours}v
r                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, drivingHours: e.target.value }))}1
-                    placeholder="e.g. 8 Hrs"0
,                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Vehicle</label>
                  <Input?
;                    value={editingDayData.assignedVehicle}y
u                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, assignedVehicle: e.target.value }))}6
2                    placeholder="e.g. Volvo / TT"0
,                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea9
5                  value={editingDayData.description}s
o                  onChange={e => setEditingDayData((prev: any) => ({ ...prev, description: e.target.value }))}C
?                  placeholder="Enter day wise plan details..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-[4px] p-2 bg-white text-slate-800 outline-none hover:border-slate-300 focus:border-slate-400"
                />
              </div>@
<              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setQuickEditModalOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                  Cancel
                </Button>
|                <Button type="submit" className="h-8 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded">#
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
5
1        {/* Itinerary Version History Dialog */}T
P        <Dialog open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>f
b          <DialogContent className="max-w-md bg-white p-5 rounded-[6px] border border-slate-200">
            <DialogHeader>N
J              <DialogTitle className="text-sm font-black text-slate-800">.
*                Itinerary Version History!
              </DialogTitle>M
I              <DialogDescription className="text-[11px] text-slate-400">L
H                Review and restore previous versions of this itinerary.'
#              </DialogDescription> 
            </DialogHeader>O
K            <div className="space-y-2 mt-3 max-h-80 overflow-y-auto pr-1">g
c              {(!tripDetails?.itineraryVersions || tripDetails.itineraryVersions.length === 0) ? ([
W                <div className="text-center p-6 text-slate-400 font-semibold text-xs">c
_                  No version history found. Changes will generate versions after confirmation.
                </div>
              ) : (d
`                [...tripDetails.itineraryVersions].reverse().map((ver: any, index: number) => {:
6                  const dateFormatted = ver.updatedAt
                    ? new Date(ver.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })*
&                    : "Unknown Time";
                  
                  return (
                    <div key={index} className="border border-slate-150 rounded-[4px] p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between"> 
                      <div>f
b                        <p className="text-xs font-bold text-slate-800">Version {ver.version}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{dateFormatted} • by {ver.updatedBy || 'System'}</p>y
u                        <p className="text-[10px] text-slate-500 mt-1">{ver.itinerary?.length || 0} days defined</p>!
                      </div>"
                      <Button3
/                        onClick={async () => {$
                           try {a
]                            const restoredTrip = await api.put(`/trips/${tripDetails.id}`, {;
7                              itinerary: ver.itinerary$
                             });C
?                            setTripDetails(restoredTrip.data);b
^                            toast.success(`Restored to Version {ver.version} successfully!`);>
:                            setVersionHistoryOpen(false);3
/                          } catch (err: any) {R
N                            toast.error(`Failed to restore: ${err.message}`); 
                          }
                        }}z
v                        className="h-7 text-[10px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded px-3"
                      >$
                         Restore$
                       </Button>
                    </div>
                  );
                })
              )}
            </div>8
4            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setVersionHistoryOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>L
H        <Dialog open={hotelModalOpen} onOpenChange={setHotelModalOpen}>f
b          <DialogContent className="max-w-md bg-white p-5 rounded-[6px] border border-slate-200">
            <DialogHeader>g
c              <DialogTitle className="text-sm font-black text-slate-800 uppercase tracking-wider">n
j                Edit Stay Arrangements — {editingHotelIdx !== null ? `Day ${editingHotelIdx + 1}` : ""}!
              </DialogTitle>I
E              <DialogDescription className="text-xs text-slate-500">S
O                Update hotel details, pricing, rooms, and confirmation status.'
#              </DialogDescription> 
            </DialogHeader>
Q
M            <form onSubmit={handleSaveHotelEdit} className="space-y-4 mt-3">;
7              <div className="grid grid-cols-2 gap-3">
                <div>v
r                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hotel Name</label>
                  <input$
                     type="text"!
                    required7
3                    value={editingHotelData.hotel}j
f                    onChange={e => setEditingHotelData({...editingHotelData, hotel: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>w
s                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Destination</label>
                  <input$
                     type="text"!
                    required6
2                    value={editingHotelData.dest}i
e                    onChange={e => setEditingHotelData({...editingHotelData, dest: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>
;
7              <div className="grid grid-cols-2 gap-3">
                <div>u
q                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Room Type</label>
                  <input$
                     type="text"6
2                    value={editingHotelData.type}i
e                    onChange={e => setEditingHotelData({...editingHotelData, type: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>u
q                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Meal Plan</label>
                  <input$
                     type="text"6
2                    value={editingHotelData.plan}i
e                    onChange={e => setEditingHotelData({...editingHotelData, plan: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>
;
7              <div className="grid grid-cols-3 gap-3">
                <div>w
s                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rooms Count</label>
                  <input&
"                    type="number"<
8                    value={editingHotelData.roomsCount}~
z                    onChange={e => setEditingHotelData({...editingHotelData, roomsCount: parseInt(e.target.value) || 0})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>x
t                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Guests</label>
                  <input&
"                    type="number"=
9                    value={editingHotelData.guestsCount}
{                    onChange={e => setEditingHotelData({...editingHotelData, guestsCount: parseInt(e.target.value) || 0})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>r
n                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nights</label>
                  <input&
"                    type="number"8
4                    value={editingHotelData.nights}z
v                    onChange={e => setEditingHotelData({...editingHotelData, nights: parseInt(e.target.value) || 1})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>
;
7              <div className="grid grid-cols-2 gap-3">
                <div>}
y                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Agreed Cost (₹)</label>
                  <input&
"                    type="number"5
1                    value={editingHotelData.amt}w
s                    onChange={e => setEditingHotelData({...editingHotelData, amt: parseInt(e.target.value) || 0})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>}
y                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Paid Amount (₹)</label>
                  <input&
"                    type="number"9
5                    value={editingHotelData.paidAmt}{
w                    onChange={e => setEditingHotelData({...editingHotelData, paidAmt: parseInt(e.target.value) || 0})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>
;
7              <div className="grid grid-cols-2 gap-3">
                <div>r
n                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
                  <select8
4                    value={editingHotelData.status}k
g                    onChange={e => setEditingHotelData({...editingHotelData, status: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  >E
A                    <option value="CONFIRMED">CONFIRMED</option>A
=                    <option value="PENDING">PENDING</option> 
                  </select>
                </div>
                <div>z
v                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Voucher Status</label>
                  <input$
                     type="text"9
5                    value={editingHotelData.voucher}l
h                    onChange={e => setEditingHotelData({...editingHotelData, voucher: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>
Z
V              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setHotelModalOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                  Cancel
                </Button>
|                <Button type="submit" className="h-8 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded">#
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
T
P        <Dialog open={transportModalOpen} onOpenChange={setTransportModalOpen}>f
b          <DialogContent className="max-w-md bg-white p-5 rounded-[6px] border border-slate-200">
            <DialogHeader>g
c              <DialogTitle className="text-sm font-black text-slate-800 uppercase tracking-wider">0
,                Edit Transport Arrangements!
              </DialogTitle>I
E              <DialogDescription className="text-xs text-slate-500">L
H                Update transport details, capacity, seats, and pricing.'
#              </DialogDescription> 
            </DialogHeader>
U
Q            <form onSubmit={handleSaveTransportEdit} className="space-y-4 mt-3">;
7              <div className="grid grid-cols-2 gap-3">
                <div>x
t                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vehicle Type</label>
                  <input$
                     type="text"!
                    required:
6                    value={editingTransportData.type}q
m                    onChange={e => setEditingTransportData({...editingTransportData, type: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Capacity Label (e.g. 26 Seater)</label>
                  <input$
                     type="text"!
                    required9
5                    value={editingTransportData.cap}p
l                    onChange={e => setEditingTransportData({...editingTransportData, cap: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>
;
7              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vehicle Details / Plate</label>
                  <input$
                     type="text";
7                    value={editingTransportData.plate}r
n                    onChange={e => setEditingTransportData({...editingTransportData, plate: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>x
t                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Model / Make</label>
                  <input$
                     type="text";
7                    value={editingTransportData.model}r
n                    onChange={e => setEditingTransportData({...editingTransportData, model: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>
;
7              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Capacity Seats (Number)</label>
                  <input&
"                    type="number"A
=                    value={editingTransportData.capacityNum}
                    onChange={e => setEditingTransportData({...editingTransportData, capacityNum: parseInt(e.target.value) || 0})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>x
t                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Seats Booked</label>
                  <input&
"                    type="number"A
=                    value={editingTransportData.seatsBooked}
                    onChange={e => setEditingTransportData({...editingTransportData, seatsBooked: parseInt(e.target.value) || 0})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>
;
7              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Agreed Cost (₹)</label>
                  <input&
"                    type="number";
7                    value={editingTransportData.total}r
n                    onChange={e => setEditingTransportData({...editingTransportData, total: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div>}
y                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Paid Amount (₹)</label>
                  <input&
"                    type="number":
6                    value={editingTransportData.paid}q
m                    onChange={e => setEditingTransportData({...editingTransportData, paid: e.target.value})}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              </div>
Z
V              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setTransportModalOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                  Cancel
                </Button>
|                <Button type="submit" className="h-8 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded">#
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ──────────────────────── HOTELS ──────────────────────── */})
%        {activeTab === "hotels" && (*
&          <div className="space-y-4">D
@            <div className="flex items-center justify-between">
              <div>T
P                <h2 className="text-base font-black text-slate-800">Hotels</h2>z
v                <p className="text-[11px] text-slate-500 mt-0.5">Manage hotels and stay arrangements for each day</p>
              </div>/
+              <div className="flex gap-2">
                <button onClick={() => toast.info("View Timeline")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">Z
V                  <Sliders className="w-3.5 h-3.5 text-slate-400" /> View as Timeline
                </button>
                <button onClick={() => toast.info("Download")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">S
O                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                </button>
              </div>
            </div>
 
            {/* Metrics */}J
F            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {[
                { v: String(hotelStats.totalNights), l: "TOTAL NIGHTS", desc: `Across ${hotelStats.totalNights} stays`, color: "text-indigo-600 bg-indigo-50 border-indigo-100", icon: Bed },
                { v: String(hotelStats.confirmedNights), l: "CONFIRMED", desc: `${((hotelStats.confirmedNights / (hotelStats.totalNights || 1))*100).toFixed(1)}% of stays`, color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: Check },
                { v: String(hotelStats.pendingNights), l: "PENDING", desc: `${((hotelStats.pendingNights / (hotelStats.totalNights || 1))*100).toFixed(1)}% of stays`, color: "text-amber-600 bg-amber-50 border-amber-100", icon: Clock },
                { v: String(hotelStats.totalRooms), l: "TOTAL ROOMS", desc: "All rooms combined", color: "text-blue-600 bg-blue-50 border-blue-100", icon: Compass },
                { v: `${hotelStats.roomsBooked} / ${hotelStats.totalRooms}`, l: "ROOMS BOOKED", desc: `${hotelStats.occupancy}% occupancy`, color: "text-cyan-600 bg-cyan-50 border-cyan-100", icon: Users },
              ].map(k => (
                <div key={k.l} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex items-center gap-3">
{                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border", k.color)}>7
3                    <k.icon className="w-5 h-5" />
                  </div>
                  <div>s
o                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{k.l}</p>Z
V                    <p className="text-xl font-black text-slate-800 mt-0.5">{k.v}</p>d
`                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{k.desc}</p>
                  </div>
                </div>
              ))}
            </div>
#
            {/* Filter Bar */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">6
2                <option>All Hotel Status</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">0
,                <option>All Cities</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">4
0                <option>All Room Types</option>
              </select>K
G              <div className="relative flex-1 max-w-xs min-w-[150px]">q
m                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                <input type="text" placeholder="Search hotel or location..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
              </div>
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 bg-white hover:bg-slate-50 text-slate-755 flex items-center gap-1.5 ml-auto shadow-3xs">N
J                <Filter className="w-3.5 h-3.5 text-slate-450" /> Filters
              </button>
            </div>
%
!            {/* Hotels Table */}k
g            <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">O
K              <table className="w-full text-left text-xs border-collapse">N
J                <thead className="bg-slate-50 border-b border-[#E2E8F0]">f
b                  <tr className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wider">O
K                    <th className="p-3 border-r border-slate-100">DAY</th>W
S                    <th className="p-3 border-r border-slate-100">DESTINATION</th>Y
U                    <th className="p-3 border-r border-slate-100">HOTEL DETAILS</th>\
X                    <th className="p-3 border-r border-slate-100">ROOM TYPE & PLAN</th>d
`                    <th className="p-3 border-r border-slate-100 text-center">ROOMS BOOKED</th>^
Z                    <th className="p-3 border-r border-slate-100 text-center">NIGHTS</th>R
N                    <th className="p-3 border-r border-slate-100">STATUS</th>X
T                    <th className="p-3 border-r border-slate-100">AMOUNT (₹)</th>D
@                    <th className="p-3 text-center">ACTION</th>
                  </tr>
                </thead>B
>                <tbody className="divide-y divide-[#E2E8F0]">:
6                  {computedHotels.map((row, idx) => {0
,                    const dayNum = idx + 1;.
*                    const badgeColors = [C
?                      "bg-red-50 text-red-600 border-red-100",O
K                      "bg-emerald-50 text-emerald-600 border-emerald-100",I
E                      "bg-amber-50 text-amber-600 border-amber-100",F
B                      "bg-blue-50 text-blue-600 border-blue-100",L
H                      "bg-purple-50 text-purple-600 border-purple-100",F
B                      "bg-pink-50 text-pink-600 border-pink-100",E
A                      "bg-teal-50 text-teal-600 border-teal-100"
                    ];R
N                    const badgeClass = badgeColors[idx % badgeColors.length];
!
                    return (\
X                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">K
G                        <td className="p-3 border-r border-slate-100">
                          <span className={cn("inline-block px-1.5 py-0.5 rounded-[3px] font-bold text-[9px] mb-1 border", badgeClass)}>{row.day}</span>d
`                          <p className="font-extrabold text-slate-800 text-[10px]">{row.wd}</p>m
i                          <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{row.date}</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">U
Q                          <p className="font-bold text-slate-800">{row.dest}</p>s
o                          <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">Himachal Pradesh</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">$
                           <div>d
`                            <p className="font-bold text-slate-855 text-[11px]">{row.hotel}</p>n
j                            <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{row.sub}</p>I
E                            {row.rating && row.rating !== "—" && (s
o                              <p className="text-[9.5px] text-amber-500 font-bold mt-0.5">★ {row.rating}</p>#
                            )}%
!                          </div>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">Y
U                          <p className="font-semibold text-slate-800">{row.type}</p>m
i                          <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{row.plan}</p>~
z                          <p className="text-[9.5px] text-slate-400 font-semibold">({row.paxSub || "2 Pax per room"})</p>"
                        </td>W
S                        <td className="p-3 border-r border-slate-100 text-center">V
R                          <p className="font-bold text-slate-800">{row.rooms}</p>e
a                          <p className="text-[9.5px] text-slate-400 font-bold">{row.roomSub}</p>"
                        </td>
}                        <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-700">{row.nights}</td>K
G                        <td className="p-3 border-r border-slate-100">
                          <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-[3px] border uppercase tracking-wider block w-fit",
                            row.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"5
1                          )}>{row.status}</span>|
x                          <span className="text-[9.5px] text-slate-400 font-semibold mt-0.5 block">{row.voucher}</span>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">T
P                          <p className="font-bold text-slate-850">{row.amt}</p>h
d                          <p className="text-[9.5px] text-slate-400 font-semibold">{row.amtSub}</p>"
                        </td>=
9                        <td className="p-3 text-center">D
@                          <div className="flex justify-center">(
$                            <Button2
.                              variant="ghost".
*                              size="icon"L
H                              onClick={() => handleHotelEditClick(idx)}t
p                              className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-750 rounded""
                            >I
E                              <MoreHorizontal className="w-4 h-4" />*
&                            </Button>%
!                          </div>"
                        </td> 
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
2
.            {/* Bottom calculation status */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold shadow-xs">F
B              <div className="flex flex-wrap items-center gap-6">n
j                <span className="text-slate-700 font-bold">Total ({hotelStats.totalNights} Nights)</span>N
J                <div className="h-4 w-px bg-slate-200 hidden sm:block" />P
L                <span className="text-slate-600 flex items-center gap-1.5">i
e                  <Compass className="w-4 h-4 text-slate-400" /> {hotelStats.totalRooms} Total Rooms
                </span>P
L                <span className="text-slate-600 flex items-center gap-1.5">
}                  <Bed className="w-4 h-4 text-slate-400" /> {hotelStats.roomsBooked} / {hotelStats.totalRooms} Rooms Booked
                </span>P
L                <span className="text-slate-600 flex items-center gap-1.5">e
a                  <Users className="w-4 h-4 text-slate-400" /> {hotelStats.occupancy}% Occupancy
                </span>
              </div>N
J              <div className="flex flex-wrap items-center gap-6 ml-auto">
                <p className="text-slate-500 font-medium">Total Amount <span className="font-black text-slate-800 ml-1">₹ {hotelStats.totalAmount.toLocaleString('en-IN')}</span></p>
                <p className="text-slate-500 font-medium">Paid: <span className="font-bold text-emerald-600 ml-1">₹ {hotelStats.totalPaid.toLocaleString('en-IN')}</span></p>
                <p className="text-slate-500 font-medium">Pending: <span className="font-bold text-rose-600 ml-1">₹ {hotelStats.totalPending.toLocaleString('en-IN')}</span></p>
                <button onClick={() => toast.info("Report downloading...")} className="h-8.5 rounded-[4px] bg-slate-900 hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 text-white px-4 shadow-sm">K
G                  <Download className="w-3.5 h-3.5" /> Download Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── TRANSPORT ──────────────────────── */},
(        {activeTab === "transport" && (*
&          <div className="space-y-4">D
@            <div className="flex items-center justify-between">
              <div>W
S                <h2 className="text-base font-black text-slate-800">Transport</h2>{
w                <p className="text-[11px] text-slate-500 mt-0.5">Manage all travel arrangements for this departure</p>
              </div>/
+              <div className="flex gap-2">
                <button onClick={() => toast.info("View Timeline")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">Z
V                  <Sliders className="w-3.5 h-3.5 text-slate-400" /> View as Timeline
                </button>
                <button onClick={() => toast.info("Download")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">S
O                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                </button>
              </div>
            </div>
"
            {/* KPI Cards */}J
F            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
              {[
                { v: "2", l: "Road Vehicles", sub: "All confirmed", icon: <Bus className="w-4 h-4 text-blue-600" />, bg: "bg-blue-50/50" },
                { v: "1", l: "Train Bookings", sub: "Confirmed", icon: <CalendarCheck className="w-4 h-4 text-emerald-600" />, bg: "bg-emerald-50/50" },
                { v: "0", l: "Flight Bookings", sub: "—", icon: <Sparkles className="w-4 h-4 text-purple-600" />, bg: "bg-purple-50/50" },
                { v: "0", l: "Other Bookings", sub: "—", icon: <Compass className="w-4 h-4 text-amber-600" />, bg: "bg-amber-50/50" },
                { v: "120", l: "Total Seats", sub: "Booked", icon: <Users className="w-4 h-4 text-cyan-600" />, bg: "bg-cyan-50/50" },
                { v: "100%", l: "Transport Ready", sub: "All confirmed", icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: "bg-emerald-50/50" }
              ].map(k => (
                <div key={k.l} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex items-center gap-3">
}                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", k.bg)}>{k.icon}</div>
                  <div>a
]                    <p className="text-lg font-black text-slate-800 leading-tight">{k.v}</p>v
r                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-0.5">{k.l}</p>[
W                    <p className="text-[9px] text-slate-400 font-semibold">{k.sub}</p>
                  </div>
                </div>
              ))}
            </div>
$
             {/* Filter Tabs */}[
W            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
              {[0
,                { label: "All", count: 3 },1
-                { label: "Road", count: 2 },2
.                { label: "Train", count: 1 },3
/                { label: "Flight", count: 0 },1
-                { label: "Other", count: 0 }&
"              ].map((t, idx) => (
                <button key={t.label} className={cn("px-3 py-1.5 text-[11px] font-bold rounded-[4px] flex items-center gap-1.5 transition-colors",
                  idx === 0 ? "bg-[#F97316]/10 text-[#F97316] font-extrabold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}> 
                  {t.label}]
Y                  <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded-full",e
a                    idx === 0 ? "bg-[#F97316]/20 text-[#F97316]" : "bg-slate-100 text-slate-500"*
&                  )}>{t.count}</span>
                </button>
              ))}
            </div>
-
)            {/* Filter Selectors Bar */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">0
,                <option>All Status</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">8
4                <option>All Transport Type</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">1
-                <option>All Vendors</option>
              </select>K
G              <div className="relative flex-1 max-w-xs min-w-[150px]">q
m                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                <input type="text" placeholder="Search vehicle, train, PNR..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
              </div>
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 bg-white hover:bg-slate-50 text-slate-755 flex items-center gap-1.5 ml-auto shadow-3xs">T
P                <Sliders className="w-3.5 h-3.5 text-slate-455" /> More Filters
              </button>
            </div>
+
'            {/* Road Vehicles list */}.
*            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">Road Vehicles <span className="text-slate-400 font-bold">(2)</span></h3>m
i              <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">Q
M                <table className="w-full text-left text-xs border-collapse">P
L                  <thead className="bg-slate-50 border-b border-[#E2E8F0]">h
d                    <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">_
[                      <th className="p-3 border-r border-slate-100 w-12 text-center"></th>W
S                      <th className="p-3 border-r border-slate-100 w-36">TYPE</th>d
`                      <th className="p-3 border-r border-slate-100 w-44">VEHICLE / DETAILS</th>\
X                      <th className="p-3 border-r border-slate-100 w-[15%]">VENDOR</th>\
X                      <th className="p-3 border-r border-slate-100 w-[15%]">PICKUP</th>]
Y                      <th className="p-3 border-r border-slate-100 w-[15%]">DROPOFF</th>X
T                      <th className="p-3 border-r border-slate-100 w-24">DATES</th>_
[                      <th className="p-3 border-r border-slate-100 text-center">SEATS</th>d
`                      <th className="p-3 border-r border-slate-100 text-right">TOTAL (₹)</th>c
_                      <th className="p-3 border-r border-slate-100 text-right">PAID (₹)</th>b
^                      <th className="p-3 border-r border-slate-100 text-right">DUE (₹)</th>T
P                      <th className="p-3 border-r border-slate-100">STATUS</th>K
G                      <th className="p-3 text-center w-24">ACTION</th>
                    </tr>
                  </thead>D
@                  <tbody className="divide-y divide-[#E2E8F0]">?
;                    {computedTransport.map((row, idx) => (\
X                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 text-center border-r border-slate-100"><Bus className="w-4 h-4 text-slate-400" /></td>K
G                        <td className="p-3 border-r border-slate-100">U
Q                          <p className="font-bold text-slate-800">{row.type}</p>m
i                          <p className="text-[10px] text-slate-450 font-semibold mt-0.5">({row.cap})</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">`
\                          <p className="font-bold text-slate-855 font-mono">{row.plate}</p>m
i                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{row.model}</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">W
S                          <p className="font-bold text-slate-800">{row.vendor}</p>n
j                          <p className="text-[9.5px] text-slate-450 font-semibold mt-0.5">{row.phone}</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">U
Q                          <p className="font-bold text-slate-800">{row.from}</p>q
m                          <p className="text-[9.5px] text-slate-455 font-semibold mt-0.5">{row.fromTime}</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">S
O                          <p className="font-bold text-slate-800">{row.to}</p>o
k                          <p className="text-[9.5px] text-slate-455 font-semibold mt-0.5">{row.toTime}</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">a
]                          <p className="font-bold text-slate-800 text-[10px]">{row.days}</p>
                          <span className="text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-1 py-0.2 rounded-full mt-0.5 block w-fit">{row.daysCount}</span>"
                        </td>
                        <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-800 font-mono">{row.seats}</td>
{                        <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-800">{row.total}</td>
|                        <td className="p-3 border-r border-slate-100 text-right font-bold text-emerald-600">{row.paid}</td>{
w                        <td className="p-3 border-r border-slate-100 text-right font-bold text-red-650">{row.due}</td>K
G                        <td className="p-3 border-r border-slate-100">
                          <span className="text-[8.5px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider block w-fit">CONFIRMED</span>"
                        </td>=
9                        <td className="p-3 text-center">Y
U                          <div className="flex justify-center items-center gap-1.5">
                            <select className="h-7 text-[10px] font-bold border border-slate-200 rounded-[4px] px-1.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">8
4                              <option>View</option>*
&                            </select>(
$                            <Button2
.                              variant="ghost".
*                              size="icon"P
L                              onClick={() => handleTransportEditClick(idx)}t
p                              className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded""
                            >I
E                              <MoreHorizontal className="w-4 h-4" />*
&                            </Button>%
!                          </div>"
                        </td> 
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
,
(            {/* Train Bookings list */}.
*            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">Train Bookings <span className="text-slate-400 font-bold">(1)</span></h3>m
i              <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">Q
M                <table className="w-full text-left text-xs border-collapse">P
L                  <thead className="bg-slate-50 border-b border-[#E2E8F0]">h
d                    <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">_
[                      <th className="p-3 border-r border-slate-100 w-12 text-center"></th>a
]                      <th className="p-3 border-r border-slate-100 w-[24%]">TRAIN / PNR</th>[
W                      <th className="p-3 border-r border-slate-100 w-[20%]">ROUTE</th>_
[                      <th className="p-3 border-r border-slate-100 w-[12%]">DEPARTURE</th>]
Y                      <th className="p-3 border-r border-slate-100 w-[12%]">ARRIVAL</th>W
S                      <th className="p-3 border-r border-slate-100 w-28">DATE</th>]
Y                      <th className="p-3 border-r border-slate-100 w-36">PASSENGERS</th>T
P                      <th className="p-3 border-r border-slate-100">STATUS</th>K
G                      <th className="p-3 text-center w-24">ACTION</th>
                    </tr>
                  </thead>D
@                  <tbody className="divide-y divide-[#E2E8F0]">=
9                    {trainBookings.map((train: any) => (a
]                      <tr key={train.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 text-center border-r border-slate-100"><CalendarCheck className="w-4 h-4 text-slate-400" /></td>K
G                        <td className="p-3 border-r border-slate-100">\
X                          <p className="font-bold text-slate-800">{train.trainName}</p>x
t                          <p className="text-[10px] text-slate-400 font-bold mt-0.5 font-mono">PNR: {train.pnr}</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">H
D                          <div className="flex items-center gap-2">&
"                            <div>[
W                              <p className="font-bold text-slate-800">{train.from}</p>q
m                              <p className="text-[9.5px] text-slate-450 font-semibold mt-0.5">{train.to}</p>'
#                            </div>L
H                            <span className="text-slate-400">→</span>%
!                          </div>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">Z
V                          <p className="font-bold text-slate-855">{train.depTime}</p>~
z                          <p className="text-[9.5px] text-slate-450 font-semibold mt-0.5">{train.depStation || "DEP"}</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">Z
V                          <p className="font-bold text-slate-855">{train.arrTime}</p>~
z                          <p className="text-[9.5px] text-slate-450 font-semibold mt-0.5">{train.arrStation || "ARR"}</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">W
S                          <p className="font-bold text-slate-800">{train.date}</p>x
t                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{train.dayWd || "Sun"}</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">X
T                          <p className="font-bold text-slate-800">{train.seats}</p>^
Z                          <p className="text-[9.5px] text-slate-400 font-bold">Booked</p>"
                        </td>K
G                        <td className="p-3 border-r border-slate-100">
                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider block w-fit border ${
                            train.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'8
4                          }`}>{train.status}</span>"
                        </td>=
9                        <td className="p-3 text-center">&
"                          <buttonK
G                            onClick={() => handleOpenEditTrain(train)}
                            className="text-[11px] font-bold text-[#F97316] border border-[#F97316]/20 rounded-[4px] px-3 py-1 bg-[#F97316]/5 hover:bg-[#F97316]/10 transition-colors" 
                          >+
'                            Edit Train(
$                          </button>"
                        </td> 
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
/
+            {/* Other Bookings section */}.
*            <div className="space-y-2.5">F
B              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Other Bookings <span className="text-slate-400 font-bold">(0)</span></h3>
                <button onClick={() => toast.info("Add other transport")} className="text-[10.5px] font-extrabold text-slate-750 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1 rounded-[4px] shadow-3xs flex items-center gap-1">G
C                  <Plus className="w-3 h-3" /> Add Other Transport
                </button>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-8 text-center flex flex-col items-center justify-center gap-2.5 shadow-3xs">y
u                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">6
2                  <Compass className="w-5 h-5" />
                </div>
                <div>f
b                  <p className="text-xs font-bold text-slate-800">No other transport bookings</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Add ferry, taxi, or other transport if required.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── ROOM & VEHICLE ALLOCATION ──────────────────────── */}-
)        {activeTab === "allocation" && (*
&          <div className="space-y-4">D
@            <div className="flex items-center justify-between">
              <div>g
c                <h2 className="text-base font-black text-slate-800">Room & Vehicle Allocation</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage room sharing groups and vehicle seat allotments with manual shuffling</p>
              </div>/
+              <div className="flex gap-2">
                <Button size="sm" onClick={handleTriggerAutoAllocate} className="h-8.5 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] shadow-sm flex items-center gap-1.5">P
L                  <RefreshCw className="w-3.5 h-3.5" /> Run Auto-Allocation
                </Button>
              </div>
            </div>
B
>            {/* Auto-Allocation Rules Configuration Panel */}i
e            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">[
W              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">C
?                <Sliders className="w-4 h-4 text-[#F97316]" />`
\                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">:
6                  Auto-Allocation Rules Configuration
                </h3>
              </div>
              W
S              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">8
4                {/* Rule 1: Room Sharing Choice */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Room Sharing Basis</label>
                  <select,
(                    value={sharingPref}I
E                    onChange={(e) => setSharingPref(e.target.value)}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2.5 text-xs font-bold text-slate-700 bg-white cursor-pointer outline-none hover:bg-slate-50"
                  >F
B                    <option value="2">2-Sharing (Double)</option>F
B                    <option value="3">3-Sharing (Triple)</option>D
@                    <option value="4">4-Sharing (Quad)</option> 
                  </select>
                </div>
7
3                {/* Rule 2: Gender Segregation */}K
G                <div className="flex items-center gap-2 pt-4 sm:pt-0">
                  <input(
$                    type="checkbox".
*                    id="rule-same-gender"5
1                    checked={sameGenderEnforced}R
N                    onChange={(e) => setSameGenderEnforced(e.target.checked)}x
t                    className="h-4 w-4 rounded border-slate-200 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                  />
                  <label htmlFor="rule-same-gender" className="text-[11px] font-bold text-slate-650 cursor-pointer select-none">M
I                    Enforce same-gender rooms (Male/Male, Female/Female)
                  </label>
                </div>
7
3                {/* Rule 3: Prioritize couples */}K
G                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <input(
$                    type="checkbox"5
1                    id="rule-prioritize-couples"4
0                    checked={prioritizeCouples}Q
M                    onChange={(e) => setPrioritizeCouples(e.target.checked)}x
t                    className="h-4 w-4 rounded border-slate-200 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                  />
                  <label htmlFor="rule-prioritize-couples" className="text-[11px] font-bold text-slate-650 cursor-pointer select-none">?
;                    Prioritize couples for 2-sharing rooms
                  </label>
                </div>
5
1                {/* Rule 4: Fallback to Quad */}K
G                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <input(
$                    type="checkbox"0
,                    id="rule-fallback-quad"1
-                    checked={fallbackToQuad}N
J                    onChange={(e) => setFallbackToQuad(e.target.checked)}x
t                    className="h-4 w-4 rounded border-slate-200 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                  />
                  <label htmlFor="rule-fallback-quad" className="text-[11px] font-bold text-slate-650 cursor-pointer select-none">C
?                    Fallback leftover travelers into 4-sharing
                  </label>
                </div>
              </div>
            </div>
-
)            {/* Assignments Previews */}H
D            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">2
.              {/* Hotel Group Assignments */}k
g              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">z
v                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">3
/                  🏨 Hotel Group Assignments
                </h3>>
:                {computedRoomAllocations.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-4 text-center">No group assignments. Use the shuffler below or Auto-Allocate.</p>
                ) : (N
J                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">)
%                    {Object.entries(\
X                      computedRoomAllocations.reduce((acc: Record<string, any>, r) => {
~                        if (!acc[r.roomNumber]) acc[r.roomNumber] = { type: r.roomType, gender: r.genderGroup, members: [] };L
H                        acc[r.roomNumber].members.push(r.travelerName);(
$                        return acc;!
                      }, {});
7                    ).map(([roomNum, rData]: any) => (
                      <div key={roomNum} className="border border-slate-100 rounded-lg p-3 bg-slate-50 hover:border-emerald-250 transition-colors">x
t                        <p className="text-[10px] font-extrabold text-slate-800 flex items-center justify-between">5
1                          <span>{roomNum}</span>r
n                          <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-black uppercase border",g
c                            rData.gender === 'BOYS' ? 'bg-blue-50 text-blue-600 border-blue-100' :h
d                            rData.gender === 'GIRLS' ? 'bg-pink-50 text-pink-600 border-pink-100' :o
k                            rData.gender === 'COUPLE' ? 'bg-purple-50 text-purple-600 border-purple-100' :N
J                            'bg-amber-50 text-amber-600 border-amber-100'7
3                          )}>{rData.gender}</span>!
                        </p>>
:                        <ul className="mt-2 space-y-1.5">M
I                          {rData.members.map((m: string, i: number) => (x
t                            <li key={i} className="text-[11px] font-bold text-slate-655 flex items-center gap-1.5">h
d                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full shrink-0" />&
"                              {m}&
"                            </li>"
                          ))}"
                        </ul>!
                      </div>
                    ))}
                  </div>
                )}
              </div>
8
4              {/* Transport Vehicle Assignments */}k
g              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">z
v                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">1
-                  🚌 Transport Assignments
                </h3>A
=                {computedVehicleAllocations.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-4 text-center">No transport assignments. Use the shuffler below or Auto-Allocate.</p>
                ) : (2
.                  <div className="space-y-3">)
%                    {Object.entries(_
[                      computedVehicleAllocations.reduce((acc: Record<string, any>, v) => {F
B                        if (!acc[v.fleetId]) acc[v.fleetId] = [];4
0                        acc[v.fleetId].push(v);(
$                        return acc;!
                      }, {})?
;                    ).map(([fleetId, travelers]: any) => {T
P                      const fleetItem = allocFleet.find(f => f.id === fleetId);#
                      return (
                        <div key={fleetId} className="border border-slate-100 rounded-lg p-3 bg-slate-50 hover:border-blue-250 transition-colors">z
v                          <p className="text-[10px] font-extrabold text-slate-800 flex items-center justify-between">[
W                            <span>{fleetItem?.vehicleType || "Tempo Traveller"}</span>
                            <span className="text-[9px] font-black text-slate-450 uppercase font-mono">{travelers.length} / {fleetItem?.capacity || 17} Seats Filled</span>#
                          </p>X
T                          <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">H
D                            {travelers.map((t: any, i: number) => (
|                              <p key={i} className="text-[11px] font-bold text-slate-650 truncate flex items-center gap-2">
                                <span className="text-[9px] font-black font-mono text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded shrink-0">#{t.seatNumber || i + 1}</span>5
1                                {t.travelerName}'
#                              </p>$
                             ))}%
!                          </div>#
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
<
8            {/* Travelers Allocation Shuffler Panel */}i
e            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">
              <div>`
\                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">P
L                  Travelers Manual Allocation Shuffler (Group Booking-Wise)
                </h3>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5 font-sans">Assign room sharing groups and vehicle seats directly. Shuffling updates both previews instantly.</p>
              </div>
4
0              <div className="overflow-x-auto">Q
M                <table className="w-full text-left text-xs border-collapse">P
L                  <thead className="bg-slate-50 border-b border-[#E2E8F0]">h
d                    <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">]
Y                      <th className="p-2.5 border-r border-slate-100">Traveler Name</th>\
X                      <th className="p-2.5 border-r border-slate-100">Gender / Age</th>_
[                      <th className="p-2.5 border-r border-slate-100">Room Assignment</th>b
^                      <th className="p-2.5 border-r border-slate-100">Vehicle Assignment</th>M
I                      <th className="p-2.5 text-center">Seat Number</th>
                    </tr>
                  </thead>D
@                  <tbody className="divide-y divide-[#E2E8F0]">4
0                    {allPassengers.map((p) => {x
t                      const current = passengerAllocations[p.name] || { room: "—", vehicle: "—", seat: "—" };#
                      return (a
]                        <tr key={p.name} className="hover:bg-slate-50/50 transition-colors">h
d                          <td className="p-2.5 border-r border-slate-100 font-bold text-slate-800">)
%                            {p.name}$
                           </td>j
f                          <td className="p-2.5 border-r border-slate-100 font-medium text-slate-600">9
5                            {p.gender} / {p.age} Yrs$
                           </td>O
K                          <td className="p-2.5 border-r border-slate-100">(
$                            <select7
3                              value={current.room}5
1                              onChange={(e) => {@
<                                const val = e.target.value;G
C                                setPassengerAllocations(prev => ({/
+                                  ...prev,J
F                                  [p.name]: { ...current, room: val })
%                                }));P
L                                toast.success(`Moved ${p.name} to ${val}`);%
!                              }}
                              className="h-7 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 w-full cursor-pointer""
                            >J
F                              <option value="—">Unassigned</option>S
O                              <option value="Group No. 1">Group No. 1</option>S
O                              <option value="Group No. 2">Group No. 2</option>S
O                              <option value="Group No. 3">Group No. 3</option>S
O                              <option value="Group No. 4">Group No. 4</option>S
O                              <option value="Group No. 5">Group No. 5</option>*
&                            </select>$
                           </td>O
K                          <td className="p-2.5 border-r border-slate-100">(
$                            <select:
6                              value={current.vehicle}5
1                              onChange={(e) => {@
<                                const val = e.target.value;G
C                                setPassengerAllocations(prev => ({/
+                                  ...prev,M
I                                  [p.name]: { ...current, vehicle: val })
%                                }));S
O                                toast.success(`Assigned ${p.name} to ${val}`);%
!                              }}
                              className="h-7 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 w-full cursor-pointer""
                            >J
F                              <option value="—">Unassigned</option>[
W                              <option value="17 Seater Tempo">17 Seater Tempo</option>*
&                            </select>$
                           </td>5
1                          <td className="p-2.5">(
$                            <select7
3                              value={current.seat}5
1                              onChange={(e) => {@
<                                const val = e.target.value;G
C                                setPassengerAllocations(prev => ({/
+                                  ...prev,J
F                                  [p.name]: { ...current, seat: val })
%                                }));Y
U                                toast.success(`Assigned ${p.name} to Seat #${val}`);%
!                              }}
                              className="h-7 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 w-24 mx-auto block cursor-pointer""
                            >J
F                              <option value="—">Unassigned</option>B
>                              {[...Array(17)].map((_, i) => (e
a                                <option key={i + 1} value={String(i + 1)}>Seat #{i + 1}</option>&
"                              ))}*
&                            </select>$
                           </td>"
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── GUIDES ──────────────────────── */})
%        {activeTab === "guides" && (*
&          <div className="space-y-4">D
@            <div className="flex items-center justify-between">
              <div>T
P                <h2 className="text-base font-black text-slate-800">Guides</h2>|
x                <p className="text-[11px] text-slate-500 mt-0.5">Manage and track guides assigned to this departure</p>
              </div>/
+              <div className="flex gap-2">
                <button onClick={() => toast.info("View Timeline")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">Z
V                  <Sliders className="w-3.5 h-3.5 text-slate-400" /> View as Timeline
                </button>
                <button onClick={() => toast.info("Download")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">S
O                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                </button>
              </div>
            </div>
"
            {/* KPI Cards */}J
F            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {[W
S                { v: "1", l: "Lead Guide", sub: "Assigned", bg: "bg-blue-50/50" },^
Z                { v: "3", l: "Support Guides", sub: "Assigned", bg: "bg-emerald-50/50" },[
W                { v: "1", l: "Trip Captain", sub: "Assigned", bg: "bg-purple-50/50" },U
Q                { v: "1", l: "Drivers", sub: "Assigned", bg: "bg-amber-50/50" },b
^                { v: "100%", l: "Coverage", sub: "All roles assigned", bg: "bg-cyan-50/50" },
              ].map(k => (o
k                <div key={k.l} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs">R
N                  <p className="text-2xl font-black text-slate-800">{k.v}</p>t
p                  <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-0.5">{k.l}</p>b
^                  <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>
!
            {/* Sub Tabs */}[
W            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
              {[7
3                { label: "All Guides", count: 6 },7
3                { label: "Lead Guide", count: 1 },;
7                { label: "Support Guides", count: 3 },4
0                { label: "Drivers", count: 1 },8
4                { label: "Trip Captain", count: 1 }&
"              ].map((t, idx) => (
                <button key={t.label} className={cn("px-3 py-1.5 text-[11px] font-bold rounded-[4px] flex items-center gap-1.5 transition-colors",
                  idx === 0 ? "bg-[#F97316]/10 text-[#F97316] font-extrabold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}> 
                  {t.label}]
Y                  <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded-full",e
a                    idx === 0 ? "bg-[#F97316]/20 text-[#F97316]" : "bg-slate-100 text-slate-500"*
&                  )}>{t.count}</span>
                </button>
              ))}
            </div>
-
)            {/* Filter selectors row */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">/
+                <option>All Roles</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">0
,                <option>All Status</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">5
1                <option>All Assignments</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">4
0                <option>All Experience</option>
              </select>K
G              <div className="relative flex-1 max-w-xs min-w-[150px]">q
m                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                <input type="text" placeholder="Search guide by name or phone..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
              </div>
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 bg-white hover:bg-slate-50 text-slate-750 flex items-center gap-1.5 ml-auto shadow-3xs">T
P                <Sliders className="w-3.5 h-3.5 text-slate-450" /> More Filters
              </button>
            </div>
%
!            {/* Guides Table */}k
g            <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">O
K              <table className="w-full text-left text-xs border-collapse">N
J                <thead className="bg-slate-50 border-b border-[#E2E8F0]">f
b                  <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">\
X                    <th className="p-3 border-r border-slate-100 w-8 text-center"></th>Q
M                    <th className="p-3 border-r border-slate-100">GUIDE</th>P
L                    <th className="p-3 border-r border-slate-100">ROLE</th>V
R                    <th className="p-3 border-r border-slate-100">ASSIGNMENT</th>Q
M                    <th className="p-3 border-r border-slate-100">PHONE</th>V
R                    <th className="p-3 border-r border-slate-100">EXPERIENCE</th>R
N                    <th className="p-3 border-r border-slate-100">STATUS</th>U
Q                    <th className="p-3 border-r border-slate-100">DOCUMENTS</th>D
@                    <th className="p-3 text-center">ACTION</th>
                  </tr>
                </thead>B
>                <tbody className="divide-y divide-[#E2E8F0]">:
6                  {computedGuides.map((row, idx) => (Z
V                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">U
Q                      <td className="p-3 text-center border-r border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] uppercase">L
H                          {row.name.split(" ").map(n => n[0]).join("")}#
                        </div> 
                      </td>I
E                      <td className="p-3 border-r border-slate-100">H
D                        <div className="flex items-center gap-1.5">[
W                          <span className="font-bold text-slate-800">{row.name}</span>
                          {row.lead && <span className="text-[7.5px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.2 rounded-full uppercase tracking-wider">LEAD</span>}#
                        </div> 
                      </td>u
q                      <td className="p-3 border-r border-slate-100 text-slate-600 font-semibold">{row.role}</td>I
E                      <td className="p-3 border-r border-slate-100">U
Q                        <p className="font-bold text-slate-800">{row.assign}</p>k
g                        <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{row.date}</p> 
                      </td>r
n                      <td className="p-3 border-r border-slate-100 font-mono text-slate-500">{row.phone}</td>I
E                      <td className="p-3 border-r border-slate-100">R
N                        <p className="font-bold text-slate-800">{row.exp}</p>l
h                        <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{row.trips}</p> 
                      </td>I
E                      <td className="p-3 border-r border-slate-100">
                        <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider block w-fit">CONFIRMED</span>j
f                        <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{row.sub}</p> 
                      </td>I
E                      <td className="p-3 border-r border-slate-100">[
W                        <div className="flex items-center gap-2 text-[9px] font-bold">L
H                          {Object.entries(row.docs).map(([k, has]) => (t
p                            <span key={k} className={cn("inline-flex items-center gap-1 uppercase select-none",N
J                              has ? "text-emerald-650" : "text-amber-600"$
                             )}>:
6                              {has ? "✓" : "!"} {k}(
$                            </span>"
                          ))}#
                        </div> 
                      </td>;
7                      <td className="p-3 text-center">W
S                        <div className="flex justify-center items-center gap-1.5">
                          <select className="h-7 text-[10px] font-bold border border-slate-200 rounded-[4px] px-1.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">6
2                            <option>View</option>(
$                          </select>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded">G
C                            <MoreHorizontal className="w-4 h-4" />(
$                          </Button>#
                        </div> 
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
+
'            {/* Bottom summary bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-3 flex items-center justify-between text-xs font-semibold">:
6              <span>Showing 1 to 6 of 6 guides</span><
8              <div className="flex items-center gap-2">A
=                <span className="text-slate-400">Show</span>
|                <select className="h-7 text-[10px] font-bold border border-slate-200 bg-white rounded px-1 cursor-pointer">*
&                  <option>10</option>
                </select>E
A                <span className="text-slate-400">per page</span>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── ACTIVITIES ──────────────────────── */}-
)        {activeTab === "activities" && (*
&          <div className="space-y-4">D
@            <div className="flex items-center justify-between">
              <div>X
T                <h2 className="text-base font-black text-slate-800">Activities</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage day wise activities and inclusions for this departure</p>
              </div>/
+              <div className="flex gap-2">
                <button onClick={() => toast.info("View Timeline")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">Z
V                  <Sliders className="w-3.5 h-3.5 text-slate-400" /> View as Timeline
                </button>
                <button onClick={() => toast.info("Download")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">S
O                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                </button>
              </div>
            </div>

            {/* KPI */}J
F            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {[
                { label: "Total Activities", value: computedActivities.length, desc: "Across departure days", bg: "bg-blue-50/50" },
                { label: "Confirmed", value: computedActivities.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length, desc: `${((computedActivities.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length / (computedActivities.length || 1))*100).toFixed(1)}%`, bg: "bg-emerald-50/50" },
                { label: "Pending", value: computedActivities.filter(a => a.status === 'PENDING').length, desc: "Action required", bg: "bg-amber-50/50" },
                { label: "Cancelled", value: computedActivities.filter(a => a.status === 'CANCELLED').length, desc: "Inactive", bg: "bg-red-50/50" },
                { label: "Optional Activities", value: computedActivities.filter(a => a.isOptional).length, desc: "Exclusions", bg: "bg-purple-50/50" }!
              ].map(kpi => (u
q                <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs">X
T                  <p className="text-2xl font-black text-slate-800">{kpi.value}</p>z
v                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{kpi.label}</p>U
Q                  <p className="text-[9.5px] text-slate-400 mt-1">{kpi.desc}</p>
                </div>
              ))}
            </div>
 
            {/* Filters */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">.
*                <option>All Days</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">7
3                <option>All Activity Type</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">0
,                <option>All Status</option>
              </select>K
G              <div className="relative flex-1 max-w-xs min-w-[150px]">q
m                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                <input type="text" placeholder="Search activity..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
              </div>
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 bg-white hover:bg-slate-50 text-slate-750 flex items-center gap-1.5 ml-auto shadow-3xs">T
P                <Sliders className="w-3.5 h-3.5 text-slate-450" /> More Filters
              </button>
            </div>

            {/* Table */}k
g            <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">O
K              <table className="w-full text-left text-xs border-collapse">N
J                <thead className="bg-slate-50 border-b border-[#E2E8F0]">f
b                  <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">O
K                    <th className="p-3 border-r border-slate-100">DAY</th>T
P                    <th className="p-3 border-r border-slate-100">ACTIVITY</th>U
Q                    <th className="p-3 border-r border-slate-100 w-28">TYPE</th>T
P                    <th className="p-3 border-r border-slate-100">INCLUDED</th>P
L                    <th className="p-3 border-r border-slate-100">TIME</th>T
P                    <th className="p-3 border-r border-slate-100">LOCATION</th>R
N                    <th className="p-3 border-r border-slate-100">STATUS</th>I
E                    <th className="p-3 text-center w-24">ACTION</th>
                  </tr>
                </thead>B
>                <tbody className="divide-y divide-[#E2E8F0]"><
8                  {computedActivities.map((a, idx) => (Z
V                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">I
E                      <td className="p-3 border-r border-slate-100">P
L                        <p className="font-bold text-slate-800">{a.day}</p>f
b                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{a.wd}</p> 
                      </td>I
E                      <td className="p-3 border-r border-slate-100">P
L                        <p className="font-bold text-slate-800">{a.act}</p>g
c                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{a.sub}</p> 
                      </td>I
E                      <td className="p-3 border-r border-slate-100">
                        <span className={cn("text-[8.5px] font-black px-2 py-0.5 rounded-[3px] border uppercase tracking-wider block w-fit",a
]                          a.type === "TRAVEL" ? "bg-blue-50 text-blue-600 border-blue-100" :l
h                          a.type === "SIGHTSEEING" ? "bg-purple-50 text-purple-600 border-purple-100" :L
H                          "bg-amber-50 text-amber-600 border-amber-100"/
+                        )}>{a.type}</span> 
                      </td>I
E                      <td className="p-3 border-r border-slate-100">'
#                        {a.inc ? (
                          <span className="flex items-center gap-1.5 text-[10.5px] text-emerald-650 font-bold">✓ Included</span>"
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-semibold">✗ Not Included</span>
                        )} 
                      </td>s
o                      <td className="p-3 border-r border-slate-100 text-slate-600 font-semibold">{a.time}</td>p
l                      <td className="p-3 border-r border-slate-100 text-slate-650 font-medium">{a.loc}</td>I
E                      <td className="p-3 border-r border-slate-100">
                        <span className={cn("text-[8.5px] font-black px-1.5 py-0.5 rounded-[3px] border uppercase tracking-wider block w-fit", a.statusClass)}>)
%                          {a.status}$
                         </span> 
                      </td>;
7                      <td className="p-3 text-center">W
S                        <div className="flex justify-center items-center gap-1.5">
                          <select className="h-7 text-[10px] font-bold border border-slate-200 rounded-[4px] px-1.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">6
2                            <option>View</option>(
$                          </select>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded">G
C                            <MoreHorizontal className="w-4 h-4" />(
$                          </Button>#
                        </div> 
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
+
'            {/* Bottom summary bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-3 flex items-center justify-between text-xs font-semibold">@
<              <span>Showing 1 to 10 of 18 activities</span><
8              <div className="flex items-center gap-2">A
=                <span className="text-slate-400">Show</span>
|                <select className="h-7 text-[10px] font-bold border border-slate-200 bg-white rounded px-1 cursor-pointer">*
&                  <option>10</option>
                </select>E
A                <span className="text-slate-400">per page</span>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── PAYMENTS ──────────────────────── */}+
'        {activeTab === "payments" && (*
&          <div className="space-y-4">D
@            <div className="flex items-center justify-between">
              <div>V
R                <h2 className="text-base font-black text-slate-800">Payments</h2>x
t                <p className="text-[11px] text-slate-500 mt-0.5">Track all customer payments for this departure</p>
              </div>/
+              <div className="flex gap-2">
                <button onClick={()=>toast.info("Payment summary")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-slate-400" /> Payment Summary</button>
                <button onClick={() => handleDownloadCSV(computedPayments, "payments_log.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>
              </div>
            </div>

            {/* KPI */}H
D            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label:"Total Received",     value:`₹${paymentKpis.received.toLocaleString("en-IN")}`, sub:`${((paymentKpis.received/paymentKpis.total)*100).toFixed(1)}% of total`, icon:<TrendingUp className="w-5 h-5" />, bg:"bg-emerald-50", color:"text-emerald-600" },
                { label:"Pending Collection", value:`₹${paymentKpis.pending.toLocaleString("en-IN")}`,  sub:`${((paymentKpis.pending/paymentKpis.total)*100).toFixed(1)}% of total`, icon:<Clock className="w-5 h-5" />,       bg:"bg-blue-50",    color:"text-blue-600" },
                { label:"Overdue",            value:`₹${paymentKpis.overdue.toLocaleString("en-IN")}`,  sub:"2 Bookings",                                                              icon:<AlertTriangle className="w-5 h-5" />,bg:"bg-amber-50",   color:"text-amber-600" },
                { label:"Total Refunds",      value:`₹${paymentKpis.refunds.toLocaleString("en-IN")}`,  sub:`${((paymentKpis.refunds/paymentKpis.total)*100).toFixed(1)}% of total`, icon:<RefreshCw className="w-5 h-5" />,    bg:"bg-purple-50",  color:"text-purple-600" },
                { label:"Paid Bookings",      value:`${paymentKpis.paidCount}/${paymentKpis.totalCount}`,sub:"95.0% of bookings",                                                    icon:<Users className="w-5 h-5" />,         bg:"bg-slate-100",  color:"text-slate-700" },
              ].map(kpi=>(
                <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>{kpi.icon}</div>
                  <div>u
q                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>b
^                    <p className={cn("text-lg font-black mt-0.5", kpi.color)}>{kpi.value}</p>P
L                    <p className="text-[10px] text-slate-400">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>
 
            {/* Filters */}t
p            <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm p-3 flex flex-wrap gap-2">
              {[["All","All Status"],["PAID","Paid"],["PARTIALLY PAID","Partially Paid"],["UNPAID","Unpaid"],["REFUNDED","Refunded"]].map(([v,l])=>(H
D                <button key={v} onClick={()=>setPayStatusFilter(v)}
                  className={cn("h-8 text-[11px] font-bold rounded-[4px] px-3 border transition-colors", payStatusFilter===v?"bg-[#F97316] text-white border-[#F97316]":"bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}>
                  {l}
                </button>
              ))}C
?              <div className="relative ml-auto min-w-[180px]">q
m                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Search by name, booking ID..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 outline-none" />
              </div>
            </div>

            {/* Table */}k
g            <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">O
K              <table className="w-full text-left text-xs border-collapse">N
J                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr>{
w                    <th className="p-3 w-10"><input type="checkbox" className="rounded-[2px] border-slate-300" /></th>
                    {["BOOKING ID","PASSENGER","PAYMENT PLAN","AMOUNT (₹)","PAID (₹)","PENDING (₹)","PAYMENT MODE","STATUS","LAST PAYMENT","ACTION"].map(h=>(
                      <th key={h} className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>B
>                <tbody className="divide-y divide-[#E2E8F0]">1
-                  {filteredPayments.map(p=>(I
E                    <tr key={p.id} className="hover:bg-slate-50/50">x
t                      <td className="p-3"><input type="checkbox" className="rounded-[2px] border-slate-300" /></td>/
+                      <td className="p-3">i
e                        <div className="font-mono font-bold text-slate-700 text-[10px]">{p.id}</div>E
A                        <StatusBadge status={p.bookingStatus} /> 
                      </td>/
+                      <td className="p-3">Z
V                        <div className="font-bold text-slate-800">{p.passenger}</div>k
g                        <div className="text-[10px] text-slate-400">{p.pax} Pax · +91 {p.phone}</div> 
                      </td>/
+                      <td className="p-3">Y
U                        <div className="font-semibold text-slate-700">{p.plan}</div>
                        <div className="text-[10px] text-slate-400">₹ {(p.amount/p.pax).toLocaleString("en-IN")} / Pax</div> 
                      </td>t
p                      <td className="p-3 font-black text-slate-800">₹ {p.amount.toLocaleString("en-IN")}</td>
                      <td className="p-3 font-black text-emerald-600">₹ {p.paid.toLocaleString("en-IN")}<div className="text-[9px] font-bold text-slate-400">{p.amount>0?Math.round((p.paid/p.amount)*100):0}%</div></td>
                      <td className={cn("p-3 font-black", p.pending>0?"text-red-600":"text-slate-400")}>₹ {p.pending.toLocaleString("en-IN")}</td>/
+                      <td className="p-3">Y
U                        <div className="font-semibold text-slate-700">{p.mode}</div>]
Y                        <div className="text-[10px] text-slate-400">{p.modeDetail}</div> 
                      </td>U
Q                      <td className="p-3"><StatusBadge status={p.status} /></td>d
`                      <td className="p-3 text-slate-500 whitespace-nowrap">{p.lastPayment}</td>/
+                      <td className="p-3">H
D                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleOpenBookingDetails(p.id)} className="text-[10px] font-bold text-slate-600 border border-slate-200 rounded-[3px] px-2 py-0.5 hover:bg-slate-50">View</button>
                          {p.status==="UNPAID"&&<button className="text-[10px] font-bold text-[#F97316] border border-[#F97316]/30 rounded-[3px] px-2 py-0.5 hover:bg-orange-50">Remind</button>}a
]                          <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />#
                        </div> 
                      </td>
                    </tr>
                  ))}
                </tbody>P
L                <tfoot className="bg-slate-50 border-t-2 border-[#E2E8F0]">
                  <tr>
                    <td colSpan={4} className="p-3 text-[11px] font-bold text-slate-600">Showing 1 to {filteredPayments.length} of {MOCK_PAYMENTS.length} bookings</td>
                    <td className="p-3 font-black text-slate-800 text-[11px]">₹ {filteredPayments.reduce((s,p)=>s+p.amount,0).toLocaleString("en-IN")}</td>
                    <td className="p-3 font-black text-emerald-600 text-[11px]">₹ {filteredPayments.reduce((s,p)=>s+p.paid,0).toLocaleString("en-IN")}</td>
                    <td className="p-3 font-black text-red-600 text-[11px]">₹ {filteredPayments.reduce((s,p)=>s+p.pending,0).toLocaleString("en-IN")}</td>.
*                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ──────────────────────── TASKS ──────────────────────── */}(
$        {activeTab === "tasks" && (*
&          <div className="space-y-4">D
@            <div className="flex items-center justify-between">
              <div>S
O                <h2 className="text-base font-black text-slate-800">Tasks</h2>w
s                <p className="text-[11px] text-slate-500 mt-0.5">Manage and track all tasks for this departure</p>
              </div>/
+              <div className="flex gap-2">
                <button className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-slate-400" /> View as Kanban</button>
                <button onClick={() => handleDownloadCSV(computedTasks, "checklist_tasks.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>
              </div>
            </div>

            {/* KPI */}H
D            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label:"Total Tasks",  value:taskKpis.total,     sub:"Across all categories", icon:<ClipboardList className="w-5 h-5" />, bg:"bg-blue-50",    color:"text-blue-600" },
                { label:"Completed",    value:taskKpis.completed,  sub:`${Math.round((taskKpis.completed/taskKpis.total)*100)}% of total`,  icon:<CheckCircle2 className="w-5 h-5" />, bg:"bg-emerald-50",color:"text-emerald-600" },
                { label:"In Progress",  value:taskKpis.inProgress, sub:"25% of total",          icon:<Clock className="w-5 h-5" />,           bg:"bg-amber-50",   color:"text-amber-600" },
                { label:"Pending",      value:taskKpis.pending,    sub:"8.33% of total",         icon:<PauseCircle className="w-5 h-5" />,     bg:"bg-slate-100",  color:"text-slate-600" },
                { label:"Overdue",      value:taskKpis.overdue,    sub:"8.33% of total",         icon:<AlertTriangle className="w-5 h-5" />,   bg:"bg-red-50",     color:"text-red-600" },
              ].map(kpi=>(
                <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>{kpi.icon}</div>
                  <div>u
q                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>\
X                    <p className={cn("text-2xl font-black", kpi.color)}>{kpi.value}</p>P
L                    <p className="text-[10px] text-slate-400">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>
 
            {/* Filters */}t
p            <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm p-3 flex flex-wrap gap-2">
              {[
                {value:taskStatusFilter,   setter:setTaskStatusFilter,   opts:["All","IN PROGRESS","COMPLETED","PENDING","OVERDUE","NOT STARTED"].map(v=>[v,v==="All"?"All Status":v])},
                {value:taskCategoryFilter, setter:setTaskCategoryFilter, opts:[["All","All Categories"],["PAYMENTS","Payments"],["DOCUMENTS","Documents"],["HOTELS","Hotels"],["TRANSPORT","Transport"],["GUIDES","Guides"],["OPERATIONS","Operations"],["COMMUNICATION","Communication"]]},!
              ].map((f,i)=>([
W                <select key={i} value={f.value} onChange={e=>f.setter(e.target.value)}
                  className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">T
P                  {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              ))}K
G              <div className="relative flex-1 min-w-[180px] max-w-xs">q
m                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Search task..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 outline-none" />
              </div>
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 ml-auto">S
O                <Filter className="w-3.5 h-3.5 text-slate-400" /> More Filters
              </button>
            </div>

            {/* Table */}k
g            <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">O
K              <table className="w-full text-left text-xs border-collapse">N
J                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr>{
w                    <th className="p-3 w-10"><input type="checkbox" className="rounded-[2px] border-slate-300" /></th>
                    {["TASK","CATEGORY","ASSIGNED TO","ASSIGNED BY","PRIORITY","DUE DATE","STATUS","CREATED ON","ACTION"].map(h=>(
                      <th key={h} className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>B
>                <tbody className="divide-y divide-[#E2E8F0]">.
*                  {filteredTasks.map(t=>(I
E                    <tr key={t.id} className="hover:bg-slate-50/50">/
+                      <td className="p-3">#
                        <input.
*                          type="checkbox"X
T                          className="rounded-[2px] border-slate-300 cursor-pointer"A
=                          checked={t.status === "COMPLETED"}X
T                          onChange={() => t.rawTask && handleToggleTask(t.rawTask)}
                        /> 
                      </td>/
+                      <td className="p-3">U
Q                        <div className="font-bold text-slate-800">{t.task}</div>V
R                        <div className="text-[10px] text-slate-400">{t.sub}</div> 
                      </td>S
O                      <td className="p-3"><TypeBadge type={t.category} /></td>/
+                      <td className="p-3">H
D                        <div className="flex items-center gap-1.5">
                          <Avatar initials={t.assignee.split(" ").map((n:string)=>n[0]).join("")} className="bg-slate-700 w-6 h-6 text-[8px]" />$
                           <div>]
Y                            <div className="font-bold text-slate-800">{t.assignee}</div>[
W                            <div className="text-[10px] text-slate-400">{t.role}</div>%
!                          </div>#
                        </div> 
                      </td>[
W                      <td className="p-3"><PriorityBadge priority={t.priority} /></td>/
+                      <td className="p-3">\
X                        <div className="font-semibold text-slate-700">{t.dueDate}</div>
                        <div className={cn("text-[10px] font-bold", t.status==="OVERDUE"?"text-red-500":"text-amber-600")}>{t.dueNote}</div> 
                      </td>U
Q                      <td className="p-3"><StatusBadge status={t.status} /></td>b
^                      <td className="p-3 text-slate-500 whitespace-nowrap">{t.createdOn}</td>/
+                      <td className="p-3">H
D                        <div className="flex items-center gap-1.5">
                          <button className="text-[10px] font-bold text-slate-600 border border-slate-200 rounded-[3px] px-2 py-0.5 hover:bg-slate-50">View</button>a
]                          <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />#
                        </div> 
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>c
_              <div className="px-4 py-3 border-t border-[#E2E8F0] text-[11px] text-slate-500">U
Q                Showing 1 to {filteredTasks.length} of {MOCK_TASKS.length} tasks
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── DOCUMENTS ──────────────────────── */},
(        {activeTab === "documents" && (*
&          <div className="space-y-4">D
@            <div className="flex items-center justify-between">
              <div>W
S                <h2 className="text-base font-black text-slate-800">Documents</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Store, organize and manage all documents for this departure</p>
              </div>/
+              <div className="flex gap-2">
                <button className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700">View as Grid</button>
                <button onClick={() => handleDownloadCSV(computedDocuments, "documents_catalog.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>
              </div>
            </div>

            {/* Stats */}H
D            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {v:128,l:"Total Documents",  sub:"Across all categories",  icon:<Folder className="w-5 h-5" />, bg:"bg-blue-50",   color:"text-blue-600"},
                {v:96, l:"Verified",          sub:"75.00% of total",        icon:<CheckCircle2 className="w-5 h-5" />, bg:"bg-emerald-50",color:"text-emerald-600"},
                {v:18, l:"Pending Verification",sub:"14.06% of total",      icon:<Clock className="w-5 h-5" />, bg:"bg-amber-50",  color:"text-amber-600"},
                {v:6,  l:"Action Required",   sub:"4.69% of total",         icon:<AlertTriangle className="w-5 h-5" />, bg:"bg-red-50",   color:"text-red-600"},
              ].map(kpi=>(
                <div key={kpi.l} className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>{kpi.icon}</div>
                  <div>V
R                    <p className="text-2xl font-black text-slate-800">{kpi.v}</p>q
m                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.l}</p>P
L                    <p className="text-[10px] text-slate-400">{kpi.sub}</p>
                  </div>
                </div>
              ))}
            </div>
 
            {/* Filters */}t
p            <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm p-3 flex flex-wrap gap-2">
              <select className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">4
0                <option>All Categories</option>
              </select>
              <select className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">8
4                <option>All Sub Categories</option>
              </select>
              <select className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">5
1                <option>All Uploaded By</option>
              </select>
              <select className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">0
,                <option>All Status</option>.
*                <option>VERIFIED</option>-
)                <option>PENDING</option>5
1                <option>ACTION REQUIRED</option>
              </select>K
G              <div className="relative flex-1 min-w-[180px] max-w-xs">q
m                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Search document name..." value={docSearch} onChange={e=>setDocSearch(e.target.value)}
                  className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 outline-none" />
              </div>
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 ml-auto">S
O                <Filter className="w-3.5 h-3.5 text-slate-400" /> More Filters
              </button>
            </div>
%
!            {/* 2-col layout */}R
N            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">+
'              {/* Category sidebar */}m
i              <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm overflow-hidden">J
F                <div className="px-4 py-3 border-b border-[#E2E8F0]">o
k                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Categories</p>
                </div>+
'                <div className="py-1">6
2                  {MOCK_DOC_CATEGORIES.map(cat=>(R
N                    <button key={cat.id} onClick={()=>setDocCategory(cat.id)}
                      className={cn("w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold transition-colors",
{                        docCategory===cat.id?"bg-[#FFF0E6] text-[#F97316] font-bold":"text-slate-700 hover:bg-slate-50")}>E
A                      <span className="flex items-center gap-2">}
y                        <Folder className={cn("w-3.5 h-3.5", docCategory===cat.id?"text-[#F97316]":"text-slate-400")} />(
$                        {cat.label}"
                      </span>
                      <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-full", docCategory===cat.id?"bg-[#F97316] text-white":"bg-slate-100 text-slate-500")}>(
$                        {cat.count}"
                      </span>"
                    </button>
                  ))}
                </div>T
P                <div className="px-4 py-3 border-t border-[#E2E8F0] space-y-1">f
b                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">N
J                    <span>Storage Used</span><span>2.48 GB / 10 GB</span>
                  </div>_
[                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">e
a                    <div className="h-full bg-[#F97316] rounded-full" style={{width:"24.8%"}} />
                  </div>O
K                  <p className="text-[10px] text-slate-400">24.8% Used</p>w
s                  <button className="text-[10px] font-bold text-[#F97316] hover:underline">Manage Storage</button>
                </div>
              </div>
*
&              {/* Documents table */}m
i              <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">Q
M                <table className="w-full text-left text-xs border-collapse">P
L                  <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                    <tr>}
y                      <th className="p-3 w-10"><input type="checkbox" className="rounded-[2px] border-slate-300" /></th>
{                      {["DOCUMENT NAME","CATEGORY","SUB CATEGORY","UPLOADED BY","UPLOADED ON","STATUS","ACTIONS"].map(h=>(
                        <th key={h} className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>D
@                  <tbody className="divide-y divide-[#E2E8F0]">1
-                    {filteredDocs.map(doc=>(M
I                      <tr key={doc.id} className="hover:bg-slate-50/50">z
v                        <td className="p-3"><input type="checkbox" className="rounded-[2px] border-slate-300" /></td>1
-                        <td className="p-3">H
D                          <div className="flex items-center gap-2">
                            <div className={cn("w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0", doc.status==="VERIFIED"?"bg-emerald-50 text-emerald-600":doc.status==="ACTION REQUIRED"?"bg-red-50 text-red-600":"bg-amber-50 text-amber-600")}>G
C                              <FileText className="w-3.5 h-3.5" />'
#                            </div>&
"                            <div>]
Y                              <div className="font-bold text-slate-800">{doc.name}</div>^
Z                              <div className="text-[10px] text-slate-400">{doc.sub}</div>'
#                            </div>%
!                          </div>"
                        </td>s
o                        <td className="p-3"><TypeBadge type={doc.category.split(" ")[0].toUpperCase()} /></td>Q
M                        <td className="p-3 text-slate-600">{doc.subcat}</td>1
-                        <td className="p-3">_
[                          <div className="font-bold text-slate-800">{doc.uploadedBy}</div>[
W                          <div className="text-[10px] text-slate-400">{doc.role}</div>"
                        </td>g
c                        <td className="p-3 text-slate-500 whitespace-nowrap">{doc.uploadedOn}</td>Y
U                        <td className="p-3"><StatusBadge status={doc.status} /></td>1
-                        <td className="p-3">J
F                          <div className="flex items-center gap-1.5">
                            <button onClick={() => doc.url ? window.open(doc.url, '_blank') : toast.info(`Viewing document: ${doc.name}`)} className="text-[10px] font-bold text-slate-600 border border-slate-200 rounded-[3px] px-2 py-0.5 hover:bg-slate-50 flex items-center gap-1">View <ChevronDown className="w-2.5 h-2.5" /></button>c
_                            <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />%
!                          </div>"
                        </td> 
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-500">n
j                  <span>Showing 1 to {filteredDocs.length} of {computedDocuments.length} documents</span>@
<                  <div className="flex items-center gap-1">*
&                    <span>Show</span>
                    <select className="h-7 text-[11px] border border-slate-200 rounded-[4px] px-1.5 bg-white outline-none"><option>10</option><option>25</option><option>50</option></select>.
*                    <span>per page</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── COMMUNICATION ──────────────────────── */}0
,        {activeTab === "communication" && (*
&          <div className="space-y-4">
            <div>Y
U              <h2 className="text-base font-black text-slate-800">Communication</h2>
~              <p className="text-[11px] text-slate-500 mt-0.5">All messages, announcements and updates for this departure</p>
            </div>
(
$            {/* Sub-filter tabs */}:
6            <div className="flex items-center gap-2">T
P              {["All","Announcements","Group Chats","Direct Messages"].map(f=>(C
?                <button key={f} onClick={()=>setConvFilter(f)}
                  className={cn("text-[11px] font-bold px-3 py-1.5 rounded-[4px] border transition-colors", convFilter===f?"bg-[#F97316] text-white border-[#F97316]":"bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}>
                  {f}
                </button>
              ))}7
3              <div className="ml-auto flex gap-2">
                <button onClick={()=>toast.info("Message templates")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Message Templates <ChevronDown className="w-3.5 h-3.5" /></button>
                <button onClick={()=>toast.info("Export")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Export <ChevronDown className="w-3 h-3" /></button>
              </div>
            </div>
'
#            {/* 3-panel layout */}b
^            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-4 h-[560px]">,
(              {/* Conversation list */}{
w              <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm flex flex-col">D
@                <div className="p-3 border-b border-[#E2E8F0]">1
-                  <div className="relative">u
q                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input type="text" placeholder="Search conversations..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-slate-50 placeholder:text-slate-400 outline-none" />
                  </div>
                </div>V
R                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">9
5                  {computedConversations.map(conv=>(P
L                    <div key={conv.id} onClick={()=>setActiveConv(conv.id)}
                      className={cn("flex items-start gap-2.5 p-3 cursor-pointer transition-colors", activeConv===conv.id?"bg-[#FFF0E6]":"hover:bg-slate-50")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[13px] shrink-0", activeConv===conv.id?"bg-[#F97316] text-white":"bg-slate-100")}>(
$                        {conv.icon}!
                      </div>;
7                      <div className="flex-1 min-w-0">V
R                        <div className="flex items-center justify-between gap-1">k
g                          <p className="text-[11px] font-bold text-slate-800 truncate">{conv.name}</p>f
b                          <span className="text-[9px] text-slate-400 shrink-0">{conv.time}</span>#
                        </div>e
a                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{conv.sub}</p>!
                      </div>
                      {conv.unread>0 && <span className="w-4 h-4 bg-[#F97316] text-white text-[8px] font-black rounded-full flex items-center justify-center shrink-0 mt-1">{conv.unread}</span>}
                    </div>
                  ))}
                </div>D
@                <div className="p-3 border-t border-[#E2E8F0]">
                  <button onClick={()=>toast.info("New conversation")} className="w-full text-[11px] font-bold border border-slate-200 rounded-[4px] py-2 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5">J
F                    <Plus className="w-3.5 h-3.5" /> New Conversation 
                  </button>
                </div>
              </div>
$
               {/* Chat feed */}{
w              <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm flex flex-col">(
$                {/* Chat header */}l
h                <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">B
>                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FFF0E6] text-[#F97316] flex items-center justify-center text-sm">🏕️</div>
                    <div>
                      <p className="text-[12px] font-black text-slate-800">{computedConversations.find(c => c.id === activeConv)?.name || "General Chat"}</p>
                      <p className="text-[10px] text-slate-400">{passengerStats.total + (leadGuideName ? 1 : 0)} participants</p>
                    </div>
                  </div>@
<                  <div className="flex items-center gap-2">U
Q                    <Search className="w-4 h-4 text-slate-400 cursor-pointer" />[
W                    <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                  </div>
                </div>
%
!                {/* Messages */}Z
V                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30"><
8                  <div className="flex justify-center">
|                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Today</span>
                  </div>g
c                  {chatMessages.filter(msg => msg.convId === activeConv || !msg.convId).map(msg=>(l
h                    <div key={msg.id} className={cn("flex gap-2.5", msg.isMine && "flex-row-reverse")}>,
(                      {!msg.isMine && (
                        <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-[8px] font-black shrink-0 mt-1">{msg.avatar}</div>
                      )}c
_                      <div className={cn("max-w-[70%] space-y-1", msg.isMine && "items-end")}>.
*                        {!msg.isMine && (J
F                          <div className="flex items-center gap-1.5">l
h                            <span className="text-[10px] font-black text-slate-700">{msg.sender}</span>^
Z                            <span className="text-[9px] text-slate-400">{msg.role}</span>%
!                          </div>
                        )}
                        <div className={cn("rounded-[8px] px-3.5 py-2.5 text-[11px] leading-relaxed whitespace-pre-wrap", msg.isMine?"bg-[#F97316] text-white rounded-tr-none":"bg-white border border-[#E2E8F0] text-slate-700 rounded-tl-none shadow-xs")}>)
%                          {msg.text}#
                        </div>i
e                        <div className={cn("flex items-center gap-2", msg.isMine && "justify-end")}>\
X                          <span className="text-[9px] text-slate-400">{msg.time}</span>:
6                          {msg.reactions.map((r,i)=>(
                            <span key={i} className="text-[10px] bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-xs">{r.emoji} {r.count}</span>"
                          ))}#
                        </div>!
                      </div>
                    </div>
                  ))}
                </div>
*
&                {/* Message input */}I
E                <div className="border-t border-[#E2E8F0] bg-white">V
R                  <div className="px-4 pt-2 flex gap-4 border-b border-slate-50">=
9                    {["Message","Announcement"].map(t=>(T
P                      <button key={t} onClick={()=>setChatTab(t.toLowerCase())}
                        className={cn("pb-2 text-[11px] font-bold border-b-2 transition-colors", chatTab===t.toLowerCase()?"text-[#F97316] border-[#F97316]":"text-slate-400 border-transparent hover:text-slate-600")}> 
                        {t}$
                       </button>
                    ))}
                  </div>A
=                  <div className="p-3 flex items-end gap-2">N
J                    <div className="flex-1 flex items-center gap-1 px-1">t
p                      <Smile className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 shrink-0" />x
t                      <Paperclip className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 shrink-0" />x
t                      <ImageIcon className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 shrink-0" />u
q                      <MapPin className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 shrink-0" />u
q                      <AtSign className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 shrink-0" />!
                      <inputY
U                        value={chatInput} onChange={e=>setChatInput(e.target.value)}V
R                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}?
;                        placeholder="Type your message..."h
d                        className="flex-1 text-[11px] outline-none placeholder:text-slate-400 px-2"
                      />
                    </div> 
                    <button6
2                      onClick={handleSendMessage}
                      className="h-9 px-4 bg-[#F97316] hover:bg-[#E05E00] text-white text-[11px] font-bold rounded-[4px] flex items-center gap-1.5 shrink-0 transition-colors"
                    >@
<                      <Send className="w-3.5 h-3.5" /> Send"
                    </button>
                  </div>
                </div>
              </div>
(
$              {/* Right sidebar */}{
w              <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm flex flex-col">D
@                <div className="p-4 border-b border-[#E2E8F0]">r
n                  <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Group Details</p>
                </div>K
G                <div className="flex-1 overflow-y-auto p-4 space-y-5">)
%                  {/* Group info */}A
=                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#FFF0E6] text-[#F97316] flex items-center justify-center text-lg shrink-0">🏕️</div>
                    <div>n
j                      <p className="font-black text-slate-800 text-[12px]">MKA-0705 – General Group</p>=
9                      <StatusBadge status="CONFIRMED" />t
p                      <p className="text-[10px] text-slate-400 mt-1">Created on 10 Jun 2027 by Suresh Kumar</p>
                    </div>
                  </div>
*
&                  {/* Description */}
                  <div>
|                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">General group for all participants, guides and team members for MKA-0705 departure.</p>
                  </div>
$
                   {/* Media */}
                  <div>Q
M                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Media, Links & Files</p>e
a                      <button className="text-[10px] font-bold text-[#F97316]">View all</button>
                    </div>C
?                    <div className="grid grid-cols-3 gap-1.5">e
a                      {["bg-slate-200","bg-blue-100","bg-green-100","bg-amber-100"].map((c,i)=>(
                        <div key={i} className={cn("aspect-square rounded-[4px]", c, "flex items-center justify-center text-slate-400")}>@
<                          <ImageIcon className="w-5 h-5" />#
                        </div>
                      ))}
                      <div className="aspect-square rounded-[4px] bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">+12</div>
                    </div>
                  </div>
+
'                  {/* Participants */}
                  <div>Q
M                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Participants ({computedParticipants.length})</p>e
a                      <button className="text-[10px] font-bold text-[#F97316]">View all</button>
                    </div>4
0                    <div className="space-y-2">=
9                      {computedParticipants.map((p,i)=>(X
T                        <div key={i} className="flex items-center justify-between">H
D                          <div className="flex items-center gap-2">
                            <Avatar initials={p.name.split(" ").map(n=>n[0]).join("")} className="bg-slate-700 w-6 h-6 text-[8px]" />&
"                            <div>c
_                              <p className="text-[11px] font-bold text-slate-800">{p.name}</p>Y
U                              <p className="text-[10px] text-slate-400">{p.role}</p>'
#                            </div>%
!                          </div>
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">{p.badge}</span>#
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
D
@                <div className="p-3 border-t border-[#E2E8F0]">
                  <button onClick={()=>toast.info("Group settings")} className="w-full text-[11px] font-bold border border-slate-200 rounded-[4px] py-2 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5">Z
V                    <Sliders className="w-3.5 h-3.5 text-slate-400" /> Group Settings 
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── REPORTS ──────────────────────── */}*
&        {activeTab === "reports" && (U
Q          <ReportsConsole tripId={tripId} departureDateStr={departureDateStr} />
        )}
4
0      {bookingModalOpen && selectedBooking && (!
        <BookingDetailsModal&
"          open={bookingModalOpen}1
-          onOpenChange={setBookingModalOpen}(
$          booking={selectedBooking}#
          onRefresh={() => {}}
        />
	      )}
!
      {addTaskModalOpen && (P
L        <Dialog open={addTaskModalOpen} onOpenChange={setAddTaskModalOpen}>n
j          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>n
j              <DialogTitle className="text-lg font-black text-slate-800">Create Custom Task</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Add a new operational task checklist item for this departure.</DialogDescription> 
            </DialogHeader>N
J            <form onSubmit={handleCreateTask} className="space-y-4 mt-2">0
,              <div className="space-y-1.5">w
s                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Task Name</label>
                <input"
                  type="text"
                  required<
8                  placeholder="Confirm guide SIM cards"*
&                  value={newTaskName}E
A                  onChange={e => setNewTaskName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>0
,              <div className="space-y-1.5">}
y                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Checklist Stage</label>
                <select+
'                  value={newTaskStage}F
B                  onChange={e => setNewTaskStage(e.target.value)}}
y                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                >O
K                  <option value="PRE_TRIP_30D">Pre-Trip (30 Days)</option>M
I                  <option value="PRE_TRIP_7D">Pre-Trip (7 Days)</option>L
H                  <option value="PRE_TRIP_1D">Pre-Trip (1 Day)</option>K
G                  <option value="DEPARTURE_DAY">Departure Day</option>G
C                  <option value="DURING_TRIP">During Trip</option>C
?                  <option value="POST_TRIP">Post-Trip</option>
                </select>
              </div>0
,              <div className="space-y-1.5">
}                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Description / Notes</label>
                <textarea@
<                  placeholder="Additional task briefing..."+
'                  value={newTaskNotes}F
B                  onChange={e => setNewTaskNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>@
<              <div className="flex justify-end gap-2 pt-2">
                <button$
                   type="button"A
=                  onClick={() => setAddTaskModalOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button$
                   type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                > 
                  Save Task
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
	      )}
"
      {editDepartureOpen && (R
N        <Dialog open={editDepartureOpen} onOpenChange={setEditDepartureOpen}>n
j          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>s
o              <DialogTitle className="text-lg font-black text-slate-800">Edit Departure Settings</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Update general information, guide assignments, or status for this batch.</DialogDescription> 
            </DialogHeader>W
S            <form onSubmit={handleEditDepartureSubmit} className="space-y-4 mt-2">0
,              <div className="space-y-1.5">}
y                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Lead Guide Name</label>
                <input"
                  type="text"
                  required7
3                  placeholder="e.g. Dikshu Sharma",
(                  value={editGuideName}G
C                  onChange={e => setEditGuideName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>0
,              <div className="space-y-1.5">~
z                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Departure Status</label>
                <select)
%                  value={editStatus}D
@                  onChange={e => setEditStatus(e.target.value)}}
y                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                >C
?                  <option value="CONFIRMED">CONFIRMED</option>?
;                  <option value="PENDING">PENDING</option>C
?                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>@
<              <div className="flex justify-end gap-2 pt-2">
                <button$
                   type="button"B
>                  onClick={() => setEditDepartureOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button$
                   type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >#
                  Save Changes
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
	      )}
!
      {addPassengerOpen && (P
L        <Dialog open={addPassengerOpen} onOpenChange={setAddPassengerOpen}>n
j          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>r
n              <DialogTitle className="text-lg font-black text-slate-800">Add Passenger Manifest</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Record a new manual passenger booking for this departure date.</DialogDescription> 
            </DialogHeader>V
R            <form onSubmit={handleAddPassengerSubmit} className="space-y-4 mt-2">0
,              <div className="space-y-1.5">w
s                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                <input"
                  type="text"
                  required6
2                  placeholder="e.g. Ramesh Patel")
%                  value={newPaxName}D
@                  onChange={e => setNewPaxName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>0
,              <div className="space-y-1.5">|
x                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Phone / Mobile</label>
                <input"
                  type="text"
                  required4
0                  placeholder="e.g. 9876543210"*
&                  value={newPaxPhone}E
A                  onChange={e => setNewPaxPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">s
o                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Age</label>
                  <input&
"                    type="number"*
&                    value={newPaxAge}E
A                    onChange={e => setNewPaxAge(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">v
r                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Gender</label>
                  <select-
)                    value={newPaxGender}H
D                    onChange={e => setNewPaxGender(e.target.value)}
{                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                  >;
7                    <option value="Male">Male</option>?
;                    <option value="Female">Female</option> 
                  </select>
                </div>
              </div>0
,              <div className="space-y-1.5">
|                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Amount (₹)</label>
                <input$
                   type="number"+
'                  value={newPaxAmount}F
B                  onChange={e => setNewPaxAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>@
<              <div className="flex justify-end gap-2 pt-2">
                <button$
                   type="button"A
=                  onClick={() => setAddPassengerOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button$
                   type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >$
                   Add Passenger
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
	      )}

      {editHotelOpen && (J
F        <Dialog open={editHotelOpen} onOpenChange={setEditHotelOpen}>n
j          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>s
o              <DialogTitle className="text-lg font-black text-slate-800">Edit Hotel Stay Details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Update arrangement, allocation, costs, or booking notes for this stay.</DialogDescription> 
            </DialogHeader>U
Q            <form onSubmit={handleEditHotelSubmit} className="space-y-3.5 mt-2">;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">z
v                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Hotel Name</label>
                  <input$
                     type="text"!
                    required.
*                    value={hotelNameForm}I
E                    onChange={e => setHotelNameForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">
{                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Location / City</label>
                  <input$
                     type="text"!
                    required2
.                    value={hotelLocationForm}M
I                    onChange={e => setHotelLocationForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">y
u                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Room Type</label>
                  <input$
                     type="text"2
.                    value={hotelRoomTypeForm}M
I                    onChange={e => setHotelRoomTypeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">|
x                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">No. of Rooms</label>
                  <input&
"                    type="number"/
+                    value={hotelRoomsForm}R
N                    onChange={e => setHotelRoomsForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">
|                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Cost (₹)</label>
                  <input&
"                    type="number".
*                    value={hotelCostForm}Q
M                    onChange={e => setHotelCostForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">
~                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Advance Paid (₹)</label>
                  <input&
"                    type="number".
*                    value={hotelPaidForm}Q
M                    onChange={e => setHotelPaidForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>0
,              <div className="space-y-1.5">
}                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Confirmation Status</label>
                <select1
-                  value={hotelConfirmedForm}L
H                  onChange={e => setHotelConfirmedForm(e.target.value)}}
y                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                >C
?                  <option value="CONFIRMED">CONFIRMED</option>Q
M                  <option value="UNCONFIRMED">PENDING / UNCONFIRMED</option>
                </select>
              </div>0
,              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Notes / Special Instructions</label>
                <textarea-
)                  value={hotelNotesForm}H
D                  onChange={e => setHotelNotesForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] h-16 resize-none"
                />
              </div>@
<              <div className="flex justify-end gap-2 pt-2">
                <button$
                   type="button">
:                  onClick={() => setEditHotelOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button$
                   type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >(
$                  Save Stay Details
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
	      )}
"
      {editTransportOpen && (R
N        <Dialog open={editTransportOpen} onOpenChange={setEditTransportOpen}>n
j          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>p
l              <DialogTitle className="text-lg font-black text-slate-800">Edit Transport Asset</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Update vehicle details, route, driver profile, or vendor pricing.</DialogDescription> 
            </DialogHeader>Y
U            <form onSubmit={handleEditTransportSubmit} className="space-y-3.5 mt-2">;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">|
x                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Vehicle Type</label>
                  <input$
                     type="text"!
                    required0
,                    value={vehicleTypeForm}K
G                    onChange={e => setVehicleTypeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">
|                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Seating Capacity</label>
                  <input&
"                    type="number"-
)                    value={capacityForm}P
L                    onChange={e => setCapacityForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>0
,              <div className="space-y-1.5">s
o                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Route</label>
                <input"
                  type="text"
                  required(
$                  value={routeForm}C
?                  onChange={e => setRouteForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">{
w                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Driver Name</label>
                  <input$
                     type="text"/
+                    value={driverNameForm}J
F                    onChange={e => setDriverNameForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">|
x                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Driver Phone</label>
                  <input$
                     type="text"0
,                    value={driverPhoneForm}K
G                    onChange={e => setDriverPhoneForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">
|                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Cost (₹)</label>
                  <input&
"                    type="number"2
.                    value={transportCostForm}U
Q                    onChange={e => setTransportCostForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">
~                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Advance Paid (₹)</label>
                  <input&
"                    type="number"2
.                    value={transportPaidForm}U
Q                    onChange={e => setTransportPaidForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>0
,              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Notes / Special Instructions</label>
                <textarea1
-                  value={transportNotesForm}L
H                  onChange={e => setTransportNotesForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] h-16 resize-none"
                />
              </div>@
<              <div className="flex justify-end gap-2 pt-2">
                <button$
                   type="button"B
>                  onClick={() => setEditTransportOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button$
                   type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >)
%                  Save Fleet Details
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
	      )}

      {editTrainOpen && (J
F        <Dialog open={editTrainOpen} onOpenChange={setEditTrainOpen}>n
j          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>v
r              <DialogTitle className="text-lg font-black text-slate-800">Edit Train Booking details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Update train name, PNR number, routing stations, schedules, or booked seats.</DialogDescription> 
            </DialogHeader>U
Q            <form onSubmit={handleEditTrainSubmit} className="space-y-3.5 mt-2">;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">
|                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Train Name / No.</label>
                  <input$
                     type="text"!
                    required.
*                    value={trainNameForm}I
E                    onChange={e => setTrainNameForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">z
v                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">PNR Number</label>
                  <input$
                     type="text"!
                    required-
)                    value={trainPnrForm}H
D                    onChange={e => setTrainPnrForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">~
z                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">From (Station)</label>
                  <input$
                     type="text"!
                    required.
*                    value={trainFromForm}I
E                    onChange={e => setTrainFromForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">|
x                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">To (Station)</label>
                  <input$
                     type="text"!
                    required,
(                    value={trainToForm}G
C                    onChange={e => setTrainToForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">~
z                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Departure Time</label>
                  <input$
                     type="text"!
                    required1
-                    value={trainDepTimeForm}L
H                    onChange={e => setTrainDepTimeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">|
x                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Arrival Time</label>
                  <input$
                     type="text"!
                    required1
-                    value={trainArrTimeForm}L
H                    onChange={e => setTrainArrTimeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>;
7              <div className="grid grid-cols-2 gap-3">2
.                <div className="space-y-1.5">t
p                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Date</label>
                  <input$
                     type="text"!
                    required.
*                    value={trainDateForm}I
E                    onChange={e => setTrainDateForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>2
.                <div className="space-y-1.5">|
x                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Booked Seats</label>
                  <input$
                     type="text"!
                    required/
+                    value={trainSeatsForm}J
F                    onChange={e => setTrainSeatsForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>0
,              <div className="space-y-1.5">t
p                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</label>
                <select.
*                  value={trainStatusForm}I
E                  onChange={e => setTrainStatusForm(e.target.value)}}
y                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                >C
?                  <option value="CONFIRMED">CONFIRMED</option>?
;                  <option value="PENDING">PENDING</option>
                </select>
              </div>@
<              <div className="flex justify-end gap-2 pt-2">
                <button$
                   type="button">
:                  onClick={() => setEditTrainOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button$
                   type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >)
%                  Save Train Details
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
	      )}


      </div>
    </div>	
  );
}B_file:///Users/parthpatel/Documents/youthcamping_os/ycadmin/src/pages/admin/DepartureHubPage.tsxRimport React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users, Calendar, User, Compass, Upload, Download, FileText,
  ClipboardList, CheckCircle2, MoreHorizontal, MessageSquare,
  PhoneCall, ChevronDown, Info, Search, X, Plus, Printer,
  Bed, Bus, Sliders, FileSpreadsheet, ClipboardCheck, Check,
  AlertTriangle, Clock, MapPin, Star, Link2, Paperclip, Image as ImageIcon,
  Smile, AtSign, Send, Shield, Folder, Filter, RefreshCw, MoreVertical,
  ArrowRight, CheckSquare, Circle, PauseCircle, XCircle, ChevronLeft, ChevronRight,
  TrendingUp, DollarSign, CreditCard, BarChart2, Activity, CalendarCheck, Sparkles,
  History as HistoryIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReportsConsole from "@/components/admin/ReportsConsole";
import BookingDetailsModal from "@/components/admin/BookingDetailsModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";
// ─── Spiti Valley Mock Itineraries ───
const MOCK_SPITI_ITINERARY = [
  { day: "Day 1", wd: "MON", date: "14 Jul 2026", plan: "Delhi → Shimla", sub: "Drive to Shimla", stay: "Shimla", stayType: "Hotel Ridge View", stayBadge: "DELUXE", travel: "340 KM", travelSub: "8 Hrs", meals: "Dinner", activities: "Mall Road Stroll", status: "ON TIME" },
  { day: "Day 2", wd: "TUE", date: "15 Jul 2026", plan: "Shimla → Sangla", sub: "Scenic Kinnaur Highway", stay: "Sangla", stayType: "Kinner Camps", stayBadge: "CAMP", travel: "220 KM", travelSub: "7 Hrs", meals: "Breakfast Dinner", activities: "Sangla Valley View", status: "ON TIME" },
  { day: "Day 3", wd: "WED", date: "16 Jul 2026", plan: "Sangla → Chitkul → Kalpa", sub: "Visit Last Indian Village", stay: "Kalpa", stayType: "Hotel Kinner Kailash", stayBadge: "DELUXE", travel: "90 KM", travelSub: "4 Hrs", meals: "Breakfast Dinner", activities: "Chitkul Village, Kalpa Fort", status: "ON TIME" },
  { day: "Day 4", wd: "THU", date: "17 Jul 2026", plan: "Kalpa → Nako → Tabo → Kaza", sub: "Enter Spiti Valley", stay: "Kaza", stayType: "Spiti Heritage Hotel", stayBadge: "DELUXE", travel: "200 KM", travelSub: "8 Hrs", meals: "Breakfast Dinner", activities: "Nako Lake, Tabo Monastery", status: "ON TIME" },
  { day: "Day 5", wd: "FRI", date: "18 Jul 2026", plan: "Kaza Local Sightseeing", sub: "Key Monastery & Kibber", stay: "Kaza", stayType: "Spiti Heritage Hotel", stayBadge: "DELUXE", travel: "Local", travelSub: "50 KM", meals: "Breakfast Dinner", activities: "Key Monastery, Kibber Village", status: "ON TIME" },
  { day: "Day 6", wd: "SAT", date: "19 Jul 2026", plan: "Kaza → Hikkim → Komic → Langza", sub: "Highest Post Office & Fossils", stay: "Kaza", stayType: "Spiti Heritage Hotel", stayBadge: "DELUXE", travel: "Local", travelSub: "60 KM", meals: "Breakfast Dinner", activities: "Highest Post Office, Langza Buddha", status: "ON TIME" },
  { day: "Day 7", wd: "SUN", date: "20 Jul 2026", plan: "Kaza → Chandra Taal", sub: "Drive to Crescent Moon Lake", stay: "Chandra Taal", stayType: "Parasol Camps", stayBadge: "CAMP", travel: "100 KM", travelSub: "5 Hrs", meals: "Breakfast Dinner", activities: "Chandra Taal Lake Walk", status: "ON TIME" },
  { day: "Day 8", wd: "MON", date: "21 Jul 2026", plan: "Chandra Taal → Manali", sub: "Cross Kunzum Pass & Rohtang", stay: "Manali", stayType: "Hotel Mountain View", stayBadge: "DELUXE", travel: "120 KM", travelSub: "6 Hrs", meals: "Breakfast Dinner", activities: "Manali Local Markets", status: "ON TIME" },
  { day: "Day 9", wd: "TUE", date: "22 Jul 2026", plan: "Manali → Delhi", sub: "Overnight Volvo Return", stay: "—", stayType: "", travel: "Volvo Bus", travelSub: "Departure: 06:00 PM", meals: "Breakfast", activities: "—", status: "ON TIME" }
];

const MOCK_SPITI_ACTIVITIES = [
  { day: "Day 1", wd: "14 Jul, Mon", act: "Delhi to Shimla Transfer", sub: "Scenic mountain drive", type: "TRAVEL", inc: true, time: "07:00 AM - 04:00 PM", loc: "Shimla", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 2", wd: "15 Jul, Tue", act: "Sangla Transfer", sub: "Drive along Sutlej river", type: "TRAVEL", inc: true, time: "08:00 AM - 03:00 PM", loc: "Sangla", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 3", wd: "16 Jul, Wed", act: "Chitkul Excursion", sub: "Visit Chitkul & Kalpa transfer", type: "SIGHTSEEING", inc: true, time: "09:00 AM - 05:00 PM", loc: "Chitkul", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 4", wd: "17 Jul, Thu", act: "Kaza Transfer", sub: "Enroute Tabo & Nako", type: "TRAVEL", inc: true, time: "07:30 AM - 05:30 PM", loc: "Kaza", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 5", wd: "18 Jul, Fri", act: "Key Monastery Visit", sub: "Explore Key & Kibber", type: "SIGHTSEEING", inc: true, time: "10:00 AM - 04:00 PM", loc: "Key", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 6", wd: "19 Jul, Sat", act: "Hikkim & Komic Post Offices", sub: "Send a postcard, Langza Buddha", type: "SIGHTSEEING", inc: true, time: "09:30 AM - 05:00 PM", loc: "Hikkim", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 7", wd: "20 Jul, Sun", act: "Chandra Taal Transfer", sub: "Cross Kunzum Pass", type: "TRAVEL", inc: true, time: "08:00 AM - 03:00 PM", loc: "Chandra Taal", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 8", wd: "21 Jul, Mon", act: "Manali Transfer", sub: "Enroute Rohtang tunnel", type: "TRAVEL", inc: true, time: "08:00 AM - 04:00 PM", loc: "Manali", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { day: "Day 9", wd: "22 Jul, Tue", act: "Delhi Return", sub: "Volvo from Manali", type: "TRAVEL", inc: true, time: "06:00 PM", loc: "Manali", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" }
];


const MOCK_ACTIVITIES = [
  { id:"a1", day:"Day 1", date:"05 Jul, Sat", activity:"Volvo Journey",           sub:"Ahmedabad → Chandigarh",         type:"TRAVEL",      included:true,  time:"09:00 PM", location:"Ahmedabad",    status:"CONFIRMED" },
  { id:"a2", day:"Day 2", date:"06 Jul, Sun", activity:"Manali Local Sightseeing", sub:"Hidimba Temple, Mall Road",      type:"SIGHTSEEING", included:true,  time:"10:00 AM - 06:00 PM", location:"Manali",       status:"CONFIRMED" },
  { id:"a3", day:"Day 3", date:"07 Jul, Mon", activity:"Solang Valley Visit",      sub:"Ropeway, Snow Point (if Open)",  type:"SIGHTSEEING", included:true,  time:"09:30 AM - 05:00 PM", location:"Solang Valley", status:"CONFIRMED" },
  { id:"a4", day:"Day 4", date:"08 Jul, Tue", activity:"Kasol Visit",              sub:"Kasol Market, Cafes",            type:"SIGHTSEEING", included:true,  time:"11:00 AM - 07:00 PM", location:"Kasol",        status:"CONFIRMED" },
  { id:"a5", day:"Day 5", date:"09 Jul, Wed", activity:"Kullu → Manikaran Sahib",  sub:"Hot Springs & Gurudwara",       type:"SIGHTSEEING", included:true,  time:"08:30 AM - 05:30 PM", location:"Manikaran",    status:"CONFIRMED" },
  { id:"a6", day:"Day 6", date:"10 Jul, Thu", activity:"Kasol to Amritsar Transfer",sub:"Enroute sightseeing",          type:"TRAVEL",      included:true,  time:"08:00 AM - 08:00 PM", location:"Amritsar",     status:"CONFIRMED" },
  { id:"a7", day:"Day 7", date:"11 Jul, Fri", activity:"Golden Temple Visit",      sub:"Darshan & Palki Sahib",          type:"SIGHTSEEING", included:true,  time:"05:00 AM - 09:00 AM", location:"Amritsar",     status:"CONFIRMED" },
  { id:"a8", day:"Day 8", date:"12 Jul, Sat", activity:"Wagah Border Ceremony",    sub:"Beating Retreat Ceremony",       type:"SIGHTSEEING", included:true,  time:"04:30 PM - 06:00 PM", location:"Wagah Border", status:"PENDING" },
  { id:"a9", day:"Day 9", date:"13 Jul, Sun", activity:"Train Journey",            sub:"Amritsar → Ahmedabad",           type:"TRAVEL",      included:false, time:"07:00 PM", location:"Amritsar",     status:"CANCELLED" },
  { id:"a10",day:"Optional",date:"",         activity:"River Rafting",             sub:"Beas River (Extra Cost)",        type:"ADVENTURE",   included:false, time:"—",        location:"Kullu",        status:"OPTIONAL" },
];

const MOCK_PAYMENTS = [
  { id:"YC/MKA/0705/001", passenger:"Rohit Patel",    pax:2, phone:"98765 43210", plan:"Standard Plan", amount:28000, paid:28000, pending:0,     mode:"UPI",           modeDetail:"UPI ID: rohit@okaxis",      status:"PAID",         lastPayment:"28 Jun 2027, 09:30 AM", bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/002", passenger:"Anjali Mehta",   pax:1, phone:"98765 43211", plan:"Standard Plan", amount:14000, paid:7000,  pending:7000,  mode:"Bank Transfer", modeDetail:"HDFC - 4567",               status:"PARTIALLY PAID",lastPayment:"20 Jun 2027, 03:42 PM", bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/003", passenger:"Devang Shah",    pax:3, phone:"98765 43212", plan:"Standard Plan", amount:42000, paid:42000, pending:0,     mode:"Credit Card",   modeDetail:"**** **** **** 1234",       status:"PAID",         lastPayment:"18 Jun 2027, 11:07 AM", bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/004", passenger:"Priya Joshi",    pax:1, phone:"98765 43213", plan:"Standard Plan", amount:14000, paid:0,     pending:14000, mode:"—",             modeDetail:"—",                         status:"UNPAID",       lastPayment:"—",                     bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/005", passenger:"Harsh Vora",     pax:2, phone:"98765 43214", plan:"Standard Plan", amount:28000, paid:14000, pending:14000, mode:"UPI",           modeDetail:"UPI ID: harshvora@okicici", status:"PARTIALLY PAID",lastPayment:"25 Jun 2027, 08:30 PM", bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/006", passenger:"Khyati Desai",   pax:1, phone:"98765 43215", plan:"Standard Plan", amount:14000, paid:14000, pending:0,     mode:"Net Banking",   modeDetail:"ICICI – 7890",              status:"PAID",         lastPayment:"22 Jun 2027, 10:11 PM", bookingStatus:"CONFIRMED" },
  { id:"YC/MKA/0705/007", passenger:"Manan Trivedi",  pax:1, phone:"98765 43216", plan:"Standard Plan", amount:14000, paid:14000, pending:0,     mode:"UPI",           modeDetail:"—",                         status:"REFUNDED",     lastPayment:"26 Jun 2027, 05:20 PM", bookingStatus:"CANCELLED" },
  { id:"YC/MKA/0705/008", passenger:"Aayushi Rawal",  pax:2, phone:"98765 43217", plan:"Standard Plan", amount:28000, paid:14000, pending:14000, mode:"Bank Transfer", modeDetail:"SBI – 1122",                status:"PARTIALLY PAID",lastPayment:"19 Jun 2027, 02:55 PM", bookingStatus:"CONFIRMED" },
];

const MOCK_TASKS = [
  { id:"t1",  task:"Collect balance payments from 6 passengers", sub:"Booking IDs: 002, 004, 005, 008, 011, 013", category:"PAYMENTS",   assignee:"Suresh Kumar",  role:"Accounting",   priority:"HIGH",   dueDate:"02 Jul 2027", dueNote:"2 days left",    status:"IN PROGRESS",  createdOn:"28 Jun 2027, 10:15 AM" },
  { id:"t2",  task:"Verify ID proofs of all passengers",         sub:"Aadhar / PAN / Passport",                   category:"DOCUMENTS",  assignee:"Neeki Patel",   role:"Operations",   priority:"MEDIUM", dueDate:"01 Jul 2027", dueNote:"Tomorrow",       status:"IN PROGRESS",  createdOn:"28 Jun 2027, 11:30 AM" },
  { id:"t3",  task:"Confirm hotel bookings & vouchers",          sub:"All 9 nights",                              category:"HOTELS",     assignee:"Parth Rathod",  role:"Operations",   priority:"HIGH",   dueDate:"29 Jun 2027", dueNote:"Today",          status:"OVERDUE",      createdOn:"27 Jun 2027, 04:45 PM" },
  { id:"t4",  task:"Confirm tempo & driver details",             sub:"Vehicle: GJ01XX1234, GJ01XX5678",           category:"TRANSPORT",  assignee:"Neeki Patel",   role:"Operations",   priority:"MEDIUM", dueDate:"29 Jun 2027", dueNote:"Today",          status:"COMPLETED",    createdOn:"27 Jun 2027, 02:20 PM" },
  { id:"t5",  task:"Share final trip details with guides",       sub:"Itinerary, contact list, SOPs",             category:"GUIDES",     assignee:"Dikshu Sharma", role:"Lead Guide",   priority:"LOW",    dueDate:"30 Jun 2027", dueNote:"1 day left",     status:"PENDING",      createdOn:"27 Jun 2027, 01:10 PM" },
  { id:"t6",  task:"Medical kit check & restock",                sub:"All items as per checklist",                category:"OPERATIONS", assignee:"Neeki Patel",   role:"Operations",   priority:"MEDIUM", dueDate:"01 Jul 2027", dueNote:"Tomorrow",       status:"PENDING",      createdOn:"28 Jun 2027, 12:05 PM" },
  { id:"t7",  task:"Prepare guest welcome kit",                  sub:"T-shirts, badges, itinerary",              category:"OPERATIONS", assignee:"Parth Rathod",  role:"Operations",   priority:"LOW",    dueDate:"03 Jul 2027", dueNote:"3 days left",    status:"NOT STARTED",  createdOn:"28 Jun 2027, 05:20 PM" },
  { id:"t8",  task:"Create WhatsApp group & add members",        sub:"Share group rules & itinerary",            category:"COMMUNICATION",assignee:"Neel Mehta",   role:"Support",      priority:"LOW",    dueDate:"30 Jun 2027", dueNote:"1 day left",     status:"COMPLETED",    createdOn:"27 Jun 2027, 03:00 PM" },
];

const MOCK_DOC_CATEGORIES = [
  { id:"all",    label:"All Documents",        count:128, active: true },
  { id:"bk",     label:"Bookings & Payments",  count:24 },
  { id:"cust",   label:"Customer Documents",   count:28 },
  { id:"trans",  label:"Transport",            count:16 },
  { id:"hotels", label:"Hotels",               count:18 },
  { id:"guides", label:"Guides",               count:12 },
  { id:"ops",    label:"Operations",           count:14 },
  { id:"fin",    label:"Finance",              count:8  },
  { id:"legal",  label:"Legal & Compliance",   count:6  },
  { id:"mktg",   label:"Marketing",            count:4  },
  { id:"other",  label:"Other",                count:2  },
  { id:"arch",   label:"Archived",             count:8  },
];

const MOCK_DOCUMENTS = [
  { id:"d1",  name:"MKA-0705 Booking Summary",   sub:"v1.2",                  category:"Bookings & Payments", subcat:"Booking Summary",  uploadedBy:"Suresh Kumar",  role:"Accounting",  uploadedOn:"28 Jun 2027, 10:15 AM", status:"VERIFIED" },
  { id:"d2",  name:"Passenger List",              sub:"Total 57 Pax",          category:"Customer Documents",  subcat:"Passenger List",   uploadedBy:"Neeki Patel",   role:"Operations",  uploadedOn:"28 Jun 2027, 09:40 AM", status:"VERIFIED" },
  { id:"d3",  name:"Payment Received Report",     sub:"As on 28 Jun 2027",     category:"Finance",             subcat:"Collection Report",uploadedBy:"Suresh Kumar",  role:"Accounting",  uploadedOn:"28 Jun 2027, 09:20 AM", status:"VERIFIED" },
  { id:"d4",  name:"Hotel Booking Vouchers",      sub:"All 9 Nights",          category:"Hotels",              subcat:"Vouchers",         uploadedBy:"Neeki Patel",   role:"Operations",  uploadedOn:"27 Jun 2027, 06:30 PM", status:"PENDING" },
  { id:"d5",  name:"Vehicle Details & RC",        sub:"2 Tempo Travellers",    category:"Transport",           subcat:"Vehicle Documents",uploadedBy:"Parth Rathod",  role:"Operations",  uploadedOn:"27 Jun 2027, 04:10 PM", status:"VERIFIED" },
  { id:"d6",  name:"Guide ID Proofs",             sub:"All Guide Documents",   category:"Guides",              subcat:"ID Proof",         uploadedBy:"Parth Rathod",  role:"Operations",  uploadedOn:"27 Jun 2027, 03:15 PM", status:"ACTION REQUIRED" },
  { id:"d7",  name:"Itinerary – Final",           sub:"Day wise plan",         category:"Operations",          subcat:"Itinerary",        uploadedBy:"Dikshu Sharma", role:"Lead Guide",  uploadedOn:"26 Jun 2027, 11:45 AM", status:"VERIFIED" },
  { id:"d8",  name:"Emergency Contact List",      sub:"Team & Vendors",        category:"Operations",          subcat:"Emergency",        uploadedBy:"Neel Mehta",    role:"Support",     uploadedOn:"26 Jun 2027, 10:20 AM", status:"PENDING" },
];

const MOCK_CONV_LIST = [
  { id:"g1",  name:"MKA-0705 – General Group", sub:"Dikshu Sharma: Meeting point details for...", time:"10:30 AM", unread:1,  type:"group",  icon:"🏕️" },
  { id:"g2",  name:"Pre-Departure Info",        sub:"Kumar: Please carry original ID proofs.",   time:"Yesterday",unread:3,  type:"group",  icon:"📋" },
  { id:"g3",  name:"Dikshu Sharma (Lead Guide)",sub:"You: Please share the expected weather...", time:"Yesterday",unread:0,  type:"direct", icon:"👤" },
  { id:"g4",  name:"Suresh Kumar (Accounting)", sub:"Suresh: Payment received from 3 passengers",time:"28 Jun",  unread:0,  type:"direct", icon:"💼" },
  { id:"g5",  name:"Important Updates",         sub:"Neeki Patel: Hotel change in Manali day 3", time:"27 Jun",  unread:0,  type:"group",  icon:"📢" },
  { id:"g6",  name:"Parth Rathod (Operations)", sub:"You: Vehicle details confirmed?",            time:"27 Jun",  unread:0,  type:"direct", icon:"👤" },
  { id:"g7",  name:"All Guides Group",          sub:"Dikshu: Guide briefing tomorrow 8 PM.",     time:"26 Jun",  unread:0,  type:"group",  icon:"🧭" },
  { id:"g8",  name:"MKA-0705 – Batch 1",        sub:"Passenger: Reached Delhi airport.",          time:"26 Jun",  unread:0,  type:"group",  icon:"✈️" },
];

const MOCK_MESSAGES = [
  { id:"m1", sender:"Dikshu Sharma", role:"Lead Guide", avatar:"DS", time:"10:10 AM", text:"Good morning everyone! 👋\nPlease find the meeting point details below.\nReach at 6:00 AM sharp at Majnu Ka Tilla, Delhi.\nOur team will be there with the Tempo Traveller.", reactions:[{emoji:"👍",count:8}], isMine:false },
  { id:"m2", convId:"g1", sender:"Neeki Patel",   role:"Operations", avatar:"NP", time:"10:22 AM", text:"Please carry your original ID proofs.\nAlso ensure your luggage is not more than 15 kg.\nFor any queries, contact us on the given numbers.", reactions:[{emoji:"👍",count:6}], isMine:false },
  { id:"m3", convId:"g2", sender:"Parth Rathod", role:"Operations", avatar:"PR", time:"10:28 AM", text:"Weather update for Manali (Day 2 to Day 4):\nMin 12°C / Max 23°C, light rain expected.\nPlease carry raincoat and proper shoes.", reactions:[], isMine:false },
  { id:"m4", sender:"Hemal Patel",  role:"You",        avatar:"HP", time:"10:30 AM", text:"Thanks team! Have a safe journey everyone.\nSee you all tomorrow! 😊", reactions:[{emoji:"❤️",count:1},{emoji:"👍",count:2}], isMine:true },
];

const MOCK_PARTICIPANTS = [
  { name:"Dikshu Sharma", role:"Lead Guide",       badge:"Admin" },
  { name:"Neeki Patel",   role:"Operations",       badge:"Admin" },
  { name:"Suresh Kumar",  role:"Accounting",       badge:"Admin" },
  { name:"Parth Rathod",  role:"Operations",       badge:"Admin" },
  { name:"Hemal Patel",   role:"You",              badge:"Admin" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    "CONFIRMED":       "bg-emerald-50 text-emerald-700 border-emerald-200",
    "PENDING":         "bg-amber-50 text-amber-700 border-amber-200",
    "CANCELLED":       "bg-slate-100 text-slate-500 border-slate-200",
    "OPTIONAL":        "bg-purple-50 text-purple-700 border-purple-200",
    "PAID":            "bg-emerald-50 text-emerald-700 border-emerald-200",
    "PARTIALLY PAID":  "bg-amber-50 text-amber-700 border-amber-200",
    "UNPAID":          "bg-red-50 text-red-600 border-red-200",
    "REFUNDED":        "bg-blue-50 text-blue-700 border-blue-200",
    "IN PROGRESS":     "bg-blue-50 text-blue-700 border-blue-200",
    "COMPLETED":       "bg-emerald-50 text-emerald-700 border-emerald-200",
    "OVERDUE":         "bg-red-50 text-red-600 border-red-200",
    "NOT STARTED":     "bg-slate-100 text-slate-500 border-slate-200",
    "VERIFIED":        "bg-emerald-50 text-emerald-700 border-emerald-200",
    "ACTION REQUIRED": "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-[3px] border text-[9px] font-black uppercase tracking-wider whitespace-nowrap", map[status] || "bg-slate-50 text-slate-500 border-slate-200")}>
      {status}
    </span>
  );
};

const TypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, string> = {
    TRAVEL:      "bg-blue-100 text-blue-700",
    SIGHTSEEING: "bg-indigo-100 text-indigo-700",
    ADVENTURE:   "bg-orange-100 text-orange-700",
    COMMUNICATION:"bg-pink-100 text-pink-700",
    PAYMENTS:    "bg-emerald-100 text-emerald-700",
    DOCUMENTS:   "bg-purple-100 text-purple-700",
    HOTELS:      "bg-amber-100 text-amber-700",
    TRANSPORT:   "bg-cyan-100 text-cyan-700",
    GUIDES:      "bg-teal-100 text-teal-700",
    OPERATIONS:  "bg-slate-200 text-slate-700",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider", map[type] || "bg-slate-100 text-slate-600")}>
      {type}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const map: Record<string, string> = {
    HIGH:   "bg-red-100 text-red-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW:    "bg-slate-100 text-slate-600",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider", map[priority] || "bg-slate-100 text-slate-600")}>
      {priority}
    </span>
  );
};

const Avatar = ({ initials, className }: { initials: string; className?: string }) => (
  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0", className || "bg-[#F97316]")}>
    {initials}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

// Helper to generate mock bookings for offline/fallback data
const generateMockBookings = (tripId: string, departureDateStr: string) => {
  const mockNames = [
    { name: "Aarav Mehta", gender: "Male", age: 24, phone: "9876543210", pickup: "Ahmedabad", email: "aarav.mehta@example.com" },
    { name: "Priya Sharma", gender: "Female", age: 22, phone: "9812345678", pickup: "Delhi", email: "priya.sharma@example.com" },
    { name: "Rahul Patel", gender: "Male", age: 27, phone: "9901234567", pickup: "Mumbai", email: "rahul.patel@example.com" },
    { name: "Sneha Reddy", gender: "Female", age: 23, phone: "8899887766", pickup: "Bangalore", email: "sneha.reddy@example.com" },
    { name: "Rohan Gupta", gender: "Male", age: 25, phone: "7766554433", pickup: "Vadodara", email: "rohan.gupta@example.com" },
    { name: "Ananya Rao", gender: "Female", age: 21, phone: "9012345678", pickup: "Delhi", email: "ananya.rao@example.com" }
  ];

  const bookingsArray = [];
  const statusOptions = ["Paid in Full", "Partial Payment", "Payment Pending"];

  let passengerCount = 0;
  for (let i = 0; i < 40; i++) {
    const primaryName = mockNames[i % mockNames.length];
    const totalAmount = 14500;
    const status = statusOptions[i % statusOptions.length];
    let advancePaid = totalAmount;
    if (status === "Partial Payment") {
      advancePaid = 6000;
    } else if (status === "Payment Pending") {
      advancePaid = 0;
    }

    const coTravelersCount = (i % 5 === 0 && passengerCount < 55) ? 2 : (i % 3 === 0 && passengerCount < 56) ? 1 : 0;
    const coTravelersList: any[] = [];
    for (let c = 0; c < coTravelersCount; c++) {
      const coName = mockNames[(i + c + 7) % mockNames.length];
      coTravelersList.push({
        name: coName.name + " (Guest)",
        gender: coName.gender,
        age: coName.age + (c % 2 === 0 ? 1 : -1),
        phone: coName.phone,
        pickupPoint: coName.pickup,
        email: coName.email
      });
      passengerCount++;
    }
    passengerCount++;

    bookingsArray.push({
      id: `BK-${1000 + i}`,
      fullName: primaryName.name,
      gender: primaryName.gender,
      age: primaryName.age,
      phone: primaryName.phone,
      email: primaryName.email,
      pickupCity: primaryName.pickup,
      tripId: tripId,
      departureDate: departureDateStr + "T00:00:00.000Z",
      totalAmount: totalAmount,
      advancePaid: advancePaid,
      createdAt: "2027-06-15T00:00:00.000Z",
      passengers: {
        details: {
          roomAllocation: `Room ${101 + Math.floor(i / 3)}`,
          idProof: "Uploaded"
        },
        persons: coTravelersList
      }
    });
  }
  return bookingsArray;
};

export default function