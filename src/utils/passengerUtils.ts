/**
 * Unified Passenger Normalization Utility
 * Used across Booking Details, Departure Hub, Ticketing, PDFs, Manifests, and Hotel Allocation.
 */

export interface NormalizedPassenger {
  id: string;
  name: string;
  age: number | null;
  gender: "M" | "F" | "O" | "U";
  genderFull: string;
  dob: string | null;
  phone: string;
  email: string;
  roomSharing: string;
  foodPreference: string;
  aadhaar: string;
  documents: any[];
  formattedAgeGender: string; // e.g. "24y / M"
  emergencyContact: string;
  medicalConditions: string;
  sharingWith: string;
  tempoAllocation: string;
  seatNumber: string;
  pickupPoint: string;
  trainDetails: string;
  activitySelection: string;
  remarks: string;
  internalNotes: string;
  isCancelled: boolean;
  status: string;
  cancellationReason?: string;
  cancellationDate?: string;
}

export function calculateAgeFromDOB(dobStr?: string | null): number | null {
  if (!dobStr || typeof dobStr !== "string") return null;
  const trimmed = dobStr.trim();
  if (!trimmed) return null;

  let birthDate: Date | null = null;

  if (trimmed.includes("-")) {
    const parts = trimmed.split("T")[0].split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        birthDate = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
        );
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        birthDate = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
        );
      }
    }
  } else if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // DD/MM/YYYY
        birthDate = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
        );
      } else if (parts[0].length === 4) {
        // YYYY/MM/DD
        birthDate = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
        );
      }
    }
  }

  if (!birthDate || isNaN(birthDate.getTime())) {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) birthDate = parsed;
  }

  if (!birthDate || isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 && age < 120 ? age : null;
}

export function normalizeGenderCode(
  genderStr?: string | null,
): "M" | "F" | "O" | "U" {
  if (!genderStr || typeof genderStr !== "string") return "U";
  const clean = genderStr.trim().toLowerCase();
  if (clean.startsWith("m") || clean === "male") return "M";
  if (clean.startsWith("f") || clean === "female") return "F";
  if (clean.startsWith("o") || clean === "other") return "O";
  return "U";
}

export function normalizeGenderFull(genderStr?: string | null): string {
  const code = normalizeGenderCode(genderStr);
  if (code === "M") return "Male";
  if (code === "F") return "Female";
  if (code === "O") return "Other";
  return "Unspecified";
}

export function formatDOBForInput(
  dobStr?: string | null,
): string {
  if (!dobStr || typeof dobStr !== "string" || dobStr.trim() === "") {
    return "";
  }
  const trimmed = dobStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (trimmed.includes("T")) {
    const isoDate = trimmed.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  }
  if (trimmed.includes("-") || trimmed.includes("/")) {
    const parts = trimmed.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      } else if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      }
    }
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}

/**
 * Normalizes all passenger data from any booking/passenger object into a single standard object.
 */
export function normalizePassenger(
  booking?: any,
  targetInput?: any,
  index: number = 0,
): NormalizedPassenger {
  let pObj: any = targetInput || {};
  let bookingDetails: any = {};
  let bookingPassengersList: any[] = [];

  if (booking) {
    if (booking.details) {
      if (typeof booking.details === "string") {
        try {
          bookingDetails = JSON.parse(booking.details);
        } catch (e) {}
      } else if (typeof booking.details === "object") {
        bookingDetails = booking.details;
      }
    }

    if (booking.passengers) {
      if (Array.isArray(booking.passengers)) {
        bookingPassengersList = booking.passengers;
      } else if (
        typeof booking.passengers === "object" &&
        Array.isArray(booking.passengers.persons)
      ) {
        bookingPassengersList = booking.passengers.persons;
      } else if (typeof booking.passengers === "string") {
        try {
          const parsed = JSON.parse(booking.passengers);
          bookingPassengersList = Array.isArray(parsed)
            ? parsed
            : parsed.persons || [];
        } catch (e) {}
      }
    }

    if (!targetInput && bookingPassengersList.length > index) {
      pObj = bookingPassengersList[index];
    }
  }

  // Extract raw properties
  const id =
    pObj.id || pObj.passengerId || (index === 0 ? "primary" : `p_${index}`);
  const firstName = pObj.firstName || "";
  const lastName = pObj.lastName || "";
  const firstLast =
    firstName || lastName ? `${firstName} ${lastName}`.trim() : null;

  // Only fallback to booking.fullName for the main passenger (index 0)
  const fallbackName =
    index === 0
      ? booking?.fullName || booking?.name || "Traveler"
      : `Traveler ${index + 1}`;
  const name =
    pObj.name ||
    pObj.fullName ||
    pObj.passengerName ||
    firstLast ||
    fallbackName;

  const phone =
    pObj.phone ||
    pObj.mobile ||
    pObj.contact ||
    pObj.phoneNumber ||
    pObj.phoneNo ||
    pObj.mobileNo ||
    pObj.contactNumber ||
    (index === 0 ? booking?.mobile || booking?.phone : "") ||
    "";
  const email = pObj.email || (index === 0 ? booking?.email : "") || "";
  const roomSharing =
    pObj.roomSharing ||
    pObj.roomType ||
    bookingDetails.roomSharing ||
    booking?.roomType ||
    "Double Sharing";
  const foodPreference =
    pObj.foodPreference ||
    pObj.food ||
    bookingDetails.foodPreference ||
    "Regular";
  const aadhaar =
    pObj.aadhaar ||
    pObj.aadhar ||
    pObj.idProofNumber ||
    pObj.idNumber ||
    bookingDetails.aadhaar ||
    "";

  // Extract DOB & compute dynamic age
  const rawDob =
    pObj.dob ||
    pObj.dateOfBirth ||
    pObj.birthDate ||
    bookingDetails.dob ||
    bookingDetails.dateOfBirth ||
    booking?.dob ||
    booking?.dateOfBirth ||
    null;
  let age: number | null = calculateAgeFromDOB(rawDob);

  if (age === null) {
    const rawAge =
      pObj.age ||
      pObj.personAge ||
      bookingDetails.age ||
      (index === 0 ? booking?.age : null);
    if (rawAge !== undefined && rawAge !== null && rawAge !== "") {
      const parsedNum = parseInt(String(rawAge), 10);
      if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < 120) {
        age = parsedNum;
      }
    }
  }

  const dob = rawDob ? formatDOBForInput(rawDob) : null;

  // Extract gender
  const rawGender =
    pObj.gender ||
    pObj.sex ||
    bookingDetails.gender ||
    (index === 0 ? booking?.gender : null);
  const gender = normalizeGenderCode(rawGender);
  const genderFull = normalizeGenderFull(rawGender);

  const ageStr = age !== null ? `${age}y` : "N/A";
  const formattedAgeGender = `${ageStr} / ${gender}`;

  // New fields for the Passenger Module
  const emergencyContact = pObj.emergencyContact || pObj.emergency || bookingDetails.emergencyContact || "";
  const medicalConditions = pObj.medicalConditions || pObj.medical || bookingDetails.medicalConditions || "";
  const sharingWith = pObj.sharingWith || pObj.partner || "";
  const tempoAllocation = pObj.tempoAllocation || pObj.tempo || pObj.vehicle || "";
  const seatNumber = pObj.seatNumber || pObj.seat || "";
  const pickupPoint = pObj.pickupPoint || pObj.pickup || bookingDetails.pickupPoint || booking?.pickupCity || "";
  const trainDetails = pObj.trainDetails || pObj.pnr || "";
  const activitySelection = pObj.activitySelection || pObj.activities || "";
  const remarks = pObj.remarks || "";
  const internalNotes = pObj.internalNotes || "";

  // Match documents
  let documents: any[] = [];
  if (booking && Array.isArray(booking.documents)) {
    documents = booking.documents.filter(
      (d: any) => d.passengerId === id || (index === 0 && !d.passengerId),
    );
  } else if (Array.isArray(pObj.documents)) {
    documents = pObj.documents;
  }

  const isCancelled =
    pObj.isCancelled === true ||
    pObj.status === "CANCELLED" ||
    (typeof pObj.status === "string" && pObj.status.toLowerCase().includes("cancel")) ||
    (typeof pObj.notes === "string" && pObj.notes.toLowerCase().includes("cancel"));
  const status = isCancelled ? "CANCELLED" : pObj.status || "CONFIRMED";
  const cancellationReason = pObj.cancellationReason || pObj.cancelReason || "";
  const cancellationDate = pObj.cancellationDate || "";

  return {
    id,
    name,
    age,
    gender,
    genderFull,
    dob: dob ? String(dob) : null,
    phone: String(phone),
    email: String(email),
    roomSharing: String(roomSharing),
    foodPreference: String(foodPreference),
    aadhaar: String(aadhaar),
    documents,
    formattedAgeGender,
    emergencyContact: String(emergencyContact),
    medicalConditions: String(medicalConditions),
    sharingWith: String(sharingWith),
    tempoAllocation: String(tempoAllocation),
    seatNumber: String(seatNumber),
    pickupPoint: String(pickupPoint),
    trainDetails: String(trainDetails),
    activitySelection: String(activitySelection),
    remarks: String(remarks),
    internalNotes: String(internalNotes),
    isCancelled,
    status,
    cancellationReason: cancellationReason ? String(cancellationReason) : undefined,
    cancellationDate: cancellationDate ? String(cancellationDate) : undefined,
  };
}

/**
 * Normalizes all passengers for a booking into an array of NormalizedPassenger
 */
export function normalizeBookingPassengers(
  booking: any,
): NormalizedPassenger[] {
  if (!booking) return [normalizePassenger()];

  let personsList: any[] = [];
  if (booking.passengers) {
    if (Array.isArray(booking.passengers)) {
      personsList = booking.passengers;
    } else if (
      typeof booking.passengers === "object" &&
      Array.isArray(booking.passengers.persons)
    ) {
      personsList = booking.passengers.persons;
    } else if (typeof booking.passengers === "string") {
      try {
        const parsed = JSON.parse(booking.passengers);
        personsList = Array.isArray(parsed) ? parsed : parsed.persons || [];
      } catch (e) {}
    }
  }

  if (personsList.length === 0) {
    return [normalizePassenger(booking)];
  }

  return personsList.map((p, idx) => normalizePassenger(booking, p, idx));
}
