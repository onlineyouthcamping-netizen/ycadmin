import { normalizePassenger } from "@/utils/passengerUtils";
import { calculateReadinessScore } from "@/utils/readinessUtils";
import { isPassengerCancelled, filterActivePassengers } from "@/utils/departure/passengerStatus";
import { getBookingGroupKey, groupPassengersByBooking } from "@/utils/departure/passengerAllocation";
import { calculateBookingFinancialStatus, safeNumber } from "@/utils/departure/paymentCalculator";
import { calculateRoomOccupancy } from "@/utils/departure/accommodationCalculator";
import { saveActivityToBackend } from "@/utils/departure/activityMapper";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  User,
  Compass,
  Upload,
  Download,
  FileText,
  ClipboardList,
  CheckCircle2,
  MoreHorizontal,
  MessageSquare,
  PhoneCall,
  ChevronDown,
  Info,
  Search,
  X,
  Plus,
  Printer,
  Bed,
  Bus,
  Sliders,
  Settings,
  FileSpreadsheet,
  ClipboardCheck,
  Check,
  AlertTriangle,
  Clock,
  MapPin,
  Star,
  Link2,
  Paperclip,
  Image,
  History,
  Trash,
  Copy,
  Smile,
  AtSign,
  Send,
  Shield,
  Folder,
  Filter,
  RefreshCw,
  MoreVertical,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Circle,
  PauseCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  CreditCard,
  BarChart2,
  Activity,
  CalendarCheck,
  Sparkles,
  MessageCircle
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
import DepartureTicketing from "@/components/admin/DepartureTicketing";
import StationPaymentCollection from "@/components/admin/StationPaymentCollection";
import VendorImportWizard from "@/components/admin/VendorImportWizard";
import HotelCalculator from "@/components/admin/hotels/HotelCalculator";
import AccommodationWorkspace from "@/components/admin/departure/AccommodationWorkspace";
import HotelAssignmentWizardModal from "@/components/admin/departure/HotelAssignmentWizardModal";
import DepartureTripControl from "@/components/admin/departure/DepartureTripControl";
import DepartureMoneySummary from "@/components/admin/departure/DepartureMoneySummary";
import { MobileDepartureWorkspace } from "@/components/mobile/MobileDepartureWorkspace";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
// ─── Spiti Valley Mock Itineraries ───
const MOCK_SPITI_ITINERARY = [
  {
    day: "Day 1",
    wd: "MON",
    date: "14 Jul 2026",
    plan: "Delhi → Shimla",
    sub: "Drive to Shimla",
    stay: "Shimla",
    stayType: "Hotel Ridge View",
    stayBadge: "DELUXE",
    travel: "340 KM",
    travelSub: "8 Hrs",
    meals: "Dinner",
    activities: "Mall Road Stroll",
    status: "ON TIME",
  },
  {
    day: "Day 2",
    wd: "TUE",
    date: "15 Jul 2026",
    plan: "Shimla → Sangla",
    sub: "Scenic Kinnaur Highway",
    stay: "Sangla",
    stayType: "Kinner Camps",
    stayBadge: "CAMP",
    travel: "220 KM",
    travelSub: "7 Hrs",
    meals: "Breakfast Dinner",
    activities: "Sangla Valley View",
    status: "ON TIME",
  },
  {
    day: "Day 3",
    wd: "WED",
    date: "16 Jul 2026",
    plan: "Sangla → Chitkul → Kalpa",
    sub: "Visit Last Indian Village",
    stay: "Kalpa",
    stayType: "Hotel Kinner Kailash",
    stayBadge: "DELUXE",
    travel: "90 KM",
    travelSub: "4 Hrs",
    meals: "Breakfast Dinner",
    activities: "Chitkul Village, Kalpa Fort",
    status: "ON TIME",
  },
  {
    day: "Day 4",
    wd: "THU",
    date: "17 Jul 2026",
    plan: "Kalpa → Nako → Tabo → Kaza",
    sub: "Enter Spiti Valley",
    stay: "Kaza",
    stayType: "Spiti Heritage Hotel",
    stayBadge: "DELUXE",
    travel: "200 KM",
    travelSub: "8 Hrs",
    meals: "Breakfast Dinner",
    activities: "Nako Lake, Tabo Monastery",
    status: "ON TIME",
  },
  {
    day: "Day 5",
    wd: "FRI",
    date: "18 Jul 2026",
    plan: "Kaza Local Sightseeing",
    sub: "Key Monastery & Kibber",
    stay: "Kaza",
    stayType: "Spiti Heritage Hotel",
    stayBadge: "DELUXE",
    travel: "Local",
    travelSub: "50 KM",
    meals: "Breakfast Dinner",
    activities: "Key Monastery, Kibber Village",
    status: "ON TIME",
  },
  {
    day: "Day 6",
    wd: "SAT",
    date: "19 Jul 2026",
    plan: "Kaza → Hikkim → Komic → Langza",
    sub: "Highest Post Office & Fossils",
    stay: "Kaza",
    stayType: "Spiti Heritage Hotel",
    stayBadge: "DELUXE",
    travel: "Local",
    travelSub: "60 KM",
    meals: "Breakfast Dinner",
    activities: "Highest Post Office, Langza Buddha",
    status: "ON TIME",
  },
  {
    day: "Day 7",
    wd: "SUN",
    date: "20 Jul 2026",
    plan: "Kaza → Chandra Taal",
    sub: "Drive to Crescent Moon Lake",
    stay: "Chandra Taal",
    stayType: "Parasol Camps",
    stayBadge: "CAMP",
    travel: "100 KM",
    travelSub: "5 Hrs",
    meals: "Breakfast Dinner",
    activities: "Chandra Taal Lake Walk",
    status: "ON TIME",
  },
  {
    day: "Day 8",
    wd: "MON",
    date: "21 Jul 2026",
    plan: "Chandra Taal → Manali",
    sub: "Cross Kunzum Pass & Rohtang",
    stay: "Manali",
    stayType: "Hotel Mountain View",
    stayBadge: "DELUXE",
    travel: "120 KM",
    travelSub: "6 Hrs",
    meals: "Breakfast Dinner",
    activities: "Manali Local Markets",
    status: "ON TIME",
  },
  {
    day: "Day 9",
    wd: "TUE",
    date: "22 Jul 2026",
    plan: "Manali → Delhi",
    sub: "Overnight Volvo Return",
    stay: "—",
    stayType: "",
    travel: "Volvo Bus",
    travelSub: "Departure: 06:00 PM",
    meals: "Breakfast",
    activities: "—",
    status: "ON TIME",
  },
];

const MOCK_SPITI_ACTIVITIES = [
  {
    day: "Day 1",
    wd: "14 Jul, Mon",
    act: "Delhi to Shimla Transfer",
    sub: "Scenic mountain drive",
    type: "TRAVEL",
    inc: true,
    time: "07:00 AM - 04:00 PM",
    loc: "Shimla",
    status: "CONFIRMED",
    statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    day: "Day 2",
    wd: "15 Jul, Tue",
    act: "Sangla Transfer",
    sub: "Drive along Sutlej river",
    type: "TRAVEL",
    inc: true,
    time: "08:00 AM - 03:00 PM",
    loc: "Sangla",
    status: "CONFIRMED",
    statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    day: "Day 3",
    wd: "16 Jul, Wed",
    act: "Chitkul Excursion",
    sub: "Visit Chitkul & Kalpa transfer",
    type: "SIGHTSEEING",
    inc: true,
    time: "09:00 AM - 05:00 PM",
    loc: "Chitkul",
    status: "CONFIRMED",
    statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    day: "Day 4",
    wd: "17 Jul, Thu",
    act: "Kaza Transfer",
    sub: "Enroute Tabo & Nako",
    type: "TRAVEL",
    inc: true,
    time: "07:30 AM - 05:30 PM",
    loc: "Kaza",
    status: "CONFIRMED",
    statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    day: "Day 5",
    wd: "18 Jul, Fri",
    act: "Key Monastery Visit",
    sub: "Explore Key & Kibber",
    type: "SIGHTSEEING",
    inc: true,
    time: "10:00 AM - 04:00 PM",
    loc: "Key",
    status: "CONFIRMED",
    statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    day: "Day 6",
    wd: "19 Jul, Sat",
    act: "Hikkim & Komic Post Offices",
    sub: "Send a postcard, Langza Buddha",
    type: "SIGHTSEEING",
    inc: true,
    time: "09:30 AM - 05:00 PM",
    loc: "Hikkim",
    status: "CONFIRMED",
    statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    day: "Day 7",
    wd: "20 Jul, Sun",
    act: "Chandra Taal Transfer",
    sub: "Cross Kunzum Pass",
    type: "TRAVEL",
    inc: true,
    time: "08:00 AM - 03:00 PM",
    loc: "Chandra Taal",
    status: "CONFIRMED",
    statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    day: "Day 8",
    wd: "21 Jul, Mon",
    act: "Manali Transfer",
    sub: "Enroute Rohtang tunnel",
    type: "TRAVEL",
    inc: true,
    time: "08:00 AM - 04:00 PM",
    loc: "Manali",
    status: "CONFIRMED",
    statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    day: "Day 9",
    wd: "22 Jul, Tue",
    act: "Delhi Return",
    sub: "Volvo from Manali",
    type: "TRAVEL",
    inc: true,
    time: "06:00 PM",
    loc: "Manali",
    status: "CONFIRMED",
    statusClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
];

const MOCK_ACTIVITIES = [
  {
    id: "a1",
    day: "Day 1",
    date: "05 Jul, Sat",
    activity: "Volvo Journey",
    sub: "Ahmedabad → Chandigarh",
    type: "TRAVEL",
    included: true,
    time: "09:00 PM",
    location: "Ahmedabad",
    status: "CONFIRMED",
  },
  {
    id: "a2",
    day: "Day 2",
    date: "06 Jul, Sun",
    activity: "Manali Local Sightseeing",
    sub: "Hidimba Temple, Mall Road",
    type: "SIGHTSEEING",
    included: true,
    time: "10:00 AM - 06:00 PM",
    location: "Manali",
    status: "CONFIRMED",
  },
  {
    id: "a3",
    day: "Day 3",
    date: "07 Jul, Mon",
    activity: "Solang Valley Visit",
    sub: "Ropeway, Snow Point (if Open)",
    type: "SIGHTSEEING",
    included: true,
    time: "09:30 AM - 05:00 PM",
    location: "Solang Valley",
    status: "CONFIRMED",
  },
  {
    id: "a4",
    day: "Day 4",
    date: "08 Jul, Tue",
    activity: "Kasol Visit",
    sub: "Kasol Market, Cafes",
    type: "SIGHTSEEING",
    included: true,
    time: "11:00 AM - 07:00 PM",
    location: "Kasol",
    status: "CONFIRMED",
  },
  {
    id: "a5",
    day: "Day 5",
    date: "09 Jul, Wed",
    activity: "Kullu → Manikaran Sahib",
    sub: "Hot Springs & Gurudwara",
    type: "SIGHTSEEING",
    included: true,
    time: "08:30 AM - 05:30 PM",
    location: "Manikaran",
    status: "CONFIRMED",
  },
  {
    id: "a6",
    day: "Day 6",
    date: "10 Jul, Thu",
    activity: "Kasol to Amritsar Transfer",
    sub: "Enroute sightseeing",
    type: "TRAVEL",
    included: true,
    time: "08:00 AM - 08:00 PM",
    location: "Amritsar",
    status: "CONFIRMED",
  },
  {
    id: "a7",
    day: "Day 7",
    date: "11 Jul, Fri",
    activity: "Golden Temple Visit",
    sub: "Darshan & Palki Sahib",
    type: "SIGHTSEEING",
    included: true,
    time: "05:00 AM - 09:00 AM",
    location: "Amritsar",
    status: "CONFIRMED",
  },
  {
    id: "a8",
    day: "Day 8",
    date: "12 Jul, Sat",
    activity: "Wagah Border Ceremony",
    sub: "Beating Retreat Ceremony",
    type: "SIGHTSEEING",
    included: true,
    time: "04:30 PM - 06:00 PM",
    location: "Wagah Border",
    status: "PENDING",
  },
  {
    id: "a9",
    day: "Day 9",
    date: "13 Jul, Sun",
    activity: "Train Journey",
    sub: "Amritsar → Ahmedabad",
    type: "TRAVEL",
    included: false,
    time: "07:00 PM",
    location: "Amritsar",
    status: "CANCELLED",
  },
  {
    id: "a10",
    day: "Optional",
    date: "",
    activity: "River Rafting",
    sub: "Beas River (Extra Cost)",
    type: "ADVENTURE",
    included: false,
    time: "—",
    location: "Kullu",
    status: "OPTIONAL",
  },
];

const MOCK_PAYMENTS = [
  {
    id: "YC/MKA/0705/001",
    passenger: "Rohit Patel",
    pax: 2,
    phone: "98765 43210",
    plan: "Standard Plan",
    amount: 28000,
    paid: 28000,
    pending: 0,
    mode: "UPI",
    modeDetail: "UPI ID: rohit@okaxis",
    status: "PAID",
    lastPayment: "28 Jun 2027, 09:30 AM",
    bookingStatus: "CONFIRMED",
  },
  {
    id: "YC/MKA/0705/002",
    passenger: "Anjali Mehta",
    pax: 1,
    phone: "98765 43211",
    plan: "Standard Plan",
    amount: 14000,
    paid: 7000,
    pending: 7000,
    mode: "Bank Transfer",
    modeDetail: "HDFC - 4567",
    status: "PARTIALLY PAID",
    lastPayment: "20 Jun 2027, 03:42 PM",
    bookingStatus: "CONFIRMED",
  },
  {
    id: "YC/MKA/0705/003",
    passenger: "Devang Shah",
    pax: 3,
    phone: "98765 43212",
    plan: "Standard Plan",
    amount: 42000,
    paid: 42000,
    pending: 0,
    mode: "Credit Card",
    modeDetail: "**** **** **** 1234",
    status: "PAID",
    lastPayment: "18 Jun 2027, 11:07 AM",
    bookingStatus: "CONFIRMED",
  },
  {
    id: "YC/MKA/0705/004",
    passenger: "Priya Joshi",
    pax: 1,
    phone: "98765 43213",
    plan: "Standard Plan",
    amount: 14000,
    paid: 0,
    pending: 14000,
    mode: "—",
    modeDetail: "—",
    status: "UNPAID",
    lastPayment: "—",
    bookingStatus: "CONFIRMED",
  },
  {
    id: "YC/MKA/0705/005",
    passenger: "Harsh Vora",
    pax: 2,
    phone: "98765 43214",
    plan: "Standard Plan",
    amount: 28000,
    paid: 14000,
    pending: 14000,
    mode: "UPI",
    modeDetail: "UPI ID: harshvora@okicici",
    status: "PARTIALLY PAID",
    lastPayment: "25 Jun 2027, 08:30 PM",
    bookingStatus: "CONFIRMED",
  },
  {
    id: "YC/MKA/0705/006",
    passenger: "Khyati Desai",
    pax: 1,
    phone: "98765 43215",
    plan: "Standard Plan",
    amount: 14000,
    paid: 14000,
    pending: 0,
    mode: "Net Banking",
    modeDetail: "ICICI – 7890",
    status: "PAID",
    lastPayment: "22 Jun 2027, 10:11 PM",
    bookingStatus: "CONFIRMED",
  },
  {
    id: "YC/MKA/0705/007",
    passenger: "Manan Trivedi",
    pax: 1,
    phone: "98765 43216",
    plan: "Standard Plan",
    amount: 14000,
    paid: 14000,
    pending: 0,
    mode: "UPI",
    modeDetail: "—",
    status: "REFUNDED",
    lastPayment: "26 Jun 2027, 05:20 PM",
    bookingStatus: "CANCELLED",
  },
  {
    id: "YC/MKA/0705/008",
    passenger: "Aayushi Rawal",
    pax: 2,
    phone: "98765 43217",
    plan: "Standard Plan",
    amount: 28000,
    paid: 14000,
    pending: 14000,
    mode: "Bank Transfer",
    modeDetail: "SBI – 1122",
    status: "PARTIALLY PAID",
    lastPayment: "19 Jun 2027, 02:55 PM",
    bookingStatus: "CONFIRMED",
  },
];

const MOCK_TASKS = [
  {
    id: "t1",
    task: "Collect balance payments from 6 passengers",
    sub: "Booking IDs: 002, 004, 005, 008, 011, 013",
    category: "PAYMENTS",
    assignee: "Suresh Kumar",
    role: "Accounting",
    priority: "HIGH",
    dueDate: "02 Jul 2027",
    dueNote: "2 days left",
    status: "IN PROGRESS",
    createdOn: "28 Jun 2027, 10:15 AM",
  },
  {
    id: "t2",
    task: "Verify ID proofs of all passengers",
    sub: "Aadhar / PAN / Passport",
    category: "DOCUMENTS",
    assignee: "Neeki Patel",
    role: "Operations",
    priority: "MEDIUM",
    dueDate: "01 Jul 2027",
    dueNote: "Tomorrow",
    status: "IN PROGRESS",
    createdOn: "28 Jun 2027, 11:30 AM",
  },
  {
    id: "t3",
    task: "Confirm hotel bookings & vouchers",
    sub: "All 9 nights",
    category: "HOTELS",
    assignee: "Parth Rathod",
    role: "Operations",
    priority: "HIGH",
    dueDate: "29 Jun 2027",
    dueNote: "Today",
    status: "OVERDUE",
    createdOn: "27 Jun 2027, 04:45 PM",
  },
  {
    id: "t4",
    task: "Confirm tempo & driver details",
    sub: "Vehicle: GJ01XX1234, GJ01XX5678",
    category: "TRANSPORT",
    assignee: "Neeki Patel",
    role: "Operations",
    priority: "MEDIUM",
    dueDate: "29 Jun 2027",
    dueNote: "Today",
    status: "COMPLETED",
    createdOn: "27 Jun 2027, 02:20 PM",
  },
  {
    id: "t5",
    task: "Share final trip details with guides",
    sub: "Itinerary, contact list, SOPs",
    category: "GUIDES",
    assignee: "Dikshu Sharma",
    role: "Lead Guide",
    priority: "LOW",
    dueDate: "30 Jun 2027",
    dueNote: "1 day left",
    status: "PENDING",
    createdOn: "27 Jun 2027, 01:10 PM",
  },
  {
    id: "t6",
    task: "Medical kit check & restock",
    sub: "All items as per checklist",
    category: "OPERATIONS",
    assignee: "Neeki Patel",
    role: "Operations",
    priority: "MEDIUM",
    dueDate: "01 Jul 2027",
    dueNote: "Tomorrow",
    status: "PENDING",
    createdOn: "28 Jun 2027, 12:05 PM",
  },
  {
    id: "t7",
    task: "Prepare guest welcome kit",
    sub: "T-shirts, badges, itinerary",
    category: "OPERATIONS",
    assignee: "Parth Rathod",
    role: "Operations",
    priority: "LOW",
    dueDate: "03 Jul 2027",
    dueNote: "3 days left",
    status: "NOT STARTED",
    createdOn: "28 Jun 2027, 05:20 PM",
  },
  {
    id: "t8",
    task: "Create WhatsApp group & add members",
    sub: "Share group rules & itinerary",
    category: "COMMUNICATION",
    assignee: "Neel Mehta",
    role: "Support",
    priority: "LOW",
    dueDate: "30 Jun 2027",
    dueNote: "1 day left",
    status: "COMPLETED",
    createdOn: "27 Jun 2027, 03:00 PM",
  },
];

const MOCK_DOC_CATEGORIES = [
  { id: "all", label: "All Documents", count: 128, active: true },
  { id: "bk", label: "Bookings & Payments", count: 24 },
  { id: "cust", label: "Customer Documents", count: 28 },
  { id: "trans", label: "Transport", count: 16 },
  { id: "hotels", label: "Hotels", count: 18 },
  { id: "guides", label: "Guides", count: 12 },
  { id: "ops", label: "Operations", count: 14 },
  { id: "fin", label: "Finance", count: 8 },
  { id: "legal", label: "Legal & Compliance", count: 6 },
  { id: "mktg", label: "Marketing", count: 4 },
  { id: "other", label: "Other", count: 2 },
  { id: "arch", label: "Archived", count: 8 },
];

const MOCK_DOCUMENTS = [
  {
    id: "d1",
    name: "MKA-0705 Booking Summary",
    sub: "v1.2",
    category: "Bookings & Payments",
    subcat: "Booking Summary",
    uploadedBy: "Suresh Kumar",
    role: "Accounting",
    uploadedOn: "28 Jun 2027, 10:15 AM",
    status: "VERIFIED",
  },
  {
    id: "d2",
    name: "Passenger List",
    sub: "Total 57 Pax",
    category: "Customer Documents",
    subcat: "Passenger List",
    uploadedBy: "Neeki Patel",
    role: "Operations",
    uploadedOn: "28 Jun 2027, 09:40 AM",
    status: "VERIFIED",
  },
  {
    id: "d3",
    name: "Payment Received Report",
    sub: "As on 28 Jun 2027",
    category: "Finance",
    subcat: "Collection Report",
    uploadedBy: "Suresh Kumar",
    role: "Accounting",
    uploadedOn: "28 Jun 2027, 09:20 AM",
    status: "VERIFIED",
  },
  {
    id: "d4",
    name: "Hotel Booking Vouchers",
    sub: "All 9 Nights",
    category: "Hotels",
    subcat: "Vouchers",
    uploadedBy: "Neeki Patel",
    role: "Operations",
    uploadedOn: "27 Jun 2027, 06:30 PM",
    status: "PENDING",
  },
  {
    id: "d5",
    name: "Vehicle Details & RC",
    sub: "2 Tempo Travellers",
    category: "Transport",
    subcat: "Vehicle Documents",
    uploadedBy: "Parth Rathod",
    role: "Operations",
    uploadedOn: "27 Jun 2027, 04:10 PM",
    status: "VERIFIED",
  },
  {
    id: "d6",
    name: "Guide ID Proofs",
    sub: "All Guide Documents",
    category: "Guides",
    subcat: "ID Proof",
    uploadedBy: "Parth Rathod",
    role: "Operations",
    uploadedOn: "27 Jun 2027, 03:15 PM",
    status: "ACTION REQUIRED",
  },
  {
    id: "d7",
    name: "Itinerary – Final",
    sub: "Day wise plan",
    category: "Operations",
    subcat: "Itinerary",
    uploadedBy: "Dikshu Sharma",
    role: "Lead Guide",
    uploadedOn: "26 Jun 2027, 11:45 AM",
    status: "VERIFIED",
  },
  {
    id: "d8",
    name: "Emergency Contact List",
    sub: "Team & Vendors",
    category: "Operations",
    subcat: "Emergency",
    uploadedBy: "Neel Mehta",
    role: "Support",
    uploadedOn: "26 Jun 2027, 10:20 AM",
    status: "PENDING",
  },
];

const MOCK_CONV_LIST = [
  {
    id: "g1",
    name: "MKA-0705 – General Group",
    sub: "Dikshu Sharma: Meeting point details for...",
    time: "10:30 AM",
    unread: 1,
    type: "group",
    icon: "🏕️",
  },
  {
    id: "g2",
    name: "Pre-Departure Info",
    sub: "Kumar: Please carry original ID proofs.",
    time: "Yesterday",
    unread: 3,
    type: "group",
    icon: "📋",
  },
  {
    id: "g3",
    name: "Dikshu Sharma (Lead Guide)",
    sub: "You: Please share the expected weather...",
    time: "Yesterday",
    unread: 0,
    type: "direct",
    icon: "👤",
  },
  {
    id: "g4",
    name: "Suresh Kumar (Accounting)",
    sub: "Suresh: Payment received from 3 passengers",
    time: "28 Jun",
    unread: 0,
    type: "direct",
    icon: "💼",
  },
  {
    id: "g5",
    name: "Important Updates",
    sub: "Neeki Patel: Hotel change in Manali day 3",
    time: "27 Jun",
    unread: 0,
    type: "group",
    icon: "📢",
  },
  {
    id: "g6",
    name: "Parth Rathod (Operations)",
    sub: "You: Vehicle details confirmed?",
    time: "27 Jun",
    unread: 0,
    type: "direct",
    icon: "👤",
  },
  {
    id: "g7",
    name: "All Guides Group",
    sub: "Dikshu: Guide briefing tomorrow 8 PM.",
    time: "26 Jun",
    unread: 0,
    type: "group",
    icon: "🧭",
  },
  {
    id: "g8",
    name: "MKA-0705 – Batch 1",
    sub: "Passenger: Reached Delhi airport.",
    time: "26 Jun",
    unread: 0,
    type: "group",
    icon: "✈️",
  },
];

const MOCK_MESSAGES = [
  {
    id: "m1",
    sender: "Dikshu Sharma",
    role: "Lead Guide",
    avatar: "DS",
    time: "10:10 AM",
    text: "Good morning everyone! 👋\nPlease find the meeting point details below.\nReach at 6:00 AM sharp at Majnu Ka Tilla, Delhi.\nOur team will be there with the Tempo Traveller.",
    reactions: [{ emoji: "👍", count: 8 }],
    isMine: false,
  },
  {
    id: "m2",
    convId: "g1",
    sender: "Neeki Patel",
    role: "Operations",
    avatar: "NP",
    time: "10:22 AM",
    text: "Please carry your original ID proofs.\nAlso ensure your luggage is not more than 15 kg.\nFor any queries, contact us on the given numbers.",
    reactions: [{ emoji: "👍", count: 6 }],
    isMine: false,
  },
  {
    id: "m3",
    convId: "g2",
    sender: "Parth Rathod",
    role: "Operations",
    avatar: "PR",
    time: "10:28 AM",
    text: "Weather update for Manali (Day 2 to Day 4):\nMin 12°C / Max 23°C, light rain expected.\nPlease carry raincoat and proper shoes.",
    reactions: [],
    isMine: false,
  },
  {
    id: "m4",
    sender: "Hemal Patel",
    role: "You",
    avatar: "HP",
    time: "10:30 AM",
    text: "Thanks team! Have a safe journey everyone.\nSee you all tomorrow! 😊",
    reactions: [
      { emoji: "❤️", count: 1 },
      { emoji: "👍", count: 2 },
    ],
    isMine: true,
  },
];

const MOCK_PARTICIPANTS = [
  { name: "Dikshu Sharma", role: "Lead Guide", badge: "Admin" },
  { name: "Neeki Patel", role: "Operations", badge: "Admin" },
  { name: "Suresh Kumar", role: "Accounting", badge: "Admin" },
  { name: "Parth Rathod", role: "Operations", badge: "Admin" },
  { name: "Hemal Patel", role: "You", badge: "Admin" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
    OPTIONAL: "bg-purple-50 text-purple-700 border-purple-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "PARTIALLY PAID": "bg-amber-50 text-amber-700 border-amber-200",
    UNPAID: "bg-red-50 text-red-600 border-red-200",
    REFUNDED: "bg-blue-50 text-blue-700 border-blue-200",
    "IN PROGRESS": "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    OVERDUE: "bg-red-50 text-red-600 border-red-200",
    "NOT STARTED": "bg-slate-100 text-slate-500 border-slate-200",
    VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "ACTION REQUIRED": "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-[3px] border text-[9px] font-black uppercase tracking-wider whitespace-nowrap",
        map[status] || "bg-slate-50 text-slate-500 border-slate-200",
      )}
    >
      {status}
    </span>
  );
};

const TypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, string> = {
    TRAVEL: "bg-blue-100 text-blue-700",
    SIGHTSEEING: "bg-indigo-100 text-indigo-700",
    ADVENTURE: "bg-orange-100 text-orange-700",
    COMMUNICATION: "bg-pink-100 text-pink-700",
    PAYMENTS: "bg-emerald-100 text-emerald-700",
    DOCUMENTS: "bg-purple-100 text-purple-700",
    HOTELS: "bg-amber-100 text-amber-700",
    TRANSPORT: "bg-cyan-100 text-cyan-700",
    GUIDES: "bg-teal-100 text-teal-700",
    OPERATIONS: "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider",
        map[type] || "bg-slate-100 text-slate-600",
      )}
    >
      {type}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const map: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider",
        map[priority] || "bg-slate-100 text-slate-600",
      )}
    >
      {priority}
    </span>
  );
};

const Avatar = ({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) => (
  <div
    className={cn(
      "w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0",
      className || "bg-[#F97316]",
    )}
  >
    {initials}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

// Helper to generate mock bookings for offline/fallback data
const generateMockBookings = (tripId: string, departureDateStr: string) => {
  const mockNames = [
    {
      name: "Aarav Mehta",
      gender: "Male",
      age: 24,
      phone: "9876543210",
      pickup: "Ahmedabad",
      email: "aarav.mehta@example.com",
    },
    {
      name: "Priya Sharma",
      gender: "Female",
      age: 22,
      phone: "9812345678",
      pickup: "Delhi",
      email: "priya.sharma@example.com",
    },
    {
      name: "Rahul Patel",
      gender: "Male",
      age: 27,
      phone: "9901234567",
      pickup: "Mumbai",
      email: "rahul.patel@example.com",
    },
    {
      name: "Sneha Reddy",
      gender: "Female",
      age: 23,
      phone: "8899887766",
      pickup: "Bangalore",
      email: "sneha.reddy@example.com",
    },
    {
      name: "Rohan Gupta",
      gender: "Male",
      age: 25,
      phone: "7766554433",
      pickup: "Vadodara",
      email: "rohan.gupta@example.com",
    },
    {
      name: "Ananya Rao",
      gender: "Female",
      age: 21,
      phone: "9012345678",
      pickup: "Delhi",
      email: "ananya.rao@example.com",
    },
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

    const coTravelersCount =
      i % 5 === 0 && passengerCount < 55
        ? 2
        : i % 3 === 0 && passengerCount < 56
          ? 1
          : 0;
    const coTravelersList: any[] = [];
    for (let c = 0; c < coTravelersCount; c++) {
      const coName = mockNames[(i + c + 7) % mockNames.length];
      coTravelersList.push({
        name: coName.name + " (Guest)",
        gender: coName.gender,
        age: coName.age + (c % 2 === 0 ? 1 : -1),
        phone: coName.phone,
        pickupPoint: coName.pickup,
        email: coName.email,
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
          idProof: "Uploaded",
        },
        persons: coTravelersList,
      },
    });
  }
  return bookingsArray;
};

export default function DepartureHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract from departureId if present (format: tripId_YYYY-MM-DD)
  const departureIdParam = searchParams.get("departureId");
  let resolvedTripId = searchParams.get("tripId") || "MKA-0705";
  let resolvedDepartureDateStr =
    searchParams.get("departureDate") || "2027-07-05";

  if (departureIdParam && departureIdParam.includes("_")) {
    const idx = departureIdParam.indexOf("_");
    resolvedTripId = departureIdParam.substring(0, idx);
    resolvedDepartureDateStr = departureIdParam.substring(idx + 1);
  }

  const tripId = resolvedTripId;
  const departureDateStr = resolvedDepartureDateStr;

  let rawTab = (searchParams.get("tab") || "overview").toLowerCase().trim();
  // Tab ID normalization
  if (["hotel", "accommodations", "accommodation", "itinerary"].includes(rawTab)) {
    rawTab = "hotels";
  } else if (rawTab === "allocation" || rawTab === "tempo") {
    rawTab = "transport";
  } else if (rawTab === "manifest") {
    rawTab = "passengers";
  } else if (["ticketing", "tasks"].includes(rawTab)) {
    rawTab = "operations";
  } else if (["money", "payments", "reports"].includes(rawTab)) {
    rawTab = "finance";
  } else if (["station", "stationpayments", "station_payments"].includes(rawTab)) {
    rawTab = "stationpayments";
  }
  const activeTab = rawTab;

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
    bookings
      .filter((b: any) => !isPassengerCancelled(null, b))
      .forEach((b: any) => {
        let passengersObj = b.passengers;
        if (typeof passengersObj === "string") {
          try {
            passengersObj = JSON.parse(passengersObj);
          } catch (e) {
            passengersObj = {};
          }
        }

        const fin = calculateBookingFinancialStatus(b);
        const due = fin.remainingAmount;
        const paymentLabel =
          fin.paymentStatus === "PAID"
            ? "Paid in Full"
            : fin.paymentStatus === "OVERPAID"
              ? "Overpaid"
              : fin.paymentStatus === "PARTIAL"
                ? "Partial Payment"
                : "Payment Pending";

        const roomDetailsObj = b.roomDetails || passengersObj?.details || {};
        const personsRoomDetails = roomDetailsObj.personsRoomDetails || {};

        const leadName = b.fullName || b.name;
        const leadRoomInfo = personsRoomDetails[leadName] || {};
        const leadRoomNo =
          leadRoomInfo.roomNo || passengersObj?.details?.roomAllocation || "—";
        const leadRoomType =
          leadRoomInfo.roomType ||
          b.roomSharing ||
          b.roomType ||
          passengersObj?.details?.roomType ||
          (b.numberOfTravelers === 1 ? "Individual" : "Double Sharing");
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
        const paxList = Array.isArray(passengersObj?.persons)
          ? passengersObj.persons
          : Array.isArray(passengersObj)
            ? passengersObj
            : [];
        const filteredCoPax = paxList.filter(
          (p: any) => normalizeCompareName(p?.name || "") !== normLeadName,
        );
        const passengerCount = filteredCoPax.length + 1;

        const perPersonAmount = (b.totalAmount || 12000) / passengerCount;
        const perPersonPaid = (b.advancePaid || 0) / passengerCount;
        const perPersonBalance = due > 0 ? due / passengerCount : 0;

        const trainOpt =
          b.trainOption ||
          b.trainClass ||
          passengersObj?.details?.trainClass ||
          passengersObj?.details?.trainOption ||
          (passengersObj?.persons && Array.isArray(passengersObj.persons) && passengersObj.persons[0]?.trainOption) ||
          "3 TIER AC TRAIN";

        const base = {
          bookingId: b.id,
          bookingRef: b.bookingId || b.id,
          bookingDate: b.createdAt?.substring(0, 10) || "2027-06-15",
          departureDate: b.departureDate?.substring(0, 10) || departureDateStr,
          batchGroup: "Batch 1",
          gender: b.gender || "Male",
          age: b.age || 24,
          phone: b.phone || b.mobile || "—",
          email: b.email || "—",
          pickupPoint: b.pickupCity || "Ahmedabad",
          dropPoint: "Manali",
          roomSharing: b.roomSharing || b.roomType || passengersObj?.details?.roomType || "Double Sharing",
          roomType: leadRoomType,
          coupleWith: leadCoupleWith,
          trainOption: trainOpt,
          trainClass: trainOpt,
          emergencyContact: "9876543211",
          roomNo: leadRoomNo,
          paymentStatus: paymentLabel,
          amount: perPersonAmount,
          paidAmount: perPersonPaid,
          balance: perPersonBalance,
          paymentMode: "UPI",
          paymentDate: "2027-06-16",
          idProofType: "Aadhar Card",
          guideName: "Dikshu Sharma",
          transportDetails: "Tempo Traveller AC",
          notes: b.notes || "No special requirements",
          hasDocs: !!passengersObj?.details?.idProof,
          ticketStatus: b.trainTicketStatus || "PENDING",
          ticketVerified: b.trainTicketStatus === "CONFIRMED",
          documentStatus:
            passengersObj?.details?.idProof || b.idProofType
              ? "Verified"
              : "Missing",
          leadPassengerName: b.fullName || b.name,
        };
        arr.push({ id: b.id, name: leadName, ...base, isLead: true });
        if (Array.isArray(passengersObj?.persons)) {
          passengersObj.persons.forEach((p: any, idx: number) => {
            if (normalizeCompareName(p.name) === normLeadName) return;

            const coRoomInfo = personsRoomDetails[p.name] || {};
            const coRoomNo = coRoomInfo.roomNo || "—";
            const coRoomType =
              coRoomInfo.roomType ||
              p.roomSharing ||
              b.roomSharing ||
              b.roomType ||
              passengersObj?.details?.roomType ||
              "Double Sharing";
            const coCoupleWith = coRoomInfo.coupleWith || "";
            const coTrainOpt = p.trainOption || p.trainClass || trainOpt;

            arr.push({
              id: `${b.id}-co-${idx}`,
              name: p.name,
              ...base,
              roomNo: coRoomNo,
              roomType: coRoomType,
              coupleWith: coCoupleWith,
              trainOption: coTrainOpt,
              trainClass: coTrainOpt,
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
              ticketVerified:
                p.ticketStatus === "CONFIRMED" ||
                b.trainTicketStatus === "CONFIRMED",
              documentStatus: p.idProof ? "Verified" : "Missing",
            });
          });
        }
      });
    return arr;
  }, [bookings, departureDateStr]);
  const [itineraryList, setItineraryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [engineStats, setEngineStats] = useState<any>(null);
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

  // New Departure API & Readiness state
  const [departureRecord, setDepartureRecord] = useState<any | null>(null);
  const [readinessData, setReadinessData] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusChange = async (targetStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await api.put("/api/departures/status", {
        tripId,
        date: departureDateStr,
        status: targetStatus,
      });
      if (res.data?.success) {
        setDepartureRecord(res.data.data.departure);
        setReadinessData(res.data.data.readiness);
        toast.success(`Departure status updated to '${targetStatus}'`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to transition to '${targetStatus}'`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // New Passengers Grouping & Room Allocation states
  const [bookingGroupFilter, setBookingGroupFilter] = useState("All");
  const [roomAllocFilter, setRoomAllocFilter] = useState("All");
  const [trainTicketFilter, setTrainTicketFilter] = useState("All");
  const [joiningCityFilter, setJoiningCityFilter] = useState("All");
  const [docStatusFilter, setDocStatusFilter] = useState("All");
  const [selectedPaxIds, setSelectedPaxIds] = useState<Record<string, boolean>>(
    {},
  );
  // New state for individual passenger selection
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<Record<string, boolean>>({});
  const [expandedBookings, setExpandedBookings] = useState<
    Record<string, boolean>
  >({});
  const [selectedBookingForRoomAlloc, setSelectedBookingForRoomAlloc] =
    useState<any | null>(null);
  const [modalAllocations, setModalAllocations] = useState<
    Record<string, { roomType: string; coupleWith: string; roomNo: string }>
  >({});

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

  const [passengerAllocations, setPassengerAllocations] = useState<
    Record<string, { room: string; vehicle: string; seat: string }>
  >({});
  const [allocFleet, setAllocFleet] = useState<any[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<any[]>([]);
  const [vendorDirectoryFleet, setVendorDirectoryFleet] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [newVehicleType, setNewVehicleType] = useState("17 Seater Tempo");
  const [newVehicleCapacity, setNewVehicleCapacity] = useState("17");
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleCost, setNewVehicleCost] = useState("");
  const [newVehicleVendor, setNewVehicleVendor] = useState("");
  const [manualRooms, setManualRooms] = useState<string[]>([]);
  const [isSavingAllocations, setIsSavingAllocations] = useState(false);
  const [showClearAllocationsDialog, setShowClearAllocationsDialog] =
    useState(false);

  const handleSaveAllocationsToDb = async (clearExisting = false) => {
    setIsSavingAllocations(true);
    try {
      const roomAllocations: Array<{
        roomNumber: string;
        roomType: string;
        genderGroup: string;
        bookingId: string;
        travelerName: string;
        sharingType?: string;
      }> = [];
      const vehicleAllocations: Array<{
        fleetId: string;
        bookingId: string;
        travelerName: string;
        seatNumber?: number;
      }> = [];

      // Map passengerAllocations to proper DB format
      allPassengers.forEach((p: any) => {
        const alloc = passengerAllocations[p.id] || passengerAllocations[p.name];
        if (!alloc) return;
        const bookingId = p.bookingId || p.rawBooking?.bookingId || p.bookingRef || p.rawBooking?.id || `BK-${(p.name || "PAX").replace(/\s+/g, "").toUpperCase()}`;

        if (alloc.room && alloc.room !== "—" && alloc.room !== "Unassigned") {
          roomAllocations.push({
            roomNumber: alloc.room,
            roomType: p.roomType || "STANDARD",
            genderGroup: p.gender === "Female" ? "GIRLS" : "BOYS",
            bookingId: bookingId,
            travelerName: p.name,
            sharingType: p.roomType || "STANDARD",
          });
        }
        if (alloc.vehicle && alloc.vehicle !== "—" && alloc.vehicle !== "Unassigned") {
          const fleet = allocFleet.find(
            (f) =>
              f.name === alloc.vehicle ||
              f.id === alloc.vehicle ||
              f.vehicleType === alloc.vehicle,
          );
          if (fleet) {
            vehicleAllocations.push({
              fleetId: fleet.id,
              bookingId: bookingId,
              travelerName: p.name,
              seatNumber:
                alloc.seat && alloc.seat !== "—"
                  ? parseInt(alloc.seat)
                  : undefined,
            });
          }
        }
      });

      if (
        clearExisting &&
        roomAllocations.length === 0 &&
        vehicleAllocations.length === 0
      ) {
        await opsService.saveManualAllocations(tripId, departureDateStr, {
          roomAllocations,
          vehicleAllocations,
          clearExisting: true,
        });
        toast.success("Allocations cleared from database");
        setShowClearAllocationsDialog(false);
        return;
      }

      const result = await opsService.saveManualAllocations(
        tripId,
        departureDateStr,
        { roomAllocations, vehicleAllocations, clearExisting },
      );
      if (result?.success) {
        toast.success(
          `Saved: ${result.data?.rooms?.length || 0} room + ${result.data?.vehicles?.length || 0} vehicle allocations`,
        );
        fetchPageData();
      } else {
        toast.error(result?.message || "Failed to save allocations");
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        err?.response?.statusText ||
        "";
      toast.error(errMsg || "Failed to save allocations to database");
      console.error("saveManualAllocations error:", err);
    } finally {
      setIsSavingAllocations(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const cap = parseInt(newVehicleCapacity) || 17;
    const vName = newVehicleName || `${newVehicleType || 'Tempo'} ${allocFleet.length + 1}`;

    try {
      // 1. If an existing departure vehicle is selected
      if (selectedVehicleId && selectedVehicleId !== 'custom') {
        const existing = fleetVehicles.find((v) => v.id === selectedVehicleId);
        if (existing) {
          const newV = {
            id: existing.id,
            name: existing.driverName || existing.name || vName,
            vehicleType: existing.vehicleType,
            capacity: existing.capacity,
            cost: existing.tariff?.amount ?? existing.totalAmount,
            vendor: existing.vendor?.name ?? existing.notes ?? 'Vendor',
          };
          setAllocFleet((prev) => [...prev, newV]);
          toast.success(`Added ${newV.name} (${newV.vehicleType})`);
          setSelectedVehicleId('');
          setSelectedVendorId('');
          return;
        }
      }

      // 2. Save new transport fleet record to backend database linked to vendorId if selected
      const savedVehicle = await opsService.createTransportFleet(
        tripId,
        {
          vehicleType: newVehicleType || "17 Seater Tempo",
          capacity: cap,
          totalAmount: parseFloat(newVehicleCost) || 35000,
          driverName: vName,
          notes: newVehicleVendor || "General Vendor",
          vendorId: selectedVendorId || undefined,
        },
        departureDateStr,
      );

      const newV = {
        id: savedVehicle.id,
        name: savedVehicle.driverName || vName,
        vehicleType: savedVehicle.vehicleType,
        capacity: savedVehicle.capacity,
        cost: savedVehicle.totalAmount,
        vendor: savedVehicle.notes || newVehicleVendor || "General Vendor",
        vendorId: savedVehicle.vendorId || selectedVendorId,
      };

      setAllocFleet((prev) => [...prev, newV]);
      setNewVehicleName("");
      setNewVehicleCost("");
      setNewVehicleVendor("");
      setSelectedVehicleId("");
      setSelectedVendorId("");
      toast.success(
        `Added ${newV.name} (${newV.vehicleType}) and linked to Vendor Directory!`,
      );
      fetchPageData();
    } catch {
      toast.error("Failed to save vehicle details to database");
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await opsService.deleteTransportFleet(id);
      setAllocFleet((prev) => prev.filter((v) => v.id !== id));
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
    guideName: "",
    agreedAmount: "",
    advancePaid: "0",
    daysWorked: "5",
    notes: "",
    assignmentType: "PRIMARY_GUIDE",
    reportingLocation: "",
    reportingTime: "",
    emergencyContact: "",
  });
  const [isSavingGuide, setIsSavingGuide] = useState(false);

  const handleAddGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guideForm.guideName.trim()) {
      toast.error("Guide name is required");
      return;
    }
    setIsSavingGuide(true);
    try {
      const saved = await opsService.createGuidePayment(
        tripId,
        {
          guideName: guideForm.guideName,
          agreedAmount: parseFloat(guideForm.agreedAmount) || 0,
          advancePaid: parseFloat(guideForm.advancePaid) || 0,
          daysWorked: parseInt(guideForm.daysWorked) || 5,
          notes: guideForm.notes,
          assignmentType: guideForm.assignmentType || "PRIMARY_GUIDE",
          reportingLocation: guideForm.reportingLocation || undefined,
          reportingTime: guideForm.reportingTime || undefined,
          emergencyContact: guideForm.emergencyContact || undefined,
        },
        departureDateStr,
      );
      setDbGuides((prev) => [...prev, saved]);
      setGuideForm({
        guideName: "",
        agreedAmount: "",
        advancePaid: "0",
        daysWorked: "5",
        notes: "",
        assignmentType: "PRIMARY_GUIDE",
        reportingLocation: "",
        reportingTime: "",
        emergencyContact: "",
      });
      setAddGuideOpen(false);
      toast.success(`Guide "${saved.guideName}" added and saved to database!`);
      fetchPageData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save guide");
    } finally {
      setIsSavingGuide(false);
    }
  };

  const handleDeleteGuide = async (id: string, guideName: string) => {
    if (!window.confirm(`Remove guide "${guideName}" from this departure?`))
      return;
    try {
      await opsService.deleteGuidePayment(id);
      setDbGuides((prev) => prev.filter((g) => g.id !== id));
      toast.info(`Guide "${guideName}" removed from departure`);
      fetchPageData();
    } catch {
      toast.error("Failed to remove guide");
    }
  };

  const handleCopyTempoList = () => {
    let txt = "*Tempo List (for WhatsApp Group)*\n\n";
    const groups: Record<string, string[]> = {};
    computedVehicleAllocations.forEach((v) => {
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
    const groups: Record<string, { gender: string; names: string[] }> = {};
    computedRoomAllocations.forEach((r) => {
      if (!groups[r.roomNumber])
        groups[r.roomNumber] = { gender: r.genderGroup, names: [] };
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

  // ─── 6-Screen Sub-Tab State ───
  const [planSubTab, setPlanSubTab] = useState<"accommodation" | "allocation" | "guides" | "activities">("accommodation");
  const [opsSubTab, setOpsSubTab] = useState<"control" | "ticketing" | "allocation" | "tasks">("control");
  const [moneySubTab, setMoneySubTab] = useState<"summary" | "receivables" | "payables" | "profit" | "station">("summary");

  // Deep Link Sub-Tab Synchronization
  const origTabParam = (searchParams.get("tab") || "").toLowerCase().trim();
  useEffect(() => {
    if (["hotels", "hotel", "accommodations", "accommodation", "itinerary"].includes(origTabParam)) {
      setPlanSubTab("accommodation");
    } else if (origTabParam === "allocation") {
      setPlanSubTab("allocation");
    } else if (origTabParam === "guides") {
      setPlanSubTab("guides");
    } else if (origTabParam === "activities") {
      setPlanSubTab("activities");
    } else if (origTabParam === "ticketing") {
      setOpsSubTab("ticketing");
    } else if (origTabParam === "tasks") {
      setOpsSubTab("tasks");
    } else if (origTabParam === "payments") {
      setMoneySubTab("receivables");
    } else if (origTabParam === "stationpayments") {
      setMoneySubTab("station");
    } else if (origTabParam === "reports") {
      setMoneySubTab("profit");
    }
  }, [origTabParam]);

  // Multi-Vendor Hotel & Stay Assignment Architecture State
  const [hotelViewMode, setHotelViewMode] = useState<"card" | "table">("card");
  const [isAddHotelWizardOpen, setIsAddHotelWizardOpen] = useState(false);
  const [selectedWizardDayInfo, setSelectedWizardDayInfo] = useState<any | null>(null);
  const [hotelWizardStep, setHotelWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [hotelWizardData, setHotelWizardData] = useState({
    destination: "Shimla",
    hotelId: "HTL-2",
    hotelName: "Hotel Snow View",
    hotelRating: "★★★★★",
    vendorId: "VND-2",
    vendorName: "Mountain Hospitality",
    checkIn: "05 Aug 2026",
    checkOut: "06 Aug 2026",
    nights: 1,
    rooms: { Twin: 3, Triple: 2, Quad: 0 } as Record<string, number>,
    totalGuests: 16,
    vendorRate: 4200,
    sellingRate: 5500,
    totalAmount: 21000,
    advancePaid: 10500,
    mealPlan: "MAP",
    remarks: "",
    status: "Draft",
  });
  const [selectedStayForDrawer, setSelectedStayForDrawer] = useState<
    any | null
  >(null);
  const [opsHotels, setOpsHotels] = useState<any[]>([]);
  const loadGenerationRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPageData = async () => {
    // 1. Abort previous pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Increment request generation token
    loadGenerationRef.current++;
    const currentGen = loadGenerationRef.current;

    setLoading(true);
    // Explicit state reset when changing departure to prevent stale data flashing
    setBookings([]);
    setDepartureRecord(null);
    setReadinessData(null);
    setEngineStats(null);
    setOpsHotels([]);
    setPassengerAllocations({});
    setActivitiesList([]);
    setDbGuides([]);
    setChecklistTasks([]);
    setItineraryList([]);
    try {
      const signal = controller.signal;
      const [
        bookingsRes,
        depRes,
        engineRes,
        itinRes,
        vendorsRes,
        tripRes,
        hotelsRes,
        transportRes,
        guidesRes,
      ] = await Promise.allSettled([
        api.get(`/bookings?status=all&tripId=${tripId}&limit=100`, { signal }),
        api.get(`/departures/resolve?tripId=${tripId}&date=${departureDateStr}`, { signal }),
        api.get(`/departure-engine/${tripId}/${departureDateStr}/passenger-stats`, { signal }),
        api.get(`/ops/itinerary/${tripId}?departureDate=${departureDateStr}`, { signal }),
        api.get(`/vendors/directory?limit=100`, { signal }),
        api.get(`/trips/${tripId}`, { signal }),
        api.get(`/ops/hotels/${tripId}?departureDate=${departureDateStr}`, { signal }),
        api.get(`/ops/transport/${tripId}?departureDate=${departureDateStr}`, { signal }),
        api.get(`/ops/guides/${tripId}?departureDate=${departureDateStr}`, { signal }),
      ]);

      // Stale response check — ignore if user switched departure while fetching
      if (currentGen !== loadGenerationRef.current) return;

      // 1. Bookings
      if (bookingsRes.status === "fulfilled" && bookingsRes.value?.data?.data) {
        const allBookings = bookingsRes.value.data.data;
        const filtered = allBookings.filter(
          (b: any) =>
            b.tripId === tripId &&
            b.departureDate?.substring(0, 10) === departureDateStr,
        );
        setBookings(filtered);
      }

      // 2. Departure resolve
      if (depRes.status === "fulfilled" && depRes.value?.data?.success) {
        setDepartureRecord(depRes.value.data.data.departure);
        setReadinessData(depRes.value.data.data.readiness);
      }

      // 3. Engine stats
      if (engineRes.status === "fulfilled" && engineRes.value?.data?.success) {
        setEngineStats(engineRes.value.data.data);
      }

      // 4. Itinerary
      if (itinRes.status === "fulfilled" && itinRes.value?.data?.data) {
        setItineraryList(itinRes.value.data.data);
      }

      // 5. Vendors directory
      if (vendorsRes.status === "fulfilled" && vendorsRes.value?.data?.data) {
        const allVendors = vendorsRes.value.data.data || [];
        const tripHotelVendors = allVendors.filter((v: any) =>
          ["hotel", "homestay", "camp"].includes(v.type?.toLowerCase()),
        );
        setDbVendors(tripHotelVendors);
      }

      // 6. Trip details
      if (tripRes.status === "fulfilled" && tripRes.value?.data?.data) {
        setTripDetails(tripRes.value.data.data);
      }

      // 7. Ops Hotels
      const hotels =
        hotelsRes.status === "fulfilled" ? hotelsRes.value?.data?.data || [] : [];
      setOpsHotels(hotels);

      // 8. Ops Transports & Guides
      const transports =
        transportRes.status === "fulfilled" ? transportRes.value?.data?.data || [] : [];
      const guides =
        guidesRes.status === "fulfilled" ? guidesRes.value?.data?.data || [] : [];
      setDbGuides(guides);

      // Fleet
      const initialFleet = transports.map((t: any) => ({
        id: t.id,
        name: t.driverName || "Tempo 1",
        vehicleType: t.vehicleType,
        capacity: t.capacity,
        cost: t.totalAmount,
        vendor: t.notes || "Self-driven",
      }));
      setAllocFleet(initialFleet);

      // Mapped tripVendors
      const mappedVendors = [
        ...hotels.map((h: any) => ({
          id: h.id,
          name: h.hotelName || h.vendor?.name || "Hotel Vendor",
          vendorType: "hotel",
          vendorId: {
            name: h.hotelName || h.vendor?.name || "Hotel Vendor",
            location: h.location,
            notes: h.notes,
          },
          paymentStatus: (h.advancePaid >= h.totalAmount && h.totalAmount > 0) ? "paid" : (h.advancePaid > 0 ? "advance_paid" : "pending"),
          notes: h.notes,
          agreedCost: h.totalAmount,
          paidAmount: h.advancePaid,
          balanceDue: h.balanceAmount,
          numberOfRooms: h.numberOfRooms || 5,
          confirmed: h.confirmed || "CONFIRMED",
          rawAssignment: h,
        })),
        ...transports.map((t: any) => ({
          id: t.id,
          name: t.vendor?.name || t.notes || t.driverName || "Transport Partner",
          vendorType: "transport",
          vendorId: {
            name: t.vendor?.name || t.notes || t.driverName || "Transport Partner",
            location: t.notes || "Local",
          },
          paymentStatus: (t.advancePaid >= t.totalAmount && t.totalAmount > 0) ? "paid" : (t.advancePaid > 0 ? "advance_paid" : "pending"),
          agreedCost: t.totalAmount,
          paidAmount: t.advancePaid || 0,
          balanceDue: (t.totalAmount || 0) - (t.advancePaid || 0),
          rawAssignment: t,
        })),
        ...guides.map((g: any) => ({
          id: g.id,
          name: g.guideName || g.guide?.name || "Lead Guide",
          vendorType: "guide",
          vendorId: {
            name: g.guideName || g.guide?.name || "Lead Guide",
            location: "Guide Partner",
          },
          paymentStatus: (g.advancePaid >= g.agreedAmount && g.agreedAmount > 0) ? "paid" : (g.advancePaid > 0 ? "advance_paid" : "pending"),
          agreedCost: g.agreedAmount,
          paidAmount: g.advancePaid,
          balanceDue: g.balanceAmount,
        })),
      ];

      setTripVendors(mappedVendors);

      const checkRes = await api
        .get(`/ops/checklists/${tripId}?departureDate=${departureDateStr}`)
        .catch(() => null);
      if (checkRes?.data?.success && checkRes.data.data.length > 0) {
        setChecklistTasks(checkRes.data.data);
      } else {
        const key = `${tripId}-${departureDateStr}`;
        if (initializationKeyRef.current !== key) {
          initializationKeyRef.current = key;
          const initRes = await api
            .post(
              `/ops/checklists/${tripId}/initialize?departureDate=${departureDateStr}`,
            )
            .catch(() => {
              initializationKeyRef.current = null;
              return null;
            });
          if (initRes?.data?.success) {
            setChecklistTasks(initRes.data.data);
          }
        }
      }

      // Load confirmed room + vehicle allocations and hydrate manual shuffler
      const allocRes = await api
        .get(
          `/ops/auto-allocate/${tripId}/confirmed?departureDate=${departureDateStr}`,
        )
        .catch(() => null);
      if (allocRes?.data?.success) {
        const { rooms = [], vehicles = [] } = allocRes.data.data;
        if (rooms.length > 0 || vehicles.length > 0) {
          // Build name→passenger map for dual-key write (by both id and name)
          const nameToPassenger: Record<string, any> = {};
          (allPassengers as any[]).forEach((p: any) => {
            if (p.name) nameToPassenger[p.name] = p;
          });

          // Build fleetId-to-name map from initialFleet
          const fleetNameMap: Record<string, string> = {};
          initialFleet.forEach((f: any) => {
            fleetNameMap[f.id] = f.name;
          });

          setPassengerAllocations((_prev: any) => {
            const next: Record<string, any> = {};

            // Write room allocations by BOTH travelerName and passenger.id
            rooms.forEach((r: any) => {
              const nameKey = r.travelerName;
              const pObj = nameToPassenger[nameKey];
              const entry = {
                ...(next[nameKey] || { vehicle: "—", seat: "—" }),
                room: r.roomNumber,
              };
              next[nameKey] = entry;
              // Also key by passenger id so computedRoomAllocations can find it
              if (pObj?.id) {
                next[pObj.id] = { ...entry };
              }
            });

            vehicles.forEach((v: any) => {
              const nameKey = v.travelerName;
              const pObj = nameToPassenger[nameKey];
              const vName = fleetNameMap[v.fleetId] || v.fleetId;
              const entry = {
                ...(next[nameKey] || { room: "—" }),
                vehicle: vName,
                seat: v.seatNumber ? String(v.seatNumber) : "—",
              };
              next[nameKey] = entry;
              if (pObj?.id) {
                next[pObj.id] = { ...entry };
              }
            });

            return next;
          });

          // Also restore manualRooms from saved allocation room numbers
          const savedRoomNumbers = [...new Set(rooms.map((r: any) => r.roomNumber as string))];
          if (savedRoomNumbers.length > 0) {
            setManualRooms(savedRoomNumbers);
          }
        }
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, departureDateStr]);
useEffect(() => {
  if (activeTab !== 'transport' || !tripId) return;
  const controller = new AbortController();

  // 1. Fetch departure fleet
  opsService
    .getTransportFleet(tripId, departureDateStr, { includeRates: true })
    .then(setFleetVehicles)
    .catch(() => setFleetVehicles([]));

  // 2. Fetch TRIP-SPECIFIC transport vendors & rates from Vendor Directory
  api
    .get(`/vendors/directory?type=TRANSPORT&tripId=${encodeURIComponent(tripId)}&limit=100`)
    .then(async (res) => {
      let vendors = res.data?.data || [];

      // If no vendors explicitly mapped to tripId in tripVendors table, fetch trip assignments
      if (vendors.length === 0) {
        try {
          const tripRes = await api.get(`/vendors/trip/${tripId}`);
          const tripAssignments = tripRes.data?.data || [];
          if (tripAssignments.length > 0) {
            vendors = tripAssignments.map((a: any) => a.vendor || a).filter(Boolean);
          }
        } catch {
          /* silent fallback */
        }
      }

      // If still empty (no vendor mapped to trip in Vendor Management), fetch global transport vendors as fallback
      if (vendors.length === 0) {
        const allRes = await api.get('/vendors/directory?type=TRANSPORT&limit=100');
        vendors = allRes.data?.data || [];
      }

      const masterItems: any[] = [];

      vendors.forEach((v: any) => {
        const vName = v.name || 'Vendor';
        const rates = v.transportRates || v.directoryVendorTransportRates || [];

        if (rates.length > 0) {
          rates.forEach((r: any) => {
            masterItems.push({
              id: `dir-${v.id}-${r.id || r.vehicleType}`,
              vendorId: v.id,
              vendorName: vName,
              vehicleType: r.vehicleType || "17 Seater Tempo",
              capacity: r.seatCapacity || r.capacity || 17,
              cost: r.amount || r.rate || 0,
              driverName: v.contactPerson || vName,
              label: `${r.vehicleType || 'Vehicle'} – ${vName} (${r.seatCapacity || 17} Seats)${r.amount ? ` – ₹${r.amount}` : ''}`,
            });
          });
        } else {
          // Standard fleet options for this vendor
          const defaultFleetTypes = [
            { type: '17 Seater Tempo Traveller', cap: 17, cost: 35000 },
            { type: '12 Seater Tempo Traveller', cap: 12, cost: 28000 },
            { type: '14 Seater Tempo Traveller', cap: 14, cost: 30000 },
            { type: 'Toyota Innova Crysta', cap: 7, cost: 22000 },
            { type: 'Maruti Suzuki Ertiga', cap: 6, cost: 18000 },
            { type: 'Swift Dzire', cap: 4, cost: 14000 },
          ];

          defaultFleetTypes.forEach((f) => {
            masterItems.push({
              id: `dir-${v.id}-${f.type.replace(/\s+/g, '-').toLowerCase()}`,
              vendorId: v.id,
              vendorName: vName,
              vehicleType: f.type,
              capacity: f.cap,
              cost: f.cost,
              driverName: v.contactPerson || `${vName} Driver`,
              label: `${f.type} – ${vName} (${f.cap} Seats)`,
            });
          });
        }
      });

      setVendorDirectoryFleet(masterItems);
    })
    .catch(() => setVendorDirectoryFleet([]));

  return () => controller.abort();
}, [activeTab, tripId, departureDateStr]);
  const handleModalFieldChange = (
    name: string,
    field: string,
    value: string,
  ) => {
    setModalAllocations((prev) => {
      const updated = {
        ...prev,
        [name]: {
          ...(prev[name] || {
            roomType: "Single",
            coupleWith: "",
            groupId: "",
          }),
          [field]: value,
        },
      };

      // Auto-linking couples/double sharing: if passenger A is coupled with B, automatically set B's coupleWith to A and type to A's type
      if (field === "coupleWith" && value) {
        updated[value] = {
          ...(updated[value] || {
            roomType: "Double",
            coupleWith: "",
            groupId: "",
          }),
          roomType: updated[name].roomType || "Double",
          coupleWith: name,
        };
        // Auto-match group id if available
        if (updated[name].groupId) {
          updated[value].groupId = updated[name].groupId;
        }
      } else if (
        field === "groupId" &&
        (updated[name]?.roomType !== "Single" &&
          updated[name]?.roomType !== "Individual") &&
        updated[name]?.coupleWith
      ) {
        const partner = updated[name].coupleWith;
        if (updated[partner]) {
          updated[partner].groupId = value;
        }
      }

      return updated;
    });
  };

  const handleSaveRoomAllocations = async () => {
    if (!selectedBookingForRoomAlloc) return;
    const bg = selectedBookingForRoomAlloc;

    try {
      const currentPassengers = bg.rawBooking.passengers || {
        details: {},
        persons: [],
      };
      const currentDetails = currentPassengers.details || {};

      const newPersonsRoomDetails = {
        ...(currentDetails.personsRoomDetails || {}),
        ...modalAllocations,
      };

      const updatedPassengers = {
        ...currentPassengers,
        details: {
          ...currentDetails,
          personsRoomDetails: newPersonsRoomDetails,
        },
      };

      await api.put(`/bookings/${bg.bookingId}`, {
        passengers: updatedPassengers,
      });

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
      Single: "bg-slate-50 text-slate-600 border-slate-200",
      Double: "bg-pink-50 text-pink-700 border-pink-200",
      Triple: "bg-purple-50 text-purple-700 border-purple-200",
      Quad: "bg-blue-50 text-blue-700 border-blue-200",
      Family: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Dorm: "bg-amber-50 text-amber-700 border-amber-200",
      Couple: "bg-pink-50 text-pink-700 border-pink-200",
      Friends: "bg-emerald-50 text-emerald-700 border-emerald-200",
      "Triple Sharing": "bg-purple-50 text-purple-700 border-purple-200",
      Individual: "bg-slate-50 text-slate-600 border-slate-200",
    };
    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded text-[10px] font-bold border",
          styles[type] || styles["Single"],
        )}
      >
        {type || "Single"}
      </span>
    );
  };

  const handleToggleTask = async (task: any) => {
    try {
      const isCompleted = task.isCompleted;
      const endpoint = isCompleted
        ? "/ops/checklists/reopen"
        : "/ops/checklists/complete";
      const notes = isCompleted
        ? "Reopened via departure hub checklist"
        : "Completed via departure hub checklist";
      const res = await api.post(endpoint, { id: task.id, notes });
      if (res.data?.success) {
        toast.success(
          `Task ${isCompleted ? "reopened" : "completed"} successfully!`,
        );
        const checkRes = await api
          .get(`/ops/checklists/${tripId}?departureDate=${departureDateStr}`)
          .catch(() => null);
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
    const b = bookings.find(
      (bk: any) => bk.id === bookingId || bk.bookingId === bookingId,
    );
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
      time: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMine: true,
      reactions: [],
    };
    setChatMessages((prev) => [...prev, newMsg]);
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
      const res = await api.post(
        `/ops/checklists/create?tripId=${tripId}&departureDate=${departureDateStr}`,
        {
          taskName: newTaskName,
          stage: newTaskStage,
          notes: newTaskNotes,
        },
      );
      if (res.data?.success) {
        toast.success("Task created successfully!");
        const checkRes = await api
          .get(`/ops/checklists/${tripId}?departureDate=${departureDateStr}`)
          .catch(() => null);
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
  const [editVehicleDetails, setEditVehicleDetails] = useState(
    "Tempo Traveller 17 Str",
  );
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
  const [pricingMethod, setPricingMethod] = useState<"PER_PERSON" | "PER_ROOM">("PER_PERSON");

  // Per Room Rates
  const [doubleRate, setDoubleRate] = useState(2200);
  const [tripleRate, setTripleRate] = useState(3000);
  const [quadRate, setQuadRate] = useState(3800);
  const [extraPersonRate, setExtraPersonRate] = useState(700);
  const [extraChildRate, setExtraChildRate] = useState(0);

  // Per Person Rates
  const [adultRate, setAdultRate] = useState(950);
  const [childRate, setChildRate] = useState(700);

  // Pax counts (For PER_PERSON)
  const [totalAdults, setTotalAdults] = useState(36);
  const [totalChild, setTotalChild] = useState(6);

  // Room Requirements (For PER_ROOM)
  const [doubleRoomsCount, setDoubleRoomsCount] = useState(12);
  const [tripleRoomsCount, setTripleRoomsCount] = useState(6);
  const [quadRoomsCount, setQuadRoomsCount] = useState(0);
  const [extraPersonsCount, setExtraPersonsCount] = useState(0);

  const [checkInDateForm, setCheckInDateForm] = useState("");
  const [checkOutDateForm, setCheckOutDateForm] = useState("");
  const [hotelNightsCount, setHotelNightsCount] = useState(2);
  const [hotelVendorId, setHotelVendorId] = useState("");
  const [voucherStatusForm, setVoucherStatusForm] = useState("PENDING");

  const [overrideApplied, setOverrideApplied] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState(0);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideAuthor, setOverrideAuthor] = useState("Super Admin");

  const [overrideTripleRate, setOverrideTripleRate] = useState(false);
  const [overrideQuadRate, setOverrideQuadRate] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [activeCalculationDrawer, setActiveCalculationDrawer] = useState<
    string | null
  >(null);
  const [editingHotel, setEditingHotel] = useState<any | null>(null);
  const [isSavingHotel, setIsSavingHotel] = useState(false);

  // Calculated Hotel Cost logic
  let doubleCost = 0;
  let tripleCost = 0;
  let quadCost = 0;
  let extraPersonCost = 0;
  let adultCost = 0;
  let childCost = 0;
  let calculatedTotalCost = 0;

  if (pricingMethod === "PER_PERSON") {
    adultCost = totalAdults * adultRate * hotelNightsCount;
    childCost = totalChild * childRate * hotelNightsCount;
    calculatedTotalCost = adultCost + childCost;
  } else {
    doubleCost = doubleRoomsCount * doubleRate * hotelNightsCount;
    tripleCost = tripleRoomsCount * tripleRate * hotelNightsCount;
    quadCost = quadRoomsCount * quadRate * hotelNightsCount;
    extraPersonCost = extraPersonsCount * extraPersonRate * hotelNightsCount;
    calculatedTotalCost = doubleCost + tripleCost + quadCost + extraPersonCost;
  }

  const hotelGst = 0;
  const grandTotalCost = calculatedTotalCost;

  const totalPaxCapacity = pricingMethod === "PER_PERSON" ? totalAdults + totalChild : (doubleRoomsCount * 2) + (tripleRoomsCount * 3) + (quadRoomsCount * 4) + extraPersonsCount;

  const formatDateToYYYYMMDD = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
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
    setHotelConfirmedForm(
      raw.confirmed ||
        (row.status === "CONFIRMED" ? "CONFIRMED" : "UNCONFIRMED"),
    );
    setVoucherStatusForm(raw.voucherStatus || "PENDING");

    // Pricing Automation fallback unpacking
    let pricingData: any = null;
    if (raw.notes && raw.notes.trim().startsWith("{")) {
      try {
        pricingData = JSON.parse(raw.notes);
      } catch (_e) {
        /* ignore invalid JSON */
      }
    }

    const dayNumStr = row.day
      ? String(row.day).replace("Day ", "").trim()
      : "1";
    const dayIndex = parseInt(dayNumStr) - 1 || 0;

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
        if (typeof passengersObj === "string") {
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
        const leadRoomType =
          leadRoomInfo.roomType ||
          b.roomSharing ||
          b.roomType ||
          passengersObj?.details?.roomType ||
          (b.numberOfTravelers === 1 ? "Individual" : "Double Sharing");
        const normLeadName = normalizeCompareName(leadName);

        // Add lead passenger
        activePassengers.push({
          name: leadName,
          roomSharing: leadRoomType,
        });

        // Map co-passengers from parsed passengers JSON list
        const coPax = Array.isArray(passengersObj?.persons)
          ? passengersObj.persons
          : [];
        coPax.forEach((co: any) => {
          if (normalizeCompareName(co.name) === normLeadName) return;
          const coRoomInfo = personsRoomDetails[co.name] || {};
          const coRoomType =
            coRoomInfo.roomType ||
            co.roomSharing ||
            b.roomSharing ||
            b.roomType ||
            passengersObj?.details?.roomType ||
            "Double Sharing";
          activePassengers.push({
            name: co.name || "Co-Traveler",
            roomSharing: coRoomType,
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

      setCheckInDateForm(
        raw.checkIn ? raw.checkIn.substring(0, 10) : calculatedCheckIn,
      );
      setCheckOutDateForm(
        raw.checkOut ? raw.checkOut.substring(0, 10) : calculatedCheckOut,
      );
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
      const cleanCheckIn = checkInDateForm
        ? new Date(checkInDateForm).toISOString().substring(0, 10)
        : "";
      const cleanCheckOut = checkOutDateForm
        ? new Date(checkOutDateForm).toISOString().substring(0, 10)
        : "";

      const pricingPayload = {
        __isHotelPricing: true,
        pricingMethod,
        rates: {
          doubleRate: cleanDoubleRate,
          tripleRate: cleanTripleRate,
          quadRate: cleanQuadRate,
          extraPersonRate: cleanExtraPersonRate,
          extraChildRate: cleanExtraChildRate,
        },
        allocations: {
          doubleRoomsCount: cleanDoubleRooms,
          tripleRoomsCount: cleanTripleRooms,
          quadRoomsCount: cleanQuadRooms,
          extraPersonsCount: cleanExtraPersons,
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
          author: overrideAuthor || "Super Admin",
        },
        overrideTripleRate,
        overrideQuadRate,
        userNotes: hotelNotesForm || "",
      };

      const finalCost = overrideApplied
        ? cleanOverrideAmount
        : calculatedTotalCost;

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
          vendorId: hotelVendorId || null,
        },
      ]);

      // If override is modified, sync it with the override endpoint if needed
      if (overrideApplied) {
        await opsService
          .saveHotelOverride(tripId, {
            departureHotelId: selectedHotelId,
            fieldName: "totalAmount",
            originalValue: calculatedTotalCost,
            overriddenValue: cleanOverrideAmount,
            reason: overrideReason || "",
            advancePaid: cleanPaid,
          })
          .catch(() => null);
      } else {
        await opsService
          .resetHotelOverride(tripId, {
            departureHotelId: selectedHotelId,
          })
          .catch(() => null);
      }

      toast.success("Hotel details updated successfully!");
      setEditingHotel(null);
      fetchPageData();
    } catch (err: any) {
      console.error("Failed to save hotel bookings", err.response?.data || err);
      const errMsg =
        err.response?.data?.message || "Failed to update hotel details.";
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
      await api.post(
        `/ops/transport/${tripId}?departureDate=${departureDateStr}`,
        {
          id: selectedTransportId,
          vehicleType: vehicleTypeForm,
          capacity: capacityForm,
          route: routeForm,
          driverName: driverNameForm,
          driverPhone: driverPhoneForm,
          totalAmount: transportCostForm,
          advancePaid: transportPaidForm,
          notes: transportNotesForm,
        },
      );
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
      } catch (_e) {
        /* ignore invalid JSON */
      }
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
        status: "CONFIRMED",
      },
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
          status: trainStatusForm,
        };
      }
      return t;
    });
    setTrainBookings(updated);
    localStorage.setItem(
      `train_bookings_${tripId}_${departureDateStr}`,
      JSON.stringify(updated),
    );
    toast.success("Train booking details updated successfully!");
    setEditTrainOpen(false);
  };

  const handlePrintManifest = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocker prevented printing. Please allow popups.");
      return;
    }

    const rowsHtml = allPassengers
      .map(
        (p, i) => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px; text-align: center; font-size: 11px;">${i + 1}</td>
        <td style="padding: 10px; font-weight: bold; font-size: 11px;">${p.name}</td>
        <td style="padding: 10px; font-size: 11px;">${p.bookingId}</td>
        <td style="padding: 10px; font-size: 11px; font-weight: bold; color: #1E293B;">${p.phone}</td>
        <td style="padding: 10px; font-size: 11px;">${p.gender} (${p.age})</td>
        <td style="padding: 10px; font-size: 11px;">${p.pickupPoint}</td>
        <td style="padding: 10px; font-family: monospace; font-size: 11px; font-weight: bold;">${p.roomNo}</td>
      </tr>
    `,
      )
      .join("");

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
    const cleanData = data.map((item) => {
      const cleanObj = { ...item };
      delete cleanObj.rawTask;
      delete cleanObj.id;
      return cleanObj;
    });
    const headers = Object.keys(cleanData[0]).join(",");
    const rows = cleanData.map((item) =>
      Object.values(item)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
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
          roomAllocation: "TBD",
        },
        persons: [],
      },
    };
    setBookings((prev) => [dummyBooking, ...prev]);
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
    const confirmedBookings = bookings.filter(
      (b: any) => b.status !== "cancelled",
    );

    // Revenue & Customer Payments
    const totalRevenue = confirmedBookings.reduce(
      (sum: number, b: any) => sum + (b.totalAmount || b.amount || 0),
      0,
    );
    const customerPaid = confirmedBookings.reduce(
      (sum: number, b: any) => sum + (b.advancePaid || 0),
      0,
    );
    const customerOutstanding = confirmedBookings.reduce(
      (sum: number, b: any) => sum + (b.remainingAmount || 0),
      0,
    );
    const totalParticipants = confirmedBookings.reduce(
      (sum: number, b: any) => sum + (b.numberOfTravelers || 1),
      0,
    );
    const outstandingParticipantsCount = confirmedBookings.filter(
      (b: any) => (b.remainingAmount || 0) > 0,
    ).length;

    // Vendor Payments (filtered from tripVendors state)
    const hotelsCost = tripVendors
      .filter((v) => v.vendorType === "hotel")
      .reduce((sum, v) => sum + (v.agreedCost || 0), 0);
    const hotelsPaid = tripVendors
      .filter((v) => v.vendorType === "hotel")
      .reduce((sum, v) => sum + (v.paidAmount || 0), 0);
    const transportsCost = tripVendors
      .filter((v) => v.vendorType === "transport")
      .reduce((sum, v) => sum + (v.agreedCost || 0), 0);
    const transportsPaid = tripVendors
      .filter((v) => v.vendorType === "transport")
      .reduce((sum, v) => sum + (v.paidAmount || 0), 0);
    const guidesCost = tripVendors
      .filter((v) => v.vendorType === "guide")
      .reduce((sum, v) => sum + (v.agreedCost || 0), 0);
    const guidesPaid = tripVendors
      .filter((v) => v.vendorType === "guide")
      .reduce((sum, v) => sum + (v.paidAmount || 0), 0);

    const totalVendorCost = hotelsCost + transportsCost + guidesCost;
    const totalVendorPaid = hotelsPaid + transportsPaid + guidesPaid;
    const totalVendorPayables = totalVendorCost - totalVendorPaid;

    const estProfit = totalRevenue - totalVendorCost;
    const profitPercent =
      totalRevenue > 0 ? ((estProfit / totalRevenue) * 100).toFixed(1) : "0";

    const customerPaidPercent =
      totalRevenue > 0 ? ((customerPaid / totalRevenue) * 100).toFixed(1) : "0";
    const customerOutstandingPercent =
      totalRevenue > 0
        ? ((customerOutstanding / totalRevenue) * 100).toFixed(1)
        : "0";
    const vendorPaidPercent =
      totalVendorCost > 0
        ? ((totalVendorPaid / totalVendorCost) * 100).toFixed(1)
        : "0";
    const vendorPayablePercent =
      totalVendorCost > 0
        ? ((totalVendorPayables / totalVendorCost) * 100).toFixed(1)
        : "0";

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
      vendorPayablePercent,
    };
  }, [bookings, tripVendors]);

  // Find lead guide and vehicles from tripVendors
  const [leadGuideName, setLeadGuideName] = useState("Assign Guide");
  const [itineraryViewMode, setItineraryViewMode] = useState<
    "customer" | "internal"
  >("internal");
  const [expandedDescs, setExpandedDescs] = useState<Record<number, boolean>>(
    {},
  );
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
    description: "",
  });
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  useEffect(() => {
    const lead = tripVendors.find((v) => v.vendorType === "guide" || v.assignmentType?.includes("GUIDE"));
    if (lead) {
      setLeadGuideName(
        lead?.vendor?.name ||
          lead?.vendorName ||
          lead?.guideName ||
          lead?.name ||
          "",
      );
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
      activities: Array.isArray(day.activities)
        ? day.activities.join(", ")
        : day.activities || "",
      departureTime: day.departureTime || "",
      arrivalTime: day.arrivalTime || "",
      distance: day.distance || "",
      drivingHours: day.drivingHours || "",
      assignedVehicle: day.assignedVehicle || "",
      description: day.description || "",
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
          activities: "",
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
        description: editingDayData.description,
      };

      const res = await api.put(`/trips/${tripDetails.id}`, {
        itinerary: updatedItinerary,
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
    const count = tripVendors.filter(
      (v) => v.vendorType === "transport",
    ).length;
    return count > 0 ? `${count} Vehicles Assigned` : "Assign Transport";
  }, [tripVendors]);

  const dateAndDurationLabel = useMemo(() => {
    try {
      const startDate = new Date(departureDateStr);
      const daysMatch = tripDetails?.duration?.match(/(\d+)\s*Day/i);
      const numDays = daysMatch ? parseInt(daysMatch[1], 10) : 9;
      const endDate = new Date(
        startDate.getTime() + (numDays - 1) * 24 * 60 * 60 * 1000,
      );

      const formatOptions = {
        day: "2-digit",
        month: "short",
        year: "numeric",
      } as const;
      const startStr = startDate.toLocaleDateString("en-US", formatOptions);
      const endStr = endDate.toLocaleDateString("en-US", formatOptions);
      return `${startStr} – ${endStr} (${tripDetails?.duration || "9D / 8N"})`;
    } catch {
      return `05 Jul 2027 – 13 Jul 2027 (9D / 8N)`;
    }
  }, [departureDateStr, tripDetails]);

  const timelineSteps = useMemo(() => {
    const confirmedBookings = bookings.filter(
      (b: any) => b.status !== "cancelled",
    );
    const sortedBookings = [...confirmedBookings].sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const firstBookingDate = sortedBookings[0]
      ? new Date(sortedBookings[0].createdAt).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "TBD";
    const bookingStartedStr = sortedBookings[0]
      ? new Date(
          new Date(sortedBookings[0].createdAt).getTime() - 2 * 60 * 60 * 1000,
        ).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "TBD";

    const capacity = tripDetails?.maxGroupSize || 30;
    const filledPercentage =
      capacity > 0 ? (stats.totalParticipants / capacity) * 100 : 0;
    const seats50PercentStr = sortedBookings[
      Math.floor(sortedBookings.length / 2)
    ]
      ? new Date(
          sortedBookings[Math.floor(sortedBookings.length / 2)].createdAt,
        ).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "TBD";

    const hotels = tripVendors.filter((v) => v.vendorType === "hotel");
    const allHotelsConfirmed =
      hotels.length > 0 && hotels.every((h) => h.paymentStatus === "paid");
    const hotelsConfirmStr = allHotelsConfirmed
      ? "Confirmed"
      : "Pending Confirmation";

    const depDate = new Date(departureDateStr);
    const departureDayStr = !isNaN(depDate.getTime())
      ? depDate.toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : departureDateStr || "TBD";

    return [
      {
        title: "Booking Started",
        date: bookingStartedStr,
        user: "System",
        active: sortedBookings.length > 0,
      },
      {
        title: "First Booking Received",
        date: firstBookingDate,
        user: sortedBookings[0]?.name || "System",
        active: sortedBookings.length > 0,
      },
      {
        title: "50% Seats Filled",
        date: seats50PercentStr,
        user: "Sales Desk",
        active: filledPercentage >= 50,
      },
      {
        title: "All Hotels Confirmed",
        date: hotelsConfirmStr,
        user: "Ops Desk",
        active: allHotelsConfirmed,
      },
      {
        title: "Balance Collection In Progress",
        date: stats.totalVendorPayables > 0 ? "In Progress" : "Completed",
        user: "Accounts Desk",
        current: true,
      },
      { title: "Departure Day", date: departureDayStr, pending: true },
    ];
  }, [bookings, tripVendors, tripDetails, departureDateStr, stats]);

  const getDayDateAndWd = (startStr: string, offsetDays: number) => {
    try {
      const parts = startStr.substring(0, 10).split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const d = new Date(year, month, day);
      d.setDate(d.getDate() + offsetDays);
      const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const wd = dayNames[d.getDay()];
      const dateFormatted = `${String(d.getDate()).padStart(2, "0")} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      return { wd, date: dateFormatted };
    } catch (err) {
      return { wd: "SAT", date: "05 Jul 2027" };
    }
  };

  const computedItinerary = useMemo(() => {
    const activeItinerarySource =
      tripDetails?.itinerary && tripDetails.itinerary.length > 0
        ? tripDetails.itinerary
        : itineraryList && itineraryList.length > 0
        ? itineraryList
        : (() => {
            const tid = (tripId || "").toLowerCase();
            if (tid.includes("ker") || tid.includes("krl") || tid.includes("kerala")) {
              return [
                { day: 1, title: "Ahmedabad to Cochin Train Journey", location: "Cochin", stay: "Night Journey", description: "Departure/reporting time: Arriving at Ernakulam Junction around 9:00 PM." },
                { day: 2, title: "Arrival in Cochin", location: "Cochin", stay: "Cochin", description: "Proceed to your hotel near the railway station and settle in." },
                { day: 3, title: "Scenic Drive to Munnar", location: "Munnar", stay: "Munnar", description: "Warm pick-up & transfer to Munnar tea plantations." },
                { day: 4, title: "Explore the Beauty of Munnar", location: "Munnar", stay: "Munnar", description: "Kundala Dam, Mattupetty Dam, Tea Gardens exploration." },
                { day: 5, title: "Thekkady – Wildlife & Cultural Experience", location: "Thekkady", stay: "Thekkady", description: "Periyar National Park & spice plantation tour." },
                { day: 6, title: "Thekkady to Alleppey – Backwater Paradise", location: "Alleppey", stay: "Alleppey", description: "Alleppey houseboat & backwater cruise experience." },
                { day: 7, title: "Alleppey to Cochin", location: "Cochin", stay: "Cochin", description: "Fort Kochi sightseeing, Chinese fishing nets & local market." },
                { day: 8, title: "Cochin to Ahmedabad", location: "Cochin", stay: "Night Journey", description: "Board return train from Ernakulam Junction." },
                { day: 9, title: "Arrival at Your City", location: "Your City", stay: "—", description: "Reach home with memorable Kerala trip experiences." },
              ];
            }
            if (tid.includes("spt") || tid.includes("spiti")) {
              return [
                { day: 1, title: "Train Journey to Chandigarh / Jalandhar", location: "Chandigarh", stay: "Night Journey", description: "Overnight train journey from starting location." },
                { day: 2, title: "Drive to Shimla / Narkanda", location: "Shimla", stay: "Shimla", description: "Scenic mountain drive towards Narkanda." },
                { day: 3, title: "Shimla to Chitkul", location: "Chitkul", stay: "Chitkul", description: "Travel to last Indian village Chitkul." },
                { day: 4, title: "Travel Chitkul to Tabo via Nako", location: "Tabo", stay: "Tabo", description: "Visit Nako Lake & Tabo Monastery." },
                { day: 5, title: "Explore Tabo, Dhankar & Kaza", location: "Kaza", stay: "Kaza", description: "Visit Dhankar Monastery & drive to Kaza." },
                { day: 6, title: "Key Monastery, Hikkim, Komic, Langza", location: "Kaza", stay: "Kaza", description: "Highest post office Hikkim & Key Monastery." },
                { day: 7, title: "Kaza to Chandratal Lake", location: "Chandratal", stay: "Chandratal", description: "Cross Kunzum Pass & camp at Chandratal." },
                { day: 8, title: "Chandratal to Manali", location: "Manali", stay: "Manali", description: "Drive through Atal Tunnel to Manali." },
                { day: 9, title: "Manali Sightseeing & Return Train", location: "Manali", stay: "Night Journey", description: "Local sightseeing & departure." },
                { day: 10, title: "Arrive at Your City", location: "Your City", stay: "—", description: "Reach home safely." },
              ];
            }
            if (tid.includes("mka") || tid.includes("manali")) {
              return [
                { day: 1, title: "Train Journey to Jalandhar", location: "Jalandhar", stay: "Night Journey", description: "Overnight train journey." },
                { day: 2, title: "Visit Wagha Border & Golden Temple", location: "Amritsar", stay: "Amritsar", description: "Sightseeing in Amritsar." },
                { day: 3, title: "Day for Kasol & Parvati Valley Exploration", location: "Kasol", stay: "Kasol", description: "Exploration of Kasol & Manikaran." },
                { day: 4, title: "Bijli Mahadev Trek", location: "Manali", stay: "Manali", description: "Scenic trek to Bijli Mahadev." },
                { day: 5, title: "Adventure Activities: Rafting & Paragliding", location: "Manali", stay: "Manali", description: "River rafting & paragliding in Kullu." },
                { day: 6, title: "Solang Valley – Atal Tunnel – Sissu", location: "Sissu", stay: "Sissu", description: "Explore Solang Valley and Sissu." },
                { day: 7, title: "Manali Sightseeing & Jogini Waterfall", location: "Manali", stay: "Manali", description: "Hadimba Temple & Jogini Waterfall." },
                { day: 8, title: "Return Train Journey", location: "Jalandhar", stay: "Night Journey", description: "Board return train." },
                { day: 9, title: "Arrive at Your City", location: "Your City", stay: "—", description: "Reach home." },
              ];
            }
            const fallbackDays = [];
            const count = tripDetails?.durationDays || 9;
            for (let i = 1; i <= count; i++) {
              fallbackDays.push({
                day: i,
                title: i === 1 ? `Day ${i} Departure & Journey` : i === count ? `Day ${i} Return & Arrival` : `Day ${i} Exploration & Stay`,
                location: `Destination Day ${i}`,
                stay: i === 1 || i === count ? "Night Journey" : `Hotel Day ${i}`,
                description: `Operational details for Day ${i}`,
              });
            }
            return fallbackDays;
          })();

    const rawList = activeItinerarySource.map((it: any, idx: number) => {
      const stayName =
        it.stay && it.stay !== "—" ? it.stay : it.location || "";
      const mealsName =
        it.meals && it.meals !== "—" ? it.meals : "Breakfast & Dinner";
      const actName = Array.isArray(it.activities)
        ? it.activities.length > 0
          ? it.activities.join(" • ")
          : it.title || it.location || ""
        : it.activities && it.activities !== "—"
          ? it.activities
          : it.title || it.location || "";
      const travelName =
        it.travel ||
        it.distance ||
        (it.location ? `Transfer / ${it.location}` : "Local Transfer");
      const travelSubName =
        it.travelSub || it.drivingHours || "Planned Transfer";

      return {
        rawIdx: idx,
        day: `Day ${it.day || idx + 1}`,
        plan: it.title || it.plan || it.location || `Day ${it.day || idx + 1}`,
        sub: it.description || it.sub || "",
        stay: stayName || "—",
        stayType:
          stayName && stayName !== "—"
            ? it.stayType || "Standard Stay"
            : "",
        stayBadge:
          stayName && stayName !== "—" ? it.stayBadge || "STANDARD" : "",
        travel: travelName,
        travelSub: travelSubName,
        distance: travelName,
        meals: mealsName || "—",
        activities: actName || "—",
        status: "ON TIME",
      };
    });

    const baseItin = rawList.map((item: any, idx: number) => ({
      ...item,
      rawIdx: idx,
      distance: item.distance || item.travel || "Local",
    }));

    return baseItin.map((item: any, idx: number) => {
      const { wd, date } = getDayDateAndWd(departureDateStr, idx);
      return {
        ...item,
        wd,
        date,
      };
    });
  }, [tripDetails, itineraryList, departureDateStr, tripId]);

  const computedHotels = useMemo(() => {
    const isSpiti =
      tripId?.toLowerCase().includes("spt") ||
      tripId?.toLowerCase().includes("spiti");

    // SPT itinerary: 9 nights → 8 hotel rows (Kaza = 2 nights in 1 row)
    // Day 1 = train, Day 10-11 = return/home — no hotel rows
    const sptNights = [
      {
        dayNum: 2,
        city: "Shimla",
        region: "Himachal Pradesh",
        nights: 1,
        dayLabel: "Day 2",
      },
      {
        dayNum: 3,
        city: "Sangla / Chitkul",
        region: "Himachal Pradesh",
        nights: 1,
        dayLabel: "Day 3",
      },
      {
        dayNum: 4,
        city: "Tabo",
        region: "Himachal Pradesh",
        nights: 1,
        dayLabel: "Day 4",
      },
      {
        dayNum: 5,
        city: "Kaza",
        region: "Spiti Valley",
        nights: 2,
        dayLabel: "Day 5–6",
      },
      {
        dayNum: 7,
        city: "Chandratal",
        region: "Spiti Valley",
        nights: 1,
        dayLabel: "Day 7",
      },
      {
        dayNum: 8,
        city: "Manali",
        region: "Himachal Pradesh",
        nights: 1,
        dayLabel: "Day 8",
      },
      {
        dayNum: 9,
        city: "Kullu",
        region: "Himachal Pradesh",
        nights: 1,
        dayLabel: "Day 9",
      },
    ];

    // Real DB hotel assignments from ops
    const hotelAssignments = tripVendors.filter((v: any) => {
      const vendorObj = typeof v.vendorId === "object" ? v.vendorId : null;
      const type = vendorObj?.type || v.vendorType || "";
      return type === "hotel";
    });

    if (isSpiti) {
      return sptNights.map((night, idx) => {
        const { wd, date } = getDayDateAndWd(
          departureDateStr,
          night.dayNum - 1,
        );

        // Find matching hotel assignment by location/city name instead of plain index matching
        const assignment =
          hotelAssignments.find((h) => {
            const raw = h.rawAssignment || h;
            const loc = (raw?.location || h.vendorId?.location || "")
              .toLowerCase()
              .trim();
            const target = night.city.toLowerCase().trim();
            return loc.includes(target) || target.includes(loc);
          }) || null;

        const vendorObj = assignment
          ? typeof assignment.vendorId === "object"
            ? assignment.vendorId
            : null
          : null;
        const raw = assignment?.rawAssignment || assignment;

        // Dynamically compute how many unique rooms are currently allocated to this location/city en-route
        const allocatedRoomsForCity = new Set(
          Object.values(passengerAllocations)
            .filter((alloc) => {
              if (
                !alloc.room ||
                alloc.room === "—" ||
                alloc.room === "Unassigned"
              )
                return false;
              // Check if traveler is allocated to a room, and if this hotel location matches the en-route city
              const isMatch = night.city
                .toLowerCase()
                .trim()
                .includes(
                  (assignment?.vendorId?.location || raw?.location || "")
                    .toLowerCase()
                    .trim(),
                );
              return isMatch || idx === 0; // fallback default to map room numbers
            })
            .map((alloc) => alloc.room),
        );
        const roomsCount =
          allocatedRoomsForCity.size > 0
            ? allocatedRoomsForCity.size
            : raw?.numberOfRooms ||
              assignment?.numberOfRooms ||
              (night.city.includes("Chandratal") || night.city.includes("Kullu")
                ? 4
                : 5);
        const isCampUnit =
          night.city.toLowerCase().includes("chandratal") ||
          night.city.toLowerCase().includes("kullu") ||
          (vendorObj?.name || raw?.hotelName || "")
            .toLowerCase()
            .includes("tent") ||
          (vendorObj?.name || raw?.hotelName || "")
            .toLowerCase()
            .includes("camp");
        const unitLabel = isCampUnit ? "Tents" : "Rooms";

        return {
          id: assignment?.id || `spt-stay-${idx}`,
          day: night.dayLabel, // e.g. "Day 5–6" for Kaza
          wd,
          date,
          destRegion: night.region,
          destCity: night.city,
          hotel: vendorObj?.name || raw?.hotelName || "— Not Assigned —",
          vendor: vendorObj?.location || raw?.location || night.city,
          allocations: assignment
            ? [{ text: `${roomsCount} ${unitLabel}`, color: "blue" }]
            : [{ text: "Pending", color: "orange" }],
          totalPaxText: assignment
            ? `${raw?.totalPax || allPassengers.length} Pax`
            : "Not booked",
          capacityPercent: 100,
          capacityColor: assignment ? "bg-emerald-500" : "bg-slate-300",
          nights: night.nights, // use itinerary-defined nights (Kaza = 2)
          status: assignment
            ? raw?.confirmed === "CONFIRMED" ||
              assignment.paymentStatus === "paid"
              ? "CONFIRMED"
              : "PENDING"
            : "PENDING",
          statusSub: assignment
            ? raw?.confirmed === "CONFIRMED"
              ? "Voucher Sent"
              : "Payment Due"
            : "Not Assigned",
          amt: assignment
            ? (raw?.totalAmount || assignment.agreedCost || 0).toLocaleString(
                "en-IN",
              )
            : "0",
          amtSub: assignment
            ? `Paid: ₹${(raw?.advancePaid || assignment.paidAmount || 0).toLocaleString("en-IN")}`
            : "No payment",
          rawAssignment: raw || assignment,
        };
      });
    }

    // Non-SPT trips: use real DB assignments
    if (hotelAssignments.length > 0) {
      return hotelAssignments.map((v: any, idx: number) => {
        const vendorObj =
          typeof v.vendorId === "object"
            ? v.vendorId
            : { name: "Assigned Hotel" };
        const dayNum = idx + 1;
        const { wd, date } = getDayDateAndWd(departureDateStr, idx);
        const dest = tripDetails?.location || "Manali";
        const raw = v.rawAssignment || v;

        // Dynamically compute unique rooms allocated
        const allocatedRooms = new Set(
          Object.values(passengerAllocations)
            .filter(
              (alloc) =>
                alloc.room && alloc.room !== "—" && alloc.room !== "Unassigned",
            )
            .map((alloc) => alloc.room),
        );
        const roomsCount =
          allocatedRooms.size > 0
            ? allocatedRooms.size
            : raw?.numberOfRooms || 0;

        return {
          id: v.id,
          day: `Day ${dayNum}`,
          wd,
          date,
          destRegion: "Himachal Pradesh",
          destCity: dest,
          hotel: vendorObj.name || raw?.hotelName || "Hotel",
          vendor: vendorObj.location || raw?.location || "Stay Location",
          allocations: [{ text: `${roomsCount} Rooms`, color: "blue" }],
          totalPaxText: `${raw?.totalPax || allPassengers.length} Pax`,
          capacityPercent: 100,
          capacityColor: "bg-emerald-500",
          nights: raw?.nights || 1,
          status:
            raw?.confirmed === "CONFIRMED" || v.paymentStatus === "paid"
              ? "CONFIRMED"
              : "PENDING",
          statusSub:
            raw?.confirmed === "CONFIRMED" ? "Voucher Sent" : "Payment Due",
          amt: (raw?.totalAmount || v.agreedCost || 0).toLocaleString("en-IN"),
          amtSub: `Paid: ₹${(raw?.advancePaid || v.paidAmount || 0).toLocaleString("en-IN")}`,
          rawAssignment: raw,
        };
      });
    }

    return [];
  }, [tripVendors, tripDetails, departureDateStr, tripId, bookings]);

  const computedTransport = useMemo(() => {
    const transAssignments = tripVendors.filter((v: any) => {
      const vendorObj = typeof v.vendorId === "object" ? v.vendorId : null;
      const type = vendorObj?.type || v.vendorType || "";
      return type === "transport";
    });

    if (transAssignments.length > 0) {
      return transAssignments.map((v: any, idx: number) => {
        const vendorObj =
          typeof v.vendorId === "object"
            ? v.vendorId
            : { name: "Assigned Transport" };
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
          total: v.agreedCost?.toLocaleString("en-IN") || "0",
          paid: v.paidAmount?.toLocaleString("en-IN") || "0",
          due: ((v.agreedCost || 0) - (v.paidAmount || 0)).toLocaleString(
            "en-IN",
          ),
          status: v.paymentStatus?.toUpperCase() || "CONFIRMED",
          rawAssignment: v,
        };
      });
    }

    return [];
  }, [tripVendors, tripDetails, departureDateStr]);

  const computedGuides = useMemo(() => {
    const guideAssignments = tripVendors.filter((v: any) => {
      const vendorObj = v.vendor || {};
      const type = vendorObj.type || v.vendorType || "";
      return type.toLowerCase() === "guide" || type.toLowerCase() === "leader";
    });

    if (guideAssignments.length > 0) {
      return guideAssignments.map((v: any, idx: number) => {
        const vendorObj = v.vendor || { name: "Assigned Guide" };
        const dayNum = idx + 1;
        const { wd, date } = getDayDateAndWd(departureDateStr, idx);

        return {
          name: vendorObj.name,
          lead: idx === 0,
          role: vendorObj.type === "leader" ? "Trip Captain" : "Support Guide",
          assign: "Full Trip",
          date: `${date.split(" ")[0]} ${date.split(" ")[1]}, ${wd.charAt(0).toUpperCase()}${wd.slice(1).toLowerCase()}`,
          phone: vendorObj.phone || "—",
          exp: vendorObj.notes || "Guide",
          trips: "Active Assignment",
          status: v.paymentStatus?.toUpperCase() || "CONFIRMED",
          sub: `Assigned on ${new Date(v.createdAt).toLocaleDateString("en-IN")}`,
          docs: { id: true, dl: true, police: true, medical: true },
        };
      });
    }
    return [];
  }, [tripVendors, departureDateStr]);

  const computedTeamContacts = useMemo(() => {
    const list: Array<{ name: string; role: string; phone: string }> = [];
    computedGuides.forEach((g: any) => {
      list.push({
        name: g.name || "Assigned Guide",
        role: g.role || "Guide",
        phone: g.phone || "—",
      });
    });
    computedTransport.forEach((t: any) => {
      list.push({
        name: t.vendor || t.name || "Transport Driver",
        role: `${t.type || "Vehicle"} (${t.plate || ""})`.trim(),
        phone: t.phone || "—",
      });
    });
    return list;
  }, [computedGuides, computedTransport]);

  const computedTopTasks = useMemo(() => {
    if (checklistTasks.length > 0) {
      return checklistTasks.slice(0, 4).map((t: any) => ({
        title: t.task || t.title || "Pending Task",
        priority: t.priority
          ? t.priority.charAt(0).toUpperCase() +
            t.priority.slice(1).toLowerCase()
          : "Medium",
        date: t.dueDate || "On Departure",
      }));
    }
    return [
      {
        title: "Verify passenger ID proofs & documentation",
        priority: "High",
        date: "Before Departure",
      },
      {
        title: "Confirm vehicle & driver assignments",
        priority: "Medium",
        date: "1 Day Before",
      },
      {
        title: "Finalize hotel vouchers & room allocation",
        priority: "High",
        date: "2 Days Before",
      },
      {
        title: "Send pre-trip briefing & WhatsApp update",
        priority: "Low",
        date: "Departure Day",
      },
    ];
  }, [checklistTasks]);

  const handlePrintVendorReceipt = (row: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const vendorName = row.vendor || row.hotel || "Assigned Vendor";
    const serviceType = row.type || "Vendor Service";
    const totalCost = row.total || row.amt || "0";
    const paidAmount =
      row.paid || row.amtSub?.replace("Paid: ₹", "") || row.amtSub || "0";
    const balanceDue =
      row.due ||
      (
        (parseFloat(totalCost.replace(/,/g, "")) || 0) -
        (parseFloat(paidAmount.replace(/,/g, "")) || 0)
      ).toLocaleString("en-IN");
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
              <p style="font-size: 11px; color: #64748b;">Date: ${new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-card">
              <div class="card-title">Vendor details</div>
              <p style="font-size:14px; font-weight:bold;">${vendorName}</p>
              ${phone ? `<p style="font-size:12px; color:#64748b;">Contact: ${phone}</p>` : ""}
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

  const handleDownloadGuideSheet = (hotelName: string, hotelBookingInput?: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Find real OpsHotelBooking if not explicitly passed
    const booking =
      hotelBookingInput ||
      opsHotels.find(
        (b: any) =>
          b.hotelName === hotelName ||
          b.vendor?.name === hotelName ||
          b.vendorName === hotelName,
      );

    const activePax = filterActivePassengers(allPassengers);

    const category = booking?.category || booking?.vendor?.category || "Not configured";
    const address = booking?.address || booking?.vendor?.address || booking?.location || "Not configured";
    const checkIn = booking?.checkInDate || booking?.checkIn || "Not configured";
    const checkOut = booking?.checkOutDate || booking?.checkOut || "Not configured";
    const phone = booking?.phone || booking?.vendor?.phone || booking?.vendor?.contactNumber || "Not configured";
    const manager = booking?.contactPerson || booking?.vendor?.contactPerson || "Not configured";
    const mealPlan = booking?.mealPlan || booking?.mealPlanType || "Not configured";

    const dRooms = safeNumber(booking?.doubleRoomsCount || booking?.doubleRooms);
    const tRooms = safeNumber(booking?.tripleRoomsCount || booking?.tripleRooms);
    const qRooms = safeNumber(booking?.quadRoomsCount || booking?.quadRooms);

    const roomDetailsText = [
      dRooms > 0 ? `${dRooms} Double` : "",
      tRooms > 0 ? `${tRooms} Triple` : "",
      qRooms > 0 ? `${qRooms} Quad` : "",
    ]
      .filter(Boolean)
      .join(", ") || "Not configured";

    // Group active passengers into rooms by room allocation
    const roomGroups: Record<string, string[]> = {};
    activePax.forEach((p) => {
      const alloc = passengerAllocations[p.id] || passengerAllocations[p.name];
      const rNum = alloc?.room || "Unassigned";
      if (!roomGroups[rNum]) roomGroups[rNum] = [];
      roomGroups[rNum].push(p.name);
    });

    const tableRowsHtml = Object.keys(roomGroups).length > 0
      ? Object.entries(roomGroups)
          .map(
            ([roomNo, paxNames]) => `
              <tr>
                <td>${roomNo}</td>
                <td>${paxNames.join(", ")}</td>
                <td>Not configured</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colSpan="3" style="text-align:center; color:#94a3b8;">No room assignments configured</td></tr>`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Guide Hotel Sheet - ${hotelName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 40px; line-height: 1.6; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 20px; font-weight: 900; text-transform: uppercase; color: #1e293b; }
            .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; }
            .label { font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
            .value { font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            @media print {
              body { margin: 0; padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <span class="title">YOUTHCAMPING OS</span>
              <p style="font-size:10px; color:#64748b; margin-top:2px; font-weight:bold;">GUIDE OPERATIONAL HOTEL SHEET</p>
            </div>
            <div style="text-align: right">
              <div class="title" style="font-size: 16px;">${hotelName}</div>
              <p style="font-size: 11px; color: #64748b; font-weight:bold;">Generated: ${new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          
          <div class="section-title">Hotel Information</div>
          <div class="grid">
            <div class="card">
              <div class="label">Hotel Name & Category</div>
              <div class="value">${hotelName} (${category})</div>
              <div class="label">Full Address</div>
              <div class="value">${address}</div>
            </div>
            <div class="card">
              <div class="label">Check-in</div>
              <div class="value">${checkIn}</div>
              <div class="label">Check-out</div>
              <div class="value">${checkOut}</div>
            </div>
          </div>

          <div class="section-title">Operational Contacts</div>
          <div class="grid">
            <div class="card">
              <div class="label">Reception Number</div>
              <div class="value">${phone}</div>
              <div class="label">Hotel Manager</div>
              <div class="value">${manager}</div>
            </div>
            <div class="card">
              <div class="label">Emergency Contact</div>
              <div class="value">${phone}</div>
              <div class="label">Google Maps Link</div>
              <div class="value">${booking?.mapUrl || booking?.vendor?.mapUrl || "Not configured"}</div>
            </div>
          </div>

          <div class="section-title">Stay & Rooming Information</div>
          <div class="grid" style="grid-template-columns: 1fr;">
            <div class="card">
              <div class="label">Total Active Passengers</div>
              <div class="value">${activePax.length} Passengers (${roomDetailsText})</div>
              <div class="label">Meal Plan</div>
              <div class="value">${mealPlan}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Room Number / Group</th>
                <th>Passengers</th>
                <th>Special Requests</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 800); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const computedPayments = useMemo(() => {
    const activeBookings = bookings.filter(
      (b: any) => !isPassengerCancelled(null, b),
    );
    return activeBookings.map((b: any) => {
      const fin = calculateBookingFinancialStatus(b);

      return {
        id: b.bookingId || `BK-${b.id.substring(0, 6).toUpperCase()}`,
        passenger: b.name || b.fullName || "Passenger",
        pax: b.numberOfTravelers || 1,
        phone: b.mobile || b.phone || "—",
        plan: b.tripName || "Standard Plan",
        amount: fin.totalAmount,
        paid: fin.netPaidAmount,
        pending: fin.remainingAmount,
        overpayment: fin.overpaymentAmount,
        refund: fin.refundAmount,
        mode: b.paymentMode || b.payment_method || "UPI",
        modeDetail: b.upi_reference ? `UPI Ref: ${b.upi_reference}` : "—",
        status: fin.paymentStatus,
        lastPayment: b.createdAt
          ? new Date(b.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
        bookingStatus: b.status?.toUpperCase() || "CONFIRMED",
      };
    });
  }, [bookings]);

  const computedDocuments = useMemo(() => {
    const list: any[] = [];

    // 1. Dynamic Hotel Vouchers
    const hotels = tripVendors.filter((v: any) => v.vendorType === "hotel");
    hotels.forEach((h: any, idx: number) => {
      const name = h.vendorId?.name || "Hotel";
      list.push({
        id: `doc-h-${idx}`,
        name: `hotel_voucher_${name.toLowerCase().replace(/\s+/g, "_")}.pdf`,
        sub: name,
        category: "Hotels",
        subcat: "Voucher",
        type: "PDF",
        size: "245 KB",
        uploadedBy: "Ops Desk",
        date: h.createdAt?.substring(0, 10) || "Recent",
        status: h.paymentStatus === "paid" ? "VERIFIED" : "PENDING",
      });
    });

    // 2. Dynamic Transport Permits/RC
    const transports = tripVendors.filter(
      (v: any) => v.vendorType === "transport",
    );
    transports.forEach((t: any, idx: number) => {
      const name = t.vendorId?.name || "Tempo Traveller";
      list.push({
        id: `doc-t-rc-${idx}`,
        name: `rc_book_${name.toLowerCase().replace(/\s+/g, "_")}.pdf`,
        sub: `${name}`,
        category: "Transport",
        subcat: "RC Book",
        type: "PDF",
        size: "380 KB",
        uploadedBy: "Ops Desk",
        date: "Recent",
        status: "VERIFIED",
      });
    });

    // 3. Dynamic Customer ID Proofs from Bookings
    bookings.forEach((b: any) => {
      let passengersObj = b.passengers;
      if (typeof passengersObj === "string") {
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
          name: `id_proof_${name.toLowerCase().replace(/\s+/g, "_")}.jpg`,
          sub: `Booking: ${b.bookingId || b.id}`,
          category: "Customer Documents",
          subcat: "Aadhar / ID Card",
          type: "Image",
          size: "1.2 MB",
          uploadedBy: name,
          date: b.createdAt?.substring(0, 10) || "Recent",
          status: "VERIFIED",
        });
      }

      if (Array.isArray(passengersObj?.persons)) {
        passengersObj.persons.forEach((p: any, idx: number) => {
          if (p.idProof) {
            list.push({
              id: `doc-p-${b.id}-${idx}`,
              name: `id_proof_${p.name.toLowerCase().replace(/\s+/g, "_")}.jpg`,
              sub: `Booking: ${b.bookingId || b.id} (Co-traveler)`,
              category: "Customer Documents",
              subcat: "Aadhar / ID Card",
              type: "Image",
              size: "1.1 MB",
              uploadedBy: p.name,
              uploadedOn: "Recent",
              status: "VERIFIED",
            });
          }
        });
      }
    });

    return list;
  }, [bookings, tripVendors]);

  // Dynamic Readiness Calculation via dedicated helper
  const calculatedReadinessScore = useMemo(() => {
    return calculateReadinessScore({
      stats,
      vendors: tripVendors,
      fleet: allocFleet,
      documents: computedDocuments,
    });
  }, [stats, tripVendors, allocFleet, computedDocuments]);

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

      const priority = t.stage.includes("30D")
        ? "HIGH"
        : t.stage.includes("7D")
          ? "MEDIUM"
          : "LOW";
      const status = t.isCompleted ? "COMPLETED" : "PENDING";

      return {
        id: t.id,
        task: t.taskName,
        sub: t.notes || "Checklist item assignment",
        category,
        assignee: t.completedBy?.name || "Ops Desk",
        role: "System Action",
        priority,
        dueDate: t.completedAt
          ? new Date(t.completedAt).toLocaleDateString("en-IN")
          : "TBD",
        dueNote: t.isCompleted ? "Completed" : "Action Required",
        status,
        rawTask: t,
      };
    });
  }, [checklistTasks]);

  const computedConversations = useMemo(() => {
    if (Array.isArray(tripDetails?.conversations) && tripDetails.conversations.length > 0) {
      return tripDetails.conversations.map((c: any, idx: number) => ({
        id: c.id || `conv-${idx}`,
        name: c.name || c.title || `Group ${idx + 1}`,
        sub: c.lastMessage || c.sub || "",
        time: c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        unread: c.unreadCount || 0,
        type: c.type || "group",
        icon: c.type === "direct" ? "👤" : "🏕️",
      }));
    }
    return [];
  }, [tripDetails]);

  const computedMessages = useMemo(() => {
    if (Array.isArray(tripDetails?.messages) && tripDetails.messages.length > 0) {
      return tripDetails.messages.map((m: any, idx: number) => ({
        id: m.id || `msg-${idx}`,
        convId: m.conversationId || m.convId || "g1",
        sender: m.senderName || m.sender || "Operations",
        role: m.senderRole || m.role || "Admin",
        avatar: (m.senderName || "OP").substring(0, 2).toUpperCase(),
        time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        text: m.text || m.content || "",
        reactions: m.reactions || [],
        isMine: m.isMine || false,
      }));
    }
    return [];
  }, [tripDetails]);

  useEffect(() => {
    if (bookings.length > 0) {
      setChatMessages(computedMessages);
    }
  }, [bookings, computedMessages]);

  const hotelStats = useMemo(() => {
    const activePax = filterActivePassengers(allPassengers);
    const summary = calculateRoomOccupancy(opsHotels, activePax, passengerAllocations);

    return {
      totalNights: summary.configuredNights,
      confirmedNights: summary.configuredNights,
      pendingNights: 0,
      totalRooms: summary.totalRooms,
      roomCapacity: summary.roomCapacity,
      totalPax: summary.totalActivePax,
      allocatedPax: summary.allocatedPax,
      unallocatedPax: summary.unallocatedPax,
      isCapacityShortfall: summary.isCapacityShortfall,
      shortfallPax: summary.shortfallPax,
      hasAccommodationConfigured: summary.hasAccommodationConfigured,
      occupancy: summary.roomCapacity > 0 ? ((summary.totalActivePax / summary.roomCapacity) * 100).toFixed(1) : "0",
    };
  }, [opsHotels, allPassengers, passengerAllocations]);

  useEffect(() => {
    if (allPassengers && allPassengers.length > 0) {
      setPassengerAllocations((prev) => {
        const next = { ...prev };
        allPassengers.forEach((p) => {
          if (isPassengerCancelled(p)) return;
          const key = p.id;
          if (!next[key]) {
            next[key] = {
              room: p.roomNo && p.roomNo !== "—" ? p.roomNo : "—",
              vehicle: "—",
              seat: "—",
            };
          }
        });
        return next;
      });
    }
  }, [allPassengers]);

  const computedRoomAllocations = useMemo(() => {
    const list: any[] = [];

    // Iterate allPassengers as the canonical source (one entry per person),
    // not Object.entries(passengerAllocations) which now has dual id+name keys
    // and would produce duplicates.
    allPassengers.forEach((pObj: any) => {
      const alloc = passengerAllocations[pObj.id] || passengerAllocations[pObj.name];
      if (!alloc || !alloc.room || alloc.room === "Unassigned" || alloc.room === "—") return;
      if (isPassengerCancelled(pObj)) return;

      const travelerName = pObj.name;
      const gender = pObj.gender === "Female" ? "GIRLS" : "BOYS";
      list.push({
        roomNumber: alloc.room,
        travelerName,
        passengerId: pObj.id,
        genderGroup: gender,
        rawGender: pObj.gender || "Unknown",
        roomType: pObj.roomType || "Double",
      });
    });

    // Add empty placeholder rooms for manually added room values

    manualRooms.forEach((rNum) => {
      const hasMembers = list.some((x) => x.roomNumber === rNum);
      if (!hasMembers) {
        list.push({
          roomNumber: rNum,
          travelerName: "",
          genderGroup: "BOYS",
          roomType: "Double",
          isEmptyPlaceholder: true,
        });
      }
    });

    return list;
  }, [passengerAllocations, allPassengers, manualRooms]);

  const computedVehicleAllocations = useMemo(() => {
    const list: any[] = [];
    // Iterate allPassengers as canonical source (one per person) to avoid duplicates
    // from dual id+name keys in passengerAllocations
    allPassengers.forEach((pObj: any) => {
      const alloc = passengerAllocations[pObj.id] || passengerAllocations[pObj.name];
      if (
        alloc?.vehicle &&
        alloc.vehicle !== "Unassigned" &&
        alloc.vehicle !== "—"
      ) {
        const fleetItem = allocFleet.find(
          (f) => f.name === alloc.vehicle || f.id === alloc.vehicle,
        );
        list.push({
          fleetId: fleetItem?.id || "tempo-1",
          vehicleType: alloc.vehicle,
          seatNumber: alloc.seat,
          travelerName: pObj.name,
          rawGender: pObj.gender || "Unknown",
        });
      }
    });
    return list;
  }, [passengerAllocations, allocFleet, allPassengers]);


  const allocWarnings = useMemo(() => {
    const warnings: string[] = [];
    allPassengers.forEach((p) => {
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
    const current = passengerAllocations[traveler.name] || {
      room: "—",
      vehicle: "—",
      seat: "—",
    };
    setShuffleRoom(current.room);

    // Resolve matching fleet item ID for correct select dropdown selection state
    const matchedFleet = allocFleet.find(
      (f) => f.name === current.vehicle || f.id === current.vehicle,
    );
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
    status: "CONFIRMED",
  });

  const handleAddActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newActivityData,
        name: newActivityData.act,
        dayNumber: Number(String(newActivityData.day).replace(/\D/g, "")) || 1,
      };
      const persisted = await saveActivityToBackend(api, tripId, departureDateStr, payload);
      setActivitiesList((prev) => [...prev, persisted]);
      setActivityModalOpen(false);
    } catch (err) {
      // API error toast is shown by saveActivityToBackend; UI state is not mutated on failure
    }
  };

  useEffect(() => {
    if (tripId.toLowerCase().includes("spt")) {
      setActivitiesList(MOCK_SPITI_ACTIVITIES);
    } else {
      setActivitiesList([
        // DAY 1: Train Journey
        {
          id: "dep-act-1",
          name: "Ahmedabad Station Check-in",
          dayNumber: 1,
          day: "Day 1",
          scheduledTime: "09:00 AM",
          endTime: "10:00 AM",
          status: "CONFIRMED",
          vendorName: "Indian Railways",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Neel Patel",
          vehicleName: "Train 19223",
          mealIncluded: "Not Included",
          isIncluded: true,
          type: "TRAVEL",
        },
        {
          id: "dep-act-2",
          name: "Group Briefing & Itinerary Handout",
          dayNumber: 1,
          day: "Day 1",
          scheduledTime: "11:30 AM",
          endTime: "12:00 PM",
          status: "CONFIRMED",
          vendorName: "YouthCamping Core",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Neel Patel",
          vehicleName: "Train Coach B4",
          mealIncluded: "Included",
          isIncluded: true,
          type: "TRAVEL",
        },
        {
          id: "dep-act-3",
          name: "Ice Breaking & Music Session",
          dayNumber: 1,
          day: "Day 1",
          scheduledTime: "12:00 PM",
          endTime: "01:30 PM",
          status: "READY",
          vendorName: "YouthCamping Core",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Anand Verma",
          vehicleName: "Train Coach B4",
          mealIncluded: "Included",
          isIncluded: true,
          type: "ENTERTAINMENT",
        },
        // DAY 2: Amritsar
        {
          id: "dep-act-4",
          name: "Punjabi Breakfast at Kesar Da Dhaba",
          dayNumber: 2,
          day: "Day 2",
          scheduledTime: "08:00 AM",
          endTime: "09:00 AM",
          status: "CONFIRMED",
          vendorName: "Kesar Da Dhaba",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 350,
          childPrice: 250,
          vendorCost: 200,
          guideName: "Neel Patel",
          vehicleName: "Traveller 1",
          mealIncluded: "Included",
          isIncluded: true,
          type: "MEAL",
        },
        {
          id: "dep-act-5",
          name: "Golden Temple Visit & Langar",
          dayNumber: 2,
          day: "Day 2",
          scheduledTime: "11:00 AM",
          endTime: "01:00 PM",
          status: "CONFIRMED",
          vendorName: "SGPC Heritage",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Neel Patel",
          vehicleName: "Traveller 1",
          mealIncluded: "Langar Included",
          isIncluded: true,
          type: "SIGHTSEEING",
        },
        {
          id: "dep-act-6",
          name: "Jallianwala Bagh Historic Tour",
          dayNumber: 2,
          day: "Day 2",
          scheduledTime: "01:00 PM",
          endTime: "02:30 PM",
          status: "CONFIRMED",
          vendorName: "Heritage Trust",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Neel Patel",
          vehicleName: "Traveller 1",
          mealIncluded: "Not Included",
          isIncluded: true,
          type: "SIGHTSEEING",
        },
        {
          id: "dep-act-7",
          name: "Wagah Border Excursion",
          dayNumber: 2,
          day: "Day 2",
          scheduledTime: "04:00 PM",
          endTime: "06:30 PM",
          status: "READY",
          vendorName: "Punjab Tourism",
          maxCapacity: 40,
          bookedCount: 38,
          adultPrice: 300,
          childPrice: 200,
          vendorCost: 150,
          guideName: "Anand Verma",
          vehicleName: "Traveller 1",
          mealIncluded: "Not Included",
          isIncluded: true,
          type: "SIGHTSEEING",
        },
        {
          id: "dep-act-8",
          name: "Departure to Kasol (Overnight Journey)",
          dayNumber: 2,
          day: "Day 2",
          scheduledTime: "10:00 PM",
          endTime: "06:00 AM",
          status: "CONFIRMED",
          vendorName: "Himachal Wheels",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Neel Patel",
          vehicleName: "Volvo 2+2 Bus",
          mealIncluded: "Not Included",
          isIncluded: true,
          type: "TRAVEL",
        },
        // DAY 3: Kasol
        {
          id: "dep-act-9",
          name: "Check-in & Refresh at Parvati Woods",
          dayNumber: 3,
          day: "Day 3",
          scheduledTime: "08:00 AM",
          endTime: "09:30 AM",
          status: "CONFIRMED",
          vendorName: "Parvati Woods Camp",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Neel Patel",
          vehicleName: "Kasol Shuttle",
          mealIncluded: "Included",
          isIncluded: true,
          type: "ACCOMMODATION",
        },
        {
          id: "dep-act-10",
          name: "Manikaran Sahib Gurudwara & Hot Springs",
          dayNumber: 3,
          day: "Day 3",
          scheduledTime: "11:00 AM",
          endTime: "01:30 PM",
          status: "CONFIRMED",
          vendorName: "Parvati Valley Tours",
          maxCapacity: 40,
          bookedCount: 36,
          adultPrice: 200,
          childPrice: 150,
          vendorCost: 100,
          guideName: "Neel Patel",
          vehicleName: "Kasol Shuttle",
          mealIncluded: "Langar Included",
          isIncluded: true,
          type: "SIGHTSEEING",
        },
        {
          id: "dep-act-11",
          name: "Chalal Trek & Cafe Walk",
          dayNumber: 3,
          day: "Day 3",
          scheduledTime: "05:30 PM",
          endTime: "07:30 PM",
          status: "READY",
          vendorName: "Local Mountain Guides",
          maxCapacity: 40,
          bookedCount: 35,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 200,
          guideName: "Anand Verma",
          vehicleName: "Self Guided",
          mealIncluded: "Not Included",
          isIncluded: true,
          type: "ADVENTURE",
        },
        {
          id: "dep-act-12",
          name: "Campfire & Acoustic Music",
          dayNumber: 3,
          day: "Day 3",
          scheduledTime: "08:00 PM",
          endTime: "10:30 PM",
          status: "CONFIRMED",
          vendorName: "Parvati Woods Camp",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Neel Patel",
          vehicleName: "Camp Ground",
          mealIncluded: "Dinner Included",
          isIncluded: true,
          type: "ENTERTAINMENT",
        },
        // DAY 4: Bijli Mahadev
        {
          id: "dep-act-13",
          name: "Bijli Mahadev Trek",
          dayNumber: 4,
          day: "Day 4",
          scheduledTime: "12:00 PM",
          endTime: "04:30 PM",
          status: "READY",
          vendorName: "Kullu Trekking Co.",
          maxCapacity: 40,
          bookedCount: 32,
          adultPrice: 600,
          childPrice: 450,
          vendorCost: 350,
          guideName: "Anand Verma",
          vehicleName: "Traveller 2",
          mealIncluded: "Packed Lunch",
          isIncluded: true,
          type: "ADVENTURE",
        },
        {
          id: "dep-act-14",
          name: "Manali Basecamp Check-in & Dinner",
          dayNumber: 4,
          day: "Day 4",
          scheduledTime: "07:00 PM",
          endTime: "09:30 PM",
          status: "CONFIRMED",
          vendorName: "Solang Heights Hotel",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Neel Patel",
          vehicleName: "Traveller 2",
          mealIncluded: "Dinner Included",
          isIncluded: true,
          type: "ACCOMMODATION",
        },
        // DAY 5: Adventure Day (Manali)
        {
          id: "dep-act-15",
          name: "Paragliding High Fly (Add-on)",
          dayNumber: 5,
          day: "Day 5",
          scheduledTime: "10:00 AM",
          endTime: "12:30 PM",
          status: "READY",
          vendorName: "Sky Riders Manali",
          maxCapacity: 35,
          bookedCount: 28,
          adultPrice: 2500,
          childPrice: 2000,
          vendorCost: 1900,
          guideName: "Neel Patel",
          vehicleName: "Traveller 1",
          mealIncluded: "Not Included",
          isIncluded: false,
          type: "ADVENTURE",
        },
        {
          id: "dep-act-16",
          name: "River Rafting — Beas River",
          dayNumber: 5,
          day: "Day 5",
          scheduledTime: "01:00 PM",
          endTime: "03:30 PM",
          status: "CONFIRMED",
          vendorName: "ABC Adventures",
          maxCapacity: 40,
          bookedCount: 32,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 200,
          guideName: "Neel Patel",
          vehicleName: "Traveller 1",
          mealIncluded: "Included",
          isIncluded: true,
          type: "ADVENTURE",
        },
        {
          id: "dep-act-17",
          name: "Kullu Shawl Factory Walk",
          dayNumber: 5,
          day: "Day 5",
          scheduledTime: "04:00 PM",
          endTime: "06:00 PM",
          status: "CONFIRMED",
          vendorName: "Bhuntar Weavers",
          maxCapacity: 40,
          bookedCount: 35,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Anand Verma",
          vehicleName: "Traveller 1",
          mealIncluded: "Tea & Snacks",
          isIncluded: true,
          type: "SIGHTSEEING",
        },
        // DAY 6: Solang
        {
          id: "dep-act-18",
          name: "ATV & Bike Ride (Add-on)",
          dayNumber: 6,
          day: "Day 6",
          scheduledTime: "10:00 AM",
          endTime: "11:30 AM",
          status: "CONFIRMED",
          vendorName: "Mountain Trails ATV",
          maxCapacity: 30,
          bookedCount: 24,
          adultPrice: 1500,
          childPrice: 1200,
          vendorCost: 900,
          guideName: "Neel Patel",
          vehicleName: "Traveller 2",
          mealIncluded: "Not Included",
          isIncluded: false,
          type: "ADVENTURE",
        },
        {
          id: "dep-act-19",
          name: "Solang Valley Snow Activities",
          dayNumber: 6,
          day: "Day 6",
          scheduledTime: "11:30 AM",
          endTime: "01:00 PM",
          status: "CONFIRMED",
          vendorName: "Solang Snow Club",
          maxCapacity: 40,
          bookedCount: 38,
          adultPrice: 800,
          childPrice: 600,
          vendorCost: 500,
          guideName: "Neel Patel",
          vehicleName: "Traveller 2",
          mealIncluded: "Not Included",
          isIncluded: false,
          type: "ADVENTURE",
        },
        {
          id: "dep-act-20",
          name: "Atal Tunnel & Sissu Visit",
          dayNumber: 6,
          day: "Day 6",
          scheduledTime: "01:00 PM",
          endTime: "05:00 PM",
          status: "READY",
          vendorName: "Lahaul Eco Tourism",
          maxCapacity: 40,
          bookedCount: 36,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 250,
          guideName: "Anand Verma",
          vehicleName: "4x4 Tempo Traveller",
          mealIncluded: "Not Included",
          isIncluded: true,
          type: "SIGHTSEEING",
        },
        // DAY 7: Manali
        {
          id: "dep-act-21",
          name: "Jogini Waterfall Trek",
          dayNumber: 7,
          day: "Day 7",
          scheduledTime: "08:00 AM",
          endTime: "11:30 AM",
          status: "CONFIRMED",
          vendorName: "Vashisht Trekking",
          maxCapacity: 40,
          bookedCount: 30,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 200,
          guideName: "Neel Patel",
          vehicleName: "Self Guided",
          mealIncluded: "Breakfast Included",
          isIncluded: true,
          type: "ADVENTURE",
        },
        {
          id: "dep-act-22",
          name: "Hadimba Temple & Club House",
          dayNumber: 7,
          day: "Day 7",
          scheduledTime: "01:00 PM",
          endTime: "04:30 PM",
          status: "CONFIRMED",
          vendorName: "Manali Cultural Trust",
          maxCapacity: 40,
          bookedCount: 38,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 100,
          guideName: "Neel Patel",
          vehicleName: "Manali Shuttle",
          mealIncluded: "Not Included",
          isIncluded: true,
          type: "SIGHTSEEING",
        },
        {
          id: "dep-act-23",
          name: "Mall Road Shopping & Cafe Hop",
          dayNumber: 7,
          day: "Day 7",
          scheduledTime: "05:00 PM",
          endTime: "09:00 PM",
          status: "CONFIRMED",
          vendorName: "Self Guided",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Anand Verma",
          vehicleName: "Self Guided",
          mealIncluded: "Not Included",
          isIncluded: true,
          type: "SIGHTSEEING",
        },
        // DAY 8: Return Journey
        {
          id: "dep-act-24",
          name: "Train Boarding — Return Journey",
          dayNumber: 8,
          day: "Day 8",
          scheduledTime: "09:00 AM",
          endTime: "10:00 AM",
          status: "CONFIRMED",
          vendorName: "Indian Railways",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Neel Patel",
          vehicleName: "Train 19224",
          mealIncluded: "Included",
          isIncluded: true,
          type: "TRAVEL",
        },
        // DAY 9: Arrival
        {
          id: "dep-act-25",
          name: "Arrival & Trip Conclusion",
          dayNumber: 9,
          day: "Day 9",
          scheduledTime: "08:00 AM",
          endTime: "09:00 AM",
          status: "CONFIRMED",
          vendorName: "YouthCamping Core",
          maxCapacity: 40,
          bookedCount: 40,
          adultPrice: 0,
          childPrice: 0,
          vendorCost: 0,
          guideName: "Neel Patel",
          vehicleName: "Train 19224",
          mealIncluded: "Not Included",
          isIncluded: true,
          type: "TRAVEL",
        },
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
    const activeTravelers = allPassengers.filter(
      (p) => !isPassengerCancelled(p),
    );
    const allocated = new Set<string>();

    // Step 1: Identify couples/groups — travelers sharing the same bookingId
    const bookingGroups = groupPassengersByBooking(activeTravelers);

    // Step 1: Allocate Same-Booking Groups (Same booking co-travelers stay together!)
    if (prioritizeCouples) {
      Object.values(bookingGroups).forEach((group) => {
        const unallocated = group.filter((p) => !allocated.has(p.id));
        if (unallocated.length >= 2) {
          let list = [...unallocated];
          while (list.length >= 2) {
            let chunkSize = 2;
            const pref = list[0]?.roomType || "";
            if (pref.includes("Quad") || pref.includes("Family") || list.length === 4) {
              chunkSize = Math.min(4, list.length);
            } else if (pref.includes("Triple") || list.length === 3) {
              chunkSize = Math.min(3, list.length);
            } else {
              chunkSize = Math.min(2, list.length);
            }

            const chunk = list.slice(0, chunkSize);
            chunk.forEach((p) => {
              newAllocs[p.id] = { room: `Room ${roomNum}` };
              allocated.add(p.id);
            });
            roomNum++;
            list = list.slice(chunkSize);
          }
        }
      });
    }

    const capacitySize = parseInt(sharingPref) || 3;

    // Helper Phase 1: Explicit Preferences (Respects Gender strictly)
    const allocatePass1 = (travelersList: any[]) => {
      if (travelersList.length === 0) return;
      const preferences = ["Single", "Double", "Triple", "Quad", "Family", "Dorm"];
      const capMap: Record<string, number> = { Single: 1, Double: 2, Triple: 3, Quad: 4, Family: 4, Dorm: 6 };
      
      preferences.forEach(pref => {
        const list = travelersList.filter(p => p.roomType === pref && !allocated.has(p.id));
        const cap = capMap[pref];
        let index = 0;
        while (index + cap <= list.length) {
          const chunk = list.slice(index, index + cap);
          chunk.forEach((p) => {
            newAllocs[p.id] = { room: `Room ${roomNum}` };
            allocated.add(p.id);
          });
          roomNum++;
          index += cap;
        }
      });
    };

    // Phase 1: Execute Explicit Preferences
    if (sameGenderEnforced) {
      const remainingMales = activeTravelers.filter(p => (p.gender || "").toLowerCase() === "male" && !allocated.has(p.id));
      allocatePass1(remainingMales);
      
      const remainingFemales = activeTravelers.filter(p => (p.gender || "").toLowerCase() === "female" && !allocated.has(p.id));
      allocatePass1(remainingFemales);
      
      const remainingUnknowns = activeTravelers.filter(p => !allocated.has(p.id) && (p.gender || "").toLowerCase() !== "male" && (p.gender || "").toLowerCase() !== "female");
      allocatePass1(remainingUnknowns);
    } else {
      const remainingAll = activeTravelers.filter(p => !allocated.has(p.id));
      allocatePass1(remainingAll);
    }

    // Phase 2: Smart Fallback (Allocates remaining unassigned travelers into rooms strictly per gender)
    const allocatePoolByGender = (genderPool: any[]) => {
      let pool = [...genderPool];
      while (pool.length > 0) {
        let chunkSize = Math.min(capacitySize, pool.length);
        if (chunkSize === 0) break;
        const chunk = pool.splice(0, chunkSize);
        chunk.forEach((p) => {
          if (p) {
            newAllocs[p.id] = { room: `Room ${roomNum}` };
            allocated.add(p.id);
          }
        });
        roomNum++;
      }
    };

    if (sameGenderEnforced) {
      const leftoverFemales = activeTravelers.filter(
        (p) => (p.gender || "").toLowerCase() === "female" && !allocated.has(p.id),
      );
      allocatePoolByGender(leftoverFemales);

      const leftoverMales = activeTravelers.filter(
        (p) => (p.gender || "").toLowerCase() === "male" && !allocated.has(p.id),
      );
      allocatePoolByGender(leftoverMales);

      const leftoverOthers = activeTravelers.filter(
        (p) => !allocated.has(p.id),
      );
      allocatePoolByGender(leftoverOthers);
    } else {
      const remainingAll = activeTravelers.filter((p) => !allocated.has(p.id));
      allocatePoolByGender(remainingAll);
    }

    // ── VEHICLE & TEMPO AUTO-ALLOCATION PASS ──
    // Initialize available fleet status
    const fallbackCapacity = parseInt(newVehicleCapacity) || 17;
    const fallbackName = newVehicleName || newVehicleType || "Tempo 1";
    const fleetStatus =
      allocFleet.length > 0
        ? allocFleet.map((f) => ({ ...f, remainingSeats: f.capacity }))
        : [
            {
              id: "tempo-1",
              name: fallbackName,
              capacity: fallbackCapacity,
              remainingSeats: fallbackCapacity,
              vehicleType: newVehicleType,
            },
          ];

    // Sort booking groups: groups containing female participants first to ensure they travel together
    const sortedGroups = Object.entries(bookingGroups).sort(
      ([, aList], [, bList]) => {
        const aHasFemale = aList.some((p) => p.gender === "Female") ? 1 : 0;
        const bHasFemale = bList.some((p) => p.gender === "Female") ? 1 : 0;
        return bHasFemale - aHasFemale; // Descending: female-containing groups first
      },
    );

    sortedGroups.forEach(([bId, groupMembers]) => {
      const gSize = groupMembers.length;
      // Try to find a vehicle that can fit the entire group
      let vehicle = fleetStatus.find((f) => f.remainingSeats >= gSize);
      if (!vehicle) {
        // Fallback: assign to the vehicle with the most remaining space
        vehicle = fleetStatus.reduce(
          (max, f) => (f.remainingSeats > max.remainingSeats ? f : max),
          fleetStatus[0],
        );
      }

      if (vehicle) {
        groupMembers.forEach((p) => {
          const seatIndex = vehicle.capacity - vehicle.remainingSeats + 1;
          // Key by p.id (same as room allocation) so computedVehicleAllocations can find it
          newAllocs[p.id] = {
            ...newAllocs[p.id],      // preserve room assignment written above
            vehicle: vehicle.name,
            seat: String(seatIndex),
          };
          vehicle.remainingSeats -= 1;
        });
      }
    });

    setPassengerAllocations(newAllocs);
  };

  useEffect(() => {
    if (allPassengers.length > 0) {
      handleTriggerAutoAllocate();
    }
  }, [sharingPref, sameGenderEnforced, prioritizeCouples, fallbackToQuad]);

  const computedParticipants = useMemo(() => {
    return allPassengers.map((p: any) => ({
      name: p.name || "Guest",
      role: p.notes === "Co-traveler" ? "Co-traveler" : "Lead Traveler",
      badge:
        p.paymentStatus === "Paid in Full"
          ? "PAID"
          : p.paymentStatus === "Partial Payment"
            ? "PARTIALLY PAID"
            : "PENDING",
    }));
  }, [allPassengers]);

  const passengerStats = useMemo(() => {
    const total = allPassengers.length;
    const paidInFull = allPassengers.filter(
      (p) => p.paymentStatus === "Paid in Full",
    ).length;
    const partial = allPassengers.filter(
      (p) => p.paymentStatus === "Partial Payment",
    ).length;
    const pending = allPassengers.filter(
      (p) => p.paymentStatus === "Payment Pending",
    ).length;
    const withDue = allPassengers.filter((p) => p.balance > 0).length;
    const totalDue = allPassengers
      .filter((p) => p.balance > 0)
      .reduce((s, p) => s + p.balance, 0);
    const outstandingPartial = allPassengers
      .filter((p) => p.paymentStatus === "Partial Payment")
      .reduce((s, p) => s + p.balance, 0);
    const outstandingPending = allPassengers
      .filter((p) => p.paymentStatus === "Payment Pending")
      .reduce((s, p) => s + p.balance, 0);
    // Reconciliation checklist stats
    const ticketed = allPassengers.filter(
      (p) => p.ticketStatus && p.ticketStatus !== "PENDING",
    ).length;
    const ticketVerified = allPassengers.filter(
      (p) => p.ticketVerified === true,
    ).length;
    const roomAllocated = allPassengers.filter(
      (p) => p.roomNo && p.roomNo !== "—" && p.roomNo !== "Unassigned",
    ).length;
    const transportAllocated = allPassengers.filter(
      (p) => p.pickupPoint && p.pickupPoint !== "—",
    ).length;
    const missingDocument = allPassengers.filter(
      (p) => p.documentStatus === "Missing",
    ).length;
    return {
      total,
      paidInFull,
      paidPercent: total > 0 ? ((paidInFull / total) * 100).toFixed(1) : "0",
      partial,
      outstandingPartial,
      pending,
      outstandingPending,
      withDue,
      totalDue,
      ticketed,
      ticketVerified,
      roomAllocated,
      transportAllocated,
      missingDocument,
    };
  }, [allPassengers]);

  const pickupOptions = useMemo(() => {
    const s = new Set<string>();
    allPassengers.forEach((p) => {
      if (p.pickupPoint) s.add(p.pickupPoint);
    });
    return Array.from(s);
  }, [allPassengers]);

  const filteredPassengers = useMemo(
    () =>
      allPassengers.filter((p) => {
        const matchSearch =
          p.name.toLowerCase().includes(paxSearch.toLowerCase()) ||
          p.phone.includes(paxSearch);
        const matchPayment =
          paymentFilter === "All"
            ? true
            : paymentFilter === "Payment Pending" ||
                paymentFilter === "Has Due Balance"
              ? p.balance > 0
              : p.paymentStatus === paymentFilter;
        const matchPickup =
          pickupFilter === "All" || p.pickupPoint === pickupFilter;
        const matchGender =
          genderFilter === "All" ||
          p.gender.toLowerCase() === genderFilter.toLowerCase();
        return matchSearch && matchPayment && matchPickup && matchGender;
      }),
    [allPassengers, paxSearch, paymentFilter, pickupFilter, genderFilter],
  );

  const paginatedPassengers = useMemo(
    () => filteredPassengers.slice((page - 1) * 10, page * 10),
    [filteredPassengers, page],
  );

  const bookingGroups = useMemo(() => {
    return bookings.map((b: any) => {
      let passengersObj = b.passengers;
      if (typeof passengersObj === "string") {
        try {
          passengersObj = JSON.parse(passengersObj);
        } catch (e) {
          passengersObj = {};
        }
      }

      const due =
        b.remainingAmount !== undefined
          ? b.remainingAmount
          : (b.totalAmount || 0) - (b.advancePaid || 0);
      const paymentStatusStr = (b.paymentStatus || "").toLowerCase();
      const paymentLabel =
        due <= 0
          ? "Paid in Full"
          : paymentStatusStr.includes("pending") ||
              b.advancePaid === 0 ||
              b.advancePaid === null
            ? "Payment Pending"
            : "Partial Payment";
      const paymentStatusShort =
        due <= 0
          ? "PAID"
          : paymentStatusStr.includes("pending") ||
              b.advancePaid === 0 ||
              b.advancePaid === null
            ? "UNPAID"
            : "PARTIALLY PAID";

      const personsRoomDetails =
        b.roomDetails?.personsRoomDetails ||
        passengersObj?.details?.personsRoomDetails ||
        {};

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
      const paxList = Array.isArray(passengersObj?.persons)
        ? passengersObj.persons
        : Array.isArray(passengersObj)
          ? passengersObj
          : [];
      const filteredCoPax = paxList.filter(
        (p: any) => normalizeCompareName(p?.name || "") !== normLeadName,
      );
      const passengerCount = filteredCoPax.length + 1;

      const perPersonAmount = (b.totalAmount || 12000) / passengerCount;
      const perPersonPaid = (b.advancePaid || 0) / passengerCount;
      const perPersonBalance = due > 0 ? due / passengerCount : 0;

      const leadPassenger = {
        name: leadName,
        age: normalizePassenger(b, null, 0).age || b.age || 24,
        gender: normalizePassenger(b, null, 0).genderFull,
        phone: b.phone || b.mobile || "—",
        email: b.email || "—",
        pickupPoint: b.pickupCity || "Ahmedabad",
        isLead: true,
        roomType:
          leadRoomInfo.roomType ||
          b.roomSharing ||
          b.roomType ||
          passengersObj?.details?.roomType ||
          (b.numberOfTravelers === 1 ? "Individual" : "Double Sharing"),
        coupleWith: leadRoomInfo.coupleWith || "",
        roomNo:
          leadRoomInfo.roomNo || passengersObj?.details?.roomAllocation || "—",
        paymentStatus: paymentLabel,
        amount: perPersonAmount,
        paidAmount: perPersonPaid,
        balance: perPersonBalance,
      };

      const personsList = [leadPassenger];

      if (Array.isArray(passengersObj?.persons)) {
        passengersObj.persons.forEach((p: any, idx: number) => {
          // Prevent duplicating lead if they are listed in persons too
          if (normalizeCompareName(p.name) === normLeadName) return;
          const coRoomInfo = personsRoomDetails[p.name] || {};
          personsList.push({
            name: p.name,
            age: normalizePassenger(b, p, idx).age || p.age || 24,
            gender: normalizePassenger(b, p, idx).genderFull,
            phone: p.phone || b.phone || "—",
            email: p.email || "—",
            pickupPoint: p.pickupPoint || b.pickupCity || "Ahmedabad",
            isLead: false,
            roomType:
              coRoomInfo.roomType ||
              p.roomSharing ||
              b.roomSharing ||
              b.roomType ||
              passengersObj?.details?.roomType ||
              "Double Sharing",
            coupleWith: coRoomInfo.coupleWith || "",
            roomNo:
              coRoomInfo.roomNo || b.passengers?.details?.roomAllocation || "—",
            paymentStatus: paymentLabel,
            amount: perPersonAmount,
            paidAmount: perPersonPaid,
            balance: perPersonBalance,
          });
        });
      }

      let coupleCount = 0;
      const coupleNames = new Set<string>();
      personsList.forEach((p) => {
        if (
          (p.roomType === "Couple" || p.roomType === "Double") &&
          p.coupleWith
        ) {
          const partner = personsList.find(
            (other) => other.name === p.coupleWith,
          );
          if (
            partner &&
            (partner.roomType === "Couple" || partner.roomType === "Double") &&
            partner.coupleWith === p.name
          ) {
            coupleNames.add([p.name, partner.name].sort().join("-"));
          }
        }
      });
      coupleCount = coupleNames.size;

      const roomsMap: Record<string, typeof personsList> = {};
      personsList.forEach((p) => {
        const rNo = p.roomNo || "Unassigned";
        if (!roomsMap[rNo]) roomsMap[rNo] = [];
        roomsMap[rNo].push(p);
      });

      const roomSummaries = Object.entries(roomsMap).map(([rNo, pList]) => {
        const couplesInRoom = pList.filter(
          (p) =>
            (p.roomType === "Couple" || p.roomType === "Double") &&
            p.coupleWith,
        );
        let roomDesc = "";
        if (couplesInRoom.length >= 2) {
          const pairNames: string[] = [];
          const matched = new Set<string>();
          couplesInRoom.forEach((p) => {
            if (matched.has(p.name)) return;
            const partner = couplesInRoom.find(
              (other) => other.name === p.coupleWith,
            );
            if (partner) {
              pairNames.push(`${p.name} + ${partner.name}`);
              matched.add(p.name);
              matched.add(partner.name);
            }
          });
          const nonCouple = pList.filter((p) => !matched.has(p.name));
          roomDesc = `${pairNames.join(", ")} (Double Sharing)`;
          if (nonCouple.length > 0) {
            roomDesc += ` + ${nonCouple.map((n) => n.name).join(", ")}`;
          }
        } else {
          roomDesc = pList.map((p) => p.name).join(", ");
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
        rawBooking: b,
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
      const matchSearch =
        paxSearch === "" ||
        bg.bookingRef.toLowerCase().includes(paxSearch.toLowerCase()) ||
        bg.leadName.toLowerCase().includes(paxSearch.toLowerCase()) ||
        bg.passengers.some(
          (p: any) =>
            p.name.toLowerCase().includes(paxSearch.toLowerCase()) ||
            p.phone.includes(paxSearch),
        );

      const matchBookingGroup =
        bookingGroupFilter === "All" || bg.bookingId === bookingGroupFilter;

      const hasUnallocated = bg.passengers.some(
        (p: any) =>
          p.roomNo === "—" ||
          p.roomNo.toLowerCase() === "unassigned" ||
          !p.roomNo,
      );
      const matchRoomAlloc =
        roomAllocFilter === "All" ||
        (roomAllocFilter === "Allocated" && !hasUnallocated) ||
        (roomAllocFilter === "Not Allocated" && hasUnallocated);

      const matchPayment =
        paymentFilter === "All"
          ? true
          : paymentFilter === "Payment Pending" ||
              paymentFilter === "Has Due Balance"
            ? bg.balance > 0
            : bg.paymentStatus === paymentFilter;

      const matchPickup =
        pickupFilter === "All" ||
        bg.pickupPoint === pickupFilter ||
        bg.passengers.some((p: any) => p.pickupPoint === pickupFilter);

      const matchTrainTicket =
        trainTicketFilter === "All" ||
        bg.trainTicketStatus === trainTicketFilter;

      const matchJoiningCity =
        joiningCityFilter === "All" ||
        bg.pickupPoint === joiningCityFilter ||
        bg.passengers.some((p: any) => p.pickupPoint === joiningCityFilter);

      const matchDocStatus =
        docStatusFilter === "All" ||
        bg.passengers.some(
          (p: any) => (p.documentStatus || "Verified") === docStatusFilter,
        );

      return (
        matchSearch &&
        matchBookingGroup &&
        matchRoomAlloc &&
        matchPayment &&
        matchPickup &&
        matchTrainTicket &&
        matchJoiningCity &&
        matchDocStatus
      );
    });
  }, [
    bookingGroups,
    paxSearch,
    bookingGroupFilter,
    roomAllocFilter,
    paymentFilter,
    pickupFilter,
    trainTicketFilter,
    joiningCityFilter,
    docStatusFilter,
  ]);

  const paginatedBookingGroups = useMemo(() => {
    return filteredBookingGroups.slice((page - 1) * 10, page * 10);
  }, [filteredBookingGroups, page]);

  // Payment stats
  const paymentKpis = useMemo(() => {
    const total = computedPayments.reduce((s, p) => s + p.amount, 0);
    const received = computedPayments.reduce((s, p) => s + p.paid, 0);
    const pending = computedPayments.reduce((s, p) => s + p.pending, 0);
    const overdue = computedPayments
      .filter((p) => p.status === "UNPAID")
      .reduce((s, p) => s + p.pending, 0);
    const refunds = computedPayments
      .filter((p) => p.status === "REFUNDED")
      .reduce((s, p) => s + p.paid, 0);
    const paidCount = computedPayments.filter(
      (p) => p.status === "PAID",
    ).length;
    return {
      total,
      received,
      pending,
      overdue,
      refunds,
      paidCount,
      totalCount: computedPayments.length,
    };
  }, [computedPayments]);

  const filteredPayments = useMemo(
    () =>
      computedPayments.filter(
        (p) => payStatusFilter === "All" || p.status === payStatusFilter,
      ),
    [computedPayments, payStatusFilter],
  );

  // Task stats
  const taskKpis = useMemo(
    () => ({
      total: computedTasks.length,
      completed: computedTasks.filter((t) => t.status === "COMPLETED").length,
      inProgress: computedTasks.filter((t) => t.status === "IN PROGRESS")
        .length,
      pending: computedTasks.filter((t) => t.status === "PENDING").length,
      overdue: computedTasks.filter((t) => t.status === "OVERDUE").length,
    }),
    [computedTasks],
  );

  const filteredTasks = useMemo(
    () =>
      computedTasks.filter(
        (t) =>
          (taskStatusFilter === "All" || t.status === taskStatusFilter) &&
          (taskCategoryFilter === "All" || t.category === taskCategoryFilter),
      ),
    [computedTasks, taskStatusFilter, taskCategoryFilter],
  );

  // Docs
  const filteredDocs = useMemo(
    () =>
      MOCK_DOCUMENTS.filter(
        (d) =>
          (docCategory === "all" ||
            d.category.toLowerCase().includes(docCategory)) &&
          (docSearch === "" ||
            d.name.toLowerCase().includes(docSearch.toLowerCase())),
      ),
    [docCategory, docSearch],
  );

  // Activities
  const filteredActivities = useMemo(
    () =>
      MOCK_ACTIVITIES.filter(
        (a) =>
          (actDayFilter === "All Days" || a.day === actDayFilter) &&
          (actTypeFilter === "All Activity Type" || a.type === actTypeFilter) &&
          (actStatusFilter === "All Status" || a.status === actStatusFilter) &&
          (actSearch === "" ||
            a.activity.toLowerCase().includes(actSearch.toLowerCase())),
      ),
    [actDayFilter, actTypeFilter, actStatusFilter, actSearch],
  );

  const actKpis = {
    total: 18,
    confirmed: 16,
    pending: 1,
    cancelled: 1,
    optional: 3,
  };

  const tabs = [
    { id: "overview",    label: "Overview" },
    { id: "passengers",  label: "Passengers" },
    { id: "hotels",      label: "Hotels" },
    { id: "transport",   label: "Transport" },
    { id: "guides",      label: "Guides" },
    { id: "activities",  label: "Activities" },
    { id: "operations",  label: "Operations", badge: computedTasks.filter((t) => t.status !== "COMPLETED").length || 0 },
    { id: "finance",     label: "Finance",    badge: computedPayments.filter((p) => p.pending > 0).length || 0 },
    { id: "stationpayments", label: "Station Payments" },
    { id: "documents",   label: "Documents" },
  ];

  // CTA label by tab
  const ctaLabel: Record<string, string> = {
    overview:    "Edit Departure",
    passengers:  "+ Add Passenger",
    hotels:      "+ Add Hotel",
    transport:   "+ Add Vehicle",
    guides:      "+ Assign Guide",
    activities:  "+ Add Activity",
    operations:  opsSubTab === "tasks" ? "+ Add Task" : "+ Add Template",
    finance:     "+ Add Payment",
    documents:   "+ Upload Document",
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F7FB] text-[#162B45] font-sans antialiased">
      {/* ─── MOBILE DEPARTURE WORKSPACE (<768px) ─── */}
      <div className="block md:hidden p-3 pb-24 overflow-y-auto">
        <MobileDepartureWorkspace
          departureName={tripDetails?.title || tripId}
          departureDate={departureDateStr}
          passengers={allPassengers}
          onSelectPassenger={(p) => setActivePassenger(p.rawPassenger || p)}
        />
      </div>

      {/* ─── DESKTOP DEPARTURE HUB (>=768px) ─── */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden">
        {/* ═══════════════════════════════════════════ HEADER ═══════════════════════════════════════════ */}
        <div className="bg-white border-b border-[#E2E8F0] shadow-xs">
          {/* Breadcrumb & Back Button */}
          <div className="px-4 sm:px-6 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <span
                onClick={() => navigate("/admin/operations")}
                className="hover:text-slate-600 cursor-pointer"
              >
                Departures Hub
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="hover:text-slate-600 cursor-pointer">
                {tripId}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-700 font-bold capitalize">
                {activeTab}
              </span>
            </div>

            <button
              onClick={() => navigate("/admin/operations")}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-[4px] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              Back to Departures Hub
            </button>
          </div>

          {/* Title row */}
          <div className="px-4 sm:px-6 pt-2 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin/operations")}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-[4px] transition-colors cursor-pointer shrink-0"
                title="Back to Departures Hub"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
                <span>Back</span>
              </button>
              <div className="w-8 h-8 rounded-[4px] bg-[#FFF0E6] flex items-center justify-center text-[#F97316] shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div>
                  <span className="text-[9.5px] font-black text-[#F97316] uppercase tracking-wider block mb-0.5">
                    Departure Operations Workspace
                  </span>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none font-mono whitespace-nowrap">
                    {departureRecord?.departureCode || `DEP-${tripId.toUpperCase()}-${departureDateStr}`}
                  </h1>
                </div>
                {(() => {
                  const status = departureRecord?.status || "Planning";
                  const statusColors: Record<string, string> = {
                    Planning: "bg-amber-100 text-amber-800 border-amber-200",
                    Ready: "bg-blue-100 text-blue-800 border-blue-200",
                    Confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
                    "In Progress": "bg-indigo-100 text-indigo-800 border-indigo-200",
                    Completed: "bg-slate-100 text-slate-800 border-slate-200",
                    Cancelled: "bg-rose-100 text-rose-800 border-rose-200",
                  };
                  return (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${statusColors[status] || "bg-slate-100 text-slate-800 border-slate-200"}`}>
                      {status}
                    </span>
                  );
                })()}
                <span className="text-slate-300">•</span>
                <span className="text-sm text-slate-600 font-semibold">
                  {tripDetails?.title || "Trip Departure"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 relative w-full sm:w-auto mt-3 sm:mt-0">
              {/* Dynamic Status Transition Buttons */}
              {(() => {
                const currentStatus = departureRecord?.status || "Planning";
                if (currentStatus === "Planning") {
                  return (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange("Ready")}
                      className="text-[11px] font-bold border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 sm:py-1.5 rounded-[4px] transition-colors"
                    >
                      Mark Ready
                    </button>
                  );
                }
                if (currentStatus === "Ready") {
                  return (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange("Confirmed")}
                      className="text-[11px] font-bold border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 sm:py-1.5 rounded-[4px] transition-colors shadow-xs"
                    >
                      Confirm Departure
                    </button>
                  );
                }
                if (currentStatus === "Confirmed") {
                  return (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange("In Progress")}
                      className="text-[11px] font-bold border border-indigo-300 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 sm:py-1.5 rounded-[4px] transition-colors shadow-xs"
                    >
                      Start Trip (In Progress)
                    </button>
                  );
                }
                if (currentStatus === "In Progress") {
                  return (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange("Completed")}
                      className="text-[11px] font-bold border border-slate-300 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 sm:py-1.5 rounded-[4px] transition-colors shadow-xs"
                    >
                      Complete Departure
                    </button>
                  );
                }
                return null;
              })()}

              <button
                onClick={() => {
                  setEditGuideName(leadGuideName);
                  setEditDepartureOpen(true);
                }}
                className="text-[11px] font-bold border border-slate-200 rounded-[4px] bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 sm:py-1.5 transition-colors w-full"
              >
                Edit Departure
              </button>
              <div className="relative w-full">
                <button
                  onClick={() => setMoreActionsOpen(!moreActionsOpen)}
                  className="w-full justify-center text-[11px] font-bold border border-slate-200 rounded-[4px] bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 sm:py-1.5 flex items-center gap-1 transition-colors"
                >
                  More Actions <ChevronDown className="w-3 h-3" />
                </button>
                {moreActionsOpen && (
                  <div className="absolute right-0 mt-1 w-full sm:w-44 bg-white border border-slate-200 rounded-[4px] shadow-lg py-1 z-50 text-left">
                    <button
                      onClick={() => {
                        handlePrintManifest();
                        setMoreActionsOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Print Manifest
                    </button>
                    {(departureRecord?.status || "Planning") !== "Cancelled" && (
                      <button
                        onClick={() => {
                          handleStatusChange("Cancelled");
                          setMoreActionsOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-bold"
                      >
                        Cancel Departure
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (activeTab === "passengers") {
                    setAddPassengerOpen(true);
                  } else if (activeTab === "operations" && opsSubTab === "tasks") {
                    setAddTaskModalOpen(true);
                  } else if (activeTab === "documents") {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.onchange = (e: any) => {
                      const file = e.target.files[0];
                      if (file) {
                        toast.success(
                          `Document "${file.name}" uploaded successfully!`,
                        );
                      }
                    };
                    input.click();
                  } else if (activeTab === "activities") {
                    setActivityModalOpen(true);
                  } else if (activeTab === "hotels") {
                    setHotelWizardStep(1);
                    setIsAddHotelWizardOpen(true);
                  } else if (activeTab === "guides") {
                    setAddGuideOpen(true);
                  } else {
                    toast.success(
                      `${ctaLabel[activeTab] || "Action"} triggered!`,
                    );
                  }
                }}
                className="col-span-2 sm:col-span-1 text-[11px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-4 py-2 sm:py-1.5 flex items-center justify-center gap-1.5 transition-colors shadow-sm w-full"
              >
                <Plus className="w-3.5 h-3.5" />
                {ctaLabel[activeTab] || "Action"}
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="px-4 sm:px-6 py-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-500 border-t border-slate-100 mt-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />{" "}
              {dateAndDurationLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />{" "}
              {passengerStats.total} Participants
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Lead Guide:{" "}
              {leadGuideName}
            </span>
            <span className="flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-slate-400" />{" "}
              {transportVehiclesLabel}
            </span>
            <span className="w-full sm:w-auto sm:ml-auto text-slate-400 font-mono text-[10.5px]">
              {departureRecord?.departureCode || `DEP-${tripId.toUpperCase()}-${departureDateStr}`}
            </span>
          </div>

          {/* Tab bar */}
          <div className="px-4 sm:px-6 flex gap-0 text-[11.5px] font-semibold overflow-x-auto no-scrollbar border-t border-slate-100">
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
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200",
                  )}
                >
                  {tab.label}
                  {tab.check && <Check className="w-3 h-3 text-emerald-500" />}
                  {tab.badge && (
                    <span
                      className={cn(
                        "text-[8px] font-extrabold px-1.5 rounded-full h-4 min-w-[16px] flex items-center justify-center",
                        isActive
                          ? "bg-[#F97316] text-white"
                          : "bg-red-500 text-white",
                      )}
                    >
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
              {/* ERP Modular Dashboard matching User Specification */}
              {(() => {
                const overviewHotels = tripVendors.filter((v: any) => v.vendorType === "hotel");
                const isHotelsConfirmed = overviewHotels.length > 0;
                
                const overviewTransport = tripVendors.filter((v: any) => v.vendorType === "transport");
                const isTransportConfirmed = overviewTransport.length > 0 || allocFleet.length > 0;
                
                const overviewGuide = tripVendors.filter((v: any) => v.vendorType === "guide");
                const isGuideAssigned = overviewGuide.length > 0;
                
                const formatCompact = (num: number) => {
                  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
                  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
                  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
                  return `₹${(num || 0).toLocaleString("en-IN")}`;
                };

                const rScore = readinessData?.totalScore ?? 0;
                const rStatus = readinessData?.status === "READY" ? "READY" : "ACTION REQUIRED";
                const missingList = readinessData?.missingItems || [];

                return (
                  <div className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-xs overflow-hidden">
                    <div className="flex bg-slate-900 text-white p-4 items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <h3 className="font-black text-lg font-mono">
                          {departureRecord?.departureCode || `DEP-${tripId.toUpperCase()}-${departureDateStr}`}
                        </h3>
                        <span className={`border px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${rStatus === "READY" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-amber-500/20 text-amber-400 border-amber-500/50"}`}>
                          {rStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Readiness</span>
                        <span className={`font-black text-lg ${rStatus === "READY" ? "text-emerald-400" : "text-amber-400"}`}>{rScore}%</span>
                      </div>
                    </div>

                    {missingList.length > 0 && (
                      <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 space-y-1">
                        <span className="font-bold flex items-center gap-1 text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Operational Missing Items ({missingList.length}):
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] font-medium text-amber-800">
                          {missingList.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Departure Readiness Summary Cockpit */}
                    <div className="p-4 bg-slate-900 text-white border-b border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">Departure Readiness Summary</span>
                        <span className="text-xs font-mono font-bold text-slate-300">Live DB Operational Status</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Hotels</p>
                          <p className={`font-black text-sm mt-0.5 ${isHotelsConfirmed ? "text-emerald-400" : "text-amber-400"}`}>
                            {overviewHotels.length} / {computedHotels.length || 7} Confirmed
                          </p>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Transport</p>
                          <p className={`font-black text-sm mt-0.5 ${isTransportConfirmed ? "text-emerald-400" : "text-amber-400"}`}>
                            {overviewTransport.length || allocFleet.length || 1} / 1 Assigned
                          </p>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Guides</p>
                          <p className={`font-black text-sm mt-0.5 ${isGuideAssigned ? "text-emerald-400" : "text-amber-400"}`}>
                            {overviewGuide.length || dbGuides.length || 1} Assigned
                          </p>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Check-ins</p>
                          <p className="font-black text-emerald-400 text-sm mt-0.5">
                            {computedHotels.length > 0 ? `${computedHotels.length} / ${computedHotels.length}` : "Updated"}
                          </p>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Payments</p>
                          <p className="font-black text-emerald-400 text-sm mt-0.5">
                            {stats.customerPaidPercent}% Collected
                          </p>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Tasks</p>
                          <p className="font-black text-emerald-400 text-sm mt-0.5">
                            {computedTasks.filter((t) => t.status === "COMPLETED").length} / {computedTasks.length || 15} Done
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-x divide-y md:divide-y-0 divide-[#E2E8F0] bg-slate-50">
                      <div className="p-4 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Passengers</p>
                        <p className="font-black text-slate-800 text-base">{stats.totalParticipants}</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hotels</p>
                        <p className={`font-black text-base ${isHotelsConfirmed ? "text-emerald-600" : "text-amber-600"}`}>
                          {isHotelsConfirmed ? "Confirmed" : "Pending"}
                        </p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Transport</p>
                        <p className={`font-black text-base ${isTransportConfirmed ? "text-emerald-600" : "text-amber-600"}`}>
                          {isTransportConfirmed ? "Confirmed" : "Pending"}
                        </p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Guide</p>
                        <p className={`font-black text-base ${isGuideAssigned ? "text-emerald-600" : "text-amber-600"}`}>
                          {isGuideAssigned ? "Assigned" : "Pending"}
                        </p>
                      </div>
                      <div className="p-4 text-center col-span-2 md:col-span-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Collections</p>
                        <div className="flex items-end justify-center gap-2">
                          <p className="font-black text-slate-800 text-base">{formatCompact(stats.totalCollected || stats.totalAdvance || 0)}</p>
                          <p className="text-[10px] font-bold text-emerald-600 mb-0.5">{stats.customerPaidPercent}%</p>
                        </div>
                      </div>
                      <div className="p-4 text-center col-span-2 md:col-span-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expenses</p>
                        <p className="font-black text-slate-800 text-base">{formatCompact(stats.totalExpenses || 0)}</p>
                      </div>
                      <div className="p-4 text-center col-span-2 md:col-span-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Profit</p>
                        <p className="font-black text-emerald-600 text-base">{formatCompact(stats.estProfit || 0)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
                {/* Outstanding Balance card */}
                <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Outstanding Balance
                      </span>
                      <h3 className="text-lg font-black text-[#EA580C] mt-1 font-mono">
                        ₹ {stats.customerOutstanding.toLocaleString("en-IN")}
                      </h3>
                      <p className="text-[9px] text-slate-400 mt-1">
                        From {stats.outstandingParticipantsCount} participants
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded bg-amber-50 flex items-center justify-center text-[#EA580C] text-sm">
                      ₹
                    </div>
                  </div>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">
                    View details
                  </button>
                </div>

                {/* Vendor Payables card */}
                <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Vendor Payables
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-1">
                        ₹ {stats.totalVendorPayables.toLocaleString("en-IN")}
                      </h3>
                      <p className="text-[9px] text-slate-400 mt-1">
                        Total pending
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded bg-slate-50 flex items-center justify-center text-slate-600">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">
                    View details
                  </button>
                </div>

                {/* Profit Est card */}
                <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Profit (Est.)
                      </span>
                      <h3 className="text-lg font-black text-emerald-600 mt-1">
                        ₹ {stats.estProfit.toLocaleString("en-IN")}
                      </h3>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {stats.profitPercent}% of revenue
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline mt-3.5 block">
                    View details
                  </button>
                </div>
              </div>

              {/* Dashboard grid mapping Screenshot 5 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Column 1: Departure Timeline */}
                <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                      <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">
                        Departure Timeline
                      </h3>
                    </div>
                    <div className="relative pl-5 border-l-2 border-slate-100 ml-1.5 space-y-4 py-1">
                      {timelineSteps.map((step, idx) => (
                        <div key={idx} className="relative">
                          {/* Bullet points */}
                          <div
                            className={cn(
                              "absolute -left-[27px] top-0.5 w-3 h-3 rounded-full border-2 bg-white",
                              step.active
                                ? "border-emerald-500 bg-emerald-500"
                                : step.current
                                  ? "border-blue-600 bg-blue-50"
                                  : "border-slate-200",
                            )}
                          />
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p
                                className={cn(
                                  "text-[11px] font-bold",
                                  step.pending
                                    ? "text-slate-400"
                                    : "text-slate-700",
                                )}
                              >
                                {step.title}
                              </p>
                              <p className="text-[9.5px] text-slate-400 mt-0.5">
                                {step.date}
                              </p>
                            </div>
                            {step.user && (
                              <span className="text-[9.5px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-[4px]">
                                {step.user}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info("Full timeline")}
                    className="text-[10px] font-black text-blue-600 hover:underline mt-4 text-left"
                  >
                    View full timeline
                  </button>
                </div>

                {/* Column 2: Itinerary Summary */}
                <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                      <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">
                        Itinerary Summary
                      </h3>
                      <button
                        onClick={() => setActiveTab("itinerary")}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        View full itinerary
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {computedItinerary.map((row: any, idx: number) => (
                        <div
                          key={idx}
                          className="py-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-700"
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 px-1.5 py-0.5 rounded-[4px]">
                              {row.day}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {row.date
                                ? row.date.split(" ").slice(0, 2).join(" ")
                                : "TBD"}
                            </span>
                          </div>
                          <p className="truncate flex-1 font-medium text-slate-600 text-left">
                            {row.plan || row.sub || "Day Plan"}
                          </p>
                          <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 py-0.5 rounded-[3px] shrink-0 uppercase tracking-wider">
                            {row.status || "ON TIME"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("itinerary")}
                    className="text-[10px] font-black text-blue-600 hover:underline mt-4 text-left"
                  >
                    View full itinerary & day plans
                  </button>
                </div>

                {/* Column 3: Quick Actions + Team Contacts */}
                <div className="space-y-4">
                  {/* Quick Actions Grid */}
                  <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                    <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-3">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          label: "Add Expense",
                          icon: <Sliders className="w-4 h-4 text-slate-500" />,
                          action: () => setActiveTab("payments"),
                        },
                        {
                          label: "Add Payment",
                          icon: (
                            <CreditCard className="w-4 h-4 text-[#F97316]" />
                          ),
                          action: () => setActiveTab("payments"),
                        },
                        {
                          label: "Add Task",
                          icon: (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ),
                          action: () => setActiveTab("tasks"),
                        },
                        {
                          label: "Upload Document",
                          icon: <Folder className="w-4 h-4 text-purple-600" />,
                          action: () => setActiveTab("documents"),
                        },
                        {
                          label: "Download Report",
                          icon: <Download className="w-4 h-4 text-slate-500" />,
                          action: () => setActiveTab("reports"),
                        },
                      ].map((act, idx) => (
                        <button
                          key={idx}
                          onClick={act.action}
                          className="flex flex-col items-center justify-center p-2.5 border border-slate-100 hover:bg-slate-50 rounded-[6px] transition-colors gap-2 text-center h-[72px] bg-white"
                        >
                          {act.icon}
                          <span className="text-[9.5px] font-bold text-slate-600 leading-tight">
                            {act.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team & Contacts */}
                  <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                      <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">
                        Team & Contacts
                      </h3>
                      <button
                        onClick={() => setActiveTab("guides")}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        View all contacts
                      </button>
                    </div>
                    <div className="space-y-3">
                      {computedTeamContacts.length > 0 ? (
                        computedTeamContacts.map((c, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar
                                initials={c.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                                className="bg-slate-700 w-6 h-6 text-[8px]"
                              />
                              <div>
                                <p className="font-bold text-slate-800">
                                  {c.name}
                                </p>
                                <p className="text-[9px] text-slate-400 font-semibold">
                                  {c.role}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-500 text-[10px]">
                                {c.phone}
                              </span>
                              <PhoneCall className="w-3.5 h-3.5 text-blue-500 hover:opacity-85 cursor-pointer shrink-0" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">
                          No team members assigned yet.
                        </p>
                      )}
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
                      <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">
                        Top Pending Tasks
                      </h3>
                      <button
                        onClick={() => setActiveTab("tasks")}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        View all tasks
                      </button>
                    </div>
                    <div className="space-y-3">
                      {computedTopTasks.map((task: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 text-[11px] font-semibold"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <p className="truncate font-medium text-slate-700 min-w-0 text-left">
                              {task.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={cn(
                                "text-[8px] font-black px-1.5 py-0.5 rounded-[3px] border uppercase",
                                task.priority === "High"
                                  ? "bg-red-50 text-red-600 border-red-100"
                                  : task.priority === "Medium"
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-slate-50 text-slate-500 border-slate-150",
                              )}
                            >
                              {task.priority}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-bold">
                              {task.date}
                            </span>
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
                      <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">
                        Payments Overview
                      </h3>
                      <button
                        onClick={() => setActiveTab("payments")}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        View all payments
                      </button>
                    </div>
                    <div className="space-y-3.5">
                      {[
                        {
                          label: "Customer Payments Received",
                          value: `₹ ${stats.customerPaid.toLocaleString("en-IN")}`,
                          percent: `${stats.customerPaidPercent}%`,
                          color: "text-emerald-600",
                        },
                        {
                          label: "Customer Outstanding",
                          value: `₹ ${stats.customerOutstanding.toLocaleString("en-IN")}`,
                          percent: `${stats.customerOutstandingPercent}%`,
                          color: "text-[#EA580C]",
                        },
                        {
                          label: "Vendor Payments Made",
                          value: `₹ ${stats.totalVendorPaid.toLocaleString("en-IN")}`,
                          percent: `${stats.vendorPaidPercent}%`,
                          color: "text-slate-700",
                        },
                        {
                          label: "Vendor Payables",
                          value: `₹ ${stats.totalVendorPayables.toLocaleString("en-IN")}`,
                          percent: `${stats.vendorPayablePercent}%`,
                          color: "text-slate-700",
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center gap-3 text-[11px] font-bold text-slate-800"
                        >
                          <span className="font-semibold text-slate-500 text-left">
                            {item.label}
                          </span>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono">{item.value}</span>
                            <span
                              className={cn(
                                "text-[10px] font-black shrink-0",
                                item.color,
                              )}
                            >
                              {item.percent}
                            </span>
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
                      <h3 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider">
                        Important Notes
                      </h3>
                      <button
                        onClick={() => toast.success("Add Note")}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        + Add Note
                      </button>
                    </div>
                    <div className="space-y-3 text-[11px]">
                      {[
                        {
                          text: "Some participants are arriving late in Manali. Monitor arrival timings.",
                          user: "Neeki",
                          date: "29 Jun 2027",
                          bg: "bg-amber-50/50 border-amber-100",
                        },
                        {
                          text: "Hotel Mountain View – 6 rooms upgraded to super deluxe category.",
                          user: "Suresh Bhai",
                          date: "28 Jun 2027",
                          bg: "bg-blue-50/30 border-blue-100",
                        },
                      ].map((note, idx) => (
                        <div
                          key={idx}
                          className={cn("p-2.5 rounded-[4px] border", note.bg)}
                        >
                          <p className="font-medium text-slate-700 text-left leading-relaxed">
                            {note.text}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1.5 text-left">
                            Added by {note.user} on {note.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info("View notes")}
                    className="text-[10px] font-black text-blue-600 hover:underline mt-4 text-left"
                  >
                    View all notes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────── PASSENGERS ──────────────────────── */}
          {activeTab === "passengers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-800">
                    Passengers
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {filteredPassengers.length} Passengers •{" "}
                    {filteredBookingGroups.length} Bookings
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePrintManifest()}
                    className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                  </button>
                </div>
              </div>

              {/* ENGINE STATISTICS PANEL */}
              {engineStats && (
                <div className="bg-slate-800 text-white p-5 rounded-[8px] shadow-sm mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-black tracking-wide flex items-center gap-2">
                        <Settings className="w-4 h-4 text-orange-400" />
                        Passenger Engine Output
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">Structured payload for downstream Assignment Engines</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1.5",
                        engineStats.readiness?.status === "Ready" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {engineStats.readiness?.status === "Ready" ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {engineStats.readiness?.status} - {engineStats.readiness?.reason}
                      </div>
                      <span className="text-[10px] font-bold bg-slate-700 px-2 py-1 rounded text-slate-300">LIVE</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pax</p>
                      <p className="text-xl font-black">{engineStats.summary?.total || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adults</p>
                      <p className="text-xl font-black">{engineStats.summary?.adults || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Children</p>
                      <p className="text-xl font-black">{engineStats.summary?.children || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Seniors</p>
                      <p className="text-xl font-black">{engineStats.summary?.seniors || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Twin Pairs</p>
                      <p className="text-xl font-black text-pink-400">{engineStats?.groups?.couples?.length || engineStats?.groups?.pairs?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Families</p>
                      <p className="text-xl font-black text-blue-400">{engineStats.groups?.families?.length || 0}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Gender Split</p>
                      <p className="text-sm font-bold">{engineStats.groups?.male?.length || 0} Male / {engineStats.groups?.female?.length || 0} Female</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Guides & Drivers</p>
                      <p className="text-sm font-bold text-orange-400">{engineStats.summary?.guides || 0} Guides / {engineStats.summary?.drivers || 0} Drivers</p>
                    </div>
                    {engineStats.warnings && engineStats.warnings.length > 0 && (
                      <div className="col-span-3 mt-2">
                         <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Validation Warnings ({engineStats.warnings.length})</p>
                         <div className="flex flex-wrap gap-2">
                           {engineStats.warnings.slice(0, 5).map((w: string, i: number) => (
                              <span key={i} className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded">{w}</span>
                           ))}
                           {engineStats.warnings.length > 5 && (
                              <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded">+{engineStats.warnings.length - 5} more</span>
                           )}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Total Passengers */}
                <div
                  onClick={() => {
                    setPaymentFilter("All");
                    setPage(1);
                  }}
                  className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Total Passengers
                  </p>
                  <p className="text-2xl font-black text-slate-800">
                    {passengerStats.total}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Total confirmed
                  </p>
                </div>
                {/* Paid in Full */}
                <div
                  onClick={() => {
                    setPaymentFilter("Paid in Full");
                    setPage(1);
                  }}
                  className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Paid in Full
                  </p>
                  <p className="text-2xl font-black text-emerald-600">
                    {passengerStats.paidInFull}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {passengerStats.paidPercent}% of total
                  </p>
                </div>
                {/* Partial Payment */}
                <div
                  onClick={() => {
                    setPaymentFilter("Partial Payment");
                    setPage(1);
                  }}
                  className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Partial Payment
                  </p>
                  <p className="text-2xl font-black text-amber-600">
                    {passengerStats.partial}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ₹{passengerStats.outstandingPartial.toLocaleString("en-IN")}{" "}
                    due
                  </p>
                </div>
                {/* Pending Due — shows ₹ amount prominently */}
                <div
                  onClick={() => {
                    setPaymentFilter("Payment Pending");
                    setPage(1);
                  }}
                  className="bg-red-50/50 border border-red-200 rounded-[4px] p-4 shadow-sm cursor-pointer hover:border-red-400 hover:shadow-md transition-all"
                >
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                    Pending Due
                  </p>
                  <p className="text-xl font-black text-red-600 leading-tight">
                    ₹{passengerStats.totalDue.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-red-400 font-bold mt-0.5">
                    {passengerStats.withDue} passengers with due
                  </p>
                </div>
                {/* Cancelled */}
                <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Cancelled
                  </p>
                  <p className="text-2xl font-black text-slate-400">0</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    0% of total
                  </p>
                </div>
              </div>

              {/* Reconciliation Checklist Stats */}
              <div className="bg-slate-50 border border-[#E2E8F0] rounded-[4px] p-3 flex flex-wrap items-center gap-6 text-xs text-slate-600 shadow-sm">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[9.5px]">
                  Reconciliation Checklist:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-800">
                    {passengerStats.total}
                  </span>{" "}
                  <span className="text-slate-400 font-medium">Confirmed</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-800">
                    {passengerStats.ticketed || 0}
                  </span>{" "}
                  <span className="text-slate-400 font-medium">Ticketed</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[#F97316]">
                    {passengerStats.ticketVerified || 0}
                  </span>{" "}
                  <span className="text-slate-400 font-medium">Verified</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-800">
                    {passengerStats.roomAllocated || 0}
                  </span>{" "}
                  <span className="text-slate-400 font-medium">
                    Room Allocated
                  </span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-800">
                    {passengerStats.transportAllocated || 0}
                  </span>{" "}
                  <span className="text-slate-400 font-medium">
                    Transport Allocated
                  </span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-red-650">
                    {passengerStats.missingDocument || 0}
                  </span>{" "}
                  <span className="text-slate-400 font-medium">
                    Missing Docs
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white border border-[#E2E8F0] rounded-[4px] shadow-sm p-3 flex flex-wrap gap-2 items-center">
                <div className="relative flex-grow min-w-[180px] max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone..."
                    value={paxSearch}
                    onChange={(e) => {
                      setPaxSearch(e.target.value);
                      setPage(1);
                    }}
                    className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#F97316]/30"
                  />
                </div>

                <select
                  value={bookingGroupFilter}
                  onChange={(e) => {
                    setBookingGroupFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 max-w-[180px]"
                >
                  <option value="All">All Booking Groups</option>
                  {bookingGroups.map((bg: any) => (
                    <option key={bg.bookingId} value={bg.bookingId}>
                      {bg.bookingRef} ({bg.leadName})
                    </option>
                  ))}
                </select>

                <select
                  value={roomAllocFilter}
                  onChange={(e) => {
                    setRoomAllocFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                >
                  <option value="All">All Room Allocation</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Not Allocated">Not Allocated</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                >
                  <option value="All">All Payments</option>
                  <option value="Paid in Full">Paid in Full</option>
                  <option value="Partial Payment">Partial Payment</option>
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Has Due Balance">Has Due Balance</option>
                </select>

                <select
                  value={pickupFilter}
                  onChange={(e) => {
                    setPickupFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                >
                  <option value="All">All Pickup Points</option>
                  {pickupOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <select
                  value={joiningCityFilter}
                  onChange={(e) => {
                    setJoiningCityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                >
                  <option value="All">All Joining Cities</option>
                  {joiningCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                <select
                  value={docStatusFilter}
                  onChange={(e) => {
                    setDocStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                >
                  <option value="All">All Doc Status</option>
                  <option value="Verified">Verified</option>
                  <option value="Missing">Missing</option>
                  <option value="Under Review">Under Review</option>
                </select>

                <select
                  value={trainTicketFilter}
                  onChange={(e) => {
                    setTrainTicketFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-[11px] font-semibold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                >
                  <option value="All">All Train Tickets</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="RAC">RAC</option>
                </select>
              </div>

              {/* Bulk Actions Bar */}
              {Object.values(selectedPassengerIds).some(v => v) && (
                <div className="bg-slate-800 text-white rounded-[4px] p-2 flex items-center justify-between text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 pl-2">
                    <span className="bg-slate-700 px-2 py-0.5 rounded-full text-[10px]">
                      {Object.values(selectedPassengerIds).filter(v => v).length} Selected
                    </span>
                    <span>Bulk Actions</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toast.info("Select a booking group to use the Allocate Rooms button.")}
                      className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors"
                    >
                      Update Room
                    </button>
                    <button 
                      onClick={async () => {
                        const newPickup = prompt("Enter new pickup point for selected passengers:");
                        if (newPickup !== null) {
                           // Collect bookings and their passengers to update
                           const bookingUpdates: Record<string, any> = {};
                           
                           allPassengers.forEach(pax => {
                             if (selectedPassengerIds[pax.id]) {
                               const bgId = pax.rawBooking?.id;
                               if (!bgId) return;
                               if (!bookingUpdates[bgId]) {
                                 bookingUpdates[bgId] = {
                                   passengers: pax.rawBooking.passengers || { details: {}, persons: [] },
                                   updates: {}
                                 };
                               }
                               bookingUpdates[bgId].updates[pax.name] = { pickupPoint: newPickup };
                             }
                           });
                           
                           try {
                             for (const bgId of Object.keys(bookingUpdates)) {
                               const b = bookingUpdates[bgId];
                               const currentDetails = b.passengers.details || {};
                               const newPersonsRoomDetails = {
                                 ...(currentDetails.personsRoomDetails || {})
                               };
                               
                               for (const paxName of Object.keys(b.updates)) {
                                 newPersonsRoomDetails[paxName] = {
                                   ...(newPersonsRoomDetails[paxName] || {}),
                                   ...b.updates[paxName]
                                 };
                               }
                               
                               await api.put(`/bookings/${bgId}`, {
                                 passengers: {
                                   ...b.passengers,
                                   details: {
                                     ...currentDetails,
                                     personsRoomDetails: newPersonsRoomDetails
                                   }
                                 }
                               });
                             }
                             toast.success("Bulk pickup point updated");
                             setSelectedPassengerIds({});
                             fetchPageData();
                           } catch (err) {
                             toast.error("Failed to apply bulk update");
                           }
                        }
                      }}
                      className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors"
                    >
                      Set Pickup
                    </button>
                    <button 
                      onClick={() => setSelectedPassengerIds({})}
                      className="bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                    <tr>
                      <th className="p-3 w-20 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={
                              allPassengers.length > 0 &&
                              paginatedBookingGroups.every(bg => 
                                bg.passengers.every((p: any) => selectedPassengerIds[p.id])
                              )
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const nextSelect = { ...selectedPassengerIds };
                              paginatedBookingGroups.forEach((bg) => {
                                bg.passengers.forEach((p: any) => {
                                  nextSelect[p.id] = checked;
                                });
                              });
                              setSelectedPassengerIds(nextSelect);
                            }}
                            className="rounded border-slate-300 text-[#F97316] focus:ring-[#F97316] w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            SEL
                          </span>
                        </div>
                      </th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        PASSENGER
                      </th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        PHONE
                      </th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        PICKUP
                      </th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-center">
                        TRAIN STATUS
                      </th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        PAYMENT
                      </th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right">
                        BALANCE
                      </th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        ROOM
                      </th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        REMARKS
                      </th>
                      <th className="p-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-center">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {paginatedBookingGroups.map((bg: any) => {
                      const isGroupExpanded =
                        expandedBookings[bg.bookingId] !== false;
                      return (
                        <React.Fragment key={bg.bookingId}>
                          {/* Expandable Group Header */}
                          <tr className="bg-slate-100/80 font-semibold text-slate-800 border-t border-b border-slate-200">
                            <td className="p-3 text-center flex items-center justify-center gap-1">
                              <input
                                type="checkbox"
                                checked={bg.passengers.every((p: any) => selectedPassengerIds[p.id])}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedPassengerIds((prev) => {
                                    const next = { ...prev };
                                    bg.passengers.forEach((p: any) => {
                                      next[p.id] = checked;
                                    });
                                    return next;
                                  });
                                }}
                                className="rounded border-slate-300 text-[#F97316] focus:ring-[#F97316] w-3.5 h-3.5 cursor-pointer mr-1"
                              />
                              <button
                                onClick={() => {
                                  setExpandedBookings((prev) => ({
                                    ...prev,
                                    [bg.bookingId]:
                                      prev[bg.bookingId] === false
                                        ? true
                                        : false,
                                  }));
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500"
                              >
                                {isGroupExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                            <td colSpan={9} className="p-3">
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                                    {bg.bookingRef}
                                  </span>
                                  <span className="font-extrabold text-slate-800">
                                    {bg.leadName}'s Group
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className="font-semibold text-slate-600 bg-slate-200/50 rounded-full px-2 py-0.5">
                                    {bg.totalPassengers} Passengers
                                  </span>
                                  {bg.coupleCount > 0 && (
                                    <span className="font-semibold text-pink-700 bg-pink-50 border border-pink-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                                      ♥ {bg.coupleCount} Couple
                                      {bg.coupleCount > 1 ? "s" : ""}
                                    </span>
                                  )}
                                  <span className="text-slate-400">•</span>
                                  <span
                                    className="text-slate-500 italic max-w-md truncate font-medium"
                                    title={bg.roomRequirement}
                                  >
                                    Rooms: {bg.roomRequirement}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4">
                                  {/* Financials */}
                                  <div className="text-right text-[11px] space-y-0.5">
                                    <div>
                                      Total:{" "}
                                      <span className="font-bold text-slate-700">
                                        ₹
                                        {bg.totalAmount.toLocaleString("en-IN")}
                                      </span>{" "}
                                      | Paid:{" "}
                                      <span className="font-bold text-emerald-600">
                                        ₹{bg.paidAmount.toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                    <div>
                                      Balance:{" "}
                                      <span
                                        className={cn(
                                          "font-bold",
                                          bg.balance > 0
                                            ? "text-red-650"
                                            : "text-emerald-600",
                                        )}
                                      >
                                        ₹{bg.balance.toLocaleString("en-IN")}
                                      </span>
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
                                            roomType:
                                              p.roomType || "Single",
                                            coupleWith: p.coupleWith || "",
                                            groupId: p.groupId || "",
                                          };
                                        });
                                        setModalAllocations(initialModal);
                                      }}
                                      className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors"
                                    >
                                      Allocate Rooms
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOpenBookingDetails(bg.bookingId)
                                      }
                                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                                    >
                                      Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {isGroupExpanded &&
                            bg.passengers.map((p: any) => (
                              <tr
                                key={p.id || p.name}
                                className="hover:bg-slate-50/30 transition-colors"
                              >
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedPassengerIds[p.id]}
                                    onChange={(e) => {
                                      setSelectedPassengerIds((prev) => ({
                                        ...prev,
                                        [p.id]: e.target.checked,
                                      }));
                                    }}
                                    className="rounded-[2px] border-slate-300 text-[#F97316] focus:ring-[#F97316] cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 pl-6">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className={cn(
                                        "font-bold text-slate-800 hover:text-blue-600 hover:underline cursor-pointer",
                                        !p.isLead &&
                                          "text-slate-650 font-medium pl-2 border-l border-slate-300",
                                      )}
                                      onClick={() =>
                                        handleOpenBookingDetails(bg.bookingId)
                                      }
                                    >
                                      {(p.roomType === "Couple" ||
                                        p.roomType === "Double") &&
                                      p.coupleWith ? (
                                        <span className="flex items-center gap-1">
                                          <span>{p.name}</span>
                                          <span className="text-pink-500 text-xs">
                                            ♥
                                          </span>
                                          <span className="text-slate-600 font-semibold">
                                            {p.coupleWith}
                                          </span>
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
                                  <div
                                    className={cn(
                                      "text-[10px] text-slate-400",
                                      !p.isLead && "pl-4",
                                    )}
                                  >
                                    {p.gender}, {p.age} yrs
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-slate-600">
                                  {p.phone}
                                </td>
                                <td className="p-3 font-semibold text-slate-700">
                                  {p.pickupPoint}
                                </td>

                                {/* Train Status */}
                                <td className="p-3 text-center">
                                  <span
                                    className={cn(
                                      "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                                      bg.trainTicketStatus === "CONFIRMED"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200",
                                    )}
                                  >
                                    {bg.trainTicketStatus}
                                  </span>
                                </td>

                                <td className="p-3">
                                  <StatusBadge
                                    status={
                                      p.paymentStatus === "Paid in Full"
                                        ? "PAID"
                                        : p.paymentStatus === "Partial Payment"
                                          ? "PARTIALLY PAID"
                                          : "UNPAID"
                                    }
                                  />
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Paid: ₹
                                    {p.paidAmount.toLocaleString("en-IN")} / pax
                                  </div>
                                </td>
                                <td
                                  className={cn(
                                    "p-3 text-right font-bold",
                                    p.balance > 0
                                      ? "text-red-500"
                                      : "text-emerald-600",
                                  )}
                                >
                                  <div>
                                    ₹{p.balance.toLocaleString("en-IN")}{" "}
                                    <span className="text-[10px] font-normal text-slate-400">
                                      / pax
                                    </span>
                                  </div>
                                  <div className="text-[9.5px] text-slate-400 font-normal mt-0.5">
                                    Group Due: ₹
                                    {bg.balance.toLocaleString("en-IN")}
                                  </div>
                                </td>

                                {/* Room Type Badge / Relationship */}
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    {getRelationshipBadge(p.roomType)}
                                    {p.groupId && (
                                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                        Group: {p.groupId}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Remarks */}
                                <td
                                  className="p-3 text-slate-600 italic text-[11px] max-w-[150px] truncate"
                                  title={
                                    p.notes || bg.rawBooking.adminNotes || "—"
                                  }
                                >
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
                      <tr>
                        <td
                          colSpan={10}
                          className="text-center p-10 text-slate-400 font-semibold"
                        >
                          No passengers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Showing {(page - 1) * 10 + 1} to{" "}
                    {Math.min(page * 10, filteredBookingGroups.length)} of{" "}
                    {filteredBookingGroups.length} booking groups
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      className="border border-slate-200 rounded-[4px] p-1 bg-white hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    {[
                      ...Array(
                        Math.min(
                          5,
                          Math.ceil(filteredBookingGroups.length / 10),
                        ),
                      ),
                    ].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPage(i + 1)}
                        className={cn(
                          "w-7 h-7 rounded-[4px] text-[11px] font-bold border",
                          page === i + 1
                            ? "bg-[#F97316] text-white border-[#F97316]"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700",
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={
                        page >= Math.ceil(filteredBookingGroups.length / 10)
                      }
                      onClick={() =>
                        setPage((p) =>
                          Math.min(
                            p + 1,
                            Math.ceil(filteredBookingGroups.length / 10),
                          ),
                        )
                      }
                      className="border border-slate-200 rounded-[4px] p-1 bg-white hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════ PLAN TAB ══════════════════════════ */}
          {/* Plan tab flattened — Hotels/Transport/Guides/Activities are now top-level tabs */}

          {/* ─── PLAN: ITINERARY ─── */}
          {activeTab === "plan" && planSubTab === "itinerary" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-800">
                    Itinerary
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Day by day plan for this departure
                  </p>
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
                          : "text-slate-500 hover:text-slate-800",
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
                          : "text-slate-500 hover:text-slate-800",
                      )}
                    >
                      Customer View
                    </button>
                  </div>
                  <button
                    onClick={() => toast.info("View Timeline")}
                    className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-400" /> View as
                    Timeline
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadCSV(
                        computedItinerary,
                        "itinerary_details.csv",
                      )
                    }
                    className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" /> Download
                    Itinerary
                  </button>
                  <button
                    onClick={() => setVersionHistoryOpen(true)}
                    className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" /> Version
                    History
                  </button>
                </div>
              </div>

              {/* Metrics cards */}
                {(() => {
                  const dayCount = computedItinerary.length || tripDetails?.durationDays || 9;
                  const nightCount = computedItinerary.filter((i: any) => i.stay && i.stay !== "—" && !i.stay.includes("No Stay")).length || (dayCount > 1 ? dayCount - 1 : 1);
                  const destSet = new Set(computedItinerary.map((i: any) => i.loc).filter(Boolean));
                  const destCount = destSet.size || 1;
                  const actCount = computedItinerary.filter((i: any) => i.activities && i.activities !== "—" && i.activities !== "").length;
                  const totalHotelCost = dbVendors.filter((v: any) => v.type?.toLowerCase() === "hotel").reduce((sum: number, h: any) => sum + (h.totalAmount || h.cost || 0), 0) || (stats.totalExpenses ? Math.round(stats.totalExpenses * 0.45) : 0);
                  const hotelVendorCount = dbVendors.filter((v: any) => v.type?.toLowerCase() === "hotel").length;

                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        {[
                          {
                            v: `${dayCount} Days / ${nightCount} Nights`,
                            l: "Duration & Stays",
                            icon: <Calendar className="w-4 h-4 text-blue-600" />,
                            bg: "bg-blue-50/50",
                          },
                          {
                            v: `${destCount} Destinations`,
                            l: "Places to be visited",
                            icon: <MapPin className="w-4 h-4 text-emerald-600" />,
                            bg: "bg-emerald-50/50",
                          },
                          {
                            v: `~${dayCount * 140} KM`,
                            l: "Total Travel Distance",
                            icon: <Bus className="w-4 h-4 text-cyan-600" />,
                            bg: "bg-cyan-50/50",
                          },
                          {
                            v: `${actCount} Activities`,
                            l: "Included in itinerary",
                            icon: <Star className="w-4 h-4 text-amber-600" />,
                            bg: "bg-amber-50/50",
                          },
                        ].map((kpi) => (
                          <div
                            key={kpi.l}
                            className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex items-center gap-3"
                          >
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                kpi.bg,
                              )}
                            >
                              {kpi.icon}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 leading-tight">
                                {kpi.v}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {kpi.l}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
                
                <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                    <tr className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-center border-r border-slate-100 w-16">
                        DAY
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-100 w-28">
                        DATE
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-100">
                        ITINERARY PLAN & DESTINATION
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-100 w-44">
                        OVERNIGHT STAY
                      </th>
                      {itineraryViewMode === "internal" && (
                        <th className="py-2.5 px-3 border-r border-slate-100 w-36">
                          TRAVEL DETAILS
                        </th>
                      )}
                      <th className="py-2.5 px-3 border-r border-slate-100 w-32">
                        MEALS
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-100 w-20 text-center">
                        STATUS
                      </th>
                      <th className="py-2.5 px-3 text-center w-12">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {computedItinerary.map((row, idx) => {
                      const isDescExpanded = expandedDescs[idx];
                      const firstLineSub = row.sub ? row.sub.split("\n")[0].replace(/^- /, "") : "";
                      const shouldTruncate = firstLineSub.length > 55;
                      const displayText =
                        shouldTruncate && !isDescExpanded
                          ? firstLineSub.substring(0, 55) + "..."
                          : firstLineSub;

                      const isStayEmpty = !row.stay || row.stay === "—";
                      const isMealsEmpty = !row.meals || row.meals === "—";

                      return (
                        <React.Fragment key={idx}>
                          <tr className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2 px-3 text-center border-r border-slate-100 font-bold text-slate-700">
                              <div className="flex items-center justify-center gap-1">
                                {itineraryViewMode === "internal" && (
                                  <button
                                    onClick={() =>
                                      setExpandedRows((prev) => ({
                                        ...prev,
                                        [idx]: !prev[idx],
                                      }))
                                    }
                                    className="text-slate-400 hover:text-slate-650 transition-colors"
                                  >
                                    <ChevronDown
                                      className={cn(
                                        "w-3.5 h-3.5 transition-transform",
                                        expandedRows[idx] && "rotate-180",
                                      )}
                                    />
                                  </button>
                                )}
                                <div>
                                  <span className="block font-black text-slate-900 text-xs">{row.day}</span>
                                  <span className="text-[9px] text-slate-400 font-bold block">
                                    {row.wd}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3 border-r border-slate-100 font-mono text-slate-600 font-bold text-xs">
                              {row.date}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-100">
                              <div className="font-bold text-slate-900 text-xs leading-snug">
                                {row.plan}
                              </div>
                              {firstLineSub && (
                                <div className="text-[11px] text-slate-500 font-medium truncate max-w-[400px]">
                                  {displayText}
                                  {shouldTruncate && (
                                    <button
                                      onClick={() =>
                                        setExpandedDescs((prev) => ({
                                          ...prev,
                                          [idx]: !prev[idx],
                                        }))
                                      }
                                      className="text-orange-600 font-bold ml-1 hover:underline text-[10px]"
                                    >
                                      {isDescExpanded ? "Less" : "More"}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-100">
                              {isStayEmpty ? (
                                <button
                                  onClick={() =>
                                    handleQuickAdd(row.rawIdx, "stay")
                                  }
                                  className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-600 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"
                                >
                                  <Plus className="w-2.5 h-2.5" /> Not Added
                                </button>
                              ) : (
                                <div>
                                  <div className="font-bold text-slate-800 text-xs truncate max-w-[150px]">
                                    {row.stay}
                                  </div>
                                  {row.stayType && (
                                    <span className="text-[9px] font-bold text-slate-400 block">
                                      {row.stayType}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            {itineraryViewMode === "internal" && (
                              <td className="py-2 px-3 border-r border-slate-100">
                                {!row.distance ? (
                                  <button
                                    onClick={() =>
                                      handleQuickAdd(row.rawIdx, "distance")
                                    }
                                    className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-600 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"
                                  >
                                    <Plus className="w-2.5 h-2.5" /> Not Added
                                  </button>
                                ) : (
                                  <div>
                                    <div className="font-bold text-slate-800 text-xs">
                                      {row.travel}
                                    </div>
                                    {row.travelSub && (
                                      <div className="text-[9px] text-slate-400 font-medium truncate max-w-[130px]">
                                        {row.travelSub}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            )}
                            <td className="py-2 px-3 border-r border-slate-100">
                              {isMealsEmpty ? (
                                <button
                                  onClick={() =>
                                    handleQuickAdd(row.rawIdx, "meals")
                                  }
                                  className="text-[10px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 hover:text-slate-600 rounded px-2 py-0.5 inline-flex items-center gap-1 transition-all"
                                >
                                  <Plus className="w-2.5 h-2.5" /> Not Added
                                </button>
                              ) : (
                                <span className="text-slate-700 font-bold text-xs">
                                  {row.meals}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-100 text-center">
                              <span
                                className={cn(
                                  "text-[8px] font-black border px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider",
                                  row.status === "INCOMPLETE"
                                    ? "bg-amber-50 text-amber-600 border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200",
                                )}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-36 bg-white border border-slate-200 rounded-[4px] shadow-lg py-1 z-50"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleQuickAdd(row.rawIdx, "edit")
                                    }
                                    className="text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  >
                                    Edit Day Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                          {expandedRows[idx] &&
                            itineraryViewMode === "internal" && (
                              <tr className="bg-slate-50/50">
                                <td
                                  colSpan={
                                    itineraryViewMode === "internal" ? 9 : 8
                                  }
                                  className="p-3.5 border-t border-b border-slate-100"
                                >
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[11px] font-medium text-slate-650">
                                    <div>
                                      <span className="block text-[9.5px] uppercase font-bold text-slate-400">
                                        Departure Time
                                      </span>
                                      {row.departureTime ? (
                                        <span className="text-slate-800 font-semibold">
                                          {row.departureTime}
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            handleQuickAdd(
                                              row.rawIdx,
                                              "departureTime",
                                            )
                                          }
                                          className="text-blue-500 hover:underline mt-0.5 block"
                                        >
                                          + Add Departure Time
                                        </button>
                                      )}
                                    </div>
                                    <div>
                                      <span className="block text-[9.5px] uppercase font-bold text-slate-400">
                                        Arrival Time
                                      </span>
                                      {row.arrivalTime ? (
                                        <span className="text-slate-800 font-semibold">
                                          {row.arrivalTime}
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            handleQuickAdd(
                                              row.rawIdx,
                                              "arrivalTime",
                                            )
                                          }
                                          className="text-blue-500 hover:underline mt-0.5 block"
                                        >
                                          + Add Arrival Time
                                        </button>
                                      )}
                                    </div>
                                    <div>
                                      <span className="block text-[9.5px] uppercase font-bold text-slate-400">
                                        Distance
                                      </span>
                                      {row.distance ? (
                                        <span className="text-slate-800 font-semibold">
                                          {row.distance}
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            handleQuickAdd(
                                              row.rawIdx,
                                              "distance",
                                            )
                                          }
                                          className="text-blue-500 hover:underline mt-0.5 block"
                                        >
                                          + Add Distance
                                        </button>
                                      )}
                                    </div>
                                    <div>
                                      <span className="block text-[9.5px] uppercase font-bold text-slate-400">
                                        Driving Hours
                                      </span>
                                      {row.drivingHours ? (
                                        <span className="text-slate-800 font-semibold">
                                          {row.drivingHours}
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            handleQuickAdd(
                                              row.rawIdx,
                                              "drivingHours",
                                            )
                                          }
                                          className="text-blue-500 hover:underline mt-0.5 block"
                                        >
                                          + Add Driving Hours
                                        </button>
                                      )}
                                    </div>
                                    <div>
                                      <span className="block text-[9.5px] uppercase font-bold text-slate-400">
                                        Assigned Vehicle
                                      </span>
                                      {row.assignedVehicle ? (
                                        <span className="text-slate-800 font-semibold">
                                          {row.assignedVehicle}
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            handleQuickAdd(
                                              row.rawIdx,
                                              "assignedVehicle",
                                            )
                                          }
                                          className="text-blue-500 hover:underline mt-0.5 block"
                                        >
                                          + Assign Vehicle
                                        </button>
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
                <span>
                  All times are tentative and subject to change due to weather,
                  traffic or operational reasons.
                </span>
              </div>
            </div>
          )}

          {/* Quick Edit Itinerary Day Modal */}
          <Dialog
            open={quickEditModalOpen}
            onOpenChange={setQuickEditModalOpen}
          >
            <DialogContent className="max-w-md bg-white p-5 rounded-[6px] border border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-sm font-black text-slate-800">
                  Edit Itinerary - Day{" "}
                  {editingDayIdx !== null ? editingDayIdx + 1 : ""}
                </DialogTitle>
                <DialogDescription className="text-[11px] text-slate-400">
                  Update the plan, stay, meals, activities, and operational
                  fields.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleSaveQuickEdit}
                className="space-y-3 mt-2 text-xs"
              >
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Plan & Destination
                  </label>
                  <Input
                    value={editingDayData.title}
                    onChange={(e) =>
                      setEditingDayData((prev: any) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g. Delhi → Shimla"
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Overnight Stay
                    </label>
                    <Input
                      value={editingDayData.stay}
                      onChange={(e) =>
                        setEditingDayData((prev: any) => ({
                          ...prev,
                          stay: e.target.value,
                        }))
                      }
                      placeholder="e.g. Hotel Ridge View"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Meals
                    </label>
                    <Input
                      value={editingDayData.meals}
                      onChange={(e) =>
                        setEditingDayData((prev: any) => ({
                          ...prev,
                          meals: e.target.value,
                        }))
                      }
                      placeholder="e.g. Breakfast, Dinner"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Activities (comma-separated)
                  </label>
                  <Input
                    value={editingDayData.activities}
                    onChange={(e) =>
                      setEditingDayData((prev: any) => ({
                        ...prev,
                        activities: e.target.value,
                      }))
                    }
                    placeholder="e.g. Mall Road Stroll, Sightseeing"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Departure Time
                    </label>
                    <Input
                      value={editingDayData.departureTime}
                      onChange={(e) =>
                        setEditingDayData((prev: any) => ({
                          ...prev,
                          departureTime: e.target.value,
                        }))
                      }
                      placeholder="e.g. 09:00 AM"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Arrival Time
                    </label>
                    <Input
                      value={editingDayData.arrivalTime}
                      onChange={(e) =>
                        setEditingDayData((prev: any) => ({
                          ...prev,
                          arrivalTime: e.target.value,
                        }))
                      }
                      placeholder="e.g. 06:00 PM"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Distance
                    </label>
                    <Input
                      value={editingDayData.distance}
                      onChange={(e) =>
                        setEditingDayData((prev: any) => ({
                          ...prev,
                          distance: e.target.value,
                        }))
                      }
                      placeholder="e.g. 340 KM"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Driving Hours
                    </label>
                    <Input
                      value={editingDayData.drivingHours}
                      onChange={(e) =>
                        setEditingDayData((prev: any) => ({
                          ...prev,
                          drivingHours: e.target.value,
                        }))
                      }
                      placeholder="e.g. 8 Hrs"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Assigned Vehicle
                    </label>
                    <Input
                      value={editingDayData.assignedVehicle}
                      onChange={(e) =>
                        setEditingDayData((prev: any) => ({
                          ...prev,
                          assignedVehicle: e.target.value,
                        }))
                      }
                      placeholder="e.g. Volvo / TT"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingDayData.description}
                    onChange={(e) =>
                      setEditingDayData((prev: any) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter day wise plan details..."
                    rows={3}
                    className="w-full text-xs border border-slate-200 rounded-[4px] p-2 bg-white text-slate-800 outline-none hover:border-slate-300 focus:border-slate-400"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setQuickEditModalOpen(false)}
                    className="h-8 text-xs font-bold text-slate-500 rounded"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Activity Dialog */}
          <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
            <DialogContent className="max-w-md bg-white p-5 rounded-lg shadow-lg border border-slate-200">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                Add Departure Activity
              </h3>
              <form
                onSubmit={handleAddActivitySubmit}
                className="space-y-4 mt-3"
              >
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    Day
                  </label>
                  <select
                    value={newActivityData.day}
                    onChange={(e) =>
                      setNewActivityData((prev) => ({
                        ...prev,
                        day: e.target.value,
                      }))
                    }
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
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newActivityData.act}
                    onChange={(e) =>
                      setNewActivityData((prev) => ({
                        ...prev,
                        act: e.target.value,
                      }))
                    }
                    placeholder="e.g. River Rafting or Solang Sightseeing"
                    className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    Subdescription
                  </label>
                  <input
                    type="text"
                    value={newActivityData.sub}
                    onChange={(e) =>
                      setNewActivityData((prev) => ({
                        ...prev,
                        sub: e.target.value,
                      }))
                    }
                    placeholder="e.g. Beas River or Hidimba Temple"
                    className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Type
                    </label>
                    <select
                      value={newActivityData.type}
                      onChange={(e) =>
                        setNewActivityData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
                    >
                      <option value="SIGHTSEEING">SIGHTSEEING</option>
                      <option value="TRAVEL">TRAVEL</option>
                      <option value="ADVENTURE">ADVENTURE</option>
                      <option value="STAY">STAY</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Timing
                    </label>
                    <input
                      type="text"
                      value={newActivityData.time}
                      onChange={(e) =>
                        setNewActivityData((prev) => ({
                          ...prev,
                          time: e.target.value,
                        }))
                      }
                      placeholder="e.g. 10:00 AM - 05:00 PM"
                      className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newActivityData.loc}
                      onChange={(e) =>
                        setNewActivityData((prev) => ({
                          ...prev,
                          loc: e.target.value,
                        }))
                      }
                      placeholder="e.g. Manali"
                      className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Status
                    </label>
                    <select
                      value={newActivityData.status}
                      onChange={(e) =>
                        setNewActivityData((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActivityModalOpen(false)}
                    className="h-8 text-xs font-bold text-slate-500 rounded"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 bg-[#F97316] hover:bg-[#E05E00] text-white font-bold text-xs uppercase rounded"
                  >
                    Add Activity
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Itinerary Version History Dialog */}
          <Dialog
            open={versionHistoryOpen}
            onOpenChange={setVersionHistoryOpen}
          >
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
                {!tripDetails?.itineraryVersions ||
                tripDetails.itineraryVersions.length === 0 ? (
                  <div className="text-center p-6 text-slate-400 font-semibold text-xs">
                    No version history found. Changes will generate versions
                    after confirmation.
                  </div>
                ) : (
                  [...tripDetails.itineraryVersions]
                    .reverse()
                    .map((ver: any, index: number) => {
                      const dateFormatted = ver.updatedAt
                        ? new Date(ver.updatedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Unknown Time";

                      return (
                        <div
                          key={index}
                          className="border border-slate-150 rounded-[4px] p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              Version {ver.version}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {dateFormatted} • by {ver.updatedBy || "System"}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {ver.itinerary?.length || 0} days defined
                            </p>
                          </div>
                          <Button
                            onClick={async () => {
                              try {
                                const restoredTrip = await api.put(
                                  `/trips/${tripDetails.id}`,
                                  {
                                    itinerary: ver.itinerary,
                                  },
                                );
                                setTripDetails(restoredTrip.data);
                                toast.success(
                                  `Restored to Version {ver.version} successfully!`,
                                );
                                setVersionHistoryOpen(false);
                              } catch (err: any) {
                                toast.error(
                                  `Failed to restore: ${err.message}`,
                                );
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
                <Button
                  variant="ghost"
                  onClick={() => setVersionHistoryOpen(false)}
                  className="h-8 text-xs font-bold text-slate-500 rounded"
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* 4-Step Add Hotel / Stay Assignment Wizard Modal */}
          <HotelAssignmentWizardModal
            isOpen={isAddHotelWizardOpen}
            onClose={() => setIsAddHotelWizardOpen(false)}
            computedItinerary={computedItinerary}
            dbVendors={dbVendors}
            tripId={tripId}
            departureDateStr={departureDateStr}
            totalPax={allPassengers.length}
            initialDayInfo={selectedWizardDayInfo}
            onSaveSuccess={fetchPageData}
          />

          {/* Hotel Details Right Drawer Modal */}
          <Dialog
            open={!!selectedStayForDrawer}
            onOpenChange={() => setSelectedStayForDrawer(null)}
          >
            <DialogContent className="max-w-lg bg-white p-6 rounded-[12px] shadow-2xl border border-slate-200 overflow-hidden fixed right-4 top-4 bottom-4 h-[calc(100vh-2rem)] flex flex-col justify-between">
              <div className="overflow-y-auto pr-1 flex-1 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#F97316] tracking-wider block">
                      {selectedStayForDrawer?.day} •{" "}
                      {selectedStayForDrawer?.destCity}
                    </span>
                    <h3 className="text-lg font-black text-slate-800 mt-0.5">
                      {selectedStayForDrawer?.hotel}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Supplied by {selectedStayForDrawer?.vendor}
                    </p>
                  </div>
                  <span className="text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                    {selectedStayForDrawer?.status || "Hotel Confirmed"}
                  </span>
                </div>

                {/* Section 1: Hotel Information */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                  <p className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    Hotel Information
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <p>
                      <b>Vendor:</b> {selectedStayForDrawer?.vendor}
                    </p>
                    <p>
                      <b>Contact Person:</b> Rajesh Sharma
                    </p>
                    <p>
                      <b>Phone:</b> +91 98765 43210
                    </p>
                    <p>
                      <b>GSTIN:</b> 02AAACR2345K1Z0
                    </p>
                  </div>
                </div>

                {/* Section 2: Room Allocation */}
                <div className="border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                  <p className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400">
                    Room Allocation
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(selectedStayForDrawer?.allocations || []).map(
                      (alloc: any, i: number) => (
                        <span
                          key={i}
                          className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {alloc.text}
                        </span>
                      ),
                    )}
                    <span className="text-xs font-bold text-slate-500 ml-auto">
                      {selectedStayForDrawer?.totalPaxText}
                    </span>
                  </div>
                </div>

                {/* Section 3: Voucher Controls */}
                <div className="border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                  <p className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400">
                    Voucher & Documents
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        toast.success("Downloading signed hotel voucher...")
                      }
                      className="flex-1 h-8 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded flex items-center justify-center gap-1.5 text-xs shadow-xxs"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />{" "}
                      Download Voucher
                    </button>
                    <button
                      onClick={() =>
                        toast.success("Voucher file uploaded successfully!")
                      }
                      className="flex-1 h-8 bg-[#FFF7ED] border border-[#F97316] text-[#F97316] hover:bg-[#FFEEDE] font-bold rounded flex items-center justify-center gap-1.5 text-xs shadow-xxs"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Signed Voucher
                    </button>
                  </div>
                </div>

                {/* Section 4: Payment Breakdown */}
                <div className="border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                  <p className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400">
                    Payment Breakdown
                  </p>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Vendor Agreed Rate:</span>
                    <span>₹{selectedStayForDrawer?.amt || "18,400"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Advance Paid:</span>
                    <span>₹9,200</span>
                  </div>
                  <div className="flex justify-between font-black text-rose-600 border-t border-slate-100 pt-1.5">
                    <span>Remaining Balance:</span>
                    <span>₹9,200</span>
                  </div>
                </div>

                {/* Section 5: Status Timeline (9-stage workflow) */}
                <div className="border border-slate-200 rounded-lg p-3.5 space-y-3">
                  <p className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400">
                    Workflow Timeline
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        step: "Draft",
                        completed: true,
                        time: "01 Aug, 10:00 AM",
                      },
                      {
                        step: "Rate Finalized",
                        completed: true,
                        time: "01 Aug, 11:45 AM",
                      },
                      {
                        step: "Voucher Sent",
                        completed: true,
                        time: "02 Aug, 02:30 PM",
                      },
                      {
                        step: "Hotel Confirmed",
                        completed: true,
                        time: "02 Aug, 04:30 PM",
                      },
                      { step: "Checked In", completed: false },
                      { step: "Checked Out", completed: false },
                      { step: "Invoice Received", completed: false },
                      { step: "Paid", completed: false },
                      { step: "Closed", completed: false },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black",
                              item.completed
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 text-slate-500",
                            )}
                          >
                            {item.completed ? "✓" : idx + 1}
                          </div>
                          <span
                            className={cn(
                              "font-bold",
                              item.completed
                                ? "text-slate-800"
                                : "text-slate-400",
                            )}
                          >
                            {item.step}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {item.time || "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center mt-3">
                <span className="text-[11px] font-bold text-slate-400">
                  Stay ID: {selectedStayForDrawer?.id || "STAY-01"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStayForDrawer(null)}
                  className="h-8 px-5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded shadow-xs"
                >
                  Close Drawer
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ──────────────────────── HOTELS & ACCOMMODATIONS WORKSPACE ──────────────────────── */}
          {/* ─── PLAN: ACCOMMODATION ─── */}
          {activeTab === "hotels" && (
            <AccommodationWorkspace
              computedItinerary={computedItinerary}
              opsHotelBookings={
                opsHotels && opsHotels.length > 0
                  ? opsHotels
                  : tripVendors
                      .filter((v: any) => v.vendorType === "hotel")
                      .map((v: any) => v.rawAssignment)
                      .filter(Boolean)
              }
              allPassengers={allPassengers}
              passengerAllocations={passengerAllocations}
              departureDateStr={departureDateStr}
              tripId={tripId}
              onEditHotel={(row: any, dayInfo?: any) => {
                setSelectedWizardDayInfo(
                  dayInfo || {
                    dayNum: row?.dayNum,
                    dayLabel: row?.dayLabel || row?.day,
                    destination: row?.destination || row?.location || row?.sub,
                    dateStr: row?.date,
                    existingBooking: row?.existingBooking || row?.booking || row,
                  },
                );
                setIsAddHotelWizardOpen(true);
              }}
            />
          )}


          {/* ─── PLAN: ALLOCATION ─── */}
          {activeTab === "transport" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-800">
                    Room & Vehicle Allocation
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Manage room sharing groups and vehicle seat allotments with
                    manual shuffling
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveAllocationsToDb(false)}
                    disabled={isSavingAllocations}
                    className="h-8.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] shadow-sm flex items-center gap-1.5"
                  >
                    {isSavingAllocations ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {isSavingAllocations ? "Saving..." : "Save to Database"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleTriggerAutoAllocate}
                    className="h-8.5 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] shadow-sm flex items-center gap-1.5"
                  >
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
                  <span className="text-[10px] font-bold text-slate-400">
                    Add available tempos/cars for this departure
                  </span>
                </div>

                <form
                  onSubmit={handleAddVehicle}
                  className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
                >
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedVehicleId(val);
                        if (val === 'custom') {
                          setNewVehicleType('17 Seater Tempo');
                          setNewVehicleCapacity('17');
                          setNewVehicleCost('');
                          setNewVehicleVendor('');
                          setSelectedVendorId('');
                        } else {
                          // Check Vendor Directory fleet options first
                          const dirVeh = vendorDirectoryFleet.find((v) => v.id === val);
                          if (dirVeh) {
                            setNewVehicleType(dirVeh.vehicleType);
                            setNewVehicleCapacity(String(dirVeh.capacity));
                            setNewVehicleCost(dirVeh.cost ? String(dirVeh.cost) : '');
                            setNewVehicleVendor(dirVeh.vendorName);
                            setNewVehicleName(dirVeh.driverName || `${dirVeh.vehicleType} - ${dirVeh.vendorName}`);
                            setSelectedVendorId(dirVeh.vendorId || '');
                            return;
                          }
                          // Check assigned departure fleet
                          const veh = fleetVehicles.find((v) => v.id === val);
                          if (veh) {
                            setNewVehicleType(veh.vehicleType);
                            setNewVehicleCapacity(String(veh.capacity));
                            setNewVehicleCost(String(veh.tariff?.amount ?? veh.totalAmount ?? ''));
                            setNewVehicleVendor(veh.vendor?.name ?? veh.notes ?? '');
                            setNewVehicleName(veh.driverName || veh.name || veh.vehicleType);
                            setSelectedVendorId(veh.vendorId || veh.vendor?.id || '');
                          }
                        }
                      }}
                      className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400 font-medium text-slate-800 bg-white"
                    >
                      <option value="">Select Vendor Vehicle / Fleet...</option>

                      {vendorDirectoryFleet.length > 0 && (
                        <optgroup label="Trip Vendors (Mapped Fleet)">
                          {vendorDirectoryFleet.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label || `${v.vehicleType} – ${v.vendorName}`}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {fleetVehicles.length > 0 && (
                        <optgroup label="Assigned Departure Fleet">
                          {fleetVehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.vehicleType} – {v.vendor?.name || v.notes || 'Vendor'} ({v.capacity} Seats) – ₹{v.tariff?.amount ?? v.totalAmount}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      <option value="custom">+ Custom Vehicle</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                      Capacity (Seats)
                    </label>
                    <select
                      value={newVehicleCapacity}
                      onChange={(e) => setNewVehicleCapacity(e.target.value)}
                      className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                    >
                      {[...Array(60)].map((_, i) => (
                        <option key={i + 1} value={String(i + 1)}>
                          {i + 1} Seats
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                      Name (e.g. Tempo 1)
                    </label>
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
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                      Cost (Rs)
                    </label>
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
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                      Vendor
                    </label>
                    <input
                      type="text"
                      placeholder="ABC Travels"
                      value={newVehicleVendor}
                      onChange={(e) => setNewVehicleVendor(e.target.value)}
                      className="h-8 w-full border border-slate-200 rounded-[4px] px-2 text-xs outline-none focus:border-slate-400"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-8 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded"
                  >
                    + Add Vehicle
                  </Button>
                </form>

                {/* Active Fleet List */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {allocFleet.map((v) => (
                    <div
                      key={v.id}
                      className="border border-slate-100 rounded-lg p-2.5 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-800">
                          {v.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {v.vehicleType} ({v.capacity} Seats)
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          Rs.{v.cost.toLocaleString("en-IN")} - {v.vendor}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 rounded"
                      >
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
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                      Room Sharing Basis
                    </label>
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
                    <label
                      htmlFor="rule-same-gender"
                      className="text-[11px] font-bold text-slate-650 cursor-pointer select-none"
                    >
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
                    <label
                      htmlFor="rule-prioritize-couples"
                      className="text-[11px] font-bold text-slate-650 cursor-pointer select-none"
                    >
                      Prioritize same-booking groups for 2-sharing rooms
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
                    <label
                      htmlFor="rule-fallback-quad"
                      className="text-[11px] font-bold text-slate-650 cursor-pointer select-none"
                    >
                      Fallback leftover travelers into 4-sharing
                    </label>
                  </div>
                </div>
              </div>

              {/* WhatsApp Generated Lists Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-[6px] p-4 flex items-center justify-between text-white shadow-sm">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    Step 5: Output - Auto-Generated WhatsApp Lists
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Ready to copy and paste directly into WhatsApp departure
                    groups.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCopyTempoList}
                    className="h-8.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase flex items-center gap-1.5 rounded border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Tempo List
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCopyRoomList}
                    className="h-8.5 bg-[#F97316] hover:bg-[#E05E00] text-white font-bold text-xs uppercase flex items-center gap-1.5 rounded"
                  >
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
                    <p className="text-xs text-slate-400 font-medium py-4 text-center">
                      No group assignments. Use the shuffler below or
                      Auto-Allocate.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(
                        computedRoomAllocations.reduce(
                          (acc: Record<string, any>, r) => {
                            if (!acc[r.roomNumber])
                              acc[r.roomNumber] = {
                                type: r.roomType,
                                members: [],
                                genders: [],
                                rawGenders: [],
                              };
                            acc[r.roomNumber].members.push(r.travelerName);
                            acc[r.roomNumber].genders.push(r.genderGroup);
                            acc[r.roomNumber].rawGenders.push(r.rawGender);
                            return acc;
                          },
                          {},
                        ),
                      ).map(([roomNum, rData]: any) => {
                        const hasBoys = rData.genders.includes("BOYS");
                        const hasGirls = rData.genders.includes("GIRLS");
                        const roomTag =
                          hasBoys && hasGirls
                            ? "COUPLE"
                            : hasGirls
                              ? "GIRLS"
                              : "BOYS";
                        return (
                          <div
                            key={roomNum}
                            className="border border-slate-100 rounded-lg p-3 bg-slate-50 hover:border-emerald-250 transition-colors"
                          >
                            <p className="text-[10px] font-extrabold text-slate-800 flex items-center justify-between border-b border-slate-100/60 pb-1">
                              <span>{roomNum}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManualRooms((prev) =>
                                    prev.filter((r) => r !== roomNum),
                                  );
                                  setPassengerAllocations((prev) => {
                                    const updated = { ...prev };
                                    Object.entries(updated).forEach(
                                      ([name, alloc]) => {
                                        if (alloc.room === roomNum) {
                                          updated[name] = {
                                            ...alloc,
                                            room: "—",
                                          };
                                        }
                                      },
                                    );
                                    return updated;
                                  });
                                  toast.success(`Deleted room: ${roomNum}`);
                                }}
                                className="text-red-500 hover:text-red-700 transition-colors p-0.5 rounded hover:bg-red-50"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </p>
                            <ul
                              className="mt-2 space-y-1.5 min-h-[40px] rounded p-1"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const travelerName =
                                  e.dataTransfer.getData("travelerName");
                                if (!travelerName) return;
                                setPassengerAllocations((prev) => {
                                  const current = prev[travelerName] || {
                                    room: "—",
                                    vehicle: "—",
                                    seat: "—",
                                  };
                                  return {
                                    ...prev,
                                    [travelerName]: {
                                      ...current,
                                      room: roomNum,
                                    },
                                  };
                                });
                                toast.success(
                                  `Moved ${travelerName} to ${roomNum}`,
                                );
                              }}
                            >
                              {rData.members
                                .filter(Boolean)
                                .map((m: string, i: number) => {
                                  const rawG = (rData.rawGenders[i] || "").toLowerCase();
                                  let dotColor = "bg-emerald-500"; // default
                                  if (rawG === "male") dotColor = "bg-blue-500";
                                  else if (rawG === "female") dotColor = "bg-pink-500";

                                  return (
                                    <li
                                      key={i}
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData("travelerName", m);
                                      }}
                                      className="text-[11px] font-bold text-slate-655 flex items-center gap-1.5 cursor-pointer hover:text-[#F97316] transition-colors bg-white px-2 py-1 rounded border border-slate-100 shadow-2xs hover:shadow-xs active:scale-[0.98] select-none"
                                      onClick={() => handleOpenShuffle({ name: m })}
                                    >
                                      <span className={`h-1.5 w-1.5 ${dotColor} rounded-full shrink-0`} />
                                      {m}
                                    </li>
                                  );
                                })}
                              {rData.members.filter(Boolean).length === 0 && (
                                <li className="text-[10px] italic text-slate-400 font-medium py-1 text-center">
                                  Empty Room
                                </li>
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
                    <p className="text-xs text-slate-400 font-medium py-4 text-center">
                      No transport assignments. Use the shuffler below or
                      Auto-Allocate.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(
                        computedVehicleAllocations.reduce(
                          (acc: Record<string, any>, v) => {
                            if (!acc[v.fleetId]) acc[v.fleetId] = [];
                            acc[v.fleetId].push(v);
                            return acc;
                          },
                          {},
                        ),
                      ).map(([fleetId, travelers]: any) => {
                        const fleetItem = allocFleet.find(
                          (f) => f.id === fleetId,
                        );
                        return (
                          <div
                            key={fleetId}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const travelerName =
                                e.dataTransfer.getData("travelerName");
                              if (!travelerName) return;
                              const fleetName =
                                fleetItem?.name || "Tempo Traveller";
                              setPassengerAllocations((prev) => {
                                const current = prev[travelerName] || {
                                  room: "—",
                                  vehicle: "—",
                                  seat: "—",
                                };
                                const entry = { ...current, vehicle: fleetName };
                                const updated = { ...prev, [travelerName]: entry };
                                // Also find passenger by name and write by id
                                const pObj = allPassengers.find((p: any) => p.name === travelerName);
                                if (pObj?.id) updated[pObj.id] = { ...entry };
                                return updated;
                              });
                              toast.success(
                                `Moved ${travelerName} to ${fleetName}`,
                              );
                            }}
                            className="border border-slate-100 rounded-lg p-3 bg-slate-50 hover:border-blue-250 transition-colors"
                          >
                            <p className="text-[10px] font-extrabold text-slate-800 flex items-center justify-between">
                              <span>
                                {fleetItem?.name ||
                                  travelers[0]?.vehicleType ||
                                  "Tempo Traveller"}{" "}
                                (
                                {fleetItem?.vehicleType ||
                                  travelers[0]?.vehicleType ||
                                  "Tempo"}
                                )
                              </span>
                              <span className="text-[9px] font-black text-slate-450 uppercase font-mono">
                                {travelers.length} /{" "}
                                {fleetItem?.capacity ||
                                  parseInt(
                                    travelers[0]?.vehicleType?.match(
                                      /\d+/,
                                    )?.[0],
                                  ) ||
                                  17}{" "}
                                Seats Filled
                              </span>
                            </p>
                            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 min-h-[40px]">
                              {travelers.map((t: any, i: number) => {
                                const rawG = (t.rawGender || "").toLowerCase();
                                let theme = "text-emerald-600 bg-emerald-50 border-emerald-100";
                                if (rawG === "male") theme = "text-blue-600 bg-blue-50 border-blue-100";
                                else if (rawG === "female") theme = "text-pink-600 bg-pink-50 border-pink-100";

                                return (
                                  <p
                                    key={i}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("travelerName", t.travelerName);
                                    }}
                                    className="text-[11px] font-bold text-slate-650 truncate flex items-center gap-2 cursor-pointer hover:text-[#F97316] transition-colors bg-white px-2 py-1 rounded border border-slate-100 shadow-2xs hover:shadow-xs active:scale-[0.98] select-none"
                                    onClick={() => handleOpenShuffle({ name: t.travelerName })}
                                  >
                                    <span className={`text-[9px] font-black font-mono ${theme} border px-1.5 py-0.2 rounded shrink-0`}>
                                      #{t.seatNumber || i + 1}
                                    </span>
                                    {t.travelerName}
                                  </p>
                                );
                              })}
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
                    {isSavingAllocations ? "Saving..." : "💾 Save to Database"}
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
                        <p className="text-sm font-black text-slate-800">
                          Clear All Allocations?
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          This will soft-cancel all ACTIVE room and vehicle
                          allocations for this departure in the database. This
                          action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowClearAllocationsDialog(false)}
                        className="h-8 text-[11px] font-bold text-slate-600"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={isSavingAllocations}
                        onClick={() => handleSaveAllocationsToDb(true)}
                        className="h-8 text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-[4px]"
                      >
                        {isSavingAllocations ? "Clearing..." : "Yes, Clear All"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────── GUIDES ──────────────────────── */}
          {/* ─── PLAN: GUIDES ─── */}
          {activeTab === "guides" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-800">
                    Guides & Crew
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Manage guides assigned to this departure — payment tracking
                    and day-wise allocation
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setAddGuideOpen((v) => !v)}
                    className="h-8.5 text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Guide
                  </Button>
                </div>
              </div>

              {/* KPI Cards — live from dbGuides */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[
                  {
                    v: String(dbGuides.length),
                    l: "Total Guides",
                    sub: "Assigned to departure",
                  },
                  {
                    v: `₹${dbGuides.reduce((s, g) => s + (g.agreedAmount || 0), 0).toLocaleString("en-IN")}`,
                    l: "Total Agreed",
                    sub: "All guides combined",
                  },
                  {
                    v: `₹${dbGuides.reduce((s, g) => s + (g.advancePaid || 0), 0).toLocaleString("en-IN")}`,
                    l: "Total Advance",
                    sub: "Paid so far",
                  },
                  {
                    v: `₹${dbGuides.reduce((s, g) => s + (g.balanceAmount || 0), 0).toLocaleString("en-IN")}`,
                    l: "Balance Due",
                    sub: "Remaining payment",
                  },
                ].map((k) => (
                  <div
                    key={k.l}
                    className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs"
                  >
                    <p className="text-2xl font-black text-slate-800">{k.v}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                      {k.l}
                    </p>
                    <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">
                      {k.sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Guide Inline Form */}
              {addGuideOpen && (
                <form
                  onSubmit={handleAddGuide}
                  className="bg-orange-50 border border-orange-200 rounded-[6px] p-4 space-y-3"
                >
                  <p className="text-[11px] font-black text-orange-700 uppercase tracking-wider">
                    Assign Guide to Departure
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                        Guide Name *
                      </label>
                      <input
                        required
                        value={guideForm.guideName}
                        onChange={(e) =>
                          setGuideForm((f) => ({
                            ...f,
                            guideName: e.target.value,
                          }))
                        }
                        placeholder="e.g. Dikshu Sharma"
                        className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                        Role / Type
                      </label>
                      <select
                        value={guideForm.assignmentType}
                        onChange={(e) =>
                          setGuideForm((f) => ({
                            ...f,
                            assignmentType: e.target.value,
                          }))
                        }
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
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                        Days Working
                      </label>
                      <input
                        type="number"
                        value={guideForm.daysWorked}
                        min="1"
                        max="30"
                        onChange={(e) =>
                          setGuideForm((f) => ({
                            ...f,
                            daysWorked: e.target.value,
                          }))
                        }
                        className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                        Agreed Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={guideForm.agreedAmount}
                        min="0"
                        onChange={(e) =>
                          setGuideForm((f) => ({
                            ...f,
                            agreedAmount: e.target.value,
                          }))
                        }
                        placeholder="e.g. 8000"
                        className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                        Advance Paid (₹)
                      </label>
                      <input
                        type="number"
                        value={guideForm.advancePaid}
                        min="0"
                        onChange={(e) =>
                          setGuideForm((f) => ({
                            ...f,
                            advancePaid: e.target.value,
                          }))
                        }
                        className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                        Reporting Time
                      </label>
                      <input
                        type="time"
                        value={guideForm.reportingTime}
                        onChange={(e) =>
                          setGuideForm((f) => ({
                            ...f,
                            reportingTime: e.target.value,
                          }))
                        }
                        className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                        Notes
                      </label>
                      <input
                        value={guideForm.notes}
                        onChange={(e) =>
                          setGuideForm((f) => ({ ...f, notes: e.target.value }))
                        }
                        placeholder="e.g. Lead guide, experienced in Spiti"
                        className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">
                        Emergency Contact
                      </label>
                      <input
                        value={guideForm.emergencyContact}
                        onChange={(e) =>
                          setGuideForm((f) => ({
                            ...f,
                            emergencyContact: e.target.value,
                          }))
                        }
                        placeholder="+91 XXXXXXXXXX"
                        className="h-8 w-full px-2.5 text-[11px] rounded-[4px] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-300"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSavingGuide}
                      className="h-8 text-[11px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px]"
                    >
                      {isSavingGuide ? "Saving..." : "Save Guide"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setAddGuideOpen(false)}
                      className="h-8 text-[11px] font-bold text-slate-600 rounded-[4px]"
                    >
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
                      <th className="p-3 border-r border-slate-100">
                        GUIDE NAME
                      </th>
                      <th className="p-3 border-r border-slate-100">ROLE</th>
                      <th className="p-3 border-r border-slate-100 text-center">
                        STATUS
                      </th>
                      <th className="p-3 border-r border-slate-100 text-center">
                        DAYS
                      </th>
                      <th className="p-3 border-r border-slate-100 text-right">
                        AGREED
                      </th>
                      <th className="p-3 border-r border-slate-100 text-right">
                        ADVANCE PAID
                      </th>
                      <th className="p-3 border-r border-slate-100 text-right">
                        BALANCE DUE
                      </th>
                      <th className="p-3 border-r border-slate-100">NOTES</th>
                      <th className="p-3 border-r border-slate-100">
                        ADDED ON
                      </th>
                      <th className="p-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {dbGuides.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="p-8 text-center text-[11px] text-slate-400 font-semibold"
                        >
                          No guides assigned yet. Click "Assign Guide" to add
                          the first guide.
                        </td>
                      </tr>
                    ) : (
                      dbGuides
                        .filter((g: any) => g.assignmentStatus !== "CANCELLED")
                        .map((g: any) => {
                          const guideDisplayName =
                            g.guideName ||
                            g.name ||
                            g.vendor?.name ||
                            "Assigned Guide";
                          const initials = guideDisplayName
                            .split(" ")
                            .map((n: string) => n[0])
                            .filter(Boolean)
                            .join("")
                            .substring(0, 2)
                            .toUpperCase();

                          return (
                            <tr
                              key={g.id || guideDisplayName}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="p-3 border-r border-slate-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px] uppercase">
                                    {initials}
                                  </div>
                                  <span className="font-bold text-slate-800">
                                    {guideDisplayName}
                                  </span>
                                </div>
                              </td>
                            <td className="p-3 border-r border-slate-100">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">
                                {(g.assignmentType || "PRIMARY_GUIDE").replace(
                                  /_/g,
                                  " ",
                                )}
                              </span>
                            </td>
                            <td className="p-3 border-r border-slate-100 text-center">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider border",
                                  g.assignmentStatus === "CONFIRMED" ||
                                    g.assignmentStatus === "ACCEPTED"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : g.assignmentStatus === "ASSIGNED"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : g.assignmentStatus === "CANCELLED"
                                        ? "bg-slate-100 text-slate-500 border-slate-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200",
                                )}
                              >
                                {g.assignmentStatus || "ASSIGNED"}
                              </span>
                            </td>
                            <td className="p-3 border-r border-slate-100 text-center font-semibold text-slate-600">
                              {g.daysWorked}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-800">
                              ₹
                              {Number(g.agreedAmount || 0).toLocaleString(
                                "en-IN",
                              )}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right font-semibold text-emerald-700">
                              ₹
                              {Number(g.advancePaid || 0).toLocaleString(
                                "en-IN",
                              )}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right">
                              <span
                                className={cn(
                                  "font-bold",
                                  Number(g.balanceAmount || 0) > 0
                                    ? "text-red-600"
                                    : "text-emerald-600",
                                )}
                              >
                                ₹
                                {Number(g.balanceAmount || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </span>
                            </td>
                            <td className="p-3 border-r border-slate-100 text-slate-500 font-medium text-[11px]">
                              {g.notes || "—"}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-slate-400 text-[10px] font-semibold">
                              {new Date(g.createdAt).toLocaleDateString(
                                "en-IN",
                                { day: "2-digit", month: "short" },
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteGuide(g.id, g.guideName)
                                }
                                className="h-7 w-7 text-red-400 hover:bg-red-50 hover:text-red-600 rounded"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom summary bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-3 flex items-center justify-between text-xs font-semibold">
                <span>
                  {dbGuides.length === 0
                    ? "No guides assigned"
                    : `${dbGuides.length} guide${dbGuides.length !== 1 ? "s" : ""} assigned to this departure`}
                </span>
                <span className="text-slate-400 text-[10px]">
                  All changes saved to database automatically
                </span>
              </div>
            </div>
          )}

          {/* ──────────────────────── ACTIVITIES ──────────────────────── */}
          {/* ─── PLAN: ACTIVITIES ─── */}
          {activeTab === "activities" && (
            <DepartureActivities
              tripId={tripId}
              departureDateStr={departureDateStr}
              tripDetails={tripDetails}
              computedItinerary={computedItinerary}
              allPassengers={allPassengers}
              tripVendors={tripVendors}
              activitiesList={activitiesList}
              fetchPageData={fetchPageData}
              setActivitiesList={setActivitiesList}
              api={api}
            />
          )}

          {/* ══════════════════════════ OPERATIONS TAB ══════════════════════════ */}
          {activeTab === "operations" && (
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
              {([
                { id: "control", label: "Trip Control Sheet" },
                { id: "tasks",   label: "Checklist & Tasks" },
              ] as { id: "control" | "tasks"; label: string }[]).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setOpsSubTab(s.id as any)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap border",
                    opsSubTab === s.id
                      ? "bg-[#F97316] text-white border-[#F97316] shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* ─── OPERATIONS: TRIP CONTROL (EXCEL REPLACEMENT) ─── */}
          {activeTab === "operations" && opsSubTab === "control" && (
            <DepartureTripControl
              tripId={tripId}
              departureDateStr={departureDateStr}
              tripDetails={tripDetails}
              computedItinerary={computedItinerary}
              tripVendors={tripVendors}
              opsHotels={opsHotels}
              allocFleet={allocFleet}
              dbGuides={dbGuides}
              totalPax={passengerStats.total || 15}
              onEditHotel={(row: any) => {
                setSelectedWizardDayInfo(row);
                setIsAddHotelWizardOpen(true);
              }}
              onOpenTransportModal={() => {
                setActiveTab("transport");
              }}
              onOpenGuideModal={() => {
                setAddGuideOpen(true);
              }}
            />
          )}

          {/* Ticketing and Allocation sub-tabs removed — use top-level tabs instead */}

          {/* ─── OPERATIONS: TASKS / CHECKLIST ─── */}
          {activeTab === "operations" && opsSubTab === "tasks" && (
            <DepartureTasks
              tripId={tripId}
              departureDateStr={departureDateStr}
            />
          )}
          {/* ══════════════════════════ MONEY TAB ══════════════════════════ */}
          {activeTab === "finance" && (
            <div className="space-y-4">
              <DepartureMoneySummary
                tripId={tripId}
                departureDateStr={departureDateStr}
                stats={stats}
                tripVendors={tripVendors}
              />
              <DeparturePayments
                tripId={tripId}
                departureDateStr={departureDateStr}
                tripDetails={tripDetails}
                tripVendors={tripVendors}
              />
            </div>
          )}

          {/* ──────────────────────── DOCUMENTS ──────────────────────── */}
          {activeTab === "documents" && (
            <DepartureDocuments
              tripId={tripId}
              departureDateStr={departureDateStr}
            />
          )}

          {/* ──────────────────────── REPORTS ──────────────────────── */}
          {activeTab === "reports" && (
            <DepartureReports
              tripId={tripId}
              departureDateStr={departureDateStr}
            />
          )}
          {/* ── STATION PAYMENT COLLECTION ── */}
          {activeTab === "stationpayments" && (
            <StationPaymentCollection
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
                  <DialogTitle className="text-lg font-black text-slate-800">
                    Create Custom Task
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Add a new operational task checklist item for this
                    departure.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Task Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Confirm guide SIM cards"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Checklist Stage
                    </label>
                    <select
                      value={newTaskStage}
                      onChange={(e) => setNewTaskStage(e.target.value)}
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
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Description / Notes
                    </label>
                    <textarea
                      placeholder="Additional task briefing..."
                      value={newTaskNotes}
                      onChange={(e) => setNewTaskNotes(e.target.value)}
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
            <Dialog
              open={editDepartureOpen}
              onOpenChange={setEditDepartureOpen}
            >
              <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-black text-slate-800">
                    Edit Departure Settings
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Update general information, guide assignments, or status for
                    this batch.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleEditDepartureSubmit}
                  className="space-y-4 mt-2"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Lead Guide Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dikshu Sharma"
                      value={editGuideName}
                      onChange={(e) => setEditGuideName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Departure Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
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
                  <DialogTitle className="text-lg font-black text-slate-800">
                    Add Passenger Manifest
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Record a new manual passenger booking for this departure
                    date.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleAddPassengerSubmit}
                  className="space-y-4 mt-2"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={newPaxName}
                      onChange={(e) => setNewPaxName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Phone / Mobile
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={newPaxPhone}
                      onChange={(e) => setNewPaxPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Age
                      </label>
                      <input
                        type="number"
                        value={newPaxAge}
                        onChange={(e) => setNewPaxAge(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Gender
                      </label>
                      <select
                        value={newPaxGender}
                        onChange={(e) => setNewPaxGender(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Total Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={newPaxAmount}
                      onChange={(e) => setNewPaxAmount(e.target.value)}
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
            <Dialog
              open={editTransportOpen}
              onOpenChange={setEditTransportOpen}
            >
              <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-black text-slate-800">
                    Edit Transport Asset
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Update vehicle details, route, driver profile, or vendor
                    pricing.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleEditTransportSubmit}
                  className="space-y-3.5 mt-2"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Vehicle Type
                      </label>
                      <input
                        type="text"
                        required
                        value={vehicleTypeForm}
                        onChange={(e) => setVehicleTypeForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Seating Capacity
                      </label>
                      <input
                        type="number"
                        value={capacityForm}
                        onChange={(e) =>
                          setCapacityForm(Number(e.target.value))
                        }
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Route
                    </label>
                    <input
                      type="text"
                      required
                      value={routeForm}
                      onChange={(e) => setRouteForm(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Driver Name
                      </label>
                      <input
                        type="text"
                        value={driverNameForm}
                        onChange={(e) => setDriverNameForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Driver Phone
                      </label>
                      <input
                        type="text"
                        value={driverPhoneForm}
                        onChange={(e) => setDriverPhoneForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Total Cost (₹)
                      </label>
                      <input
                        type="number"
                        value={transportCostForm}
                        onChange={(e) =>
                          setTransportCostForm(Number(e.target.value))
                        }
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Advance Paid (₹)
                      </label>
                      <input
                        type="number"
                        value={transportPaidForm}
                        onChange={(e) =>
                          setTransportPaidForm(Number(e.target.value))
                        }
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Notes / Special Instructions
                    </label>
                    <textarea
                      value={transportNotesForm}
                      onChange={(e) => setTransportNotesForm(e.target.value)}
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
                  <DialogTitle className="text-lg font-black text-slate-800">
                    Edit Train Booking details
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Update train name, PNR number, routing stations, schedules,
                    or booked seats.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleEditTrainSubmit}
                  className="space-y-3.5 mt-2"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Train Name / No.
                      </label>
                      <input
                        type="text"
                        required
                        value={trainNameForm}
                        onChange={(e) => setTrainNameForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        PNR Number
                      </label>
                      <input
                        type="text"
                        required
                        value={trainPnrForm}
                        onChange={(e) => setTrainPnrForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        From (Station)
                      </label>
                      <input
                        type="text"
                        required
                        value={trainFromForm}
                        onChange={(e) => setTrainFromForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        To (Station)
                      </label>
                      <input
                        type="text"
                        required
                        value={trainToForm}
                        onChange={(e) => setTrainToForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Departure Time
                      </label>
                      <input
                        type="text"
                        required
                        value={trainDepTimeForm}
                        onChange={(e) => setTrainDepTimeForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Arrival Time
                      </label>
                      <input
                        type="text"
                        required
                        value={trainArrTimeForm}
                        onChange={(e) => setTrainArrTimeForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Date
                      </label>
                      <input
                        type="text"
                        required
                        value={trainDateForm}
                        onChange={(e) => setTrainDateForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Booked Seats
                      </label>
                      <input
                        type="text"
                        required
                        value={trainSeatsForm}
                        onChange={(e) => setTrainSeatsForm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={trainStatusForm}
                      onChange={(e) => setTrainStatusForm(e.target.value)}
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
                  <DialogTitle className="text-lg font-black text-slate-800">
                    Reshuffle Traveler
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Change room assignment and transport allocation for{" "}
                    <strong>{shufflingTraveler.name}</strong>.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Room Assignment
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Room 101, Group No. 1"
                      value={shuffleRoom === "—" ? "" : shuffleRoom}
                      onChange={(e) => setShuffleRoom(e.target.value || "—")}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Vehicle Assignment
                    </label>
                    <select
                      value={shuffleVehicle}
                      onChange={(e) => setShuffleVehicle(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                    >
                      <option value="—">Unassigned</option>
                      {allocFleet.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.vehicleType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Seat Number
                    </label>
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
                        const matchedFleet = allocFleet.find(
                          (f) => f.id === shuffleVehicle,
                        );
                        const vehicleVal = matchedFleet
                          ? matchedFleet.name
                          : shuffleVehicle;
                        setPassengerAllocations((prev) => {
                          const entry = {
                            room: shuffleRoom,
                            vehicle: vehicleVal,
                            seat: shuffleSeat,
                          };
                          const updated = { ...prev, [shufflingTraveler.name]: entry };
                          // Also write by id so computedVehicleAllocations finds it
                          if (shufflingTraveler.id) {
                            updated[shufflingTraveler.id] = { ...entry };
                          }
                          return updated;
                        });
                        toast.success(
                          `Updated allocations for ${shufflingTraveler.name}`,
                        );
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
                  <DialogTitle className="text-lg font-black text-slate-800">
                    Add Custom Room
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Create an empty room placeholder to shuffle travelers into.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Room Name / Number
                    </label>
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
                        setManualRooms((prev) => [...prev, cleanName]);
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

          {selectedBookingForRoomAlloc &&
            (() => {
              const bg = selectedBookingForRoomAlloc;
              return (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[999] p-4">
                  <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full flex flex-col max-h-[85vh]">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-slate-800 text-sm">
                          Allocate Rooms & Relationships
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Booking: {bg.bookingRef} — {bg.leadName}'s Group (
                          {bg.totalPassengers} Passengers)
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedBookingForRoomAlloc(null)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto space-y-4 flex-1">
                      <div className="space-y-3.5">
                        {bg.passengers.map((p: any) => {
                          const current = modalAllocations[p.name] || {
                            roomType: "Single",
                            coupleWith: "",
                            groupId: "",
                          };
                          return (
                            <div
                              key={p.id || p.name}
                              className="p-3 bg-slate-50 rounded border border-slate-100 flex flex-wrap items-center gap-3 justify-between"
                            >
                              <div className="min-w-[150px]">
                                <div className="font-bold text-slate-800 text-xs">
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {p.gender}, {p.age} yrs{" "}
                                  {p.isLead ? "• Lead" : ""}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Sharing Type Dropdown */}
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Sharing Type
                                  </label>
                                  <select
                                    value={current.roomType}
                                    onChange={(e) =>
                                      handleModalFieldChange(
                                        p.name,
                                        "roomType",
                                        e.target.value,
                                      )
                                    }
                                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none w-28 h-7"
                                  >
                                    <option value="Single">Single</option>
                                    <option value="Double">Double</option>
                                    <option value="Triple">Triple</option>
                                    <option value="Quad">Quad</option>
                                    <option value="Family">Family</option>
                                    <option value="Dorm">Dorm</option>
                                  </select>
                                </div>

                                {/* Sharing With Dropdown */}
                                {(current.roomType !== "Single" && current.roomType !== "Individual") && (
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Sharing With
                                    </label>
                                    <select
                                      value={current.coupleWith}
                                      onChange={(e) =>
                                        handleModalFieldChange(
                                          p.name,
                                          "coupleWith",
                                          e.target.value,
                                        )
                                      }
                                      className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none w-32 h-7"
                                    >
                                      <option value="">Select Partner</option>
                                      {bg.passengers
                                        .filter(
                                          (other: any) => other.name !== p.name,
                                        )
                                        .map((other: any) => (
                                          <option
                                            key={other.name}
                                            value={other.name}
                                          >
                                            {other.name}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                )}

                                {/* Group ID */}
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Group ID
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      current.groupId || ""
                                    }
                                    onChange={(e) =>
                                      handleModalFieldChange(
                                        p.name,
                                        "groupId",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Internal ID"
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
    </div>
  );
}
