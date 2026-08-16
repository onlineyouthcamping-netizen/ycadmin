import { describe, expect, it } from "vitest";
import { findHotelForDay } from "./accommodationCalculator";

const jalandharBooking = {
  id: "gulshan-day-1",
  hotelName: "Gulshan Hotel Jalandhar",
  location: "Jalandhar",
  checkIn: "2026-08-01",
  checkOut: "2026-08-02",
  nightsCount: 1,
};

describe("findHotelForDay", () => {
  it("does not reuse a one-night booking on another day in the same city", () => {
    expect(
      findHotelForDay("2026-08-07", "Jalandhar", [jalandharBooking]),
    ).toBeNull();
    expect(
      findHotelForDay("2026-08-08", "Jalandhar", [jalandharBooking]),
    ).toBeNull();
  });

  it("matches a saved booking on its exact check-in date", () => {
    expect(
      findHotelForDay("2026-08-01", "Jalandhar", [jalandharBooking]),
    ).toEqual(jalandharBooking);
  });

  it("keeps a genuine multi-night booking active through its stay window", () => {
    const kazaBooking = {
      id: "kaza-days-5-6",
      hotelName: "Kaza Retreat",
      location: "Kaza",
      checkIn: "2026-08-05",
      checkOut: "2026-08-07",
      nightsCount: 2,
    };

    expect(findHotelForDay("2026-08-06", "Kaza", [kazaBooking])).toEqual(
      kazaBooking,
    );
    expect(findHotelForDay("2026-08-07", "Kaza", [kazaBooking])).toBeNull();
  });
});
