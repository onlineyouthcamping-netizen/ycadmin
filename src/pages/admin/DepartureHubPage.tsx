import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users, Calendar, User, Compass, Upload, Download, FileText,
  ClipboardList, CheckCircle2, MoreHorizontal, MessageSquare,
  PhoneCall, ChevronDown, Info, Search, X, Plus, Printer,
  Bed, Bus, Sliders, FileSpreadsheet, ClipboardCheck, Check,
  AlertTriangle, Clock, MapPin, Star, Link2, Paperclip, Image, History, Trash, Copy,
  Smile, AtSign, Send, Shield, Folder, Filter, RefreshCw, MoreVertical,
  ArrowRight, ArrowLeft, CheckSquare, Circle, PauseCircle, XCircle, ChevronLeft, ChevronRight,
  TrendingUp, DollarSign, CreditCard, BarChart2, Activity, CalendarCheck, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { opsService } from "@/services/ops.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReportsConsole from "@/components/admin/ReportsConsole";
import BookingDetailsModal from "@/components/admin/BookingDetailsModal";
import DepartureActivities from "@/components/admin/DepartureActivities";
import DepartureCommunication from "@/components/admin/DepartureCommunication";
import DepartureDocuments from "@/components/admin/DepartureDocuments";
import DeparturePayments from "@/components/admin/DeparturePayments";
import DepartureReports from "@/components/admin/DepartureReports";
import DepartureTasks from "@/components/admin/DepartureTasks";
import VendorImportWizard from "@/components/admin/VendorImportWizard";
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

export default function DepartureHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract from departureId if present (format: tripId_YYYY-MM-DD)
  const departureIdParam = searchParams.get("departureId");
  let resolvedTripId = searchParams.get("tripId") || "MKA-0705";
  let resolvedDepartureDateStr = searchParams.get("departureDate") || "2027-07-05";

  if (departureIdParam && departureIdParam.includes("_")) {
    const idx = departureIdParam.indexOf("_");
    resolvedTripId = departureIdParam.substring(0, idx);
    resolvedDepartureDateStr = departureIdParam.substring(idx + 1);
  }

  const tripId = resolvedTripId;
  const departureDateStr = resolvedDepartureDateStr;
  const activeTab = searchParams.get("tab") || "overview";

  const setActiveTab = (tab: string) => {
    const nextParams: Record<string, string> = { tab };
    if (departureIdParam) {
      nextParams.departureId = departureIdParam;
    } else {
      nextParams.tripId = tripId;
      nextParams.departureDate = departureDateStr;
    }
    setSearchParams(nextParams);
  };

  const initializationKeyRef = useRef<string | null>(null);

  // Data states
  const [bookings, setBookings] = useState<any[]>([]);
  const allPassengers = useMemo(() => {
    const arr: any[] = [];
    bookings.filter((b: any) => b.status !== "cancelled").forEach((b: any) => {
      let passengersObj = b.passengers;
      if (typeof passengersObj === 'string') {
        try {
          passengersObj = JSON.parse(passengersObj);
        } catch (e) {
          passengersObj = {};
        }
      }

      const due = (b.totalAmount || 0) - (b.advancePaid || 0);
      const paymentLabel = due <= 0 ? "Paid in Full" : b.advancePaid > 0 ? "Partial Payment" : "Payment Pending";
      
      const roomDetailsObj = b.roomDetails || passengersObj?.details || {};
      const personsRoomDetails = roomDetailsObj.personsRoomDetails || {};
      
      const leadName = b.fullName || b.name;
      const leadRoomInfo = personsRoomDetails[leadName] || {};
      const leadRoomNo = leadRoomInfo.roomNo || passengersObj?.details?.roomAllocation || "—";
      const leadRoomType = leadRoomInfo.roomType || (b.numberOfTravelers === 1 ? "Individual" : "Triple Sharing");
      const leadCoupleWith = leadRoomInfo.coupleWith || "";

      const normalizeCompareName = (nameStr: string) => {
        if (!nameStr) return "";
        let clean = nameStr.toLowerCase().trim();
        if (clean.startsWith("mr. ")) clean = clean.substring(4).trim();
        else if (clean.startsWith("mrs. ")) clean = clean.substring(5).trim();
        else if (clean.startsWith("ms. ")) clean = clean.substring(4).trim();
        return clean;
      };

      const normLeadName = normalizeCompareName(leadName);
      const paxList = passengersObj?.persons || [];
      const filteredCoPax = paxList.filter((p: any) => normalizeCompareName(p.name) !== normLeadName);
      const passengerCount = filteredCoPax.length + 1;

      const perPersonAmount = (b.totalAmount || 12000) / passengerCount;
      const perPersonPaid = (b.advancePaid || 0) / passengerCount;
      const perPersonBalance = due > 0 ? (due / passengerCount) : 0;

      const base = { 
        bookingId: b.id, 
        bookingRef: b.bookingId || b.id,
        bookingDate: b.createdAt?.substring(0,10) || "2027-06-15", 
        departureDate: b.departureDate?.substring(0,10) || departureDateStr, 
        batchGroup:"Batch 1", 
        gender:b.gender||"Male", 
        age:b.age||24, 
        phone:b.phone||b.mobile||"—", 
        email:b.email||"—", 
        pickupPoint:b.pickupCity||"Ahmedabad", 
        dropPoint:"Manali", 
        roomSharing:passengersObj?.details?.roomType||"Triple", 
        roomType: leadRoomType, 
        coupleWith: leadCoupleWith,
        emergencyContact:"9876543211", 
        roomNo: leadRoomNo, 
        paymentStatus:paymentLabel, 
        amount: perPersonAmount, 
        paidAmount: perPersonPaid, 
        balance: perPersonBalance, 
        paymentMode:"UPI", 
        paymentDate:"2027-06-16", 
        idProofType:"Aadhar Card", 
        guideName:"Dikshu Sharma", 
        transportDetails:"Tempo Traveller AC", 
        notes:b.notes||"No special requirements", 
        hasDocs:!!passengersObj?.details?.idProof,
        ticketStatus: b.trainTicketStatus || "PENDING",
        ticketVerified: b.trainTicketStatus === "CONFIRMED",
        documentStatus: (passengersObj?.details?.idProof || b.idProofType) ? "Verified" : "Missing",
        leadPassengerName: b.fullName || b.name
      };
      arr.push({ id:b.id, name:leadName, ...base, isLead: true });
      if (Array.isArray(passengersObj?.persons)) {
        passengersObj.persons.forEach((p: any, idx: number) => {
          if (normalizeCompareName(p.name) === normLeadName) return;

          const coRoomInfo = personsRoomDetails[p.name] || {};
          const coRoomNo = coRoomInfo.roomNo || "—";
          const coRoomType = coRoomInfo.roomType || "Triple Sharing";
          const coCoupleWith = coRoomInfo.coupleWith || "";

          arr.push({ 
            id: `${b.id}-co-${idx}`, 
            name: p.name, 
            ...base, 
            roomNo: coRoomNo,
            roomType: coRoomType,
            coupleWith: coCoupleWith,
            phone: p.phone || b.phone || "—", 
            email: p.email || "—", 
            pickupPoint: p.pickupPoint || b.pickupCity || "Ahmedabad", 
            amount: perPersonAmount, 
            paidAmount: perPersonPaid, 
            balance: perPersonBalance, 
            notes: "Co-traveler", 
            isLead: false,
            gender: p.gender || "Male",
            age: p.age || 24,
            ticketStatus: p.ticketStatus || b.trainTicketStatus || "PENDING",
            ticketVerified: p.ticketStatus === "CONFIRMED" || b.trainTicketStatus === "CONFIRMED",
            documentStatus: p.idProof ? "Verified" : "Missing"
          });
        });
      }
    });
    return arr;
  }, [bookings, departureDateStr]);
  const [itineraryList, setItineraryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tripDetails, setTripDetails] = useState<any | null>(null);
  const [tripVendors, setTripVendors] = useState<any[]>([]);
  const [vendorSummary, setVendorSummary] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>(MOCK_MESSAGES);
  const [dbTasks, setDbTasks] = useState<any[]>([]);
  const [checklistTasks, setChecklistTasks] = useState<any[]>([]);
  const [dbVendors, setDbVendors] = useState<any[]>([]);

  // Passengers filter states
  const [paxSearch, setPaxSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [pickupFilter, setPickupFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [page, setPage] = useState(1);

  // New Passengers Grouping & Room Allocation states
  const [bookingGroupFilter, setBookingGroupFilter] = useState("All");
  const [coupleFilter, setCoupleFilter] = useState("All");
  const [roomAllocFilter, setRoomAllocFilter] = useState("All");
  const [trainTicketFilter, setTrainTicketFilter] = useState("All");
  const [joiningCityFilter, setJoiningCityFilter] = useState("All");
  const [docStatusFilter, setDocStatusFilter] = useState("All");
  const [selectedPaxIds, setSelectedPaxIds] = useState<Record<string, boolean>>({});
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});
  const [selectedBookingForRoomAlloc, setSelectedBookingForRoomAlloc] = useState<any | null>(null);
  const [modalAllocations, setModalAllocations] = useState<Record<string, { roomType: string, coupleWith: string, roomNo: string }>>({});

  // Tasks filter
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState("All");

  // Documents filter
  const [docCategory, setDocCategory] = useState("all");
  const [docSearch, setDocSearch] = useState("");

  // Communication
  const [activeConv, setActiveConv] = useState("g1");
  const [chatInput, setChatInput] = useState("");
  const [chatTab, setChatTab] = useState("message");
  const [convFilter, setConvFilter] = useState("All");

  // Payments filter
  const [payStatusFilter, setPayStatusFilter] = useState("All");


  const [passengerAllocations, setPassengerAllocations] = useState<Record<string, { room: string, vehicle: string, seat: string }>>({});
  const [allocFleet, setAllocFleet] = useState<any[]>([]);
  const [newVehicleType, setNewVehicleType] = useState("17 Seater Tempo");
  const [newVehicleCapacity, setNewVehicleCapacity] = useState("17");
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleCost, setNewVehicleCost] = useState("");
  const [newVehicleVendor, setNewVehicleVendor] = useState("");
  const [manualRooms, setManualRooms] = useState<string[]>([]);
  const [isSavingAllocations, setIsSavingAllocations] = useState(false);
  const [showClearAllocationsDialog, setShowClearAllocationsDialog] = useState(false);

  const handleSaveAllocationsToDb = async (clearExisting = false) => {
    setIsSavingAllocations(true);
    try {
      const roomAllocations: Array<{roomNumber: string; roomType: string; genderGroup: string; bookingId: string; travelerName: string; sharingType?: string}> = [];
      const vehicleAllocations: Array<{fleetId: string; bookingId: string; travelerName: string; seatNumber?: number}> = [];

      // Map passengerAllocations to proper DB format
      allPassengers.forEach((p: any) => {
        const alloc = passengerAllocations[p.name];
        if (!alloc) return;
        if (alloc.room && alloc.room !== '—') {
          roomAllocations.push({
            roomNumber: alloc.room,
            roomType: 'STANDARD',
            genderGroup: p.gender === 'Female' ? 'GIRLS' : 'BOYS',
            bookingId: p.bookingRef,
            travelerName: p.name,
            sharingType: 'STANDARD'
          });
        }
        if (alloc.vehicle && alloc.vehicle !== '—') {
          const fleet = allocFleet.find(f => 
            f.name === alloc.vehicle || 
            f.id === alloc.vehicle || 
            f.vehicleType === alloc.vehicle
          );
          if (fleet) {
            vehicleAllocations.push({
              fleetId: fleet.id,
              bookingId: p.bookingRef,
              travelerName: p.name,
              seatNumber: alloc.seat && alloc.seat !== '—' ? parseInt(alloc.seat) : undefined
            });
          }
        }
      });

      if (clearExisting && roomAllocations.length === 0 && vehicleAllocations.length === 0) {
        await opsService.saveManualAllocations(tripId, departureDateStr, { roomAllocations, vehicleAllocations, clearExisting: true });
        toast.success('Allocations cleared from database');
        setShowClearAllocationsDialog(false);
        return;
      }

      const result = await opsService.saveManualAllocations(tripId, departureDateStr, { roomAllocations, vehicleAllocations, clearExisting });
      if (result?.success) {
        toast.success(`Saved: ${result.data?.rooms?.length || 0} room + ${result.data?.vehicles?.length || 0} vehicle allocations`);
        fetchPageData();
      } else {
        toast.error(result?.message || 'Failed to save allocations');
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || err?.response?.statusText || '';
      toast.error(errMsg || 'Failed to save allocations to database');
      console.error('saveManualAllocations error:', err);
    } finally {
      setIsSavingAllocations(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const cap = parseInt(newVehicleCapacity) || 17;
    const vName = newVehicleName || `Tempo ${allocFleet.length + 1}`;
    
    try {
      const savedVehicle = await opsService.createTransportFleet(tripId, {
        vehicleType: newVehicleType,
        capacity: cap,
        totalAmount: parseFloat(newVehicleCost) || 35000,
        driverName: vName,
        notes: newVehicleVendor || "General Vendor"
      }, departureDateStr);

      const newV = {
        id: savedVehicle.id,
        name: savedVehicle.driverName || vName,
        vehicleType: savedVehicle.vehicleType,
        capacity: savedVehicle.capacity,
        cost: savedVehicle.totalAmount,
        vendor: savedVehicle.notes || "General Vendor"
      };

      setAllocFleet(prev => [...prev, newV]);
      setNewVehicleName("");
      setNewVehicleCost("");
      setNewVehicleVendor("");
      toast.success(`Added ${newV.name} (${newV.vehicleType}) and saved to database!`);
      fetchPageData();
    } catch {
      toast.error("Failed to save vehicle details to database");
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await opsService.deleteTransportFleet(id);
      setAllocFleet(prev => prev.filter(v => v.id !== id));
      toast.info("Removed vehicle from database and fleet");
      fetchPageData();
    } catch {
      toast.error("Failed to delete vehicle from database");
    }
  };

  // Guide state
  const [dbGuides, setDbGuides] = useState<any[]>([]);
  const [addGuideOpen, setAddGuideOpen] = useState(false);
  const [guideForm, setGuideForm] = useState({
    guideName: '', agreedAmount: '', advancePaid: '0', daysWorked: '5', notes: '',
    assignmentType: 'PRIMARY_GUIDE', reportingLocation: '', reportingTime: '', emergencyContact: ''
  });
  const [isSavingGuide, setIsSavingGuide] = useState(false);

  const handleAddGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guideForm.guideName.trim()) { toast.error('Guide name is required'); return; }
    setIsSavingGuide(true);
    try {
      const saved = await opsService.createGuidePayment(tripId, {
        guideName: guideForm.guideName,
        agreedAmount: parseFloat(guideForm.agreedAmount) || 0,
        advancePaid: parseFloat(guideForm.advancePaid) || 0,
        daysWorked: parseInt(guideForm.daysWorked) || 5,
        notes: guideForm.notes,
        assignmentType: guideForm.assignmentType || 'PRIMARY_GUIDE',
        reportingLocation: guideForm.reportingLocation || undefined,
        reportingTime: guideForm.reportingTime || undefined,
        emergencyContact: guideForm.emergencyContact || undefined,
      }, departureDateStr);
      setDbGuides(prev => [...prev, saved]);
      setGuideForm({ guideName: '', agreedAmount: '', advancePaid: '0', daysWorked: '5', notes: '', assignmentType: 'PRIMARY_GUIDE', reportingLocation: '', reportingTime: '', emergencyContact: '' });
      setAddGuideOpen(false);
      toast.success(`Guide "${saved.guideName}" added and saved to database!`);
      fetchPageData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save guide');
    } finally {
      setIsSavingGuide(false);
    }
  };

  const handleDeleteGuide = async (id: string, guideName: string) => {
    if (!window.confirm(`Remove guide "${guideName}" from this departure?`)) return;
    try {
      await opsService.deleteGuidePayment(id);
      setDbGuides(prev => prev.filter(g => g.id !== id));
      toast.info(`Guide "${guideName}" removed from departure`);
      fetchPageData();
    } catch {
      toast.error('Failed to remove guide');
    }
  };

  const handleCopyTempoList = () => {
    let txt = "*Tempo List (for WhatsApp Group)*\n\n";
    const groups: Record<string, string[]> = {};
    computedVehicleAllocations.forEach(v => {
      const vName = v.vehicleType || "Tempo 1";
      if (!groups[vName]) groups[vName] = [];
      groups[vName].push(v.travelerName);
    });
    Object.entries(groups).forEach(([vName, names]) => {
      txt += `🚌 *${vName}* — ${names.join(", ")} [${names.length} names]\n`;
    });
    navigator.clipboard.writeText(txt);
    toast.success("WhatsApp Tempo List copied to clipboard!");
  };

  const handleCopyRoomList = () => {
    let txt = "*Room List (for WhatsApp Group)*\n\n";
    const groups: Record<string, { gender: string, names: string[] }> = {};
    computedRoomAllocations.forEach(r => {
      if (!groups[r.roomNumber]) groups[r.roomNumber] = { gender: r.genderGroup, names: [] };
      groups[r.roomNumber].names.push(r.travelerName);
    });
    Object.entries(groups).forEach(([roomNo, data]) => {
      txt += `🏢 *${roomNo}* — ${data.names.join(", ")} (${data.gender === "BOYS" ? "Boys" : data.gender === "GIRLS" ? "Girls" : "Couples"})\n`;
    });
    navigator.clipboard.writeText(txt);
    toast.success("WhatsApp Room List copied to clipboard!");
  };




  // Activities filter
  const [actDayFilter, setActDayFilter] = useState("All Days");
  const [actTypeFilter, setActTypeFilter] = useState("All Activity Type");
  const [actStatusFilter, setActStatusFilter] = useState("All Status");
  const [actSearch, setActSearch] = useState("");

  const fetchPageData = async () => {
    setLoading(true);
    try {
      const bookingsRes = await api.get(`/bookings?status=all&tripId=${tripId}&limit=100`);
      const allBookings = bookingsRes.data?.data || [];
      let filtered = allBookings.filter((b: any) =>
        b.tripId === tripId && b.departureDate?.substring(0, 10) === departureDateStr
      );
      setBookings(filtered);

      const itinRes = await api.get(`/ops/itinerary/${tripId}?departureDate=${departureDateStr}`);
      setItineraryList(itinRes.data?.data || []);

      // Load vendors from Directory (has room rates + trip mappings)
      const vendorsRes = await api.get("/vendors/directory").catch(() => ({ data: { data: [] } }));
      const allVendors = vendorsRes.data?.data || [];
      // Hotel/homestay/camp vendors — trip-mapped ones shown first
      const tripHotelVendors = allVendors.filter((v: any) =>
        ["hotel", "homestay", "camp"].includes(v.type?.toLowerCase())
      );
      tripHotelVendors.sort((a: any, b: any) => {
        const aMap = a.tripMappings?.find((m: any) => m.tripId === tripId);
        const bMap = b.tripMappings?.find((m: any) => m.tripId === tripId);
        if (aMap && !bMap) return -1;
        if (!aMap && bMap) return 1;
        if (aMap?.isPrimary && !bMap?.isPrimary) return -1;
        if (!aMap?.isPrimary && bMap?.isPrimary) return 1;
        return 0;
      });
      setDbVendors(tripHotelVendors);

      // Load trip details
      const tripRes = await api.get(`/trips/${tripId}`).catch(() => null);
      if (tripRes?.data?.success) {
        setTripDetails(tripRes.data.data);
      }

      // Load operations hotels, transport, and guides
      const hotelsRes = await api.get(`/ops/hotels/${tripId}?departureDate=${departureDateStr}`).catch(() => ({ data: { data: [] } }));
      const transportRes = await api.get(`/ops/transport/${tripId}?departureDate=${departureDateStr}`).catch(() => ({ data: { data: [] } }));
      const guidesRes = await api.get(`/ops/guides/${tripId}?departureDate=${departureDateStr}`).catch(() => ({ data: { data: [] } }));

      const hotels = hotelsRes.data?.data || [];
      const transports = transportRes.data?.data || [];
      const guides = guidesRes.data?.data || [];
      setDbGuides(guides);

      // Populate allocFleet from database
      const initialFleet = transports.map((t: any) => ({
        id: t.id,
        name: t.driverName || "Tempo 1",
        vehicleType: t.vehicleType,
        capacity: t.capacity,
        cost: t.totalAmount,
        vendor: t.notes || "Self-driven"
      }));
      setAllocFleet(initialFleet);

      // Combine them into tripVendors structure
      const mappedVendors = [
        ...hotels.map((h: any) => ({
          id: h.id,
          vendorType: 'hotel',
          vendorId: {
            name: h.hotelName,
            location: h.location,
            notes: h.notes
          },
          paymentStatus: h.confirmed === 'CONFIRMED' ? 'paid' : 'pending',
          notes: h.notes,
          agreedCost: h.totalAmount,
          paidAmount: h.advancePaid,
          balanceDue: h.balanceAmount
        })),
        ...transports.map((t: any) => ({
          id: t.id,
          vendorType: 'transport',
          vendorId: {
            name: t.vehicleType,
            location: t.driverName || 'Driver',
            notes: t.notes
          },
          paymentStatus: t.balanceAmount === 0 ? 'paid' : 'pending',
          notes: t.notes,
          agreedCost: t.totalAmount,
          paidAmount: t.advancePaid,
          balanceDue: t.balanceAmount
        })),
        ...guides.map((g: any) => ({
          id: g.id,
          vendorType: 'guide',
          vendor: {
            name: g.guideName,
            type: 'guide'
          },
          paymentStatus: g.paymentStatus === 'PAID' ? 'paid' : 'pending',
          agreedCost: g.agreedAmount,
          paidAmount: g.advancePaid,
          balanceDue: g.balanceAmount
        }))
      ];

      setTripVendors(mappedVendors);

      const checkRes = await api.get(`/ops/checklists/${tripId}?departureDate=${departureDateStr}`).catch(() => null);
      if (checkRes?.data?.success && checkRes.data.data.length > 0) {
        setChecklistTasks(checkRes.data.data);
      } else {
        const key = `${tripId}-${departureDateStr}`;
        if (initializationKeyRef.current !== key) {
          initializationKeyRef.current = key;
          const initRes = await api.post(`/ops/checklists/${tripId}/initialize?departureDate=${departureDateStr}`).catch(() => {
            initializationKeyRef.current = null;
            return null;
          });
          if (initRes?.data?.success) {
            setChecklistTasks(initRes.data.data);
          }
        }
      }

      // Load confirmed room + vehicle allocations and hydrate manual shuffler
      const allocRes = await api.get(`/ops/auto-allocate/${tripId}/confirmed?departureDate=${departureDateStr}`).catch(() => null);
      if (allocRes?.data?.success) {
        const { rooms = [], vehicles = [] } = allocRes.data.data;
        if (rooms.length > 0 || vehicles.length > 0) {
          setPassengerAllocations((prev: any) => {
            const next = { ...prev };
            rooms.forEach((r: any) => {
              const key = r.travelerName;
              next[key] = { ...(next[key] || { vehicle: '—', seat: '—' }), room: r.roomNumber };
            });
            // Build fleetId-to-name map from initialFleet
            const fleetNameMap: Record<string, string> = {};
            initialFleet.forEach((f: any) => { fleetNameMap[f.id] = f.name; });
            vehicles.forEach((v: any) => {
              const key = v.travelerName;
              const vName = fleetNameMap[v.fleetId] || v.fleetId;
              next[key] = { ...(next[key] || { room: '—' }), vehicle: vName, seat: v.seatNumber ? String(v.seatNumber) : '—' };
            });
            return next;
          });
        }
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [tripId, departureDateStr]);

  const handleModalFieldChange = (name: string, field: string, value: string) => {
    setModalAllocations(prev => {
      const updated = {
        ...prev,
        [name]: {
          ...(prev[name] || { roomType: "Individual", coupleWith: "", roomNo: "—" }),
          [field]: value
        }
      };

      // Auto-linking couples/double sharing: if passenger A is coupled with B, automatically set B's coupleWith to A and type to A's type
      if (field === "coupleWith" && value) {
        updated[value] = {
          ...(updated[value] || { roomType: "Double", coupleWith: "", roomNo: "—" }),
          roomType: updated[name].roomType || "Double",
          coupleWith: name
        };
        // Auto-match room number if available
        if (updated[name].roomNo && updated[name].roomNo !== "—") {
          updated[value].roomNo = updated[name].roomNo;
        }
      } else if (field === "roomNo" && (updated[name]?.roomType === "Couple" || updated[name]?.roomType === "Double") && updated[name]?.coupleWith) {
        const partner = updated[name].coupleWith;
        if (updated[partner]) {
          updated[partner].roomNo = value;
        }
      }

      return updated;
    });
  };

  const handleSaveRoomAllocations = async () => {
    if (!selectedBookingForRoomAlloc) return;
    const bg = selectedBookingForRoomAlloc;

    try {
      const currentPassengers = bg.rawBooking.passengers || { details: {}, persons: [] };
      const currentDetails = currentPassengers.details || {};

      const newPersonsRoomDetails = {
        ...(currentDetails.personsRoomDetails || {}),
        ...modalAllocations
      };

      const updatedPassengers = {
        ...currentPassengers,
        details: {
          ...currentDetails,
          personsRoomDetails: newPersonsRoomDetails
        }
      };

      await api.put(`/bookings/${bg.bookingId}`, { passengers: updatedPassengers });

      toast.success("Room allocations saved successfully!");
      setSelectedBookingForRoomAlloc(null);
      await fetchPageData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save room allocations");
    }
  };

  const getRelationshipBadge = (type: string) => {
    const styles: Record<string, string> = {
      "Couple": "bg-pink-50 text-pink-700 border-pink-200",
      "Family": "bg-blue-50 text-blue-700 border-blue-200",
      "Friends": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "Triple Sharing": "bg-purple-50 text-purple-700 border-purple-200",
      "Individual": "bg-slate-50 text-slate-600 border-slate-200"
    };
    return (
      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", styles[type] || styles["Individual"])}>
        {type || "Individual"}
      </span>
    );
  };

  const handleToggleTask = async (task: any) => {
    try {
      const isCompleted = task.isCompleted;
      const endpoint = isCompleted ? "/ops/checklists/reopen" : "/ops/checklists/complete";
      const notes = isCompleted ? "Reopened via departure hub checklist" : "Completed via departure hub checklist";
      const res = await api.post(endpoint, { id: task.id, notes });
      if (res.data?.success) {
        toast.success(`Task ${isCompleted ? 'reopened' : 'completed'} successfully!`);
        const checkRes = await api.get(`/ops/checklists/${tripId}?departureDate=${departureDateStr}`).catch(() => null);
        if (checkRes?.data?.success) {
          setChecklistTasks(checkRes.data.data);
        }
      }
    } catch (err) {
      toast.error("Failed to update checklist item");
    }
  };

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const handleOpenBookingDetails = (bookingId: string) => {
    const b = bookings.find((bk: any) => bk.id === bookingId || bk.bookingId === bookingId);
    if (b) {
      setSelectedBooking(b);
      setBookingModalOpen(true);
    } else {
      toast.error("Booking details not found");
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg = {
      id: `msg-sent-${Date.now()}`,
      convId: activeConv,
      sender: "Suresh Kumar",
      avatar: "SK",
      role: "Operations Manager",
      text: chatInput,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
      reactions: []
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput("");
    toast.success("Message sent!");
  };

  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskStage, setNewTaskStage] = useState("PRE_TRIP_7D");
  const [newTaskNotes, setNewTaskNotes] = useState("");

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) {
      toast.error("Task name is required");
      return;
    }
    try {
      const res = await api.post(`/ops/checklists/create?tripId=${tripId}&departureDate=${departureDateStr}`, {
        taskName: newTaskName,
        stage: newTaskStage,
        notes: newTaskNotes
      });
      if (res.data?.success) {
        toast.success("Task created successfully!");
        const checkRes = await api.get(`/ops/checklists/${tripId}?departureDate=${departureDateStr}`).catch(() => null);
        if (checkRes?.data?.success) {
          setChecklistTasks(checkRes.data.data);
        }
        setAddTaskModalOpen(false);
        setNewTaskName("");
        setNewTaskNotes("");
      }
    } catch (err) {
      toast.error("Failed to create checklist task");
    }
  };

  const [timelineView, setTimelineView] = useState(false);
  const [editDepartureOpen, setEditDepartureOpen] = useState(false);
  const [addPassengerOpen, setAddPassengerOpen] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);

  // New Passenger Form State
  const [newPaxName, setNewPaxName] = useState("");
  const [newPaxPhone, setNewPaxPhone] = useState("");
  const [newPaxAge, setNewPaxAge] = useState("24");
  const [newPaxGender, setNewPaxGender] = useState("Male");
  const [newPaxAmount, setNewPaxAmount] = useState("14000");

  // Edit Departure Details Form State
  const [editGuideName, setEditGuideName] = useState("");
  const [editVehicleDetails, setEditVehicleDetails] = useState("Tempo Traveller 17 Str");
  const [editStatus, setEditStatus] = useState("CONFIRMED");

  // Hotel Edit States
  const [editHotelOpen, setEditHotelOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [hotelNameForm, setHotelNameForm] = useState("");
  const [hotelLocationForm, setHotelLocationForm] = useState("");
  const [hotelRoomTypeForm, setHotelRoomTypeForm] = useState("");
  const [hotelRoomsForm, setHotelRoomsForm] = useState(1);
  const [hotelCostForm, setHotelCostForm] = useState(0);
  const [hotelPaidForm, setHotelPaidForm] = useState(0);
  const [hotelConfirmedForm, setHotelConfirmedForm] = useState("UNCONFIRMED");
  const [hotelNotesForm, setHotelNotesForm] = useState("");

  // Transport Edit States
  const [editTransportOpen, setEditTransportOpen] = useState(false);
  const [selectedTransportId, setSelectedTransportId] = useState("");
  const [vehicleTypeForm, setVehicleTypeForm] = useState("");
  const [capacityForm, setCapacityForm] = useState(13);
  const [routeForm, setRouteForm] = useState("");
  const [driverNameForm, setDriverNameForm] = useState("");
  const [driverPhoneForm, setDriverPhoneForm] = useState("");
  const [transportCostForm, setTransportCostForm] = useState(0);
  const [transportPaidForm, setTransportPaidForm] = useState(0);
  const [transportNotesForm, setTransportNotesForm] = useState("");

  // Hotel Pricing Automation states
  const [pricingMethod, setPricingMethod] = useState<"room-wise" | "double-extra" | "per-person" | "manual">("room-wise");
  
  const [doubleRate, setDoubleRate] = useState(2600);
  const [tripleRate, setTripleRate] = useState(3400);
  const [quadRate, setQuadRate] = useState(4200);
  const [extraPersonRate, setExtraPersonRate] = useState(800);
  const [extraChildRate, setExtraChildRate] = useState(0);

  const [doubleRoomsCount, setDoubleRoomsCount] = useState(0);
  const [tripleRoomsCount, setTripleRoomsCount] = useState(0);
  const [quadRoomsCount, setQuadRoomsCount] = useState(0);
  const [extraPersonsCount, setExtraPersonsCount] = useState(0);

  const [checkInDateForm, setCheckInDateForm] = useState("");
  const [checkOutDateForm, setCheckOutDateForm] = useState("");
  const [hotelNightsCount, setHotelNightsCount] = useState(1);
  const [hotelVendorId, setHotelVendorId] = useState("");
  const [voucherStatusForm, setVoucherStatusForm] = useState("PENDING");

  const [overrideApplied, setOverrideApplied] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState(0);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideAuthor, setOverrideAuthor] = useState("Super Admin");

  const [overrideTripleRate, setOverrideTripleRate] = useState(false);
  const [overrideQuadRate, setOverrideQuadRate] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [activeCalculationDrawer, setActiveCalculationDrawer] = useState<string | null>(null);
  const [editingHotel, setEditingHotel] = useState<any | null>(null);
  const [isSavingHotel, setIsSavingHotel] = useState(false);

  // Calculated Hotel Cost logic (Passenger Sharing Rates per Person)
  const doubleCost = doubleRoomsCount * doubleRate * hotelNightsCount; // Twin Sharing Pax
  const tripleCost = tripleRoomsCount * tripleRate * hotelNightsCount; // Triple Sharing Pax
  const quadCost = quadRoomsCount * quadRate * hotelNightsCount; // Quad Sharing Pax
  const extraPersonCost = extraPersonsCount * extraPersonRate * hotelNightsCount; // Extra Pax

  const calculatedTotalCost = doubleCost + tripleCost + quadCost + extraPersonCost;
  const totalPaxCapacity = doubleRoomsCount + tripleRoomsCount + quadRoomsCount + extraPersonsCount;
  const totalRoomsCount = Math.ceil(doubleRoomsCount / 2) + Math.ceil(tripleRoomsCount / 3) + Math.ceil(quadRoomsCount / 4) + (extraPersonsCount ? 1 : 0);
  const formatDateToYYYYMMDD = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleCheckInChange = (newVal: string) => {
    setCheckInDateForm(newVal);
    if (newVal) {
      const d = new Date(newVal);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + hotelNightsCount);
        setCheckOutDateForm(formatDateToYYYYMMDD(d));
      }
    }
  };

  const handleNightsChange = (nights: number) => {
    setHotelNightsCount(nights);
    if (checkInDateForm) {
      const d = new Date(checkInDateForm);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + nights);
        setCheckOutDateForm(formatDateToYYYYMMDD(d));
      }
    }
  };
  const handleOpenEditHotel = (row: any) => {
    const raw = row.rawAssignment || {};
    setSelectedHotelId(row.id);
    setHotelNameForm(raw.hotelName || row.hotel || "");
    setHotelLocationForm(raw.location || row.sub || "");
    setHotelRoomTypeForm(raw.roomType || row.type || "Deluxe Stay");
    setHotelRoomsForm(raw.numberOfRooms || 1);
    setHotelCostForm(raw.totalAmount || 0);
    setHotelPaidForm(raw.advancePaid || 0);
    setHotelConfirmedForm(raw.confirmed || (row.status === "CONFIRMED" ? "CONFIRMED" : "UNCONFIRMED"));
    setVoucherStatusForm(raw.voucherStatus || "PENDING");

    // Pricing Automation fallback unpacking
    let pricingData: any = null;
    if (raw.notes && raw.notes.trim().startsWith("{")) {
      try {
        pricingData = JSON.parse(raw.notes);
      } catch (e) {}
    }

    const dayNumStr = row.day ? String(row.day).replace("Day ", "").trim() : "1";
    const dayIndex = (parseInt(dayNumStr) - 1) || 0;



    const dCheckIn = new Date(departureDateStr);
    if (!isNaN(dCheckIn.getTime())) {
      dCheckIn.setDate(dCheckIn.getDate() + dayIndex);
    }
    const calculatedCheckIn = formatDateToYYYYMMDD(dCheckIn);

    const dCheckOut = new Date(dCheckIn);
    if (!isNaN(dCheckOut.getTime())) {
      dCheckOut.setDate(dCheckOut.getDate() + (row.nights || 1));
    }
    const calculatedCheckOut = formatDateToYYYYMMDD(dCheckOut);

    if (pricingData && pricingData.__isHotelPricing) {
      setPricingMethod(pricingData.pricingMethod || "room-wise");
      setDoubleRate(pricingData.rates?.doubleRate ?? 2600);
      setTripleRate(pricingData.rates?.tripleRate ?? 3400);
      setQuadRate(pricingData.rates?.quadRate ?? 4200);
      setExtraPersonRate(pricingData.rates?.extraPersonRate ?? 800);
      setExtraChildRate(pricingData.rates?.extraChildRate ?? 0);

      setDoubleRoomsCount(pricingData.allocations?.doubleRoomsCount ?? 5);
      setTripleRoomsCount(pricingData.allocations?.tripleRoomsCount ?? 0);
      setQuadRoomsCount(pricingData.allocations?.quadRoomsCount ?? 0);
      setExtraPersonsCount(pricingData.allocations?.extraPersonsCount ?? 0);

      setCheckInDateForm(pricingData.checkInDate || calculatedCheckIn);
      setCheckOutDateForm(pricingData.checkOutDate || calculatedCheckOut);
      setHotelNightsCount(pricingData.nightsCount || row.nights || 1);
      setHotelVendorId(pricingData.vendorId || raw.vendorId || "");
      setVoucherStatusForm(pricingData.voucherStatus || "PENDING");

      setOverrideApplied(pricingData.override?.applied ?? false);
      setOverrideAmount(pricingData.override?.amount ?? 0);
      setOverrideReason(pricingData.override?.reason ?? "");
      setOverrideAuthor(pricingData.override?.author ?? "Super Admin");

      setOverrideTripleRate(pricingData.overrideTripleRate ?? false);
      setOverrideQuadRate(pricingData.overrideQuadRate ?? false);
      setShowInternalNotes(!!pricingData.userNotes);

      setHotelNotesForm(pricingData.userNotes || "");
    } else {
      setPricingMethod("room-wise");
      setDoubleRate(2600);
      setTripleRate(3400);
      setQuadRate(4200);
      setExtraPersonRate(800);
      setExtraChildRate(0);

      // Filter manifest to travelers for this departure/trip
      const activePassengers: any[] = [];
      const normalizeCompareName = (nameStr: string) => {
        if (!nameStr) return "";
        let clean = nameStr.toLowerCase().trim();
        if (clean.startsWith("mr. ")) clean = clean.substring(4).trim();
        else if (clean.startsWith("mrs. ")) clean = clean.substring(5).trim();
        else if (clean.startsWith("ms. ")) clean = clean.substring(4).trim();
        return clean;
      };

      bookings.forEach((b: any) => {
        let passengersObj = b.passengers;
        if (typeof passengersObj === 'string') {
          try {
            passengersObj = JSON.parse(passengersObj);
          } catch (e) {
            passengersObj = {};
          }
        }

        const roomDetailsObj = b.roomDetails || passengersObj?.details || {};
        const personsRoomDetails = roomDetailsObj.personsRoomDetails || {};

        const leadName = b.fullName || b.name || "Traveler";
        const leadRoomInfo = personsRoomDetails[leadName] || {};
        const leadRoomType = leadRoomInfo.roomType || (b.numberOfTravelers === 1 ? "Individual" : "Triple Sharing");
        const normLeadName = normalizeCompareName(leadName);

        // Add lead passenger
        activePassengers.push({
          name: leadName,
          roomSharing: leadRoomType
        });

        // Map co-passengers from parsed passengers JSON list
        const coPax = Array.isArray(passengersObj?.persons) ? passengersObj.persons : [];
        coPax.forEach((co: any) => {
          if (normalizeCompareName(co.name) === normLeadName) return;
          const coRoomInfo = personsRoomDetails[co.name] || {};
          const coRoomType = coRoomInfo.roomType || "Triple Sharing";
          activePassengers.push({
            name: co.name || "Co-Traveler",
            roomSharing: coRoomType
          });
        });
      });

      let twinPax = 0;
      let triplePax = 0;
      let quadPax = 0;
      let extraPax = 0;

      // Check if we have active room allocations saved in our shuffler
      const roomGroups: Record<string, number> = {};
      Object.entries(passengerAllocations).forEach(([name, alloc]) => {
        if (alloc.room && alloc.room !== "—" && alloc.room !== "Unassigned") {
          roomGroups[alloc.room] = (roomGroups[alloc.room] || 0) + 1;
        }
      });

      const hasSavedRoomAllocations = Object.keys(roomGroups).length > 0;

      if (hasSavedRoomAllocations) {
        // Calculate rooms directly from saved shuffler groups
        Object.entries(roomGroups).forEach(([room, count]) => {
          if (count === 2) {
            twinPax += 2; // 1 Double Room = 2 passengers
          } else if (count === 3) {
            triplePax += 3; // 1 Triple Room = 3 passengers
          } else if (count === 4) {
            quadPax += 4; // 1 Quad Room = 4 passengers
          } else {
            extraPax += count; // Single or extra bed passengers
          }
        });
      } else {
        // Fallback: use raw passenger preferences from the bookings sheet
        activePassengers.forEach((p: any) => {
          const sharing = (p.roomSharing || "").toLowerCase();
          if (sharing.includes("twin") || sharing.includes("double")) {
            twinPax++;
          } else if (sharing.includes("triple")) {
            triplePax++;
          } else if (sharing.includes("quad")) {
            quadPax++;
          } else {
            extraPax++;
          }
        });
      }

      setDoubleRoomsCount(twinPax);
      setTripleRoomsCount(triplePax);
      setQuadRoomsCount(quadPax);
      setExtraPersonsCount(extraPax);

      setCheckInDateForm(raw.checkIn ? raw.checkIn.substring(0, 10) : calculatedCheckIn);
      setCheckOutDateForm(raw.checkOut ? raw.checkOut.substring(0, 10) : calculatedCheckOut);
      setHotelNightsCount(row.nights || 1);
      setHotelVendorId(raw.vendorId || "");
      setVoucherStatusForm("PENDING");

      setOverrideApplied(false);
      setOverrideAmount(0);
      setOverrideReason("");
      setOverrideAuthor("Super Admin");

      setOverrideTripleRate(false);
      setOverrideQuadRate(false);
      setShowInternalNotes(false);

      setHotelNotesForm(raw.notes || "");
    }

    setEditingHotel(row);
  };

  const handleEditHotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingHotel) return;
    setIsSavingHotel(true);
    try {
      // Helper to convert inputs safely to numbers
      const toFiniteNum = (val: any) => {
        const parsed = parseFloat(String(val));
        return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, parsed);
      };
      const toFiniteInt = (val: any) => {
        const parsed = parseInt(String(val), 10);
        return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, parsed);
      };

      const cleanDoubleRate = toFiniteNum(doubleRate);
      const cleanTripleRate = toFiniteNum(tripleRate);
      const cleanQuadRate = toFiniteNum(quadRate);
      const cleanExtraPersonRate = toFiniteNum(extraPersonRate);
      const cleanExtraChildRate = toFiniteNum(extraChildRate);

      const cleanDoubleRooms = toFiniteInt(doubleRoomsCount);
      const cleanTripleRooms = toFiniteInt(tripleRoomsCount);
      const cleanQuadRooms = toFiniteInt(quadRoomsCount);
      const cleanExtraPersons = toFiniteInt(extraPersonsCount);

      const cleanNightsCount = Math.max(1, toFiniteInt(hotelNightsCount));
      const cleanOverrideAmount = toFiniteNum(overrideAmount);
      const cleanPaid = toFiniteNum(hotelPaidForm);

      // Normalize check-in / check-out dates (format to YYYY-MM-DD or empty)
      const cleanCheckIn = checkInDateForm ? new Date(checkInDateForm).toISOString().substring(0, 10) : "";
      const cleanCheckOut = checkOutDateForm ? new Date(checkOutDateForm).toISOString().substring(0, 10) : "";

      const pricingPayload = {
        __isHotelPricing: true,
        pricingMethod,
        rates: {
          doubleRate: cleanDoubleRate,
          tripleRate: cleanTripleRate,
          quadRate: cleanQuadRate,
          extraPersonRate: cleanExtraPersonRate,
          extraChildRate: cleanExtraChildRate
        },
        allocations: {
          doubleRoomsCount: cleanDoubleRooms,
          tripleRoomsCount: cleanTripleRooms,
          quadRoomsCount: cleanQuadRooms,
          extraPersonsCount: cleanExtraPersons
        },
        checkInDate: cleanCheckIn,
        checkOutDate: cleanCheckOut,
        nightsCount: cleanNightsCount,
        vendorId: hotelVendorId || "",
        voucherStatus: voucherStatusForm || "PENDING",
        override: {
          applied: overrideApplied,
          amount: cleanOverrideAmount,
          reason: overrideReason || "",
          author: overrideAuthor || "Super Admin"
        },
        overrideTripleRate,
        overrideQuadRate,
        userNotes: hotelNotesForm || ""
      };

      const finalCost = overrideApplied ? cleanOverrideAmount : calculatedTotalCost;

      await opsService.saveHotelBookings(tripId, departureDateStr, [
        {
          id: selectedHotelId,
          hotelName: hotelNameForm || "",
          location: hotelLocationForm || "",
          roomType: hotelRoomTypeForm || "",
          numberOfRooms: totalRoomsCount || 1,
          totalAmount: finalCost,
          advancePaid: cleanPaid,
          confirmed: hotelConfirmedForm || "UNCONFIRMED",
          notes: JSON.stringify(pricingPayload),
          pricingMethod,
          doubleRoomsCount: cleanDoubleRooms,
          tripleRoomsCount: cleanTripleRooms,
          quadRoomsCount: cleanQuadRooms,
          extraPersonsCount: cleanExtraPersons,
          nightsCount: cleanNightsCount,
          doubleRate: cleanDoubleRate,
          tripleRate: cleanTripleRate,
          quadRate: cleanQuadRate,
          extraBedRate: cleanExtraPersonRate,
          checkIn: cleanCheckIn,
          checkOut: cleanCheckOut,
          vendorId: hotelVendorId || null
        }
      ]);

      // If override is modified, sync it with the override endpoint if needed
      if (overrideApplied) {
        await opsService.saveHotelOverride(tripId, {
          departureHotelId: selectedHotelId,
          fieldName: 'totalAmount',
          originalValue: calculatedTotalCost,
          overriddenValue: cleanOverrideAmount,
          reason: overrideReason || "",
          advancePaid: cleanPaid
        }).catch(() => null);
      } else {
        await opsService.resetHotelOverride(tripId, {
          departureHotelId: selectedHotelId
        }).catch(() => null);
      }

      toast.success("Hotel details updated successfully!");
      setEditingHotel(null);
      fetchPageData();
    } catch (err: any) {
      console.error("Failed to save hotel bookings", err.response?.data || err);
      const errMsg = err.response?.data?.message || "Failed to update hotel details.";
      toast.error(errMsg);
    } finally {
      setIsSavingHotel(false);
    }
  };

  const handleOpenEditTransport = (row: any) => {
    const raw = row.rawAssignment || {};
    setSelectedTransportId(row.id);
    setVehicleTypeForm(raw.vehicleType || row.type || "");
    setCapacityForm(raw.capacity || 13);
    setRouteForm(raw.route || "");
    setDriverNameForm(raw.driverName || "");
    setDriverPhoneForm(raw.driverPhone || "");
    setTransportCostForm(raw.totalAmount || 0);
    setTransportPaidForm(raw.advancePaid || 0);
    setTransportNotesForm(raw.notes || "");
    setEditTransportOpen(true);
  };

  const handleEditTransportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/ops/transport/${tripId}?departureDate=${departureDateStr}`, {
        id: selectedTransportId,
        vehicleType: vehicleTypeForm,
        capacity: capacityForm,
        route: routeForm,
        driverName: driverNameForm,
        driverPhone: driverPhoneForm,
        totalAmount: transportCostForm,
        advancePaid: transportPaidForm,
        notes: transportNotesForm
      });
      toast.success("Transport details updated successfully!");
      setEditTransportOpen(false);
      // Refresh
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update transport details.");
    }
  };

  // Train Booking States
  const [trainBookings, setTrainBookings] = useState(() => {
    const key = `train_bookings_${tripId}_${departureDateStr}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "train-1",
        trainName: "14416 / SHATABDI EXP",
        pnr: "2456 7890 1234",
        from: "Amritsar (ASR)",
        to: "Ahmedabad (ADI)",
        depTime: "04:10 PM",
        arrTime: "09:45 PM",
        depStation: "ASR",
        arrStation: "ADI",
        date: "13 Jul 2027",
        dayWd: "Sun",
        seats: "57 / 60",
        status: "CONFIRMED"
      }
    ];
  });

  const [editTrainOpen, setEditTrainOpen] = useState(false);
  const [selectedTrainId, setSelectedTrainId] = useState("");
  const [trainNameForm, setTrainNameForm] = useState("");
  const [trainPnrForm, setTrainPnrForm] = useState("");
  const [trainFromForm, setTrainFromForm] = useState("");
  const [trainToForm, setTrainToForm] = useState("");
  const [trainDepTimeForm, setTrainDepTimeForm] = useState("");
  const [trainArrTimeForm, setTrainArrTimeForm] = useState("");
  const [trainDateForm, setTrainDateForm] = useState("");
  const [trainSeatsForm, setTrainSeatsForm] = useState("");
  const [trainStatusForm, setTrainStatusForm] = useState("CONFIRMED");

  const handleOpenEditTrain = (train: any) => {
    setSelectedTrainId(train.id);
    setTrainNameForm(train.trainName);
    setTrainPnrForm(train.pnr);
    setTrainFromForm(train.from);
    setTrainToForm(train.to);
    setTrainDepTimeForm(train.depTime);
    setTrainArrTimeForm(train.arrTime);
    setTrainDateForm(train.date);
    setTrainSeatsForm(train.seats);
    setTrainStatusForm(train.status);
    setEditTrainOpen(true);
  };

  const handleEditTrainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = trainBookings.map((t: any) => {
      if (t.id === selectedTrainId) {
        return {
          ...t,
          trainName: trainNameForm,
          pnr: trainPnrForm,
          from: trainFromForm,
          to: trainToForm,
          depTime: trainDepTimeForm,
          arrTime: trainArrTimeForm,
          date: trainDateForm,
          seats: trainSeatsForm,
          status: trainStatusForm
        };
      }
      return t;
    });
    setTrainBookings(updated);
    localStorage.setItem(`train_bookings_${tripId}_${departureDateStr}`, JSON.stringify(updated));
    toast.success("Train booking details updated successfully!");
    setEditTrainOpen(false);
  };

  const handlePrintManifest = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocker prevented printing. Please allow popups.");
      return;
    }
    
    const rowsHtml = allPassengers.map((p, i) => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px; text-align: center; font-size: 11px;">${i + 1}</td>
        <td style="padding: 10px; font-weight: bold; font-size: 11px;">${p.name}</td>
        <td style="padding: 10px; font-size: 11px;">${p.bookingId}</td>
        <td style="padding: 10px; font-size: 11px; font-weight: bold; color: #1E293B;">${p.phone}</td>
        <td style="padding: 10px; font-size: 11px;">${p.gender} (${p.age})</td>
        <td style="padding: 10px; font-size: 11px;">${p.pickupPoint}</td>
        <td style="padding: 10px; font-family: monospace; font-size: 11px; font-weight: bold;">${p.roomNo}</td>
      </tr>
    `).join("");

    const manifestHtml = `
      <html>
        <head>
          <title>Passenger Manifest - ${tripId} (${departureDateStr})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #1E293B; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; border: 1px solid #E2E8F0; }
            th { background-color: #F8FAFC; border-bottom: 2px solid #E2E8F0; padding: 12px 10px; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #475569; text-align: left; }
            h1 { font-size: 22px; margin: 0; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; }
            .header-meta { display: flex; gap: 30px; margin-top: 12px; font-size: 11px; color: #475569; border-bottom: 2px dashed #E2E8F0; padding-bottom: 18px; }
            .meta-item { display: flex; flex-direction: column; gap: 3px; }
            .meta-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #94A3B8; }
            .meta-val { font-size: 12px; font-weight: bold; color: #0F172A; }
          </style>
        </head>
        <body>
          <h1>DEPARTURE MANIFEST</h1>
          <div class="header-meta">
            <div class="meta-item"><span class="meta-label">Trip Code</span><span class="meta-val">${tripId}</span></div>
            <div class="meta-item"><span class="meta-label">Itinerary</span><span class="meta-val">${tripDetails?.title || "Spiti Valley Road Trip"}</span></div>
            <div class="meta-item"><span class="meta-label">Date</span><span class="meta-val">${departureDateStr}</span></div>
            <div class="meta-item"><span class="meta-label">Tour Lead</span><span class="meta-val">${leadGuideName}</span></div>
            <div class="meta-item"><span class="meta-label">Pax Count</span><span class="meta-val">${allPassengers.length} Verified</span></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">S.No</th>
                <th>Passenger Name</th>
                <th>Booking ID</th>
                <th>Phone Number</th>
                <th>Gender (Age)</th>
                <th>Pickup Point</th>
                <th>Room Allocation</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(manifestHtml);
    printWindow.document.close();
  };

  const handleDownloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("No data available to export");
      return;
    }
    const cleanData = data.map(item => {
      const cleanObj = { ...item };
      delete cleanObj.rawTask;
      delete cleanObj.id;
      return cleanObj;
    });
    const headers = Object.keys(cleanData[0]).join(",");
    const rows = cleanData.map(item =>
      Object.values(item)
        .map(val => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} exported successfully!`);
  };

  const handleAddPassengerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaxName.trim() || !newPaxPhone.trim()) {
      toast.error("Name and Phone are required");
      return;
    }
    // Simulate creating passenger booking record
    const dummyBooking = {
      id: `bk-new-${Date.now()}`,
      bookingId: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: newPaxName,
      name: newPaxName,
      phone: newPaxPhone,
      mobile: newPaxPhone,
      age: parseInt(newPaxAge) || 24,
      gender: newPaxGender,
      tripId,
      tripName: tripDetails?.title || "Spiti Valley Road Trip",
      departureDate: departureDateStr,
      totalAmount: parseInt(newPaxAmount) || 14000,
      advancePaid: 0,
      remainingAmount: parseInt(newPaxAmount) || 14000,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      passengers: {
        details: {
          idProof: null,
          roomAllocation: "TBD"
        },
        persons: []
      }
    };
    setBookings(prev => [dummyBooking, ...prev]);
    toast.success("Passenger added successfully to departure hub list!");
    setAddPassengerOpen(false);
    setNewPaxName("");
    setNewPaxPhone("");
  };

  const handleEditDepartureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeadGuideName(editGuideName);
    toast.success("Departure details updated successfully!");
    setEditDepartureOpen(false);
  };

  // Dynamic Overview Calculations
  const stats = useMemo(() => {
    const confirmedBookings = bookings.filter((b: any) => b.status !== "cancelled");
    
    // Revenue & Customer Payments
    const totalRevenue = confirmedBookings.reduce((sum: number, b: any) => sum + (b.totalAmount || b.amount || 0), 0);
    const customerPaid = confirmedBookings.reduce((sum: number, b: any) => sum + (b.advancePaid || 0), 0);
    const customerOutstanding = confirmedBookings.reduce((sum: number, b: any) => sum + (b.remainingAmount || 0), 0);
    const totalParticipants = confirmedBookings.reduce((sum: number, b: any) => sum + (b.numberOfTravelers || 1), 0);
    const outstandingParticipantsCount = confirmedBookings.filter((b: any) => (b.remainingAmount || 0) > 0).length;

    // Vendor Payments (filtered from tripVendors state)
    const hotelsCost = tripVendors.filter(v => v.vendorType === 'hotel').reduce((sum, v) => sum + (v.agreedCost || 0), 0);
    const hotelsPaid = tripVendors.filter(v => v.vendorType === 'hotel').reduce((sum, v) => sum + (v.paidAmount || 0), 0);
    const transportsCost = tripVendors.filter(v => v.vendorType === 'transport').reduce((sum, v) => sum + (v.agreedCost || 0), 0);
    const transportsPaid = tripVendors.filter(v => v.vendorType === 'transport').reduce((sum, v) => sum + (v.paidAmount || 0), 0);
    const guidesCost = tripVendors.filter(v => v.vendorType === 'guide').reduce((sum, v) => sum + (v.agreedCost || 0), 0);
    const guidesPaid = tripVendors.filter(v => v.vendorType === 'guide').reduce((sum, v) => sum + (v.paidAmount || 0), 0);

    const totalVendorCost = hotelsCost + transportsCost + guidesCost;
    const totalVendorPaid = hotelsPaid + transportsPaid + guidesPaid;
    const totalVendorPayables = totalVendorCost - totalVendorPaid;

    const estProfit = totalRevenue - totalVendorCost;
    const profitPercent = totalRevenue > 0 ? ((estProfit / totalRevenue) * 100).toFixed(1) : "0";

    const customerPaidPercent = totalRevenue > 0 ? ((customerPaid / totalRevenue) * 100).toFixed(1) : "0";
    const customerOutstandingPercent = totalRevenue > 0 ? ((customerOutstanding / totalRevenue) * 100).toFixed(1) : "0";
    const vendorPaidPercent = totalVendorCost > 0 ? ((totalVendorPaid / totalVendorCost) * 100).toFixed(1) : "0";
    const vendorPayablePercent = totalVendorCost > 0 ? ((totalVendorPayables / totalVendorCost) * 100).toFixed(1) : "0";

    return {
      totalRevenue,
      customerPaid,
      customerOutstanding,
      totalParticipants,
      outstandingParticipantsCount,
      totalVendorCost,
      totalVendorPaid,
      totalVendorPayables,
      estProfit,
      profitPercent,
      customerPaidPercent,
      customerOutstandingPercent,
      vendorPaidPercent,
      vendorPayablePercent
    };
  }, [bookings, tripVendors]);

  // Find lead guide and vehicles from tripVendors
  const [leadGuideName, setLeadGuideName] = useState("Assign Guide");
  const [itineraryViewMode, setItineraryViewMode] = useState<"customer" | "internal">("internal");
  const [expandedDescs, setExpandedDescs] = useState<Record<number, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [quickEditModalOpen, setQuickEditModalOpen] = useState(false);
  const [editingDayIdx, setEditingDayIdx] = useState<number | null>(null);
  const [editingDayData, setEditingDayData] = useState<any>({
    title: "",
    stay: "",
    meals: "",
    activities: "",
    departureTime: "",
    arrivalTime: "",
    distance: "",
    drivingHours: "",
    assignedVehicle: "",
    description: ""
  });
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  useEffect(() => {
    const lead = tripVendors.find(v => v.vendorType === 'guide');
    if (lead) {
      setLeadGuideName(lead.vendor.name);
    }
  }, [tripVendors]);

  const handleQuickAdd = (idx: number, field: string) => {
    setEditingDayIdx(idx);
    const rawItin = tripDetails?.itinerary || [];
    const day = rawItin[idx] || {};
    setEditingDayData({
      title: day.title || day.location || "",
      stay: day.stay || "",
      meals: day.meals || "",
      activities: Array.isArray(day.activities) ? day.activities.join(", ") : day.activities || "",
      departureTime: day.departureTime || "",
      arrivalTime: day.arrivalTime || "",
      distance: day.distance || "",
      drivingHours: day.drivingHours || "",
      assignedVehicle: day.assignedVehicle || "",
      description: day.description || ""
    });
    setQuickEditModalOpen(true);
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDayIdx === null || !tripDetails) return;

    try {
      const updatedItinerary = [...(tripDetails.itinerary || [])];
      
      while (updatedItinerary.length <= editingDayIdx) {
        updatedItinerary.push({
          day: updatedItinerary.length + 1,
          title: "",
          description: "",
          stay: "",
          meals: "",
          activities: ""
        });
      }

      updatedItinerary[editingDayIdx] = {
        ...updatedItinerary[editingDayIdx],
        day: editingDayIdx + 1,
        title: editingDayData.title,
        stay: editingDayData.stay,
        meals: editingDayData.meals,
        activities: editingDayData.activities,
        departureTime: editingDayData.departureTime,
        arrivalTime: editingDayData.arrivalTime,
        distance: editingDayData.distance,
        drivingHours: editingDayData.drivingHours,
        assignedVehicle: editingDayData.assignedVehicle,
        description: editingDayData.description
      };

      const res = await api.put(`/trips/${tripDetails.id}`, {
        itinerary: updatedItinerary
      });

      if (res.data?.success || res.data?.data) {
        setTripDetails(res.data.data);
        toast.success("Itinerary day updated successfully!");
        setQuickEditModalOpen(false);
      } else {
        toast.error("Failed to update itinerary day.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred while saving the itinerary.");
    }
  };

  const transportVehiclesLabel = useMemo(() => {
    const count = tripVendors.filter(v => v.vendorType === 'transport').length;
    return count > 0 ? `${count} Vehicles Assigned` : "Assign Transport";
  }, [tripVendors]);

  const dateAndDurationLabel = useMemo(() => {
    try {
      const startDate = new Date(departureDateStr);
      const daysMatch = tripDetails?.duration?.match(/(\d+)\s*Day/i);
      const numDays = daysMatch ? parseInt(daysMatch[1], 10) : 9;
      const endDate = new Date(startDate.getTime() + (numDays - 1) * 24 * 60 * 60 * 1000);
      
      const formatOptions = { day: '2-digit', month: 'short', year: 'numeric' } as const;
      const startStr = startDate.toLocaleDateString('en-US', formatOptions);
      const endStr = endDate.toLocaleDateString('en-US', formatOptions);
      return `${startStr} – ${endStr} (${tripDetails?.duration || '9D / 8N'})`;
    } catch {
      return `05 Jul 2027 – 13 Jul 2027 (9D / 8N)`;
    }
  }, [departureDateStr, tripDetails]);

  const hasDateMismatch = useMemo(() => {
    try {
      const depDate = new Date(departureDateStr);
      const createdDate = new Date("2027-06-15");
      return depDate.getTime() < createdDate.getTime();
    } catch {
      return false;
    }
  }, [departureDateStr]);

  const timelineSteps = useMemo(() => {
    const confirmedBookings = bookings.filter((b: any) => b.status !== "cancelled");
    const sortedBookings = [...confirmedBookings].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const firstBookingDate = sortedBookings[0] ? new Date(sortedBookings[0].createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "TBD";
    const bookingStartedStr = sortedBookings[0] ? new Date(new Date(sortedBookings[0].createdAt).getTime() - 2 * 60 * 60 * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "TBD";
    
    const capacity = tripDetails?.maxGroupSize || 30;
    const filledPercentage = capacity > 0 ? (stats.totalParticipants / capacity) * 100 : 0;
    const seats50PercentStr = sortedBookings[Math.floor(sortedBookings.length / 2)] ? new Date(sortedBookings[Math.floor(sortedBookings.length / 2)].createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "TBD";

    const hotels = tripVendors.filter(v => v.vendorType === 'hotel');
    const allHotelsConfirmed = hotels.length > 0 && hotels.every(h => h.paymentStatus === 'paid');
    const hotelsConfirmStr = allHotelsConfirmed ? "Confirmed" : "Pending Confirmation";

    const depDate = new Date(departureDateStr);
    const departureDayStr = !isNaN(depDate.getTime()) 
      ? depDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : departureDateStr || "TBD";

    return [
      { title: "Booking Started", date: bookingStartedStr, user: "System", active: sortedBookings.length > 0 },
      { title: "First Booking Received", date: firstBookingDate, user: sortedBookings[0]?.name || "System", active: sortedBookings.length > 0 },
      { title: "50% Seats Filled", date: seats50PercentStr, user: "Sales Desk", active: filledPercentage >= 50 },
      { title: "All Hotels Confirmed", date: hotelsConfirmStr, user: "Ops Desk", active: allHotelsConfirmed },
      { title: "Balance Collection In Progress", date: stats.totalVendorPayables > 0 ? "In Progress" : "Completed", user: "Accounts Desk", current: true },
      { title: "Departure Day", date: departureDayStr, pending: true },
    ];
  }, [bookings, tripVendors, tripDetails, departureDateStr, stats]);


  const getDayDateAndWd = (startStr: string, offsetDays: number) => {
    try {
      const parts = startStr.substring(0, 10).split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      const d = new Date(year, month, day);
      d.setDate(d.getDate() + offsetDays);
      const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      const wd = dayNames[d.getDay()];
      const dateFormatted = `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      return { wd, date: dateFormatted };
    } catch (err) {
      return { wd: "SAT", date: "05 Jul 2027" };
    }
  };

  const computedItinerary = useMemo(() => {
    const baseItin = (tripDetails?.itinerary && tripDetails.itinerary.length > 0) 
      ? tripDetails.itinerary.map((it: any) => ({
          day: `Day ${it.day}`,
          plan: it.title || it.location,
          sub: it.description || "",
          stay: it.stay || "—",
          stayType: it.stay && it.stay !== "—" ? "Standard Stay" : "",
          stayBadge: it.stay && it.stay !== "—" ? "STANDARD" : "",
          travel: "Local / Transfer",
          travelSub: "Planned Transfer",
          meals: it.meals || "—",
          activities: Array.isArray(it.activities) ? it.activities.join(" ") : it.activities || "—",
          status: "ON TIME"
        }))
      : (tripId.toLowerCase().includes("spt") ? MOCK_SPITI_ITINERARY : [
          { day: "Day 1", plan: "Ahmedabad → Chandigarh", sub: "Overnight Journey by Volvo", stay: "—", stayType: "", travel: "Volvo Bus", travelSub: "Departure: 08:00 PM", meals: "—", activities: "—", status: "ON TIME" },
          { day: "Day 2", plan: "Chandigarh → Manali", sub: "Enroute Sightseeing", stay: "Manali", stayType: "Hotel Mountain View", stayBadge: "DELUXE", travel: "280 KM", travelSub: "7-8 Hrs", meals: "Breakfast Dinner", activities: "Hadimba Temple Mall Road Visit", status: "ON TIME" },
          { day: "Day 3", plan: "Manali Local Sightseeing", sub: "Solang Valley & Rohtang Pass (if open)", stay: "Manali", stayType: "Hotel Mountain View", stayBadge: "DELUXE", travel: "Local", travelSub: "70 KM", meals: "Breakfast Dinner", activities: "Solang Valley Rohtang Pass", status: "ON TIME" },
          { day: "Day 4", plan: "Manali → Kasol", sub: "Scenic Drive", stay: "Kasol", stayType: "Riverside Camp", stayBadge: "CAMP", travel: "80 KM", travelSub: "3-4 Hrs", meals: "Breakfast Dinner", activities: "Parvati Valley Kasol Market", status: "ON TIME" },
          { day: "Day 5", plan: "Kasol → Kullu → Manikaran", sub: "Hot Springs Visit", stay: "Kasol", stayType: "Riverside Camp", stayBadge: "CAMP", travel: "60 KM", travelSub: "2-3 Hrs", meals: "Breakfast Dinner", activities: "Manikaran Sahib Hot Springs", status: "ON TIME" },
          { day: "Day 6", plan: "Kasol → Amritsar", sub: "Overnight Journey by Volvo", stay: "—", stayType: "", travel: "Volvo Bus", travelSub: "Departure: 08:00 PM", meals: "Breakfast", activities: "—", status: "ON TIME" },
          { day: "Day 7", plan: "Amritsar Sightseeing", sub: "Heritage & Wagah Border", stay: "Amritsar", stayType: "Hotel Grand Amritsar", stayBadge: "DELUXE", travel: "Local", travelSub: "60 KM", meals: "Breakfast Dinner", activities: "Golden Temple Wagah Border", status: "ON TIME" },
          { day: "Day 8", plan: "Amritsar → Delhi", sub: "Overnight Journey by Train", stay: "—", stayType: "", travel: "Shatabdi Express", travelSub: "Departure: 07:00 PM", meals: "Breakfast", activities: "—", status: "ON TIME" },
          { day: "Day 9", plan: "Delhi → Ahmedabad", sub: "Arrival in Ahmedabad", stay: "—", stayType: "", travel: "Flight", travelSub: "Arrival: 06:30 AM", meals: "—", activities: "—", status: "ON TIME" },
        ]);

    return baseItin.map((item: any, idx: number) => {
      const { wd, date } = getDayDateAndWd(departureDateStr, idx);
      return {
        ...item,
        wd,
        date
      };
    });
  }, [tripDetails, departureDateStr, tripId]);


  const computedHotels = useMemo(() => {
    const isSpiti = tripId?.toLowerCase().includes("spt") || tripId?.toLowerCase().includes("spiti");

    // SPT itinerary: 9 nights → 8 hotel rows (Kaza = 2 nights in 1 row)
    // Day 1 = train, Day 10-11 = return/home — no hotel rows
    const sptNights = [
      { dayNum: 2,   city: "Shimla",           region: "Himachal Pradesh", nights: 1, dayLabel: "Day 2" },
      { dayNum: 3,   city: "Sangla / Chitkul",  region: "Himachal Pradesh", nights: 1, dayLabel: "Day 3" },
      { dayNum: 4,   city: "Tabo",              region: "Himachal Pradesh", nights: 1, dayLabel: "Day 4" },
      { dayNum: 5,   city: "Kaza",              region: "Spiti Valley",     nights: 2, dayLabel: "Day 5–6" },
      { dayNum: 7,   city: "Chandratal",         region: "Spiti Valley",     nights: 1, dayLabel: "Day 7" },
      { dayNum: 8,   city: "Manali",             region: "Himachal Pradesh", nights: 1, dayLabel: "Day 8" },
      { dayNum: 9,   city: "Kullu",              region: "Himachal Pradesh", nights: 1, dayLabel: "Day 9" },
    ];

    // Real DB hotel assignments from ops
    const hotelAssignments = tripVendors.filter((v: any) => {
      const vendorObj = typeof v.vendorId === 'object' ? v.vendorId : null;
      const type = vendorObj?.type || v.vendorType || '';
      return type === 'hotel';
    });

    if (isSpiti) {
      return sptNights.map((night, idx) => {
        const { wd, date } = getDayDateAndWd(departureDateStr, night.dayNum - 1);
        const assignment = hotelAssignments[idx] || null;
        const vendorObj = assignment ? (typeof assignment.vendorId === 'object' ? assignment.vendorId : null) : null;
        const raw = assignment?.rawAssignment || assignment;

        return {
          id: assignment?.id || `spt-stay-${idx}`,
          day: night.dayLabel,          // e.g. "Day 5–6" for Kaza
          wd,
          date,
          destRegion: night.region,
          destCity: night.city,
          hotel: vendorObj?.name || raw?.hotelName || "— Not Assigned —",
          vendor: vendorObj?.location || raw?.location || night.city,
          allocations: assignment
            ? [{ text: `${raw?.numberOfRooms || '?'} Rooms`, color: 'blue' }]
            : [{ text: "Pending", color: "orange" }],
          totalPaxText: assignment ? `${raw?.totalPax || allPassengers.length} Pax` : "Not booked",
          capacityPercent: 100,
          capacityColor: assignment ? "bg-emerald-500" : "bg-slate-300",
          nights: night.nights,         // use itinerary-defined nights (Kaza = 2)
          status: assignment
            ? (raw?.confirmed === 'CONFIRMED' || assignment.paymentStatus === 'paid' ? 'CONFIRMED' : 'PENDING')
            : 'PENDING',
          statusSub: assignment
            ? (raw?.confirmed === 'CONFIRMED' ? 'Voucher Sent' : 'Payment Due')
            : 'Not Assigned',
          amt: assignment
            ? ((raw?.totalAmount || assignment.agreedCost || 0).toLocaleString('en-IN'))
            : "0",
          amtSub: assignment
            ? `Paid: ₹${(raw?.advancePaid || assignment.paidAmount || 0).toLocaleString('en-IN')}`
            : "No payment",
          rawAssignment: raw || assignment,
        };
      });
    }

    // Non-SPT trips: use real DB assignments
    if (hotelAssignments.length > 0) {
      return hotelAssignments.map((v: any, idx: number) => {
        const vendorObj = typeof v.vendorId === 'object' ? v.vendorId : { name: 'Assigned Hotel' };
        const dayNum = idx + 1;
        const { wd, date } = getDayDateAndWd(departureDateStr, idx);
        const dest = tripDetails?.location || "Manali";
        const raw = v.rawAssignment || v;

        return {
          id: v.id,
          day: `Day ${dayNum}`,
          wd,
          date,
          destRegion: "Himachal Pradesh",
          destCity: dest,
          hotel: vendorObj.name || raw?.hotelName || "Hotel",
          vendor: vendorObj.location || raw?.location || "Stay Location",
          allocations: [{ text: `${raw?.numberOfRooms || '?'} Rooms`, color: "blue" }],
          totalPaxText: `${raw?.totalPax || allPassengers.length} Pax`,
          capacityPercent: 100,
          capacityColor: "bg-emerald-500",
          nights: raw?.nights || 1,
          status: raw?.confirmed === 'CONFIRMED' || v.paymentStatus === 'paid' ? 'CONFIRMED' : 'PENDING',
          statusSub: raw?.confirmed === 'CONFIRMED' ? 'Voucher Sent' : 'Payment Due',
          amt: (raw?.totalAmount || v.agreedCost || 0).toLocaleString('en-IN'),
          amtSub: `Paid: ₹${(raw?.advancePaid || v.paidAmount || 0).toLocaleString('en-IN')}`,
          rawAssignment: raw,
        };
      });
    }

    return [];
  }, [tripVendors, tripDetails, departureDateStr, tripId, bookings]);

  const computedTransport = useMemo(() => {
    const transAssignments = tripVendors.filter((v: any) => {
      const vendorObj = typeof v.vendorId === 'object' ? v.vendorId : null;
      const type = vendorObj?.type || v.vendorType || '';
      return type === 'transport';
    });

    if (transAssignments.length > 0) {
      return transAssignments.map((v: any, idx: number) => {
        const vendorObj = typeof v.vendorId === 'object' ? v.vendorId : { name: 'Assigned Transport' };
        const dayNum = idx + 1;
        const { wd, date } = getDayDateAndWd(departureDateStr, idx);
        const dest = tripDetails?.location || "Manali";
        
        return {
          id: v.id,
          type: "Tempo Traveller",
          cap: "26 Seater",
          plate: v.notes || "GJ01XX1234",
          model: "Force Traveller",
          vendor: vendorObj.name,
          phone: vendorObj.phone || "+91 98765 43210",
          from: "Ahmedabad",
          fromTime: `${date.split(" ")[0]} ${date.split(" ")[1]}, 06:00 AM`,
          to: dest,
          toTime: `${date.split(" ")[0]} ${date.split(" ")[1]}, 06:00 PM`,
          days: `${date.split(" ")[0]} ${date.split(" ")[1]}`,
          daysCount: "2 Days",
          seats: "26 / 26",
          total: v.agreedCost?.toLocaleString('en-IN') || "0",
          paid: v.paidAmount?.toLocaleString('en-IN') || "0",
          due: ((v.agreedCost || 0) - (v.paidAmount || 0)).toLocaleString('en-IN'),
          status: v.paymentStatus?.toUpperCase() || 'CONFIRMED',
          rawAssignment: v
        };
      });
    }

    return [];
  }, [tripVendors, tripDetails, departureDateStr]);

  const computedGuides = useMemo(() => {
    const guideAssignments = tripVendors.filter((v: any) => {
      const vendorObj = v.vendor || {};
      const type = vendorObj.type || v.vendorType || '';
      return type.toLowerCase() === 'guide' || type.toLowerCase() === 'leader';
    });

    if (guideAssignments.length > 0) {
      return guideAssignments.map((v: any, idx: number) => {
        const vendorObj = v.vendor || { name: 'Assigned Guide' };
        const dayNum = idx + 1;
        const { wd, date } = getDayDateAndWd(departureDateStr, idx);
        
        return {
          name: vendorObj.name,
          lead: idx === 0,
          role: vendorObj.type === 'leader' ? 'Trip Captain' : 'Support Guide',
          assign: 'Full Trip',
          date: `${date.split(" ")[0]} ${date.split(" ")[1]}, ${wd.charAt(0).toUpperCase()}${wd.slice(1).toLowerCase()}`,
          phone: vendorObj.phone || '—',
          exp: vendorObj.notes || 'Guide',
          trips: 'Active Assignment',
          status: v.paymentStatus?.toUpperCase() || 'CONFIRMED',
          sub: `Assigned on ${new Date(v.createdAt).toLocaleDateString('en-IN')}`,
          docs: { id: true, dl: true, police: true, medical: true }
        };
      });
    }
    return [];
  }, [tripVendors, departureDateStr]);

  const handlePrintVendorReceipt = (row: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const vendorName = row.vendor || row.hotel || "Assigned Vendor";
    const serviceType = row.type || "Vendor Service";
    const totalCost = row.total || row.amt || "0";
    const paidAmount = row.paid || row.amtSub?.replace("Paid: ₹", "") || row.amtSub || "0";
    const balanceDue = row.due || ((parseFloat(totalCost.replace(/,/g, '')) || 0) - (parseFloat(paidAmount.replace(/,/g, '')) || 0)).toLocaleString('en-IN');
    const status = row.status || "PENDING";
    const phone = row.phone || row.sub || "";
    
    const receiptHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Vendor Settlement Record - ${vendorName}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.6;
            }
            .receipt-header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .receipt-title {
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              color: #1e293b;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 15px;
              border-radius: 6px;
            }
            .card-title {
              font-size: 10px;
              font-weight: 900;
              color: #94a3b8;
              text-transform: uppercase;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background: #f1f5f9;
              text-align: left;
              padding: 10px;
              font-size: 11px;
              color: #64748b;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
            }
            .totals-box {
              width: 300px;
              margin-left: auto;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              overflow: hidden;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 12px;
              font-size: 12px;
            }
            .totals-row.grand {
              background: #1e293b;
              color: #fff;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <div>
              <span style="font-size:20px; font-weight:900; color:#1e293b;">YOUTHCAMPING OS</span>
              <p style="font-size:10px; color:#64748b; margin-top:2px;">INTERNAL VENDOR SETTLEMENT RECORD</p>
            </div>
            <div style="text-align: right">
              <div class="receipt-title">Payment Settlement Receipt</div>
              <p style="font-size: 11px; color: #64748b;">Date: ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-card">
              <div class="card-title">Vendor details</div>
              <p style="font-size:14px; font-weight:bold;">${vendorName}</p>
              ${phone ? `<p style="font-size:12px; color:#64748b;">Contact: ${phone}</p>` : ''}
            </div>
            <div class="info-card">
              <div class="card-title">Trip context</div>
              <p style="font-size:13px; font-weight:bold;">Departure: ${tripId}</p>
              <p style="font-size:12px; color:#64748b;">Departure Date: ${departureDateStr}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Service Description</th>
                <th style="text-align: right">Agreed Cost</th>
                <th style="text-align: right">Paid Amount</th>
                <th style="text-align: right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${serviceType} Allocation</td>
                <td style="text-align: right">&#8377;${totalCost}</td>
                <td style="text-align: right; color:#059669">&#8377;${paidAmount}</td>
                <td style="text-align: right; color:#e11d48">&#8377;${balanceDue}</td>
              </tr>
            </tbody>
          </table>
          <div class="totals-box">
            <div class="totals-row"><span>Agreed Settlement</span><span>&#8377;${totalCost}</span></div>
            <div class="totals-row" style="color:#059669"><span>Total Cleared</span><span>&minus;&#8377;${paidAmount}</span></div>
            <div class="totals-row grand"><span>Balance Due</span><span>&#8377;${balanceDue}</span></div>
          </div>
          <div class="footer">
            <p>Authorized and issued by YouthCamping OS Accounts Desk.</p>
            <p>This is a system-generated settlement receipt and does not require a physical signature.</p>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 800); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const computedPayments = useMemo(() => {
    const confirmedBookings = bookings.filter((b: any) => b.status !== "cancelled");
    return confirmedBookings.map((b: any) => {
      let status = "UNPAID";
      if (b.paymentStatus === "Paid" || b.paymentStatus === "paid" || b.paymentStatus === "Paid in Full" || b.remainingAmount === 0) {
        status = "PAID";
      } else if (b.advancePaid > 0) {
        status = "PARTIALLY PAID";
      }
      
      return {
        id: b.bookingId || `BK-${b.id.substring(0, 6).toUpperCase()}`,
        passenger: b.name || b.fullName || "Passenger",
        pax: b.numberOfTravelers || 1,
        phone: b.mobile || b.phone || "—",
        plan: b.tripName || "Standard Plan",
        amount: b.totalAmount || b.amount || 0,
        paid: b.advancePaid || 0,
        pending: b.remainingAmount || 0,
        mode: b.paymentMode || b.payment_method || "UPI",
        modeDetail: b.upi_reference ? `UPI Ref: ${b.upi_reference}` : "—",
        status: status,
        lastPayment: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "—",
        bookingStatus: b.status?.toUpperCase() || "CONFIRMED"
      };
    });
  }, [bookings]);

  const computedDocuments = useMemo(() => {
    const list: any[] = [];
    
    // 1. Dynamic Hotel Vouchers
    const hotels = tripVendors.filter((v: any) => v.vendorType === 'hotel');
    hotels.forEach((h: any, idx: number) => {
      const name = h.vendorId?.name || "Hotel";
      list.push({
        id: `doc-h-${idx}`,
        name: `hotel_voucher_${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        sub: name,
        category: "Hotels",
        subcat: "Voucher",
        type: "PDF",
        size: "245 KB",
        uploadedBy: "Ops Desk",
        date: h.createdAt?.substring(0, 10) || "Recent",
        status: h.paymentStatus === "paid" ? "VERIFIED" : "PENDING"
      });
    });

    // 2. Dynamic Transport Permits/RC
    const transports = tripVendors.filter((v: any) => v.vendorType === 'transport');
    transports.forEach((t: any, idx: number) => {
      const name = t.vendorId?.name || "Tempo Traveller";
      list.push({
        id: `doc-t-rc-${idx}`,
        name: `rc_book_${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        sub: `${name}`,
        category: "Transport",
        subcat: "RC Book",
        type: "PDF",
        size: "380 KB",
        uploadedBy: "Ops Desk",
        date: "Recent",
        status: "VERIFIED"
      });
    });

     // 3. Dynamic Customer ID Proofs from Bookings
    bookings.forEach((b: any) => {
      let passengersObj = b.passengers;
      if (typeof passengersObj === 'string') {
        try {
          passengersObj = JSON.parse(passengersObj);
        } catch (e) {
          passengersObj = {};
        }
      }

      if (passengersObj?.details?.idProof || b.idProof) {
        const name = b.fullName || b.name || "Passenger";
        list.push({
          id: `doc-b-${b.id}`,
          name: `id_proof_${name.toLowerCase().replace(/\s+/g, '_')}.jpg`,
          sub: `Booking: ${b.bookingId || b.id}`,
          category: "Customer Documents",
          subcat: "Aadhar / ID Card",
          type: "Image",
          size: "1.2 MB",
          uploadedBy: name,
          date: b.createdAt?.substring(0, 10) || "Recent",
          status: "VERIFIED"
        });
      }
      
      if (Array.isArray(passengersObj?.persons)) {
        passengersObj.persons.forEach((p: any, idx: number) => {
          if (p.idProof) {
            list.push({
              id: `doc-p-${b.id}-${idx}`,
              name: `id_proof_${p.name.toLowerCase().replace(/\s+/g, '_')}.jpg`,
              sub: `Booking: ${b.bookingId || b.id} (Co-traveler)`,
              category: "Customer Documents",
              subcat: "Aadhar / ID Card",
              type: "Image",
              size: "1.1 MB",
              uploadedBy: p.name,
              uploadedOn: "Recent",
              status: "VERIFIED"
            });
          }
        });
      }
    });
    
    return list;
  }, [bookings, tripVendors, departureDateStr]);

  const computedTasks = useMemo(() => {
    if (checklistTasks.length === 0) {
      return MOCK_TASKS;
    }
    return checklistTasks.map((t: any) => {
      let category = "OPERATIONS";
      if (t.stage.includes("30D")) category = "PRE-TRIP (30D)";
      else if (t.stage.includes("7D")) category = "PRE-TRIP (7D)";
      else if (t.stage.includes("1D")) category = "PRE-TRIP (1D)";
      else if (t.stage.includes("DEPARTURE")) category = "DEPARTURE DAY";
      else if (t.stage.includes("DURING")) category = "DURING TRIP";
      else if (t.stage.includes("POST")) category = "POST-TRIP";

      const priority = t.stage.includes("30D") ? "HIGH" : t.stage.includes("7D") ? "MEDIUM" : "LOW";
      const status = t.isCompleted ? "COMPLETED" : "PENDING";
      
      return {
        id: t.id,
        task: t.taskName,
        sub: t.notes || "Checklist item assignment",
        category,
        assignee: t.completedBy?.name || "Ops Desk",
        role: "System Action",
        priority,
        dueDate: t.completedAt ? new Date(t.completedAt).toLocaleDateString('en-IN') : "TBD",
        dueNote: t.isCompleted ? "Completed" : "Action Required",
        status,
        rawTask: t
      };
    });
  }, [checklistTasks]);

  const computedConversations = useMemo(() => {
    return [
      { id:"g1",  name:`${tripId} – General Group`, sub:`${leadGuideName || 'Guide'}: Meeting point details...`, time:"10:30 AM", unread:1,  type:"group",  icon:"🏕️" },
      { id:"g2",  name:"Pre-Departure Info",        sub:"Operations: Please carry original ID proofs.",   time:"Yesterday",unread:3,  type:"group",  icon:"📋" },
      { id:"g3",  name:`${leadGuideName || 'Guide'} (Lead Guide)`,sub:"You: Please share the expected weather...", time:"Yesterday",unread:0,  type:"direct", icon:"👤" },
      { id:"g4",  name:"Suresh Kumar (Accounting)", sub:"Suresh: Payment received from travelers",time:"28 Jun",  unread:0,  type:"direct", icon:"💼" },
      { id:"g5",  name:"Important Updates",         sub:"Ops Desk: Hotel updates for trip", time:"27 Jun",  unread:0,  type:"group",  icon:"📢" },
    ];
  }, [tripId, leadGuideName]);

  const computedMessages = useMemo(() => {
    const travelerNames = bookings.filter((b: any) => b.status !== "cancelled").map((b: any) => b.fullName || b.name);
    const primaryTraveler = travelerNames[0] || "Jeel";
    const secondaryTraveler = travelerNames[1] || "Vatsal";
    const guideName = leadGuideName || "Dikshu Sharma";

    return [
      { id: "m1", convId: "g1", sender: guideName, role: "Lead Guide", avatar: "DS", time: "10:10 AM", text: `Good morning everyone! 👋\nWelcome to the ${tripDetails?.title || 'Spiti Valley Road Trip'} group.\nReach at 6:00 AM sharp at the meeting point.\nOur team will be there with the vehicles.`, reactions: [{ emoji: "👍", count: 8 }], isMine: false },
      { id: "m2", convId: "g1", sender: primaryTraveler, role: "Traveler", avatar: "PT", time: "10:22 AM", text: "Thanks team! Excited for the trip en route.", reactions: [{ emoji: "👍", count: 6 }], isMine: false },
      { id: "m3", convId: "g2", sender: "Ops Desk", role: "Operations", avatar: "OD", time: "10:28 AM", text: "Please carry your original ID proofs.\nAlso ensure your luggage is not more than 15 kg.", reactions: [], isMine: false },
      { id: "m4", convId: "g1", sender: "Suresh Kumar", role: "You", avatar: "SK", time: "10:30 AM", text: "Thanks team! Have a safe journey everyone. See you all tomorrow! 😊", reactions: [{ emoji: "❤️", count: 1 }, { emoji: "👍", count: 2 }], isMine: true },
    ];
  }, [bookings, leadGuideName, tripDetails]);

  useEffect(() => {
    if (bookings.length > 0) {
      setChatMessages(computedMessages);
    }
  }, [bookings, computedMessages]);

  const hotelStats = useMemo(() => {
    const hotels = tripVendors.filter((v: any) => v.vendorType === 'hotel');
    const totalNights = hotels.length || 9;
    const confirmedNights = hotels.filter((h: any) => h.paymentStatus === 'paid' || h.notes?.toLowerCase().includes('confirm')).length;
    const pendingNights = totalNights - confirmedNights;
    const paxCount = bookings.reduce((sum: number, b: any) => sum + (b.numberOfTravelers || 1), 0);
    const totalRooms = totalNights * 12 || 120;
    const roomsBooked = Math.min(paxCount, totalRooms);
    const occupancy = totalRooms > 0 ? ((roomsBooked / totalRooms) * 100).toFixed(1) : "0";

    return {
      totalNights,
      confirmedNights,
      pendingNights,
      totalRooms,
      roomsBooked,
      occupancy
    };
  }, [tripVendors, bookings]);



  useEffect(() => {
    if (allPassengers && allPassengers.length > 0) {
      setPassengerAllocations(prev => {
        const next = { ...prev };
        allPassengers.forEach((p) => {
          if (!next[p.name]) {
            next[p.name] = {
              room: p.roomNo && p.roomNo !== "—" ? p.roomNo : "—",
              vehicle: "—",
              seat: "—"
            };
          }
        });
        return next;
      });
    }
  }, [allPassengers]);

  const computedRoomAllocations = useMemo(() => {
    const list: any[] = [];
    
    // 1. Gather all traveler allocations
    Object.entries(passengerAllocations).forEach(([name, alloc]) => {
      if (alloc.room && alloc.room !== "Unassigned" && alloc.room !== "—") {
        const pObj = allPassengers.find(p => p.name === name);
        const gender = (pObj && pObj.gender === "Female") ? "GIRLS" : "BOYS";
        list.push({
          roomNumber: alloc.room,
          travelerName: name,
          genderGroup: gender,
          roomType: "Double"
        });
      }
    });

    // 2. Add empty placeholder rooms for manually added room values
    manualRooms.forEach((rNum) => {
      const hasMembers = list.some(x => x.roomNumber === rNum);
      if (!hasMembers) {
        list.push({
          roomNumber: rNum,
          travelerName: "",
          genderGroup: "BOYS",
          roomType: "Double",
          isEmptyPlaceholder: true
        });
      }
    });

    return list;
  }, [passengerAllocations, allPassengers, manualRooms]);

  const computedVehicleAllocations = useMemo(() => {
    const list: any[] = [];
    Object.entries(passengerAllocations).forEach(([name, alloc]) => {
      if (alloc.vehicle && alloc.vehicle !== "Unassigned" && alloc.vehicle !== "—") {
        const fleetItem = allocFleet.find(f => f.name === alloc.vehicle || f.id === alloc.vehicle);
        list.push({
          fleetId: fleetItem?.id || "tempo-1",
          vehicleType: alloc.vehicle,
          seatNumber: alloc.seat,
          travelerName: name
        });
      }
    });
    return list;
  }, [passengerAllocations, allocFleet]);

  const allocWarnings = useMemo(() => {
    const warnings: string[] = [];
    allPassengers.forEach(p => {
      const alloc = passengerAllocations[p.name];
      if (!alloc || alloc.room === "—" || alloc.vehicle === "—") {
        warnings.push(`Unallocated traveler: ${p.name}`);
      }
    });
    return warnings;
  }, [allPassengers, passengerAllocations]);

    const [shufflingTraveler, setShufflingTraveler] = useState<any | null>(null);
  const [shuffleRoom, setShuffleRoom] = useState("");
  const [shuffleVehicle, setShuffleVehicle] = useState("");
  const [shuffleSeat, setShuffleSeat] = useState("");
  const [shuffleModalOpen, setShuffleModalOpen] = useState(false);
  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const handleOpenShuffle = (traveler: any) => {
    setShufflingTraveler(traveler);
    const current = passengerAllocations[traveler.name] || { room: "—", vehicle: "—", seat: "—" };
    setShuffleRoom(current.room);
    
    // Resolve matching fleet item ID for correct select dropdown selection state
    const matchedFleet = allocFleet.find(f => f.name === current.vehicle || f.id === current.vehicle);
    setShuffleVehicle(matchedFleet ? matchedFleet.id : "—");
    
    setShuffleSeat(current.seat);
    setShuffleModalOpen(true);
  };

  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [newActivityData, setNewActivityData] = useState({
    day: "Day 1",
    act: "",
    sub: "",
    type: "SIGHTSEEING",
    time: "",
    loc: "",
    status: "CONFIRMED"
  });

  const handleAddActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActivitiesList(prev => [...prev, {
      ...newActivityData,
      wd: newActivityData.day === "Optional" ? "" : "07 Jul, Mon",
      inc: newActivityData.status === "CONFIRMED",
      statusClass: newActivityData.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                   newActivityData.status === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-100" :
                   newActivityData.status === "CANCELLED" ? "bg-red-50 text-red-650 border-red-100" :
                   "bg-blue-50 text-blue-600 border-blue-100"
    }]);
    setActivityModalOpen(false);
    toast.success("Activity added successfully!");
  };

  useEffect(() => {
    if (tripId.toLowerCase().includes("spt")) {
      setActivitiesList(MOCK_SPITI_ACTIVITIES);
    } else {
      setActivitiesList([
        { day: "Day 1", wd: "05 Jul, Sat", act: "Volvo Journey", sub: "Ahmedabad → Chandigarh", type: "TRAVEL", inc: true, time: "09:00 PM", loc: "Ahmedabad", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        { day: "Day 2", wd: "06 Jul, Sun", act: "Manali Local Sightseeing", sub: "Hidimba Temple, Mall Road", type: "SIGHTSEEING", inc: true, time: "10:00 AM - 06:00 PM", loc: "Manali", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        { day: "Day 3", wd: "07 Jul, Mon", act: "Solang Valley Visit", sub: "Ropeway, Snow Point (if Open)", type: "SIGHTSEEING", inc: true, time: "09:30 AM - 05:00 PM", loc: "Solang Valley", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        { day: "Day 4", wd: "08 Jul, Tue", act: "Kasol Visit", sub: "Kasol Market, Cafes", type: "SIGHTSEEING", inc: true, time: "11:00 AM - 07:00 PM", loc: "Kasol", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        { day: "Day 5", wd: "09 Jul, Wed", act: "Kullu → Manikaran Sahib", sub: "Hot Springs & Gurudwara", type: "SIGHTSEEING", inc: true, time: "08:30 AM - 05:30 PM", loc: "Manikaran", status: "CONFIRMED", statusClass: "bg-emerald-50 text-[#15803d] border-emerald-100" },
        { day: "Day 6", wd: "10 Jul, Thu", act: "Kasol to Amritsar Transfer", sub: "Enroute sightseeing", type: "TRAVEL", inc: true, time: "08:00 AM - 08:00 PM", loc: "Amritsar", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        { day: "Day 7", wd: "11 Jul, Fri", act: "Golden Temple Visit", sub: "Darshan & Palki Sahib", type: "SIGHTSEEING", inc: true, time: "05:00 AM - 09:00 AM", loc: "Amritsar", status: "CONFIRMED", statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        { day: "Day 8", wd: "12 Jul, Sat", act: "Wagah Border Ceremony", sub: "Beating Retreat Ceremony", type: "SIGHTSEEING", inc: true, time: "04:30 PM - 06:00 PM", loc: "Wagah Border", status: "PENDING", statusClass: "bg-amber-50 text-amber-600 border-amber-100" },
        { day: "Day 9", wd: "13 Jul, Sun", act: "Train Journey", sub: "Amritsar → Ahmedabad", type: "TRAVEL", inc: false, time: "07:00 PM", loc: "Amritsar", status: "CANCELLED", statusClass: "bg-red-50 text-[#b91c1c] border-red-100" },
        { day: "Optional", wd: "", act: "River Rafting", sub: "Beas River (Extra Cost)", type: "ADVENTURE", inc: false, time: "—", loc: "Kullu", status: "OPTIONAL", statusClass: "bg-blue-50 text-blue-600 border-blue-100" }
      ]);
    }
  }, [tripId]);

  const computedActivities = useMemo(() => {
    return activitiesList;
  }, [activitiesList]);

const [sharingPref, setSharingPref] = useState<string>("3");
  const [sameGenderEnforced, setSameGenderEnforced] = useState(true);
  const [prioritizeCouples, setPrioritizeCouples] = useState(true);
  const [fallbackToQuad, setFallbackToQuad] = useState(true);

  const handleTriggerAutoAllocate = () => {
    const newAllocs: Record<string, any> = {};
    let roomNum = 1;
    const activeTravelers = allPassengers.filter(p => p.notes !== "Cancelled");
    const allocated = new Set<string>();

    // Step 1: Identify couples/groups — travelers sharing the same bookingId
    const bookingGroups: Record<string, any[]> = {};
    activeTravelers.forEach(p => {
      const bId = String(p.bookingId).replace(/-co-\d+$/, "");
      if (!bookingGroups[bId]) bookingGroups[bId] = [];
      bookingGroups[bId].push(p);
    });

    // Couples = travelers in the same booking group who have roomType "Couple" and match each other
    if (prioritizeCouples) {
      Object.values(bookingGroups).forEach(group => {
        const matched = new Set<string>();
        group.forEach(p => {
          if (allocated.has(p.name) || matched.has(p.name)) return;
          
          // Check if traveler is couple or has coupleWith configured
          const couplePartnerName = p.coupleWith || "";
          if (couplePartnerName) {
            const partner = group.find(other => 
              other.name === couplePartnerName && 
              !allocated.has(other.name) && 
              !matched.has(other.name)
            );
            if (partner) {
              newAllocs[p.name] = {
                room: `Room ${roomNum}`
              };
              newAllocs[partner.name] = {
                room: `Room ${roomNum}`
              };
              allocated.add(p.name);
              allocated.add(partner.name);
              matched.add(p.name);
              matched.add(partner.name);
              roomNum++;
            }
          }
        });
      });
    }

    // Helper to allocate a list of same-gender travelers into rooms of 3 and 4
    const allocateSameGender = (travelersList: any[]) => {
      const N = travelersList.length;
      if (N === 0) return;

      let index = 0;
      
      // If N % 3 === 1, we need one room of 4, and the rest rooms of 3
      if (N % 3 === 1) {
        // Allocate first 4 into a room
        const chunk = travelersList.slice(index, index + 4);
        chunk.forEach(p => {
          newAllocs[p.name] = {
            room: `Room ${roomNum}`
          };
          allocated.add(p.name);
        });
        roomNum++;
        index += 4;
      } 
      // If N % 3 === 2, we need one room of 2, and the rest rooms of 3
      else if (N % 3 === 2) {
        // Allocate first 2 into a room
        const chunk = travelersList.slice(index, index + 2);
        chunk.forEach(p => {
          newAllocs[p.name] = {
            room: `Room ${roomNum}`
          };
          allocated.add(p.name);
        });
        roomNum++;
        index += 2;
      }

      // Allocate the remaining travelers in chunks of 3
      while (index < N) {
        const chunk = travelersList.slice(index, index + 3);
        chunk.forEach(p => {
          newAllocs[p.name] = {
            room: `Room ${roomNum}`
          };
          allocated.add(p.name);
        });
        roomNum++;
        index += 3;
      }
    };

    // Step 2: Allocate remaining boys sorted by age
    const remainingMales = activeTravelers
      .filter(p => (p.gender || "").toLowerCase() === "male" && !allocated.has(p.name))
      .sort((a, b) => (a.age || 0) - (b.age || 0));
    allocateSameGender(remainingMales);

    // Step 3: Allocate remaining girls sorted by age
    const remainingFemales = activeTravelers
      .filter(p => (p.gender || "").toLowerCase() === "female" && !allocated.has(p.name))
      .sort((a, b) => (a.age || 0) - (b.age || 0));
    allocateSameGender(remainingFemales);

    // Step 4: Anyone still unallocated (no gender set, etc.)
    activeTravelers.filter(p => !allocated.has(p.name)).forEach(p => {
      newAllocs[p.name] = {
        room: `Room ${roomNum}`
      };
    });

    // ── VEHICLE & TEMPO AUTO-ALLOCATION PASS ──
    // Initialize available fleet status
    const fleetStatus = allocFleet.length > 0
      ? allocFleet.map(f => ({ ...f, remainingSeats: f.capacity }))
      : [{ id: "tempo-1", name: "Tempo 1", capacity: 17, remainingSeats: 17 }];

    // Sort booking groups: groups containing female participants first to ensure they travel together
    const sortedGroups = Object.entries(bookingGroups).sort(([, aList], [, bList]) => {
      const aHasFemale = aList.some(p => p.gender === "Female") ? 1 : 0;
      const bHasFemale = bList.some(p => p.gender === "Female") ? 1 : 0;
      return bHasFemale - aHasFemale; // Descending: female-containing groups first
    });

    sortedGroups.forEach(([bId, groupMembers]) => {
      const gSize = groupMembers.length;
      // Try to find a vehicle that can fit the entire group
      let vehicle = fleetStatus.find(f => f.remainingSeats >= gSize);
      if (!vehicle) {
        // Fallback: assign to the vehicle with the most remaining space
        vehicle = fleetStatus.reduce((max, f) => f.remainingSeats > max.remainingSeats ? f : max, fleetStatus[0]);
      }

      if (vehicle) {
        groupMembers.forEach(p => {
          const seatIndex = vehicle.capacity - vehicle.remainingSeats + 1;
          newAllocs[p.name] = {
            ...newAllocs[p.name],
            vehicle: vehicle.name,
            seat: String(seatIndex)
          };
          vehicle.remainingSeats -= 1;
        });
      }
    });

    setPassengerAllocations(newAllocs);
    toast.success(`Auto-allocated: couples in 2-sharing, same-gender 3/4 sharing rooms, and grouped vehicle seats.`);
  };




  const computedParticipants = useMemo(() => {
    return allPassengers.map((p: any) => ({
      name: p.name || "Guest",
      role: p.notes === "Co-traveler" ? "Co-traveler" : "Lead Traveler",
      badge: p.paymentStatus === "Paid in Full" ? "PAID" : p.paymentStatus === "Partial Payment" ? "PARTIALLY PAID" : "PENDING"
    }));
  }, [allPassengers]);

  const passengerStats = useMemo(() => {
    const total = allPassengers.length;
    const paidInFull = allPassengers.filter(p => p.paymentStatus === "Paid in Full").length;
    const partial = allPassengers.filter(p => p.paymentStatus === "Partial Payment").length;
    const pending = allPassengers.filter(p => p.paymentStatus === "Payment Pending").length;
    const outstandingPartial = allPassengers.filter(p => p.paymentStatus === "Partial Payment").reduce((s,p) => s+p.balance, 0);
    const outstandingPending = allPassengers.filter(p => p.paymentStatus === "Payment Pending").reduce((s,p) => s+p.balance, 0);
    return { total, paidInFull, paidPercent: total>0 ? ((paidInFull/total)*100).toFixed(1) : "0", partial, outstandingPartial, pending, outstandingPending };
  }, [allPassengers]);

  const pickupOptions = useMemo(() => {
    const s = new Set<string>(); allPassengers.forEach(p => { if (p.pickupPoint) s.add(p.pickupPoint); }); return Array.from(s);
  }, [allPassengers]);

  const filteredPassengers = useMemo(() =>
    allPassengers.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(paxSearch.toLowerCase()) || p.phone.includes(paxSearch);
      const matchPayment = paymentFilter === "All" || p.paymentStatus === paymentFilter;
      const matchPickup = pickupFilter === "All" || p.pickupPoint === pickupFilter;
      const matchGender = genderFilter === "All" || p.gender.toLowerCase() === genderFilter.toLowerCase();
      return matchSearch && matchPayment && matchPickup && matchGender;
    }), [allPassengers, paxSearch, paymentFilter, pickupFilter, genderFilter]);

  const paginatedPassengers = useMemo(() => filteredPassengers.slice((page-1)*10, page*10), [filteredPassengers, page]);

  const bookingGroups = useMemo(() => {
    return bookings.map((b: any) => {
      let passengersObj = b.passengers;
      if (typeof passengersObj === 'string') {
        try {
          passengersObj = JSON.parse(passengersObj);
        } catch (e) {
          passengersObj = {};
        }
      }

      const due = (b.totalAmount || 0) - (b.advancePaid || 0);
      const paymentLabel = due <= 0 ? "Paid in Full" : b.advancePaid > 0 ? "Partial Payment" : "Payment Pending";
      const paymentStatusShort = due <= 0 ? "PAID" : b.advancePaid > 0 ? "PARTIALLY PAID" : "UNPAID";

      const personsRoomDetails = b.roomDetails?.personsRoomDetails || passengersObj?.details?.personsRoomDetails || {};

      const normalizeCompareName = (nameStr: string) => {
        if (!nameStr) return "";
        let clean = nameStr.toLowerCase().trim();
        if (clean.startsWith("mr. ")) clean = clean.substring(4).trim();
        else if (clean.startsWith("mrs. ")) clean = clean.substring(5).trim();
        else if (clean.startsWith("ms. ")) clean = clean.substring(4).trim();
        return clean;
      };

      const leadName = b.fullName || b.name;
      const leadRoomInfo = personsRoomDetails[leadName] || {};
      const normLeadName = normalizeCompareName(leadName);
      const paxList = passengersObj?.persons || [];
      const filteredCoPax = paxList.filter((p: any) => normalizeCompareName(p.name) !== normLeadName);
      const passengerCount = filteredCoPax.length + 1;

      const perPersonAmount = (b.totalAmount || 12000) / passengerCount;
      const perPersonPaid = (b.advancePaid || 0) / passengerCount;
      const perPersonBalance = due > 0 ? (due / passengerCount) : 0;

      const leadPassenger = {
        name: leadName,
        age: b.age || 24,
        gender: b.gender || "Male",
        phone: b.phone || b.mobile || "—",
        email: b.email || "—",
        pickupPoint: b.pickupCity || "Ahmedabad",
        isLead: true,
        roomType: leadRoomInfo.roomType || (b.numberOfTravelers === 1 ? "Individual" : "Triple Sharing"),
        coupleWith: leadRoomInfo.coupleWith || "",
        roomNo: leadRoomInfo.roomNo || passengersObj?.details?.roomAllocation || "—",
        paymentStatus: paymentLabel,
        amount: perPersonAmount,
        paidAmount: perPersonPaid,
        balance: perPersonBalance
      };

      const personsList = [leadPassenger];

      if (Array.isArray(passengersObj?.persons)) {
        passengersObj.persons.forEach((p: any, idx: number) => {
          // Prevent duplicating lead if they are listed in persons too
          if (normalizeCompareName(p.name) === normLeadName) return;
          const coRoomInfo = personsRoomDetails[p.name] || {};
          personsList.push({
            name: p.name,
            age: p.age || 24,
            gender: p.gender || "Male",
            phone: p.phone || b.phone || "—",
            email: p.email || "—",
            pickupPoint: p.pickupPoint || b.pickupCity || "Ahmedabad",
            isLead: false,
            roomType: coRoomInfo.roomType || "Triple Sharing",
            coupleWith: coRoomInfo.coupleWith || "",
            roomNo: coRoomInfo.roomNo || b.passengers?.details?.roomAllocation || "—",
            paymentStatus: paymentLabel,
            amount: perPersonAmount,
            paidAmount: perPersonPaid,
            balance: perPersonBalance
          });
        });
      }

      let coupleCount = 0;
      const coupleNames = new Set<string>();
      personsList.forEach(p => {
        if ((p.roomType === "Couple" || p.roomType === "Double") && p.coupleWith) {
          const partner = personsList.find(other => other.name === p.coupleWith);
          if (partner && (partner.roomType === "Couple" || partner.roomType === "Double") && partner.coupleWith === p.name) {
            coupleNames.add([p.name, partner.name].sort().join("-"));
          }
        }
      });
      coupleCount = coupleNames.size;

      const roomsMap: Record<string, typeof personsList> = {};
      personsList.forEach(p => {
        const rNo = p.roomNo || "Unassigned";
        if (!roomsMap[rNo]) roomsMap[rNo] = [];
        roomsMap[rNo].push(p);
      });

      const roomSummaries = Object.entries(roomsMap).map(([rNo, pList]) => {
        const couplesInRoom = pList.filter(p => (p.roomType === "Couple" || p.roomType === "Double") && p.coupleWith);
        let roomDesc = "";
        if (couplesInRoom.length >= 2) {
          const pairNames: string[] = [];
          const matched = new Set<string>();
          couplesInRoom.forEach(p => {
            if (matched.has(p.name)) return;
            const partner = couplesInRoom.find(other => other.name === p.coupleWith);
            if (partner) {
              pairNames.push(`${p.name} + ${partner.name}`);
              matched.add(p.name);
              matched.add(partner.name);
            }
          });
          const nonCouple = pList.filter(p => !matched.has(p.name));
          roomDesc = `${pairNames.join(", ")} (Double Sharing)`;
          if (nonCouple.length > 0) {
            roomDesc += ` + ${nonCouple.map(n => n.name).join(", ")}`;
          }
        } else {
          roomDesc = pList.map(p => p.name).join(", ");
        }
        return `${rNo}: ${roomDesc}`;
      });

      const roomRequirement = roomSummaries.join(" | ") || "No rooms allocated";

      return {
        bookingId: b.id,
        bookingRef: b.bookingId || b.id,
        leadName,
        totalPassengers: personsList.length,
        coupleCount,
        roomRequirement,
        totalAmount: b.totalAmount || 0,
        paidAmount: b.advancePaid || 0,
        balance: due > 0 ? due : 0,
        paymentStatus: paymentLabel,
        paymentStatusShort,
        trainTicketStatus: b.trainTicketStatus || "PENDING",
        pickupPoint: b.pickupCity || "Ahmedabad",
        passengers: personsList,
        rawBooking: b
      };
    });
  }, [bookings]);

  const joiningCities = useMemo(() => {
    const cities = new Set<string>();
    bookingGroups.forEach((bg: any) => {
      if (bg.pickupPoint) cities.add(bg.pickupPoint);
      bg.passengers.forEach((p: any) => {
        if (p.pickupPoint) cities.add(p.pickupPoint);
      });
    });
    return Array.from(cities);
  }, [bookingGroups]);

  const filteredBookingGroups = useMemo(() => {
    return bookingGroups.filter((bg: any) => {
      const matchSearch = paxSearch === "" || 
        bg.bookingRef.toLowerCase().includes(paxSearch.toLowerCase()) ||
        bg.leadName.toLowerCase().includes(paxSearch.toLowerCase()) ||
        bg.passengers.some((p: any) => p.name.toLowerCase().includes(paxSearch.toLowerCase()) || p.phone.includes(paxSearch));

      const matchBookingGroup = bookingGroupFilter === "All" || bg.bookingId === bookingGroupFilter;

      const matchCouple = coupleFilter === "All" ||
        (coupleFilter === "With Couples" && bg.coupleCount > 0) ||
        (coupleFilter === "Without Couples" && bg.coupleCount === 0);

      const hasUnallocated = bg.passengers.some((p: any) => p.roomNo === "—" || p.roomNo.toLowerCase() === "unassigned" || !p.roomNo);
      const matchRoomAlloc = roomAllocFilter === "All" ||
        (roomAllocFilter === "Allocated" && !hasUnallocated) ||
        (roomAllocFilter === "Not Allocated" && hasUnallocated);

      const matchPayment = paymentFilter === "All" || bg.paymentStatus === paymentFilter;

      const matchPickup = pickupFilter === "All" || bg.pickupPoint === pickupFilter || bg.passengers.some((p: any) => p.pickupPoint === pickupFilter);

      const matchTrainTicket = trainTicketFilter === "All" || bg.trainTicketStatus === trainTicketFilter;

      const matchJoiningCity = joiningCityFilter === "All" || bg.pickupPoint === joiningCityFilter || bg.passengers.some((p: any) => p.pickupPoint === joiningCityFilter);

      const matchDocStatus = docStatusFilter === "All" || bg.passengers.some((p: any) => (p.documentStatus || "Verified") === docStatusFilter);

      return matchSearch && matchBookingGroup && matchCouple && matchRoomAlloc && matchPayment && matchPickup && matchTrainTicket && matchJoiningCity && matchDocStatus;
    });
  }, [bookingGroups, paxSearch, bookingGroupFilter, coupleFilter, roomAllocFilter, paymentFilter, pickupFilter, trainTicketFilter, joiningCityFilter, docStatusFilter]);

  const paginatedBookingGroups = useMemo(() => {
    return filteredBookingGroups.slice((page - 1) * 10, page * 10);
  }, [filteredBookingGroups, page]);

  // Payment stats
  const paymentKpis = useMemo(() => {
    const total = computedPayments.reduce((s,p)=>s+p.amount,0);
    const received = computedPayments.reduce((s,p)=>s+p.paid,0);
    const pending = computedPayments.reduce((s,p)=>s+p.pending,0);
    const overdue = computedPayments.filter(p=>p.status==="UNPAID").reduce((s,p)=>s+p.pending,0);
    const refunds = computedPayments.filter(p=>p.status==="REFUNDED").reduce((s,p)=>s+p.paid,0);
    const paidCount = computedPayments.filter(p=>p.status==="PAID").length;
    return { total, received, pending, overdue, refunds, paidCount, totalCount:computedPayments.length };
  }, [computedPayments]);

  const filteredPayments = useMemo(() =>
    computedPayments.filter(p => payStatusFilter === "All" || p.status === payStatusFilter),
    [computedPayments, payStatusFilter]);

  // Task stats
  const taskKpis = useMemo(() => ({
    total: computedTasks.length,
    completed: computedTasks.filter(t=>t.status==="COMPLETED").length,
    inProgress: computedTasks.filter(t=>t.status==="IN PROGRESS").length,
    pending: computedTasks.filter(t=>t.status==="PENDING").length,
    overdue: computedTasks.filter(t=>t.status==="OVERDUE").length,
  }), [computedTasks]);

  const filteredTasks = useMemo(() =>
    computedTasks.filter(t =>
      (taskStatusFilter === "All" || t.status === taskStatusFilter) &&
      (taskCategoryFilter === "All" || t.category === taskCategoryFilter)
    ), [computedTasks, taskStatusFilter, taskCategoryFilter]);

  // Docs
  const filteredDocs = useMemo(() =>
    MOCK_DOCUMENTS.filter(d =>
      (docCategory === "all" || d.category.toLowerCase().includes(docCategory)) &&
      (docSearch === "" || d.name.toLowerCase().includes(docSearch.toLowerCase()))
    ), [docCategory, docSearch]);

  // Activities
  const filteredActivities = useMemo(() =>
    MOCK_ACTIVITIES.filter(a =>
      (actDayFilter === "All Days" || a.day === actDayFilter) &&
      (actTypeFilter === "All Activity Type" || a.type === actTypeFilter) &&
      (actStatusFilter === "All Status" || a.status === actStatusFilter) &&
      (actSearch === "" || a.activity.toLowerCase().includes(actSearch.toLowerCase()))
    ), [actDayFilter, actTypeFilter, actStatusFilter, actSearch]);

  const actKpis = { total:18, confirmed:16, pending:1, cancelled:1, optional:3 };

  const tabs = [
    { id:"overview",       label:"Overview" },
    { id:"passengers",     label:"Passengers" },
    { id:"itinerary",      label:"Itinerary" },
    { id:"hotels",         label:"Hotels",     badge:null, check:true },
    { id:"allocation",     label:"Room & Tempo Allocation" },
    { id:"guides",         label:"Guides" },
    { id:"activities",     label:"Activities" },
    { id:"payments",       label:"Payments",   badge: computedPayments.filter(p => p.pending > 0).length },
    { id:"tasks",          label:"Tasks",      badge: computedTasks.filter(t => t.status !== "COMPLETED").length },
    { id:"documents",      label:"Documents",  badge: computedDocuments.length },
    { id:"communication",  label:"Communication" },
    { id:"reports",        label:"Reports" },
  ];

  // CTA label by tab
  const ctaLabel: Record<string,string> = {
    activities:"+ Add Activity", payments:"+ Add Payment", tasks:"+ Add Task",
    documents:"+ Upload Document", communication:"+ New Message",
    overview:"Edit Departure", passengers:"+ Add Passenger",
    itinerary:"+ Add Day", hotels:"+ Add Hotel", allocation:"+ Add Vehicle",
    guides:"+ Assign Guide", reports:"Download Report",
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F7FB] text-[#162B45] font-sans antialiased">
      {hasDateMismatch && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-[#B45309] shrink-0">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <span>
            Warning: The departure date (14 Jul 2026) occurs before the creation date (15 Jun 2027) of this departure workspace. Please verify the scheduling.
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════ HEADER ═══════════════════════════════════════════ */}
      <div className="bg-white border-b border-[#E2E8F0] shadow-xs">
        {/* Breadcrumb */}
        <div className="px-6 pt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <span className="hover:text-slate-600 cursor-pointer">Departures Hub</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hover:text-slate-600 cursor-pointer">{tripId}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 font-bold capitalize">{activeTab}</span>
        </div>

        {/* Title row */}
        <div className="px-6 pt-2 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-[#FFF0E6] flex items-center justify-center text-[#F97316]">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div>
                <span className="text-[9.5px] font-black text-[#F97316] uppercase tracking-wider block mb-0.5">Departure Operations Workspace</span>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{tripId}</h1>
              </div>
              <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">CONFIRMED</span>
              <span className="text-slate-300">•</span>
              <span className="text-sm text-slate-600 font-semibold">{tripDetails?.title || "Manali Kasol Amritsar"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 relative">
            <button
              onClick={() => { setEditGuideName(leadGuideName); setEditDepartureOpen(true); }}
              className="text-[11px] font-bold border border-slate-200 rounded-[4px] bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 transition-colors"
            >
              Edit Departure
            </button>
            <div className="relative">
              <button
                onClick={() => setMoreActionsOpen(!moreActionsOpen)}
                className="text-[11px] font-bold border border-slate-200 rounded-[4px] bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 flex items-center gap-1 transition-colors"
              >
                More Actions <ChevronDown className="w-3 h-3" />
              </button>
              {moreActionsOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-[4px] shadow-lg py-1 z-50 text-left">
                  <button
                    onClick={() => { handlePrintManifest(); setMoreActionsOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Print Manifest
                  </button>
                  <button
                    onClick={() => { toast.success("Departure locked successfully!"); setMoreActionsOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Lock Departure
                  </button>
                  <button
                    onClick={() => { toast.error("Cancellation requires Senior Approval"); setMoreActionsOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Cancel Departure
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (activeTab === "passengers") {
                  setAddPassengerOpen(true);
                } else if (activeTab === "tasks") {
                  setAddTaskModalOpen(true);
                } else if (activeTab === "documents") {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      toast.success(`Document "${file.name}" uploaded successfully!`);
                    }
                  };
                  input.click();
                } else if (activeTab === "communication") {
                  const input = document.querySelector("input[placeholder='Type your message...']") as HTMLInputElement;
                  if (input) input.focus();
                } else if (activeTab === "activities") {
                  setActivityModalOpen(true);
                } else {
                  toast.success(`${ctaLabel[activeTab] || "Action"} triggered!`);
                }
              }}
              className="text-[11px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-4 py-1.5 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {ctaLabel[activeTab] || "Action"}
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="px-6 py-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-semibold text-slate-500 border-t border-slate-100 mt-2">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {dateAndDurationLabel}</span>
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> {passengerStats.total} / {tripDetails?.maxGroupSize || 30} Participants</span>
          <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> Lead Guide: {leadGuideName}</span>
          <span className="flex items-center gap-1.5"><Bus className="w-3.5 h-3.5 text-slate-400" /> {transportVehiclesLabel}</span>
          <span className="ml-auto text-slate-400 hidden lg:block">Created by Suresh Bhai on 15 Jun 2027</span>
        </div>

        {/* Tab bar */}
        <div className="px-6 flex gap-0 text-[11.5px] font-semibold overflow-x-auto no-scrollbar border-t border-slate-100">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-3 pt-3 px-3 transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5",
                  isActive
                    ? "text-[#F97316] border-[#F97316] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                )}
              >
                {tab.label}
                {tab.check && <Check className="w-3 h-3 text-emerald-500" />}
                {tab.badge && (
                  <span className={cn("text-[8px] font-extrabold px-1.5 rounded-full h-4 min-w-[16px] flex items-center justify-center", isActive ? "bg-[#F97316] text-white" : "bg-red-500 text-white")}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ CONTENT ═══════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* ──────────────────────── OVERVIEW ──────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Top Stat Row matching Screenshot 5 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              {/* Departure Readiness card */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex items-center gap-4 col-span-1">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#E2E8F0" strokeWidth="6" fill="transparent" />
                    <circle cx="32" cy="32" r="28" stroke="#12B76A" strokeWidth="6" fill="transparent"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - 0.91)} />
                  </svg>
                  <span className="absolute text-sm font-black text-slate-800">91%</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-700">Departure Readiness</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Great! You're almost ready to depart.</p>
                  <button onClick={() => toast.info("Checklist")} className="text-[10px] font-bold text-blue-600 hover:underline mt-1.5 flex items-center gap-0.5">View Readiness Checklist</button>
                </div>
              </div>

              {/* Total Revenue card */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">₹ {stats.totalRevenue.toLocaleString('en-IN')}</h3>
                    <p className="text-[9px] text-slate-400 mt-1">From {stats.totalParticipants} participants</p>
                  </div>
                  <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center text-blue-600 text-sm">₹</div>
                </div>
                <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">View details</button>
              </div>

              {/* Outstanding Balance card */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
                    <h3 className="text-lg font-black text-[#EA580C] mt-1 font-mono">₹ {stats.customerOutstanding.toLocaleString('en-IN')}</h3>
                    <p className="text-[9px] text-slate-400 mt-1">From {stats.outstandingParticipantsCount} participants</p>
                  </div>
                  <div className="w-7 h-7 rounded bg-amber-50 flex items-center justify-center text-[#EA580C] text-sm">₹</div>
                </div>
                <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">View details</button>
              </div>

              {/* Vendor Payables card */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Vendor Payables</span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">₹ {stats.totalVendorPayables.toLocaleString('en-IN')}</h3>
                    <p className="text-[9px] text-slate-400 mt-1">Total pending</p>
                  </div>
                  <div className="w-7 h-7 rounded bg-slate-50 flex items-center justify-center text-slate-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">View details</button>
              </div>

              {/* Profit Est card */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Profit (Est.)</span>
                    <h3 className="text-lg font-black text-emerald-600 mt-1">₹ {stats.estProfit.toLocaleString('en-IN')}</h3>
                    <p className="text-[9px] text-slate-400 mt-1">{stats.profitPercent}% of revenue</p>
                  </div>
                  <div className="w-7 h-7 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">View details</button>
              </div>
            </div>

            {/* Dashboard grid mapping Screenshot 5 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Column 1: Departure Timeline */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Departure Timeline</h3>
                  </div>
                  <div className="relative pl-5 border-l-2 border-slate-100 ml-1.5 space-y-4 py-1">
                    {timelineSteps.map((step, idx) => (
                      <div key={idx} className="relative">
                        {/* Bullet points */}
                        <div className={cn("absolute -left-[27px] top-0.5 w-3 h-3 rounded-full border-2 bg-white",
                          step.active ? "border-emerald-500 bg-emerald-500" :
                          step.current ? "border-blue-600 bg-blue-50" : "border-slate-200"
                        )} />
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className={cn("text-[11px] font-bold", step.pending ? "text-slate-400" : "text-slate-700")}>{step.title}</p>
                            <p className="text-[9.5px] text-slate-400 mt-0.5">{step.date}</p>
                          </div>
                          {step.user && <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-[4px]">{step.user}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => toast.info("Full timeline")} className="text-[10px] font-black text-blue-600 hover:underline mt-4 text-left">View full timeline</button>
              </div>

              {/* Column 2: Itinerary Summary */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Itinerary Summary</h3>
                    <button onClick={() => setActiveTab("itinerary")} className="text-[10px] font-bold text-blue-600 hover:underline">View full itinerary</button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {[
                      { day: "Day 1", date: "05 Jul", desc: "Ahmedabad → Chandigarh (Overnight Journey)", status: "ON TIME" },
                      { day: "Day 2", date: "06 Jul", desc: "Chandigarh → Manali", status: "ON TIME" },
                      { day: "Day 3", date: "07 Jul", desc: "Manali Local Sightseeing", status: "ON TIME" },
                      { day: "Day 4", date: "08 Jul", desc: "Manali → Kasol", status: "ON TIME" },
                      { day: "Day 5", date: "09 Jul", desc: "Kasol → Kullu → Manikaran", status: "ON TIME" },
                      { day: "Day 6", date: "10 Jul", desc: "Kasol → Amritsar", status: "ON TIME" },
                      { day: "Day 7", date: "11 Jul", desc: "Amritsar Sightseeing", status: "ON TIME" },
                      { day: "Day 8", date: "12 Jul", desc: "Amritsar → Delhi (Overnight Journey)", status: "ON TIME" },
                      { day: "Day 9", date: "13 Jul", desc: "Delhi → Ahmedabad", status: "ON TIME" },
                    ].map((row, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-700">
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 px-1.5 py-0.5 rounded-[4px]">{row.day}</span>
                          <span className="text-[10px] font-bold text-slate-400">{row.date}</span>
                        </div>
                        <p className="truncate flex-1 font-medium text-slate-600 text-left">{row.desc}</p>
                        <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 py-0.5 rounded-[3px] shrink-0 uppercase tracking-wider">{row.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => toast.info("Itinerary plans")} className="text-[10px] font-black text-blue-600 hover:underline mt-4 text-left">View full itinerary & day plans</button>
              </div>

              {/* Column 3: Quick Actions + Team Contacts */}
              <div className="space-y-4">
                {/* Quick Actions Grid */}
                <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                  <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Add Expense", icon: <Sliders className="w-4 h-4 text-slate-500" />, action: () => toast.success("Add expense") },
                      { label: "Add Payment", icon: <CreditCard className="w-4 h-4 text-[#F97316]" />, action: () => toast.success("Add payment") },
                      { label: "Add Task", icon: <CheckSquare className="w-4 h-4 text-blue-600" />, action: () => toast.success("Add task") },
                      { label: "Upload Document", icon: <Folder className="w-4 h-4 text-purple-600" />, action: () => toast.success("Upload document") },
                      { label: "Send Message", icon: <MessageSquare className="w-4 h-4 text-emerald-600" />, action: () => toast.success("Send message") },
                      { label: "Download Report", icon: <Download className="w-4 h-4 text-slate-500" />, action: () => toast.success("Download report") },
                    ].map((act, idx) => (
                      <button key={idx} onClick={act.action} className="flex flex-col items-center justify-center p-2.5 border border-slate-100 hover:bg-slate-50 rounded-[6px] transition-colors gap-2 text-center h-[72px] bg-white">
                        {act.icon}
                        <span className="text-[9.5px] font-bold text-slate-600 leading-tight">{act.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team & Contacts */}
                <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Team & Contacts</h3>
                    <button onClick={() => toast.info("View contacts")} className="text-[10px] font-bold text-blue-600 hover:underline">View all contacts</button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Dikshu Sharma", role: "Guide", phone: "+91 98765 43210" },
                      { name: "Suresh Kumar", role: "Trip Captain", phone: "+91 98765 56789" },
                      { name: "Driver 1 - Ramesh", role: "Tempo 1", phone: "+91 98765 11111" },
                      { name: "Driver 2 - Pawan", role: "Tempo 2", phone: "+91 98765 22222" },
                    ].map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <Avatar initials={c.name.split(" ").map(n=>n[0]).join("")} className="bg-slate-700 w-6 h-6 text-[8px]" />
                          <div>
                            <p className="font-bold text-slate-800">{c.name}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">{c.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[10px]">{c.phone}</span>
                          <PhoneCall className="w-3.5 h-3.5 text-blue-500 hover:opacity-85 cursor-pointer shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row Grid matching Screenshot 5 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Box 1: Top Pending Tasks */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Top Pending Tasks</h3>
                    <button onClick={() => setActiveTab("tasks")} className="text-[10px] font-bold text-blue-600 hover:underline">View all tasks</button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: "Collect balance from 18 participants", priority: "High", date: "02 Jul 2027" },
                      { title: "Guide briefing & kit handover", priority: "Medium", date: "04 Jul 2027" },
                      { title: "WhatsApp group final message", priority: "Medium", date: "04 Jul 2027" },
                      { title: "Emergency contacts sharing", priority: "Low", date: "04 Jul 2027" },
                    ].map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 text-[11px] font-semibold">
                        <div className="flex items-center gap-2 min-w-0">
                          <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <p className="truncate font-medium text-slate-700 min-w-0 text-left">{task.title}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-[3px] border uppercase",
                            task.priority === "High" ? "bg-red-50 text-red-600 border-red-100" :
                            task.priority === "Medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-slate-50 text-slate-500 border-slate-150"
                          )}>{task.priority}</span>
                          <span className="text-[9.5px] text-slate-400 font-bold">{task.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 2: Payments Overview */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Payments Overview</h3>
                    <button onClick={() => setActiveTab("payments")} className="text-[10px] font-bold text-blue-600 hover:underline">View all payments</button>
                  </div>
                  <div className="space-y-3.5">
                    {[
                      { label: "Customer Payments Received", value: `₹ ${stats.customerPaid.toLocaleString('en-IN')}`, percent: `${stats.customerPaidPercent}%`, color: "text-emerald-600" },
                      { label: "Customer Outstanding", value: `₹ ${stats.customerOutstanding.toLocaleString('en-IN')}`, percent: `${stats.customerOutstandingPercent}%`, color: "text-[#EA580C]" },
                      { label: "Vendor Payments Made", value: `₹ ${stats.totalVendorPaid.toLocaleString('en-IN')}`, percent: `${stats.vendorPaidPercent}%`, color: "text-slate-700" },
                      { label: "Vendor Payables", value: `₹ ${stats.totalVendorPayables.toLocaleString('en-IN')}`, percent: `${stats.vendorPayablePercent}%`, color: "text-slate-700" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-3 text-[11px] font-bold text-slate-800">
                        <span className="font-semibold text-slate-500 text-left">{item.label}</span>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono">{item.value}</span>
                          <span className={cn("text-[10px] font-black shrink-0", item.color)}>{item.percent}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 3: Important Notes */}
              <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">Important Notes</h3>
                    <button onClick={() => toast.success("Add Note")} className="text-[10px] font-bold text-blue-600 hover:underline">+ Add Note</button>
                  </div>
                  <div className="space-y-3 text-[11px]">
                    {[
                      { text: "Some participants are arriving late in Manali. Monitor arrival timings.", user: "Neeki", date: "29 Jun 2027", bg: "bg-amber-50/50 border-amber-100" },
                      { text: "Hotel Mountain View – 6 rooms upgraded to super deluxe category.", user: "Suresh Bhai", date: "28 Jun 2027", bg: "bg-blue-50/30 border-blue-100" },
                    ].map((note, idx) => (
                      <div key={idx} className={cn("p-2.5 rounded-[4px] border", note.bg)}>
                        <p className="font-medium text-slate-700 text-left leading-relaxed">{note.text}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1.5 text-left">Added by {note.user} on {note.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => toast.info("View notes")} className="text-[10px] font-black text-blue-600 hover:underline mt-4 text-left">View all notes</button>
              </div>

            </div>
          </div>
        )}

        {/* ──────────────────────── PASSENGERS ──────────────────────── */}
        {activeTab === "passengers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-800">Passengers</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">{filteredPassengers.length} Passengers • {filteredBookingGroups.length} Bookings</p>
              </div>
              <div className="flex gap-2">
                <button className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                </button>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label:"Total Passengers",  value:passengerStats.total,        sub:"Total confirmed",          color:"text-slate-800" },
                { label:"Paid in Full",       value:passengerStats.paidInFull,   sub:`${passengerStats.paidPercent}% of total`, color:"text-emerald-600" },
                { label:"Partial Payment",    value:passengerStats.partial,      sub:`₹${passengerStats.outstandingPartial.toLocaleString("en-IN")} due`, color:"text-amber-600" },
                { label:"Payment Pending",    value:passengerStats.pending,      sub:`₹${passengerStats.outstandingPending.toLocaleString("en-IN")} due`, color:"text-red-600" },
                { label:"Cancelled",          value:0,                           sub:"0% of total",             color:"text-slate-400" },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>
                  <p className={cn("text-2xl font-black", kpi.color)}>{kpi.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Reconciliation Checklist Stats */}
            <div className="bg-slate-50 border border-[#E2E8F0] rounded-[4px] p-3 flex flex-wrap items-center gap-6 text-xs text-slate-600 shadow-sm">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[9.5px]">Reconciliation Checklist:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800">{passengerStats.total}</span> <span className="text-slate-400 font-medium">Confirmed</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800">{passengerStats.ticketed || 0}</span> <span className="text-slate-400 font-medium">Ticketed</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#F97316]">{passengerStats.ticketVerified || 0}</span> <span className="text-slate-400 font-medium">Verified</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800">{passengerStats.roomAllocated || 0}</span> <span className="text-slate-400 font-medium">Room Allocated</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800">{passengerStats.transportAllocated || 0}</span> <span className="text-slate-400 font-medium">Transport Allocated</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-red-650">{passengerStats.missingDocument || 0}</span> <span className="text-slate-400 font-medium">Missing Docs</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm p-3 flex flex-wrap gap-2 items-center">
              <div className="relative flex-grow min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Search by name, phone..." value={paxSearch} onChange={e => { setPaxSearch(e.target.value); setPage(1); }}
                  className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#F97316]/30" />
              </div>

              <select value={bookingGroupFilter} onChange={e => { setBookingGroupFilter(e.target.value); setPage(1); }}
                className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 max-w-[180px]">
                <option value="All">All Booking Groups</option>
                {bookingGroups.map((bg: any) => (
                  <option key={bg.bookingId} value={bg.bookingId}>{bg.bookingRef} ({bg.leadName})</option>
                ))}
              </select>

              <select value={coupleFilter} onChange={e => { setCoupleFilter(e.target.value); setPage(1); }}
                className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">
                <option value="All">All Couples Status</option>
                <option value="With Couples">Has Couple</option>
                <option value="Without Couples">No Couple</option>
              </select>

              <select value={roomAllocFilter} onChange={e => { setRoomAllocFilter(e.target.value); setPage(1); }}
                className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">
                <option value="All">All Room Allocation</option>
                <option value="Allocated">Allocated</option>
                <option value="Not Allocated">Not Allocated</option>
              </select>

              <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}
                className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">
                <option value="All">All Payments</option>
                <option value="Paid in Full">Paid in Full</option>
                <option value="Partial Payment">Partial Payment</option>
                <option value="Payment Pending">Pending</option>
              </select>

              <select value={pickupFilter} onChange={e => { setPickupFilter(e.target.value); setPage(1); }}
                className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">
                <option value="All">All Pickup Points</option>
                {pickupOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <select value={joiningCityFilter} onChange={e => { setJoiningCityFilter(e.target.value); setPage(1); }}
                className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">
                <option value="All">All Joining Cities</option>
                {joiningCities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>

              <select value={docStatusFilter} onChange={e => { setDocStatusFilter(e.target.value); setPage(1); }}
                className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">
                <option value="All">All Doc Status</option>
                <option value="Verified">Verified</option>
                <option value="Missing">Missing</option>
                <option value="Under Review">Under Review</option>
              </select>

              <select value={trainTicketFilter} onChange={e => { setTrainTicketFilter(e.target.value); setPage(1); }}
                className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50">
                <option value="All">All Train Tickets</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PENDING">PENDING</option>
                <option value="RAC">RAC</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3 w-20 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={paginatedBookingGroups.length > 0 && paginatedBookingGroups.every(bg => selectedPaxIds[bg.bookingId])}
                          onChange={e => {
                            const checked = e.target.checked;
                            const nextSelect = { ...selectedPaxIds };
                            paginatedBookingGroups.forEach(bg => {
                              nextSelect[bg.bookingId] = checked;
                            });
                            setSelectedPaxIds(nextSelect);
                          }}
                          className="rounded border-slate-300 text-[#F97316] focus:ring-[#F97316] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SEL</span>
                      </div>
                    </th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">PASSENGER</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">PHONE</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">PICKUP</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-center">TRAIN STATUS</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">PAYMENT</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right">BALANCE</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">ROOM</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">REMARKS</th>
                    <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paginatedBookingGroups.map((bg: any) => {
                    const isGroupExpanded = expandedBookings[bg.bookingId] !== false;
                    return (
                      <React.Fragment key={bg.bookingId}>
                        {/* Expandable Group Header */}
                        <tr className="bg-slate-100/80 font-semibold text-slate-800 border-t border-b border-slate-200">
                          <td className="p-3 text-center flex items-center justify-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!selectedPaxIds[bg.bookingId]}
                              onChange={e => {
                                setSelectedPaxIds(prev => ({
                                  ...prev,
                                  [bg.bookingId]: e.target.checked
                                }));
                              }}
                              className="rounded border-slate-300 text-[#F97316] focus:ring-[#F97316] w-3.5 h-3.5 cursor-pointer mr-1"
                            />
                            <button
                              onClick={() => {
                                setExpandedBookings(prev => ({
                                  ...prev,
                                  [bg.bookingId]: prev[bg.bookingId] === false ? true : false
                                }));
                              }}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            >
                              {isGroupExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td colSpan={9} className="p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5">{bg.bookingRef}</span>
                                <span className="font-extrabold text-slate-800">{bg.leadName}'s Group</span>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-slate-600 bg-slate-200/50 rounded-full px-2 py-0.5">{bg.totalPassengers} Passengers</span>
                                {bg.coupleCount > 0 && (
                                  <span className="font-semibold text-pink-700 bg-pink-50 border border-pink-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                                    ♥ {bg.coupleCount} Couple{bg.coupleCount > 1 ? "s" : ""}
                                  </span>
                                )}
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 italic max-w-md truncate font-medium" title={bg.roomRequirement}>Rooms: {bg.roomRequirement}</span>
                              </div>

                              <div className="flex items-center gap-4">
                                {/* Financials */}
                                <div className="text-right text-[11px] space-y-0.5">
                                  <div>
                                    Total: <span className="font-bold text-slate-700">₹{bg.totalAmount.toLocaleString("en-IN")}</span> |
                                    Paid: <span className="font-bold text-emerald-600">₹{bg.paidAmount.toLocaleString("en-IN")}</span>
                                  </div>
                                  <div>
                                    Balance: <span className={cn("font-bold", bg.balance > 0 ? "text-red-650" : "text-emerald-600")}>₹{bg.balance.toLocaleString("en-IN")}</span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedBookingForRoomAlloc(bg);
                                      const initialModal: any = {};
                                      bg.passengers.forEach((p: any) => {
                                        initialModal[p.name] = {
                                          roomType: p.roomType || "Individual",
                                          coupleWith: p.coupleWith || "",
                                          roomNo: p.roomNo || "—"
                                        };
                                      });
                                      setModalAllocations(initialModal);
                                    }}
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors"
                                  >
                                    Allocate Rooms
                                  </button>
                                  <button
                                    onClick={() => handleOpenBookingDetails(bg.bookingId)}
                                    className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                                  >
                                    Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {isGroupExpanded && bg.passengers.map((p: any) => (
                          <tr key={p.id || p.name} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-3 text-center"><input type="checkbox" className="rounded-[2px] border-slate-300" /></td>
                            <td className="p-3 pl-6">
                              <div className="flex items-center gap-1.5">
                                <div className={cn("font-bold text-slate-800 hover:text-blue-600 hover:underline cursor-pointer", !p.isLead && "text-slate-650 font-medium pl-2 border-l border-slate-300")} onClick={() => handleOpenBookingDetails(bg.bookingId)}>
                                  {(p.roomType === "Couple" || p.roomType === "Double") && p.coupleWith ? (
                                    <span className="flex items-center gap-1">
                                      <span>{p.name}</span>
                                      <span className="text-pink-500 text-xs">♥</span>
                                      <span className="text-slate-600 font-semibold">{p.coupleWith}</span>
                                    </span>
                                  ) : (
                                    p.name
                                  )}
                                </div>
                                {!p.isLead && !p.coupleWith && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                    co-traveler
                                  </span>
                                )}
                              </div>
                              <div className={cn("text-[10px] text-slate-400", !p.isLead && "pl-4")}>{p.gender}, {p.age} yrs</div>
                            </td>
                            <td className="p-3 font-mono text-slate-600">{p.phone}</td>
                            <td className="p-3 font-semibold text-slate-700">{p.pickupPoint}</td>
                            
                            {/* Train Status */}
                            <td className="p-3 text-center">
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", 
                                bg.trainTicketStatus === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                              )}>
                                {bg.trainTicketStatus}
                              </span>
                            </td>

                             <td className="p-3">
                              <StatusBadge status={p.paymentStatus === "Paid in Full" ? "PAID" : p.paymentStatus === "Partial Payment" ? "PARTIALLY PAID" : "UNPAID"} />
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Paid: ₹{p.paidAmount.toLocaleString("en-IN")} / pax
                              </div>
                            </td>
                            <td className={cn("p-3 text-right font-bold", p.balance > 0 ? "text-red-500" : "text-emerald-600")}>
                              <div>₹{p.balance.toLocaleString("en-IN")} <span className="text-[10px] font-normal text-slate-400">/ pax</span></div>
                              <div className="text-[9.5px] text-slate-400 font-normal mt-0.5">
                                Group Due: ₹{bg.balance.toLocaleString("en-IN")}
                              </div>
                            </td>
                            
                            {/* Room Type Badge / Relationship */}
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {getRelationshipBadge(p.roomType)}
                                {p.roomNo && p.roomNo !== "—" && (
                                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                    {p.roomNo}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Remarks */}
                            <td className="p-3 text-slate-600 italic text-[11px] max-w-[150px] truncate" title={p.notes || bg.rawBooking.adminNotes || "—"}>
                              {p.notes || bg.rawBooking.adminNotes || "—"}
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex gap-2 justify-center">
                                <MessageSquare className="w-4 h-4 text-green-500 cursor-pointer hover:opacity-80" />
                                <PhoneCall className="w-3.5 h-3.5 text-blue-500 cursor-pointer hover:opacity-80" />
                                <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer hover:opacity-80" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {paginatedBookingGroups.length === 0 && (
                    <tr><td colSpan={10} className="text-center p-10 text-slate-400 font-semibold">No passengers found.</td></tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-500">
                <span>Showing {(page-1)*10+1} to {Math.min(page*10,filteredBookingGroups.length)} of {filteredBookingGroups.length} booking groups</span>
                <div className="flex items-center gap-1">
                  <button disabled={page===1} onClick={()=>setPage(p=>Math.max(p-1,1))} className="border border-slate-200 rounded-[4px] p-1 bg-white hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  {[...Array(Math.min(5,Math.ceil(filteredBookingGroups.length/10)))].map((_,i)=>(
                    <button key={i+1} onClick={()=>setPage(i+1)} className={cn("w-7 h-7 rounded-[4px] text-[11px] font-bold border", page===i+1?"bg-[#F97316] text-white border-[#F97316]":"bg-white border-slate-200 hover:bg-slate-50 text-slate-700")}>{i+1}</button>
                  ))}
                  <button disabled={page>=Math.ceil(filteredBookingGroups.length/10)} onClick={()=>setPage(p=>Math.min(p+1,Math.ceil(filteredBookingGroups.length/10)))} className="border border-slate-200 rounded-[4px] p-1 bg-white hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── ITINERARY ──────────────────────── */}
        {activeTab === "itinerary" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-800">Itinerary</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Day by day plan for this departure</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Segmented View Switcher */}
                <div className="flex bg-slate-100 p-0.5 rounded-[4px] border border-slate-200 shrink-0 mr-2">
                  <button
                    onClick={() => setItineraryViewMode("internal")}
                    className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-[3px] transition-all",
                      itineraryViewMode === "internal"
                        ? "bg-white text-slate-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Internal View
                  </button>
                  <button
                    onClick={() => setItineraryViewMode("customer")}
                    className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-[3px] transition-all",
                      itineraryViewMode === "customer"
                        ? "bg-white text-slate-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Customer View
                  </button>
                </div>
                <button onClick={() => toast.info("View Timeline")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" /> View as Timeline
                </button>
                <button onClick={() => handleDownloadCSV(computedItinerary, "itinerary_details.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">
                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download Itinerary
                </button>
                <button onClick={() => setVersionHistoryOpen(true)} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">
                  <History className="w-3.5 h-3.5 text-slate-400" /> Version History
                </button>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[
                { v: "9 Days / 8 Nights", l: "Duration & Stays", icon: <Calendar className="w-4 h-4 text-blue-600" />, bg: "bg-blue-50/50" },
                { v: "7 Destinations", l: "Places to be visited", icon: <MapPin className="w-4 h-4 text-emerald-600" />, bg: "bg-emerald-50/50" },
                { v: "~1,320 KM", l: "Total Travel Distance", icon: <Bus className="w-4 h-4 text-cyan-600" />, bg: "bg-cyan-50/50" },
                { v: "6 Activities", l: "Included in itinerary", icon: <Star className="w-4 h-4 text-amber-600" />, bg: "bg-amber-50/50" },
              ].map(kpi => (
                <div key={kpi.l} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", kpi.bg)}>{kpi.icon}</div>
                  <div>
                    <p className="text-xs font-black text-slate-800 leading-tight">{kpi.v}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{kpi.l}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wider">
                    <th className="p-3 text-center border-r border-slate-100 w-16">DAY</th>
                    <th className="p-3 border-r border-slate-100 w-28">DATE</th>
                    <th className="p-3 border-r border-slate-100 w-[24%]">PLAN & DESTINATION</th>
                    <th className="p-3 border-r border-slate-100 w-[18%]">OVERNIGHT STAY</th>
                    {itineraryViewMode === "internal" && (
                      <th className="p-3 border-r border-slate-100 w-[16%]">TRAVEL DETAILS</th>
                    )}
                    <th className="p-3 border-r border-slate-100 w-24">MEALS</th>
                    <th className="p-3 border-r border-slate-100 w-[18%]">ACTIVITIES</th>
                    <th className="p-3 border-r border-slate-100 w-20 text-center">STATUS</th>
                    <th className="p-3 text-center w-12">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {computedItinerary.map((row, idx) => {
                    const isDescExpanded = expandedDescs[idx];
                    const shouldTruncate = row.sub && row.sub.length > 80;
                    const displayText = shouldTruncate && !isDescExpanded 
                      ? row.sub.substring(0, 80) + "..." 
                      : row.sub;

                    const isStayEmpty = !row.stay || row.stay === "—";
                    const isMealsEmpty = !row.meals || row.meals === "—";
                    const isActEmpty = !row.activities || row.activities === "—" || row.activities === "";

                    return (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 text-center border-r border-slate-100 font-bold text-slate-700">
                            <div className="flex items-center justify-center gap-1.5">
                              {itineraryViewMode === "internal" && (
                                <button
                                  onClick={() => setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                  className="text-slate-400 hover:text-slate-650 transition-colors"
                                >
                                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expandedRows[idx] && "rotate-180")} />
                                </button>
                              )}
                              <div>
                                <span className="block">{row.day}</span>
                                <span className="text-[9px] text-slate-400 font-bold mt-0.5">{row.wd}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 border-r border-slate-100 font-mono text-slate-500">{row.date}</td>
                          <td className="p-3 border-r border-slate-100">
                            <div className="font-bold text-slate-800">{row.plan}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5 whitespace-pre-line">
                              {displayText}
                              {shouldTruncate && (
                                <button
                                  onClick={() => setExpandedDescs(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                  className="text-blue-500 font-bold ml-1 hover:underline text-[9.5px] inline-block"
                                >
                                  {isDescExpanded ? "Show Less" : "View Details"}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-3 border-r border-slate-100">
                            {isStayEmpty ? (
                              <button
                                onClick={() => handleQuickAdd(row.rawIdx, "stay")}
                                className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-600 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"
                              >
                                <Plus className="w-2.5 h-2.5" /> Not Added
                              </button>
                            ) : (
                              <>
                                <div className="font-bold text-slate-800">{row.stay}</div>
                                {row.stayType && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-slate-400 font-medium">{row.stayType}</span>
                                    <span className={cn("text-[7.5px] font-black px-1.5 py-0.2 rounded-full border tracking-wider",
                                      row.stayBadge === "DELUXE" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    )}>{row.stayBadge}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                          {itineraryViewMode === "internal" && (
                            <td className="p-3 border-r border-slate-100">
                              {!row.distance ? (
                                <button
                                  onClick={() => handleQuickAdd(row.rawIdx, "distance")}
                                  className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-600 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"
                                >
                                  <Plus className="w-2.5 h-2.5" /> Not Added
                                </button>
                              ) : (
                                <>
                                  <div className="font-bold text-slate-800">{row.travel}</div>
                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">{row.travelSub}</div>
                                </>
                              )}
                            </td>
                          )}
                          <td className="p-3 border-r border-slate-100">
                            {isMealsEmpty ? (
                              <button
                                onClick={() => handleQuickAdd(row.rawIdx, "meals")}
                                className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-600 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"
                              >
                                <Plus className="w-2.5 h-2.5" /> Not Added
                              </button>
                            ) : (
                              <span className="text-slate-600 font-semibold">{row.meals}</span>
                            )}
                          </td>
                          <td className="p-3 border-r border-slate-100">
                            {isActEmpty ? (
                              <button
                                onClick={() => handleQuickAdd(row.rawIdx, "activities")}
                                className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-650 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"
                              >
                                <Plus className="w-2.5 h-2.5" /> Not Added
                              </button>
                            ) : (
                              <span className="text-slate-650 font-medium">{row.activities}</span>
                            )}
                          </td>
                          <td className="p-3 border-r border-slate-100 text-center">
                            <span className={cn(
                              "text-[8px] font-black border px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider",
                              row.status === "INCOMPLETE" 
                                ? "bg-amber-50 text-amber-600 border-amber-200" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36 bg-white border border-slate-200 rounded-[4px] shadow-lg py-1 z-50">
                                <DropdownMenuItem
                                  onClick={() => handleQuickAdd(row.rawIdx, "edit")}
                                  className="text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                  Edit Day Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                        {expandedRows[idx] && itineraryViewMode === "internal" && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={itineraryViewMode === "internal" ? 9 : 8} className="p-3.5 border-t border-b border-slate-100">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[11px] font-medium text-slate-650">
                                <div>
                                  <span className="block text-[9.5px] uppercase font-bold text-slate-400">Departure Time</span>
                                  {row.departureTime ? (
                                    <span className="text-slate-800 font-semibold">{row.departureTime}</span>
                                  ) : (
                                    <button onClick={() => handleQuickAdd(row.rawIdx, "departureTime")} className="text-blue-500 hover:underline mt-0.5 block">+ Add Departure Time</button>
                                  )}
                                </div>
                                <div>
                                  <span className="block text-[9.5px] uppercase font-bold text-slate-400">Arrival Time</span>
                                  {row.arrivalTime ? (
                                    <span className="text-slate-800 font-semibold">{row.arrivalTime}</span>
                                  ) : (
                                    <button onClick={() => handleQuickAdd(row.rawIdx, "arrivalTime")} className="text-blue-500 hover:underline mt-0.5 block">+ Add Arrival Time</button>
                                  )}
                                </div>
                                <div>
                                  <span className="block text-[9.5px] uppercase font-bold text-slate-400">Distance</span>
                                  {row.distance ? (
                                    <span className="text-slate-800 font-semibold">{row.distance}</span>
                                  ) : (
                                    <button onClick={() => handleQuickAdd(row.rawIdx, "distance")} className="text-blue-500 hover:underline mt-0.5 block">+ Add Distance</button>
                                  )}
                                </div>
                                <div>
                                  <span className="block text-[9.5px] uppercase font-bold text-slate-400">Driving Hours</span>
                                  {row.drivingHours ? (
                                    <span className="text-slate-800 font-semibold">{row.drivingHours}</span>
                                  ) : (
                                    <button onClick={() => handleQuickAdd(row.rawIdx, "drivingHours")} className="text-blue-500 hover:underline mt-0.5 block">+ Add Driving Hours</button>
                                  )}
                                </div>
                                <div>
                                  <span className="block text-[9.5px] uppercase font-bold text-slate-400">Assigned Vehicle</span>
                                  {row.assignedVehicle ? (
                                    <span className="text-slate-800 font-semibold">{row.assignedVehicle}</span>
                                  ) : (
                                    <button onClick={() => handleQuickAdd(row.rawIdx, "assignedVehicle")} className="text-blue-500 hover:underline mt-0.5 block">+ Assign Vehicle</button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-[6px] p-3.5">
              <Info className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
              <span>All times are tentative and subject to change due to weather, traffic or operational reasons.</span>
            </div>
          </div>
        )}

        {/* Quick Edit Itinerary Day Modal */}
        <Dialog open={quickEditModalOpen} onOpenChange={setQuickEditModalOpen}>
          <DialogContent className="max-w-md bg-white p-5 rounded-[6px] border border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-sm font-black text-slate-800">
                Edit Itinerary - Day {editingDayIdx !== null ? editingDayIdx + 1 : ""}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-400">
                Update the plan, stay, meals, activities, and operational fields.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveQuickEdit} className="space-y-3 mt-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Plan & Destination</label>
                <Input
                  value={editingDayData.title}
                  onChange={e => setEditingDayData((prev: any) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Delhi → Shimla"
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Overnight Stay</label>
                  <Input
                    value={editingDayData.stay}
                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, stay: e.target.value }))}
                    placeholder="e.g. Hotel Ridge View"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Meals</label>
                  <Input
                    value={editingDayData.meals}
                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, meals: e.target.value }))}
                    placeholder="e.g. Breakfast, Dinner"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Activities (comma-separated)</label>
                <Input
                  value={editingDayData.activities}
                  onChange={e => setEditingDayData((prev: any) => ({ ...prev, activities: e.target.value }))}
                  placeholder="e.g. Mall Road Stroll, Sightseeing"
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Departure Time</label>
                  <Input
                    value={editingDayData.departureTime}
                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, departureTime: e.target.value }))}
                    placeholder="e.g. 09:00 AM"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Arrival Time</label>
                  <Input
                    value={editingDayData.arrivalTime}
                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, arrivalTime: e.target.value }))}
                    placeholder="e.g. 06:00 PM"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Distance</label>
                  <Input
                    value={editingDayData.distance}
                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, distance: e.target.value }))}
                    placeholder="e.g. 340 KM"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Driving Hours</label>
                  <Input
                    value={editingDayData.drivingHours}
                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, drivingHours: e.target.value }))}
                    placeholder="e.g. 8 Hrs"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Vehicle</label>
                  <Input
                    value={editingDayData.assignedVehicle}
                    onChange={e => setEditingDayData((prev: any) => ({ ...prev, assignedVehicle: e.target.value }))}
                    placeholder="e.g. Volvo / TT"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={editingDayData.description}
                  onChange={e => setEditingDayData((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter day wise plan details..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-[4px] p-2 bg-white text-slate-800 outline-none hover:border-slate-300 focus:border-slate-400"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setQuickEditModalOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                  Cancel
                </Button>
                <Button type="submit" className="h-8 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded">
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Activity Dialog */}
        <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
          <DialogContent className="max-w-md bg-white p-5 rounded-lg shadow-lg border border-slate-200">
            <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Add Departure Activity</h3>
            <form onSubmit={handleAddActivitySubmit} className="space-y-4 mt-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Day</label>
                <select
                  value={newActivityData.day}
                  onChange={(e) => setNewActivityData(prev => ({ ...prev, day: e.target.value }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
                >
                  <option value="Day 1">Day 1</option>
                  <option value="Day 2">Day 2</option>
                  <option value="Day 3">Day 3</option>
                  <option value="Day 4">Day 4</option>
                  <option value="Day 5">Day 5</option>
                  <option value="Day 6">Day 6</option>
                  <option value="Day 7">Day 7</option>
                  <option value="Day 8">Day 8</option>
                  <option value="Day 9">Day 9</option>
                  <option value="Optional">Optional</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Activity Name</label>
                <input
                  type="text"
                  required
                  value={newActivityData.act}
                  onChange={(e) => setNewActivityData(prev => ({ ...prev, act: e.target.value }))}
                  placeholder="e.g. River Rafting or Solang Sightseeing"
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Subdescription</label>
                <input
                  type="text"
                  value={newActivityData.sub}
                  onChange={(e) => setNewActivityData(prev => ({ ...prev, sub: e.target.value }))}
                  placeholder="e.g. Beas River or Hidimba Temple"
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Type</label>
                  <select
                    value={newActivityData.type}
                    onChange={(e) => setNewActivityData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
                  >
                    <option value="SIGHTSEEING">SIGHTSEEING</option>
                    <option value="TRAVEL">TRAVEL</option>
                    <option value="ADVENTURE">ADVENTURE</option>
                    <option value="STAY">STAY</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Timing</label>
                  <input
                    type="text"
                    value={newActivityData.time}
                    onChange={(e) => setNewActivityData(prev => ({ ...prev, time: e.target.value }))}
                    placeholder="e.g. 10:00 AM - 05:00 PM"
                    className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Location</label>
                  <input
                    type="text"
                    value={newActivityData.loc}
                    onChange={(e) => setNewActivityData(prev => ({ ...prev, loc: e.target.value }))}
                    placeholder="e.g. Manali"
                    className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={newActivityData.status}
                    onChange={(e) => setNewActivityData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="OPTIONAL">OPTIONAL</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={() => setActivityModalOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                  Cancel
                </Button>
                <Button type="submit" className="h-8 bg-[#F97316] hover:bg-[#E05E00] text-white font-bold text-xs uppercase rounded">
                  Add Activity
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Itinerary Version History Dialog */}
        <Dialog open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
          <DialogContent className="max-w-md bg-white p-5 rounded-[6px] border border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-sm font-black text-slate-800">
                Itinerary Version History
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-400">
                Review and restore previous versions of this itinerary.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-3 max-h-80 overflow-y-auto pr-1">
              {(!tripDetails?.itineraryVersions || tripDetails.itineraryVersions.length === 0) ? (
                <div className="text-center p-6 text-slate-400 font-semibold text-xs">
                  No version history found. Changes will generate versions after confirmation.
                </div>
              ) : (
                [...tripDetails.itineraryVersions].reverse().map((ver: any, index: number) => {
                  const dateFormatted = ver.updatedAt
                    ? new Date(ver.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : "Unknown Time";
                  
                  return (
                    <div key={index} className="border border-slate-150 rounded-[4px] p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Version {ver.version}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{dateFormatted} • by {ver.updatedBy || 'System'}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{ver.itinerary?.length || 0} days defined</p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            const restoredTrip = await api.put(`/trips/${tripDetails.id}`, {
                              itinerary: ver.itinerary
                            });
                            setTripDetails(restoredTrip.data);
                            toast.success(`Restored to Version {ver.version} successfully!`);
                            setVersionHistoryOpen(false);
                          } catch (err: any) {
                            toast.error(`Failed to restore: ${err.message}`);
                          }
                        }}
                        className="h-7 text-[10px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded px-3"
                      >
                        Restore
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setVersionHistoryOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ──────────────────────── HOTELS ──────────────────────── */}
        {activeTab === "hotels" && (
          <div className="space-y-4">
            {editingHotel ? (
              <form onSubmit={handleEditHotelSubmit} className="space-y-4">
                {/* Zoho Header Bar */}
                <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-3xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingHotel(null)}
                      className="text-slate-450 hover:text-slate-700 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-base font-black text-slate-800">Edit Hotel</h2>
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-[4px] border uppercase tracking-wider",
                      hotelConfirmedForm === "CONFIRMED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      {hotelConfirmedForm}
                    </span>
                    <span className="text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
                      Voucher {voucherStatusForm}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingHotel(null)}
                      className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 bg-white text-slate-700 shadow-3xs transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingHotel}
                      className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSavingHotel ? "Saving..." : "Save Hotel"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left Column: Editor Sections */}
                  <div className="lg:col-span-2 space-y-5">
                    
                    {/* 1. HOTEL DETAILS */}
                    <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-5 shadow-3xs space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">1</span>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Hotel Details</h3>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Hotel Name *</label>
                          <input
                            type="text"
                            required
                            value={hotelNameForm}
                            onChange={e => setHotelNameForm(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] font-semibold text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Destination / City *</label>
                          <input
                            type="text"
                            required
                            value={hotelLocationForm}
                            onChange={e => setHotelLocationForm(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] font-semibold text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Check-in Date *</label>
                          <input
                            type="date"
                            required
                            value={checkInDateForm}
                            onChange={e => handleCheckInChange(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] text-slate-700 bg-white font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Check-out Date *</label>
                          <input
                            type="date"
                            required
                            value={checkOutDateForm}
                            onChange={e => setCheckOutDateForm(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] text-slate-700 bg-white font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Nights *</label>
                          <input
                            type="number"
                            required
                            value={hotelNightsCount}
                            onChange={e => handleNightsChange(Number(e.target.value))}
                            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] text-slate-700 bg-white font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Vendor Directory Lookup</label>
                          <select
                            value={hotelVendorId}
                            onChange={e => {
                              const val = e.target.value;
                              setHotelVendorId(val);
                              const selected = dbVendors.find((v: any) => v.id === val);
                              if (selected) {
                                setHotelNameForm(selected.name);
                                setHotelLocationForm(selected.location || "");
                                // AUTO-FILL RATES FROM DIRECTORY ROOM RATES
                                const rates: any[] = selected.roomRates || [];
                                // Per-person rate = room rate / occupancy
                                const getRatePerPax = (sharingType: string, occupancy: number) => {
                                  const r = rates.find((r: any) => r.sharingType === sharingType);
                                  if (!r || !r.amount) return 0;
                                  return r.rateBasis === 'PER_PERSON_PER_NIGHT'
                                    ? Number(r.amount)
                                    : Math.round(Number(r.amount) / occupancy);
                                };
                                const dbl = getRatePerPax('DOUBLE', 2);
                                const tri = getRatePerPax('TRIPLE', 3);
                                const qud = getRatePerPax('QUAD', 4);
                                if (dbl > 0) setDoubleRate(dbl);
                                if (tri > 0) setTripleRate(tri);
                                if (qud > 0) setQuadRate(qud);
                              }
                            }}
                            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-[4px] bg-white outline-none cursor-pointer font-bold text-slate-750 focus:border-[#F97316]"
                          >
                            <option value="">-- Select Vendor --</option>
                            {dbVendors.map((vendor: any) => {
                              const tripMap = vendor.tripMappings?.find((m: any) => m.tripId === tripId);
                              const badge = tripMap ? (tripMap.isPrimary ? " 🥇 Primary" : " 🥈 Backup") : "";
                              return (
                                <option key={vendor.id} value={vendor.id}>
                                  {vendor.name}{badge}{vendor.location ? ` · ${vendor.location}` : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-455 uppercase tracking-wider block">Confirmation Status</label>
                          <select
                            value={hotelConfirmedForm}
                            onChange={e => setHotelConfirmedForm(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-[4px] bg-white outline-none cursor-pointer font-bold text-slate-700"
                          >
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="UNCONFIRMED">PENDING / UNCONFIRMED</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-455 uppercase tracking-wider block">Voucher Status</label>
                          <select
                            value={voucherStatusForm}
                            onChange={e => setVoucherStatusForm(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-[4px] bg-white outline-none cursor-pointer font-bold text-slate-700"
                          >
                            <option value="UPLOADED">UPLOADED</option>
                            <option value="PENDING">PENDING</option>
                          </select>
                        </div>
                      </div>
                    </div>


                    {/* 2. PASSENGER PRICING & ALLOCATION */}
                    <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-5 shadow-3xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">2</span>
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Passenger Pricing & Allocation</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-450 font-bold">Stay Nights:</span>
                          <input
                            type="number"
                            required
                            value={hotelNightsCount}
                            onChange={e => setHotelNightsCount(Number(e.target.value))}
                            className="h-7 w-14 text-xs text-center border border-slate-200 rounded bg-white font-bold text-slate-800 outline-none"
                          />
                        </div>
                      </div>

                      {/* Passengerwise Sharing Calculations */}
                      <div className="border border-slate-200 rounded-[6px] overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-[9.5px] font-black text-slate-455 uppercase tracking-wider">
                              <th className="p-3 border-r border-slate-100">SHARING TYPE</th>
                              <th className="p-3 border-r border-slate-100 text-center w-28">PASSENGERS</th>
                              <th className="p-3 border-r border-slate-100 text-center w-28">RATE PER PAX (₹)</th>
                              <th className="p-3 border-r border-slate-100 text-center">NIGHTS</th>
                              <th className="p-3 text-center">SUBTOTAL (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {/* Twin Sharing */}
                            <tr>
                              <td className="p-3 border-r border-slate-100 font-bold text-slate-750">Twin Sharing (per pax)</td>
                              <td className="p-3 border-r border-slate-100">
                                <input
                                  type="number"
                                  value={doubleRoomsCount}
                                  onChange={e => setDoubleRoomsCount(Number(e.target.value))}
                                  className="w-full text-xs px-2 py-0.5 border rounded text-center font-semibold text-slate-800 bg-white"
                                />
                              </td>
                              <td className="p-3 border-r border-slate-100">
                                <input
                                  type="number"
                                  value={doubleRate}
                                  onChange={e => setDoubleRate(Number(e.target.value))}
                                  className="w-full text-xs px-2 py-0.5 border rounded text-center font-semibold text-slate-800 bg-white"
                                />
                              </td>
                              <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-500">{hotelNightsCount}</td>
                              <td className="p-3 text-center font-black text-slate-750">₹{doubleCost.toLocaleString('en-IN')}</td>
                            </tr>

                            {/* Triple Sharing */}
                            <tr>
                              <td className="p-3 border-r border-slate-100 font-bold text-slate-750">Triple Sharing (per pax)</td>
                              <td className="p-3 border-r border-slate-100">
                                <input
                                  type="number"
                                  value={tripleRoomsCount}
                                  onChange={e => setTripleRoomsCount(Number(e.target.value))}
                                  className="w-full text-xs px-2 py-0.5 border rounded text-center font-semibold text-slate-800 bg-white"
                                />
                              </td>
                              <td className="p-3 border-r border-slate-100">
                                <input
                                  type="number"
                                  value={tripleRate}
                                  onChange={e => setTripleRate(Number(e.target.value))}
                                  className="w-full text-xs px-2 py-0.5 border rounded text-center font-semibold text-slate-800 bg-white"
                                />
                              </td>
                              <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-500">{hotelNightsCount}</td>
                              <td className="p-3 text-center font-black text-slate-750">₹{tripleCost.toLocaleString('en-IN')}</td>
                            </tr>

                            {/* Quad Sharing */}
                            <tr>
                              <td className="p-3 border-r border-slate-100 font-bold text-slate-750">Quad Sharing (per pax)</td>
                              <td className="p-3 border-r border-slate-100">
                                <input
                                  type="number"
                                  value={quadRoomsCount}
                                  onChange={e => setQuadRoomsCount(Number(e.target.value))}
                                  className="w-full text-xs px-2 py-0.5 border rounded text-center font-semibold text-slate-800 bg-white"
                                />
                              </td>
                              <td className="p-3 border-r border-slate-100">
                                <input
                                  type="number"
                                  value={quadRate}
                                  onChange={e => setQuadRate(Number(e.target.value))}
                                  className="w-full text-xs px-2 py-0.5 border rounded text-center font-semibold text-slate-800 bg-white"
                                />
                              </td>
                              <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-500">{hotelNightsCount}</td>
                              <td className="p-3 text-center font-black text-slate-750">₹{quadCost.toLocaleString('en-IN')}</td>
                            </tr>

                            {/* Extra Person */}
                            <tr>
                              <td className="p-3 border-r border-slate-100 font-bold text-slate-750">Extra Bed / Person (per pax)</td>
                              <td className="p-3 border-r border-slate-100">
                                <input
                                  type="number"
                                  value={extraPersonsCount}
                                  onChange={e => setExtraPersonsCount(Number(e.target.value))}
                                  className="w-full text-xs px-2 py-0.5 border rounded text-center font-semibold text-slate-800 bg-white"
                                />
                              </td>
                              <td className="p-3 border-r border-slate-100">
                                <input
                                  type="number"
                                  value={extraPersonRate}
                                  onChange={e => setExtraPersonRate(Number(e.target.value))}
                                  className="w-full text-xs px-2 py-0.5 border rounded text-center font-semibold text-slate-800 bg-white"
                                />
                              </td>
                              <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-500">{hotelNightsCount}</td>
                              <td className="p-3 text-center font-black text-slate-750">₹{extraPersonCost.toLocaleString('en-IN')}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Allocated Travelers</p>
                          <p className="text-xs font-semibold text-slate-650 mt-0.5">
                            {totalPaxCapacity} allocated / {allPassengers.length} manifest passengers
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Calculated Cost</p>
                          <p className="text-lg font-black text-[#F97316]">₹{calculatedTotalCost.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Summaries Sidebar */}
                  <div className="space-y-5">
                    
                    {/* HOTEL COST SUMMARY */}
                    <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-5 shadow-3xs space-y-3.5">
                      <h3 className="text-[10px] font-black text-slate-455 uppercase tracking-wider border-b border-slate-100 pb-1.5">Hotel Cost Summary</h3>
                      
                      <div className="space-y-2 text-xs font-semibold text-slate-600">
                        {doubleRoomsCount > 0 && (
                          <div className="flex justify-between">
                            <span>Twin Sharing ({doubleRoomsCount} Pax)</span>
                            <span className="font-bold text-slate-800">₹{doubleCost.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {tripleRoomsCount > 0 && (
                          <div className="flex justify-between">
                            <span>Triple Sharing ({tripleRoomsCount} Pax)</span>
                            <span className="font-bold text-slate-800">₹{tripleCost.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {quadRoomsCount > 0 && (
                          <div className="flex justify-between">
                            <span>Quad Sharing ({quadRoomsCount} Pax)</span>
                            <span className="font-bold text-slate-800">₹{quadCost.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {extraPersonsCount > 0 && (
                          <div className="flex justify-between">
                            <span>Extra Bed ({extraPersonsCount} Pax)</span>
                            <span className="font-bold text-slate-800">₹{extraPersonCost.toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-black text-slate-800">
                          <span>Total Hotel Cost</span>
                          <span className="text-[#F97316] text-base">₹{calculatedTotalCost.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>


                    {/* PAYMENT SUMMARY */}
                    <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-5 shadow-3xs space-y-3.5">
                      <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-wider border-b border-slate-100 pb-1.5">Payment Summary</h3>
                      
                      <div className="space-y-2 text-xs font-semibold text-slate-600">
                        <div className="flex justify-between">
                          <span>Hotel Cost</span>
                          <span className="font-bold text-slate-800">₹{calculatedTotalCost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Advance Paid</span>
                          <span className="font-bold text-slate-800">₹{hotelPaidForm.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2.5">
                          <span>Balance Due</span>
                          <span className="font-black text-red-600">
                            ₹{(calculatedTotalCost - hotelPaidForm).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] font-black text-slate-450 uppercase">Payment Status</span>
                          <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-[4px] border uppercase tracking-wider block w-fit",
                            hotelPaidForm >= calculatedTotalCost 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : hotelPaidForm > 0 
                                ? "bg-amber-50 text-amber-600 border-amber-100" 
                                : "bg-red-50 text-red-600 border-red-100"
                          )}>
                            {hotelPaidForm >= calculatedTotalCost ? "PAID IN FULL" : hotelPaidForm > 0 ? "PARTIALLY PAID" : "UNPAID"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-[10px]">
                          <div>
                            <span className="text-slate-400 block font-bold">Last Payment</span>
                            <span className="text-slate-700 font-extrabold block mt-0.5">10 Jul 2026</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold">Paid By</span>
                            <span className="text-slate-700 font-extrabold block mt-0.5">Himalayan Stays</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* OVERRIDE (IF APPLICABLE) */}
                    <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-5 shadow-3xs space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Override (If Applicable)</span>
                        <button
                          type="button"
                          onClick={() => setOverrideApplied(!overrideApplied)}
                          className="text-[10px] font-extrabold text-[#F97316] hover:underline"
                        >
                          {overrideApplied ? "Reset" : "+ Add Override"}
                        </button>
                      </div>

                      {overrideApplied ? (
                        <div className="space-y-3.5 text-xs">
                          <div>
                            <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Overridden Cost (₹) *</label>
                            <input
                              type="number"
                              required
                              value={overrideAmount}
                              onChange={e => setOverrideAmount(Number(e.target.value))}
                              className="w-full border border-orange-200 rounded-[4px] px-3 py-1.5 mt-0.5 font-bold text-orange-700 bg-orange-50/10 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Reason for Override *</label>
                            <input
                              type="text"
                              required
                              value={overrideReason}
                              onChange={e => setOverrideReason(e.target.value)}
                              placeholder="e.g. Bulk stay flat discount"
                              className="w-full border rounded-[4px] px-3 py-1.5 mt-0.5 text-slate-750 focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10.5px] text-slate-400 font-semibold italic leading-normal">
                          No override applied. Turn on override to set custom total pricing bypassing normal sharing rate rules.
                        </p>
                      )}
                    </div>

                    {/* NOTES */}
                    <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-5 shadow-3xs space-y-2">
                      <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-wider border-b border-slate-100 pb-1.5">Notes</h3>
                      <textarea
                        value={hotelNotesForm}
                        onChange={e => setHotelNotesForm(e.target.value)}
                        placeholder="Add any notes about this hotel..."
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] h-20 resize-none"
                      />
                    </div>

                  </div>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-800">Hotels</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">Manage hotels and stay arrangements for each day</p>
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



            {/* Metrics - computed from real hotel data */}
            {(() => {
              const totalNights = computedHotels.reduce((s: number, h: any) => s + (h.nights || 1), 0);
              const confirmed = computedHotels.filter((h: any) => h.status === 'PAID' || h.rawAssignment?.confirmed === 'CONFIRMED').length;
              const pending = computedHotels.length - confirmed;
              const confirmedPct = computedHotels.length > 0 ? ((confirmed / computedHotels.length) * 100).toFixed(1) : '0.0';
              const pendingPct = computedHotels.length > 0 ? ((pending / computedHotels.length) * 100).toFixed(1) : '0.0';
              const totalRooms = computedHotels.reduce((s: number, h: any) => {
                const raw = h.rawAssignment;
                return s + (raw?.numberOfRooms || 0);
              }, 0);
              const totalAmount = computedHotels.reduce((s: number, h: any) => {
                const raw = h.rawAssignment;
                const amt = raw?.totalAmount || parseFloat((h.amt || '0').replace(/,/g, '')) || 0;
                return s + amt;
              }, 0);
              const stats = [
                { v: String(totalNights || computedHotels.length), l: "TOTAL NIGHTS", desc: `Across ${computedHotels.length} stays`, color: "text-purple-600", bg: "bg-purple-50 border-purple-100", icon: Calendar },
                { v: String(confirmed), l: "CONFIRMED", desc: `${confirmedPct}% of stays`, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: CheckCircle2 },
                { v: String(pending), l: "PENDING", desc: `${pendingPct}% of stays`, color: "text-amber-500", bg: "bg-amber-50 border-amber-100", icon: Clock },
                { v: totalRooms > 0 ? String(totalRooms) : "—", l: "TOTAL ROOMS", desc: "All rooms combined", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: Bed },
                { v: `₹${Math.round(totalAmount / 1000)}K`, l: "TOTAL AMOUNT", desc: "Agreed hotel cost", color: "text-rose-600", bg: "bg-rose-50 border-rose-100", icon: Users },
                { v: String(computedHotels.length), l: "TOTAL STAYS", desc: "Hotel nights booked", color: "text-teal-600", bg: "bg-teal-50 border-teal-100", icon: TrendingUp },
              ];
              return (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
                  {stats.map(k => {
                    const IconComponent = k.icon;
                    return (
                      <div key={k.l} className="bg-white border border-[#E2E8F0] rounded-[8px] p-3 flex items-center gap-3 shadow-xxs">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border", k.bg)}>
                          <IconComponent className={cn("w-5 h-5", k.color)} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.l}</p>
                          <p className="text-lg font-black text-slate-800 leading-tight mt-0.5">{k.v}</p>
                          <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{k.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Filter Bar */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Hotel Status</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Cities</option>
              </select>
              <select className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                <option>All Room Types</option>
              </select>
              <div className="relative flex-1 max-w-xs min-w-[150px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                <input type="text" placeholder="Search hotel or location..." className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
              </div>
              <button className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 bg-white hover:bg-slate-50 text-slate-750 flex items-center gap-1.5 ml-auto shadow-3xs">
                <Sliders className="w-3.5 h-3.5 text-slate-450" /> More Filters
              </button>
            </div>

            {/* Hotels Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3 border-r border-slate-100">DAY</th>
                    <th className="p-3 border-r border-slate-100">DESTINATION</th>
                    <th className="p-3 border-r border-slate-100">HOTEL & VENDOR</th>
                    <th className="p-3 border-r border-slate-100">BOOKED ROOMS</th>
                    <th className="p-3 border-r border-slate-100 text-center">NIGHTS</th>
                    <th className="p-3 border-r border-slate-100">STATUS</th>
                    <th className="p-3 border-r border-slate-100">AMOUNT (₹)</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {computedHotels.map((row, idx) => {
                    const rawNotes = row.rawAssignment?.notes;
                    let pricingObj: any = null;
                    if (rawNotes && rawNotes.trim().startsWith("{")) {
                      try { pricingObj = JSON.parse(rawNotes); } catch (e) {}
                    }
                    const isAutomated = pricingObj && pricingObj.__isHotelPricing;
                    const showDrawer = activeCalculationDrawer === row.id;

                    return (
                      <React.Fragment key={row.id || idx}>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 border-r border-slate-100">
                            <p className="font-extrabold text-slate-800">{row.day}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{row.wd} &middot; {row.date}</p>
                          </td>
                          <td className="p-3 border-r border-slate-100">
                            <p className="font-bold text-slate-800">{row.destRegion}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {row.destCity}
                            </p>
                          </td>
                          <td className="p-3 border-r border-slate-100">
                            <p className="font-bold text-slate-855">{row.hotel}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                <User className="w-3 h-3" /> {row.vendor}
                              </span>
                              <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wider">CONFIRMED</span>
                              <span className="text-[8px] font-black bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                                <FileText className="w-2.5 h-2.5" /> Voucher Sent
                              </span>
                            </div>
                          </td>
                          <td className="p-3 border-r border-slate-100">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(row.allocations || []).map((alloc: any, aIdx: number) => (
                                <span
                                  key={aIdx}
                                  className={cn(
                                    "text-[9px] font-black px-1.5 py-0.5 rounded",
                                    alloc.color === 'blue' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                    alloc.color === 'orange' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                    "bg-purple-50 text-purple-600 border border-purple-100"
                                  )}
                                >
                                  {alloc.text}
                                </span>
                              ))}
                            </div>
                            <p className="text-[9.5px] text-slate-400 font-bold mt-1.5">{row.totalPaxText}</p>
                          </td>
                          <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-700">{row.nights}</td>
                          <td className="p-3 border-r border-slate-100">
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-green-50 text-green-600 border border-green-150 uppercase tracking-wider block w-fit">
                              {row.status}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-semibold mt-1 block">
                              {row.statusSub}
                            </span>
                          </td>
                          <td className="p-3 border-r border-slate-100">
                            <p className="font-bold text-slate-800">₹{row.amt}</p>
                            <p className="text-[9.5px] text-slate-400 font-semibold">{row.amtSub}</p>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditHotel(row)}
                                className="text-[10px] font-extrabold text-[#FF6B00] border border-orange-200 hover:border-orange-300 rounded-[4px] px-3.5 py-1 bg-white hover:bg-orange-50 shadow-3xs transition-all cursor-pointer"
                              >
                                View
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-755 rounded border border-slate-200">
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border border-slate-200 rounded-[6px] shadow-md text-xs font-semibold">
                                  <DropdownMenuItem onClick={() => handleOpenEditHotel(row)} className="hover:bg-slate-50 cursor-pointer p-2 flex items-center gap-1.5">
                                    Edit Pricing
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Popover Cost Calculation Breakdown Drawer */}
                        {showDrawer && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={8} className="p-4 border-b border-[#E2E8F0]">
                              <div className="bg-white border border-slate-200 rounded-[6px] p-4 text-xs shadow-md max-w-xl space-y-2">
                                <h4 className="font-black text-slate-800 border-b border-slate-150 pb-2 flex items-center justify-between">
                                  <span>Hotel Cost Calculation Breakdown</span>
                                  <span className="text-[10px] font-bold text-slate-400">{row.hotel} ({row.day})</span>
                                </h4>
                                
                                {isAutomated ? (
                                  <div className="space-y-1.5 font-medium text-slate-600">
                                    {pricingObj.allocations?.doubleRoomsCount > 0 && (
                                      <div className="flex justify-between">
                                        <span>Double Sharing Allocation:</span>
                                        <span className="font-bold text-slate-800">
                                          {pricingObj.allocations.doubleRoomsCount} Rooms × ₹{pricingObj.rates.doubleRate.toLocaleString('en-IN')} × {pricingObj.nightsCount} Nights = ₹{(pricingObj.allocations.doubleRoomsCount * pricingObj.rates.doubleRate * pricingObj.nightsCount).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    )}
                                    {pricingObj.allocations?.tripleRoomsCount > 0 && (
                                      <div className="flex justify-between">
                                        <span>Triple Sharing Allocation:</span>
                                        <span className="font-bold text-slate-800">
                                          {pricingObj.allocations.tripleRoomsCount} Rooms × ₹{pricingObj.rates.tripleRate.toLocaleString('en-IN')} × {pricingObj.nightsCount} Nights = ₹{(pricingObj.allocations.tripleRoomsCount * pricingObj.rates.tripleRate * pricingObj.nightsCount).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    )}
                                    {pricingObj.allocations?.quadRoomsCount > 0 && (
                                      <div className="flex justify-between">
                                        <span>Quad Sharing Allocation:</span>
                                        <span className="font-bold text-slate-800">
                                          {pricingObj.allocations.quadRoomsCount} Rooms × ₹{pricingObj.rates.quadRate.toLocaleString('en-IN')} × {pricingObj.nightsCount} Nights = ₹{(pricingObj.allocations.quadRoomsCount * pricingObj.rates.quadRate * pricingObj.nightsCount).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    )}
                                    {pricingObj.allocations?.extraPersonsCount > 0 && (
                                      <div className="flex justify-between">
                                        <span>Extra Bed Allocation:</span>
                                        <span className="font-bold text-slate-800">
                                          {pricingObj.allocations.extraPersonsCount} Pax × ₹{pricingObj.rates.extraPersonRate.toLocaleString('en-IN')} × {pricingObj.nightsCount} Nights = ₹{(pricingObj.allocations.extraPersonsCount * pricingObj.rates.extraPersonRate * pricingObj.nightsCount).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    )}
                                    
                                    <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-slate-800 text-sm">
                                      <span>Sum Computed Cost:</span>
                                      <span>₹{row.rawAssignment?.totalAmount?.toLocaleString('en-IN') || "0"}</span>
                                    </div>

                                    {pricingObj.override?.applied && (
                                      <div className="bg-orange-50/50 border border-orange-100 rounded p-2 mt-2 text-[11px] text-orange-850">
                                        <div className="flex justify-between font-bold">
                                          <span>⚠️ Manual Override Applied:</span>
                                          <span>₹{pricingObj.override.amount?.toLocaleString('en-IN')}</span>
                                        </div>
                                        <p className="text-[10px] text-orange-650 mt-0.5">Reason: {pricingObj.override.reason || "Not specified"}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-slate-500 font-semibold italic">This hotel stay uses legacy pricing details.</p>
                                    <p className="text-xs font-bold text-slate-750 mt-1.5">Raw Notes/Details:</p>
                                    <pre className="text-[11px] bg-slate-50 p-2.5 rounded mt-1 overflow-x-auto text-slate-650 font-mono whitespace-pre-wrap">{row.type}</pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom calculation status */}
            <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold">
              <div className="flex flex-wrap items-center gap-6">
                <span>Showing all 9 nights</span>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <p className="text-slate-500 font-medium">Total Amount (₹) <span className="font-black text-slate-800 ml-1">3,57,000</span> <span className="font-bold text-emerald-600 ml-1.5">Paid Advance</span></p>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <p className="text-slate-500 font-medium">Outstanding (₹) <span className="font-black text-red-650 ml-1">24,000</span></p>
              </div>
              <button onClick={() => toast.info("View Payment Summary")} className="text-[11.5px] font-extrabold text-blue-600 hover:underline">View Payment Summary →</button>
            </div>
          </>
        )}
      </div>
    )}

        {/* ──────────────────────── TRANSPORT ──────────────────────── */}
        {activeTab === "allocation" && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-800">Room & Vehicle Allocation</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage room sharing groups and vehicle seat allotments with manual shuffling</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleSaveAllocationsToDb(false)} 
                  disabled={isSavingAllocations}
                  className="h-8.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] shadow-sm flex items-center gap-1.5"
                >
                  {isSavingAllocations ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {isSavingAllocations ? 'Saving...' : 'Save to Database'}
                </Button>
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

              <form onSubmit={handleAddVehicle} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Vehicle Type</label>
                  <select
                    value={newVehicleType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewVehicleType(val);
                      // Auto-suggest matching seats
                      if (val.includes("13")) setNewVehicleCapacity("13");
                      else if (val.includes("17")) setNewVehicleCapacity("17");
                      else if (val.includes("6") || val.includes("Car")) setNewVehicleCapacity("6");
                    }}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  >
                    <option value="13 Seater Tempo">13 Seater Tempo</option>
                    <option value="17 Seater Tempo">17 Seater Tempo</option>
                    <option value="6 Seater Car">6 Seater Car</option>
                    <option value="Custom Vehicle">Custom Vehicle</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Capacity (Seats)</label>
                  <select
                    value={newVehicleCapacity}
                    onChange={(e) => setNewVehicleCapacity(e.target.value)}
                    className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                  >
                    {[...Array(60)].map((_, i) => (
                      <option key={i + 1} value={String(i + 1)}>{i + 1} Seats</option>
                    ))}
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
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    Hotel Group Assignments
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddRoomModalOpen(true)}
                    className="h-7 text-[10px] font-bold text-[#F97316] border-[#F97316]/20 hover:bg-[#F97316]/5 rounded px-2"
                  >
                    + Add Room
                  </Button>
                </div>
                {computedRoomAllocations.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-4 text-center">No group assignments. Use the shuffler below or Auto-Allocate.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(
                      computedRoomAllocations.reduce((acc: Record<string, any>, r) => {
                        if (!acc[r.roomNumber]) acc[r.roomNumber] = { type: r.roomType, members: [], genders: [] };
                        acc[r.roomNumber].members.push(r.travelerName);
                        acc[r.roomNumber].genders.push(r.genderGroup);
                        return acc;
                      }, {})
                    ).map(([roomNum, rData]: any) => {
                      const hasBoys = rData.genders.includes("BOYS");
                      const hasGirls = rData.genders.includes("GIRLS");
                      const roomTag = (hasBoys && hasGirls) ? "COUPLE" : hasGirls ? "GIRLS" : "BOYS";
                      return (
                        <div key={roomNum} className="border border-slate-100 rounded-lg p-3 bg-slate-50 hover:border-emerald-250 transition-colors">
                          <p className="text-[10px] font-extrabold text-slate-800 flex items-center justify-between">
                            <span>{roomNum}</span>
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {rData.members.filter(Boolean).map((m: string, i: number) => (
                              <li key={i} className="text-[11px] font-bold text-slate-655 flex items-center gap-1.5 cursor-pointer hover:text-[#F97316] transition-colors" onClick={() => handleOpenShuffle({ name: m })}>
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full shrink-0" />
                                {m}
                              </li>
                            ))}
                            {rData.members.filter(Boolean).length === 0 && (
                              <li className="text-[10px] italic text-slate-400 font-medium">Empty Room</li>
                            )}
                          </ul>
                        </div>
                      );
                    })}
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
                              <p key={i} className="text-[11px] font-bold text-slate-650 truncate flex items-center gap-2 cursor-pointer hover:text-[#F97316] transition-colors" onClick={() => handleOpenShuffle({ name: t.travelerName })}>
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

            {/* Save Allocations to DB + Clear */}
            <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-3 flex items-center justify-end gap-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowClearAllocationsDialog(true)}
                  className="h-8 text-[11px] font-bold text-red-500 border-red-200 hover:bg-red-50 rounded-[4px]"
                >
                  Clear DB Allocations
                </Button>
                <Button
                  size="sm"
                  disabled={isSavingAllocations}
                  onClick={() => handleSaveAllocationsToDb(false)}
                  className="h-8 text-[11px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px]"
                >
                  {isSavingAllocations ? 'Saving...' : '💾 Save to Database'}
                </Button>
              </div>
            </div>


            {/* Clear Allocations Confirmation Dialog */}
            {showClearAllocationsDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xl w-96 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">Clear All Allocations?</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">This will soft-cancel all ACTIVE room and vehicle allocations for this departure in the database. This action cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setShowClearAllocationsDialog(false)} className="h-8 text-[11px] font-bold text-slate-600">
                      Cancel
                    </Button>
                    <Button size="sm" disabled={isSavingAllocations} onClick={() => handleSaveAllocationsToDb(true)} className="h-8 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-[4px]">
                      {isSavingAllocations ? 'Clearing...' : 'Yes, Clear All'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────── GUIDES ──────────────────────── */}
        {activeTab === "guides" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-800">Guides & Crew</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage guides assigned to this departure — payment tracking and day-wise allocation</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setAddGuideOpen(v => !v)}
                  className="h-8.5 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign Guide
                </Button>
              </div>
            </div>

            {/* KPI Cards — live from dbGuides */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[
                { v: String(dbGuides.length), l: "Total Guides", sub: "Assigned to departure" },
                { v: `₹${dbGuides.reduce((s,g) => s + (g.agreedAmount||0), 0).toLocaleString('en-IN')}`, l: "Total Agreed", sub: "All guides combined" },
                { v: `₹${dbGuides.reduce((s,g) => s + (g.advancePaid||0), 0).toLocaleString('en-IN')}`, l: "Total Advance", sub: "Paid so far" },
                { v: `₹${dbGuides.reduce((s,g) => s + (g.balanceAmount||0), 0).toLocaleString('en-IN')}`, l: "Balance Due", sub: "Remaining payment" },
              ].map(k => (
                <div key={k.l} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs">
                  <p className="text-2xl font-black text-slate-800">{k.v}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{k.l}</p>
                  <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Add Guide Inline Form */}
            {addGuideOpen && (
              <form onSubmit={handleAddGuide} className="bg-orange-50 border border-orange-200 rounded-[6px] p-4 space-y-3">
                <p className="text-[11px] font-black text-orange-700 uppercase tracking-wider">Assign Guide to Departure</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Guide Name *</label>
                    <input
                      required value={guideForm.guideName} onChange={e => setGuideForm(f => ({...f, guideName: e.target.value}))}
                      placeholder="e.g. Dikshu Sharma"
                      className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Role / Type</label>
                    <select
                      value={guideForm.assignmentType} onChange={e => setGuideForm(f => ({...f, assignmentType: e.target.value}))}
                      className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                    >
                      <option value="PRIMARY_GUIDE">Primary Guide</option>
                      <option value="ASSISTANT_GUIDE">Assistant Guide</option>
                      <option value="TRIP_LEADER">Trip Leader</option>
                      <option value="DRIVER_GUIDE">Driver Guide</option>
                      <option value="FREELANCER">Freelancer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Days Working</label>
                    <input
                      type="number" value={guideForm.daysWorked} min="1" max="30" onChange={e => setGuideForm(f => ({...f, daysWorked: e.target.value}))}
                      className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Agreed Amount (₹)</label>
                    <input
                      type="number" value={guideForm.agreedAmount} min="0" onChange={e => setGuideForm(f => ({...f, agreedAmount: e.target.value}))}
                      placeholder="e.g. 8000"
                      className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Advance Paid (₹)</label>
                    <input
                      type="number" value={guideForm.advancePaid} min="0" onChange={e => setGuideForm(f => ({...f, advancePaid: e.target.value}))}
                      className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Reporting Time</label>
                    <input
                      type="time" value={guideForm.reportingTime} onChange={e => setGuideForm(f => ({...f, reportingTime: e.target.value}))}
                      className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Notes</label>
                    <input
                      value={guideForm.notes} onChange={e => setGuideForm(f => ({...f, notes: e.target.value}))}
                      placeholder="e.g. Lead guide, experienced in Spiti"
                      className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Emergency Contact</label>
                    <input
                      value={guideForm.emergencyContact} onChange={e => setGuideForm(f => ({...f, emergencyContact: e.target.value}))}
                      placeholder="+91 XXXXXXXXXX"
                      className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={isSavingGuide} className="h-8 text-[11px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px]">
                    {isSavingGuide ? 'Saving...' : 'Save Guide'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setAddGuideOpen(false)} className="h-8 text-[11px] font-bold text-slate-600 rounded-[4px]">
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Guides Table — live from dbGuides */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 border-r border-slate-100">GUIDE NAME</th>
                    <th className="p-3 border-r border-slate-100">ROLE</th>
                    <th className="p-3 border-r border-slate-100 text-center">STATUS</th>
                    <th className="p-3 border-r border-slate-100 text-center">DAYS</th>
                    <th className="p-3 border-r border-slate-100 text-right">AGREED</th>
                    <th className="p-3 border-r border-slate-100 text-right">ADVANCE PAID</th>
                    <th className="p-3 border-r border-slate-100 text-right">BALANCE DUE</th>
                    <th className="p-3 border-r border-slate-100">NOTES</th>
                    <th className="p-3 border-r border-slate-100">ADDED ON</th>
                    <th className="p-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {dbGuides.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-[11px] text-slate-400 font-semibold">
                        No guides assigned yet. Click "Assign Guide" to add the first guide.
                      </td>
                    </tr>
                  ) : dbGuides.filter((g: any) => g.assignmentStatus !== 'CANCELLED').map((g: any) => (
                    <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px] uppercase">
                            {g.guideName?.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                          </div>
                          <span className="font-bold text-slate-800">{g.guideName}</span>
                        </div>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{(g.assignmentType || 'PRIMARY_GUIDE').replace(/_/g, ' ')}</span>
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center">
                        <span className={cn("px-2 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider border",
                          g.assignmentStatus === 'CONFIRMED' || g.assignmentStatus === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          g.assignmentStatus === 'ASSIGNED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          g.assignmentStatus === 'CANCELLED' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        )}>{g.assignmentStatus || 'ASSIGNED'}</span>
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center font-semibold text-slate-600">{g.daysWorked}</td>
                      <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-800">₹{Number(g.agreedAmount||0).toLocaleString('en-IN')}</td>
                      <td className="p-3 border-r border-slate-100 text-right font-semibold text-emerald-700">₹{Number(g.advancePaid||0).toLocaleString('en-IN')}</td>
                      <td className="p-3 border-r border-slate-100 text-right">
                        <span className={cn("font-bold", Number(g.balanceAmount||0) > 0 ? "text-red-600" : "text-emerald-600")}>
                          ₹{Number(g.balanceAmount||0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-100 text-slate-500 font-medium text-[11px]">{g.notes || '—'}</td>
                      <td className="p-3 border-r border-slate-100 text-slate-400 text-[10px] font-semibold">{new Date(g.createdAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short'})}</td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleDeleteGuide(g.id, g.guideName)}
                          className="h-7 w-7 text-red-400 hover:bg-red-50 hover:text-red-600 rounded"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom summary bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-3 flex items-center justify-between text-xs font-semibold">
              <span>{dbGuides.length === 0 ? 'No guides assigned' : `${dbGuides.length} guide${dbGuides.length !== 1 ? 's' : ''} assigned to this departure`}</span>
              <span className="text-slate-400 text-[10px]">All changes saved to database automatically</span>
            </div>
          </div>
        )}


        {/* ──────────────────────── ACTIVITIES ──────────────────────── */}
        {activeTab === "activities" && (
          <DepartureActivities
            tripId={tripId}
            departureDateStr={departureDateStr}
            tripDetails={tripDetails}
            tripVendors={tripVendors}
            activitiesList={activitiesList}
            fetchPageData={fetchPageData}
            setActivitiesList={setActivitiesList}
            api={api}
          />
        )}
                {/* ──────────────────────── PAYMENTS ──────────────────────── */}
        {activeTab === "payments" && (
          <DeparturePayments
            tripId={tripId}
            departureDateStr={departureDateStr}
            tripDetails={tripDetails}
            tripVendors={tripVendors}
          />
        )}
                {/* ──────────────────────── TASKS ──────────────────────── */}
        {activeTab === "tasks" && (
          <DepartureTasks
            tripId={tripId}
            departureDateStr={departureDateStr}
          />
        )}
                {/* ──────────────────────── DOCUMENTS ──────────────────────── */}
        {activeTab === "documents" && (
          <DepartureDocuments
            tripId={tripId}
            departureDateStr={departureDateStr}
          />
        )}
                {/* ──────────────────────── COMMUNICATION ──────────────────────── */}
        {activeTab === "communication" && (
          <DepartureCommunication
            tripId={tripId}
            departureDateStr={departureDateStr}
            tripDetails={tripDetails}
          />
        )}
                {/* ──────────────────────── REPORTS ──────────────────────── */}
        {activeTab === "reports" && (
          <DepartureReports
            tripId={tripId}
            departureDateStr={departureDateStr}
          />
        )}
              {bookingModalOpen && selectedBooking && (
        <BookingDetailsModal
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          booking={selectedBooking}
          onRefresh={() => {}}
        />
      )}

      {addTaskModalOpen && (
        <Dialog open={addTaskModalOpen} onOpenChange={setAddTaskModalOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-800">Create Custom Task</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Add a new operational task checklist item for this departure.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Task Name</label>
                <input
                  type="text"
                  required
                  placeholder="Confirm guide SIM cards"
                  value={newTaskName}
                  onChange={e => setNewTaskName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Checklist Stage</label>
                <select
                  value={newTaskStage}
                  onChange={e => setNewTaskStage(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                >
                  <option value="PRE_TRIP_30D">Pre-Trip (30 Days)</option>
                  <option value="PRE_TRIP_7D">Pre-Trip (7 Days)</option>
                  <option value="PRE_TRIP_1D">Pre-Trip (1 Day)</option>
                  <option value="DEPARTURE_DAY">Departure Day</option>
                  <option value="DURING_TRIP">During Trip</option>
                  <option value="POST_TRIP">Post-Trip</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Description / Notes</label>
                <textarea
                  placeholder="Additional task briefing..."
                  value={newTaskNotes}
                  onChange={e => setNewTaskNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddTaskModalOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >
                  Save Task
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {editDepartureOpen && (
        <Dialog open={editDepartureOpen} onOpenChange={setEditDepartureOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-800">Edit Departure Settings</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Update general information, guide assignments, or status for this batch.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditDepartureSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Lead Guide Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dikshu Sharma"
                  value={editGuideName}
                  onChange={e => setEditGuideName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Departure Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditDepartureOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {addPassengerOpen && (
        <Dialog open={addPassengerOpen} onOpenChange={setAddPassengerOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-800">Add Passenger Manifest</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Record a new manual passenger booking for this departure date.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPassengerSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={newPaxName}
                  onChange={e => setNewPaxName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Phone / Mobile</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={newPaxPhone}
                  onChange={e => setNewPaxPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Age</label>
                  <input
                    type="number"
                    value={newPaxAge}
                    onChange={e => setNewPaxAge(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Gender</label>
                  <select
                    value={newPaxGender}
                    onChange={e => setNewPaxGender(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Amount (₹)</label>
                <input
                  type="number"
                  value={newPaxAmount}
                  onChange={e => setNewPaxAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddPassengerOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >
                  Add Passenger
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}



      {editTransportOpen && (
        <Dialog open={editTransportOpen} onOpenChange={setEditTransportOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-800">Edit Transport Asset</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Update vehicle details, route, driver profile, or vendor pricing.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTransportSubmit} className="space-y-3.5 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Vehicle Type</label>
                  <input
                    type="text"
                    required
                    value={vehicleTypeForm}
                    onChange={e => setVehicleTypeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Seating Capacity</label>
                  <input
                    type="number"
                    value={capacityForm}
                    onChange={e => setCapacityForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Route</label>
                <input
                  type="text"
                  required
                  value={routeForm}
                  onChange={e => setRouteForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Driver Name</label>
                  <input
                    type="text"
                    value={driverNameForm}
                    onChange={e => setDriverNameForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Driver Phone</label>
                  <input
                    type="text"
                    value={driverPhoneForm}
                    onChange={e => setDriverPhoneForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Cost (₹)</label>
                  <input
                    type="number"
                    value={transportCostForm}
                    onChange={e => setTransportCostForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={transportPaidForm}
                    onChange={e => setTransportPaidForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Notes / Special Instructions</label>
                <textarea
                  value={transportNotesForm}
                  onChange={e => setTransportNotesForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] h-16 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTransportOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >
                  Save Fleet Details
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {editTrainOpen && (
        <Dialog open={editTrainOpen} onOpenChange={setEditTrainOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-800">Edit Train Booking details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Update train name, PNR number, routing stations, schedules, or booked seats.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTrainSubmit} className="space-y-3.5 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Train Name / No.</label>
                  <input
                    type="text"
                    required
                    value={trainNameForm}
                    onChange={e => setTrainNameForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">PNR Number</label>
                  <input
                    type="text"
                    required
                    value={trainPnrForm}
                    onChange={e => setTrainPnrForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">From (Station)</label>
                  <input
                    type="text"
                    required
                    value={trainFromForm}
                    onChange={e => setTrainFromForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">To (Station)</label>
                  <input
                    type="text"
                    required
                    value={trainToForm}
                    onChange={e => setTrainToForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Departure Time</label>
                  <input
                    type="text"
                    required
                    value={trainDepTimeForm}
                    onChange={e => setTrainDepTimeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Arrival Time</label>
                  <input
                    type="text"
                    required
                    value={trainArrTimeForm}
                    onChange={e => setTrainArrTimeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Date</label>
                  <input
                    type="text"
                    required
                    value={trainDateForm}
                    onChange={e => setTrainDateForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Booked Seats</label>
                  <input
                    type="text"
                    required
                    value={trainSeatsForm}
                    onChange={e => setTrainSeatsForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</label>
                <select
                  value={trainStatusForm}
                  onChange={e => setTrainStatusForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTrainOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >
                  Save Train Details
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {shuffleModalOpen && shufflingTraveler && (
        <Dialog open={shuffleModalOpen} onOpenChange={setShuffleModalOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-800">Reshuffle Traveler</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Change room assignment and transport allocation for <strong>{shufflingTraveler.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Room Assignment</label>
                <input
                  type="text"
                  placeholder="e.g. Room 101, Group No. 1"
                  value={shuffleRoom === "—" ? "" : shuffleRoom}
                  onChange={(e) => setShuffleRoom(e.target.value || "—")}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Vehicle Assignment</label>
                <select
                  value={shuffleVehicle}
                  onChange={(e) => setShuffleVehicle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                >
                  <option value="—">Unassigned</option>
                  {allocFleet.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.vehicleType})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Seat Number</label>
                <input
                  type="text"
                  placeholder="e.g. 1, 12, Window"
                  value={shuffleSeat === "—" ? "" : shuffleSeat}
                  onChange={(e) => setShuffleSeat(e.target.value || "—")}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShuffleModalOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const matchedFleet = allocFleet.find(f => f.id === shuffleVehicle);
                    const vehicleVal = matchedFleet ? matchedFleet.name : shuffleVehicle;
                    setPassengerAllocations(prev => ({
                      ...prev,
                      [shufflingTraveler.name]: {
                        room: shuffleRoom,
                        vehicle: vehicleVal,
                        seat: shuffleSeat
                      }
                    }));
                    toast.success(`Updated allocations for ${shufflingTraveler.name}`);
                    setShuffleModalOpen(false);
                  }}
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >
                  Save Reshuffle
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {addRoomModalOpen && (
        <Dialog open={addRoomModalOpen} onOpenChange={setAddRoomModalOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-800">Add Custom Room</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Create an empty room placeholder to shuffle travelers into.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Room Name / Number</label>
                <input
                  type="text"
                  placeholder="e.g. Room 105, Cottage 3"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddRoomModalOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleanName = newRoomName.trim();
                    if (!cleanName) {
                      toast.error("Please enter a room name");
                      return;
                    }
                    if (manualRooms.includes(cleanName)) {
                      toast.error("Room already exists");
                      return;
                    }
                    setManualRooms(prev => [...prev, cleanName]);
                    toast.success(`Created room: ${cleanName}`);
                    setNewRoomName("");
                    setAddRoomModalOpen(false);
                  }}
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >
                  Create Room
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedBookingForRoomAlloc && (() => {
        const bg = selectedBookingForRoomAlloc;
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[999] p-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-800 text-sm">Allocate Rooms & Relationships</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Booking: {bg.bookingRef} — {bg.leadName}'s Group ({bg.totalPassengers} Passengers)</p>
                </div>
                <button onClick={() => setSelectedBookingForRoomAlloc(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                <div className="space-y-3.5">
                  {bg.passengers.map((p: any) => {
                    const current = modalAllocations[p.name] || { roomType: "Individual", coupleWith: "", roomNo: "—" };
                    return (
                      <div key={p.id || p.name} className="p-3 bg-slate-50 rounded border border-slate-100 flex flex-wrap items-center gap-3 justify-between">
                        <div className="min-w-[150px]">
                          <div className="font-bold text-slate-800 text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-500">{p.gender}, {p.age} yrs {p.isLead ? "• Lead" : ""}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Relationship Dropdown */}
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Relationship</label>
                             <select
                              value={current.roomType}
                              onChange={(e) => handleModalFieldChange(p.name, "roomType", e.target.value)}
                              className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none w-28 h-7"
                            >
                              <option value="Couple">Couple</option>
                              <option value="Double">Double Sharing</option>
                              <option value="Family">Family</option>
                              <option value="Friends">Friends</option>
                              <option value="Triple Sharing">Triple Sharing</option>
                              <option value="Individual">Individual</option>
                            </select>
                          </div>

                          {/* Couple With Dropdown */}
                          {(current.roomType === "Couple" || current.roomType === "Double") && (
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Couple With</label>
                              <select
                                value={current.coupleWith}
                                onChange={(e) => handleModalFieldChange(p.name, "coupleWith", e.target.value)}
                                className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none w-28 h-7"
                              >
                                <option value="">Select Partner</option>
                                {bg.passengers
                                  .filter((other: any) => other.name !== p.name)
                                  .map((other: any) => (
                                    <option key={other.name} value={other.name}>{other.name}</option>
                                  ))}
                              </select>
                            </div>
                          )}

                          {/* Room Number Input */}
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Room No</label>
                            <input
                              type="text"
                              value={current.roomNo === "—" ? "" : current.roomNo}
                              onChange={(e) => handleModalFieldChange(p.name, "roomNo", e.target.value)}
                              placeholder="e.g. Room 101"
                              className="px-2 py-1 h-7 text-xs border border-slate-200 rounded focus:outline-none w-24"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 rounded-b-lg">
                <button
                  onClick={() => setSelectedBookingForRoomAlloc(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRoomAllocations}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 font-bold transition-colors"
                >
                  Save Allocations
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      </div>
    </div>
  );
}
