import { useState, useEffect } from "react";
import { adminUsersService } from "@/services/adminUsers.service";
import { Admin } from "@/types";

export interface StaffOption {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export const DEFAULT_FED_STAFF: StaffOption[] = [
  {
    id: "fed-1",
    name: "Hemal Patel",
    email: "hemalpatel9007@gmail.com",
    role: "SUPERADMIN",
  },
  {
    id: "fed-2",
    name: "Vidhi Thummer",
    email: "vidhi.thummer@youthcamping.online",
    role: "SALES",
  },
  {
    id: "fed-3",
    name: "Zeel Panchal",
    email: "zeel.panchal@youthcamping.online",
    role: "ADMIN",
  },
  {
    id: "fed-4",
    name: "Suresh Chaudhary",
    email: "suresh.chaudhary@youthcamping.online",
    role: "ADMIN",
  },
  {
    id: "fed-5",
    name: "Hemal Patel",
    email: "hemal.patel@youthcamping.online",
    role: "VIEWER",
  },
  {
    id: "fed-6",
    name: "Super Admin",
    email: "admin@youthcamping.online",
    role: "VIEWER",
  },
  {
    id: "fed-7",
    name: "Neeki Diyali",
    email: "nikkiyouthcamping@gmail.com",
    role: "OPERATIONS",
  },
];

export function useStaffUsers() {
  const [staffUsers, setStaffUsers] = useState<StaffOption[]>(DEFAULT_FED_STAFF);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      try {
        const fetchedAdmins: Admin[] = await adminUsersService.listAdmins();
        if (mounted && Array.isArray(fetchedAdmins) && fetchedAdmins.length > 0) {
          const mapped: StaffOption[] = fetchedAdmins.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email || "",
            role: u.role ? u.role.toUpperCase() : "STAFF",
          }));

          const mergedMap = new Map<string, StaffOption>();
          DEFAULT_FED_STAFF.forEach((u) => mergedMap.set(u.email || u.id, u));
          mapped.forEach((u) => mergedMap.set(u.email || u.id, u));

          setStaffUsers(Array.from(mergedMap.values()));
        }
      } catch (err) {
        console.error("Failed to load live staff members in useStaffUsers:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    staffUsers,
    loading,
  };
}
