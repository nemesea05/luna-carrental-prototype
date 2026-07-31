"use strict";

const VEHICLES = [
  {
    id: "xpander",
    code: "MX",
    brand: "Mitsubishi",
    model: "Xpander GLS",
    year: 2026,
    type: "MPV",
    transmission: "Automatic",
    fuel: "Gasoline",
    seats: 7,
    bags: 4,
    price12: 2300,
    priceDay: 3200,
    rating: 4.9,
    badge: "Family favorite",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=86",
    description: "A spacious and comfortable MPV for family trips, airport runs, and barkada getaways."
  },
  {
    id: "fortuner",
    code: "TF",
    brand: "Toyota",
    model: "Fortuner",
    year: 2025,
    type: "SUV",
    transmission: "Automatic",
    fuel: "Diesel",
    seats: 7,
    bags: 5,
    price12: 3200,
    priceDay: 4500,
    rating: 4.8,
    badge: "Road-trip ready",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=86",
    description: "A capable seven-seater with elevated comfort for long drives and out-of-town travel."
  },
  {
    id: "civic",
    code: "HC",
    brand: "Honda",
    model: "Civic RS",
    year: 2025,
    type: "Sedan",
    transmission: "Automatic",
    fuel: "Gasoline",
    seats: 5,
    bags: 3,
    price12: 2600,
    priceDay: 3600,
    rating: 4.7,
    badge: "City favorite",
    image: "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=86",
    description: "A refined and efficient sedan for city appointments, date nights, and business travel."
  },
  {
    id: "terra",
    code: "NT",
    brand: "Nissan",
    model: "Terra VL",
    year: 2025,
    type: "SUV",
    transmission: "Automatic",
    fuel: "Diesel",
    seats: 7,
    bags: 5,
    price12: 3400,
    priceDay: 4800,
    rating: 4.8,
    badge: "Premium comfort",
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=86",
    description: "Premium cabin comfort and generous space for groups carrying people, luggage, or both."
  }
];


const TIME_SLOTS = [
  { id: "morning", start: "7:00 AM", end: "7:00 PM", durationHours: 12 },
  { id: "overnight", start: "10:00 PM", end: "10:00 AM", durationHours: 12 },
  { id: "afternoon", start: "1:00 PM", end: "1:00 AM", durationHours: 12 },
  { id: "early", start: "4:00 AM", end: "4:00 PM", durationHours: 12 }
];

/* Front-end-only sample reservations. They make the calendar demonstrate
   available, limited, and unavailable dates even before a visitor creates
   their first local booking. Real bookings saved in localStorage are added
   to these blocks automatically. */
const DEMO_AVAILABILITY_BLOCKS = [
  { vehicleId: "xpander", rentalType: "wholeday", startOffset: 2, endOffset: 3, time: "7:00 AM" },
  { vehicleId: "civic", rentalType: "12hour", startOffset: 2, slotId: "afternoon" },
  { vehicleId: "fortuner", rentalType: "12hour", startOffset: 3, slotId: "overnight" },
  { vehicleId: "xpander", rentalType: "wholeday", startOffset: 5, endOffset: 6, time: "7:00 AM" },
  { vehicleId: "fortuner", rentalType: "wholeday", startOffset: 5, endOffset: 6, time: "7:00 AM" },
  { vehicleId: "civic", rentalType: "wholeday", startOffset: 5, endOffset: 6, time: "7:00 AM" },
  { vehicleId: "terra", rentalType: "wholeday", startOffset: 5, endOffset: 6, time: "7:00 AM" }
];

const STORAGE = {
  bookings: "everyride_redesign_bookings",
  user: "everyride_redesign_user",
  favorites: "everyride_redesign_favorites",
  session: "everyride_redesign_session"
};

const state = {
  route: "home",
  rentalType: "12hour",
  bookingStep: 1,
  selectedVehicleId: null,
  bookingTab: "upcoming",
  vehicleType: "All",
  search: "",
  sort: "recommended",
  minimumSeats: 0,
  bookingToCancel: null,
  scheduleDate: null,
  scheduleSlotId: null,
  rangeStart: null,
  rangeEnd: null,
  wholeDayPickupTime: "7:00 AM",
  calendarView12: new Date(),
  calendarViewDay: new Date(),
  bookings: readStorage(STORAGE.bookings, []),
  account: readStorage(STORAGE.user, null),
  user: readStorage(STORAGE.session, false) ? readStorage(STORAGE.user, null) : null,
  favorites: readStorage(STORAGE.favorites, [])
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const todayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().split("T")[0];
};
const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};
const formatMoney = amount => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(amount);
const formatDate = dateString => new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${dateString}T12:00:00`));
const getVehicle = id => VEHICLES.find(vehicle => vehicle.id === id) || VEHICLES[0];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key}`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    showToast("Browser storage is unavailable.", "error");
  }
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function setMinDates() {
  const today = todayString();
  const heroDate = $("#heroDate");
  if (heroDate) {
    heroDate.min = today;
    heroDate.value ||= today;
  }
}

function routeTo(route) {
  if (!document.getElementById(`page-${route}`)) route = "home";
  state.route = route;
  $$(".page").forEach(page => page.classList.toggle("active", page.dataset.page === route));
  $$('[data-route]').forEach(link => {
    const isActive = link.dataset.route === route;
    link.classList.toggle("active", isActive);
    if (link.classList.contains("nav-link")) link.setAttribute("aria-current", isActive ? "page" : "false");
  });
  closeDrawer();
  closeMobileFilters();
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", `#${route}`);
  if (route === "vehicles") renderVehicles();
  if (route === "bookings") renderBookings();
  refreshIcons();
}

function openDrawer() {
  $("#mobileDrawer").classList.add("open");
  $("#mobileDrawer").setAttribute("aria-hidden", "false");
  $("#drawerBackdrop").classList.add("show");
  $("#mobileMenuBtn").setAttribute("aria-expanded", "true");
  document.body.classList.add("drawer-open");
}

function closeDrawer() {
  $("#mobileDrawer").classList.remove("open");
  $("#mobileDrawer").setAttribute("aria-hidden", "true");
  $("#drawerBackdrop").classList.remove("show");
  $("#mobileMenuBtn").setAttribute("aria-expanded", "false");
  document.body.classList.remove("drawer-open");
}

function openMobileFilters() {
  $("#filterPanel").classList.add("open");
  $("#drawerBackdrop").classList.add("show");
  document.body.classList.add("drawer-open");
}

function closeMobileFilters() {
  $("#filterPanel")?.classList.remove("open");
  if (!$("#mobileDrawer").classList.contains("open")) {
    $("#drawerBackdrop").classList.remove("show");
    document.body.classList.remove("drawer-open");
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setTimeout(() => modal.querySelector("button, input, select, textarea")?.focus(), 80);
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (!$(".modal-shell.open")) document.body.classList.remove("modal-open");
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i data-lucide="${type === "error" ? "circle-alert" : "circle-check"}"></i><p>${escapeHTML(message)}</p>`;
  $("#toastRegion").appendChild(toast);
  refreshIcons();
  setTimeout(() => toast.remove(), 3600);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function vehicleCard(vehicle) {
  const favorite = state.favorites.includes(vehicle.id);
  return `
    <article class="vehicle-card" data-vehicle-card="${vehicle.id}">
      <div class="vehicle-image">
        <span class="vehicle-badge">${vehicle.badge}</span>
        <button class="favorite-btn ${favorite ? "active" : ""}" data-favorite="${vehicle.id}" aria-label="${favorite ? "Remove from" : "Add to"} favorites"><i data-lucide="heart"></i></button>
        <img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}" loading="lazy">
      </div>
      <div class="vehicle-body">
        <div class="vehicle-topline"><div><small>${vehicle.type.toUpperCase()} · ${vehicle.year}</small><h3>${vehicle.brand} ${vehicle.model}</h3></div><span class="rating"><i data-lucide="star"></i>${vehicle.rating}</span></div>
        <div class="vehicle-specs"><span><i data-lucide="users"></i>${vehicle.seats} seats</span><span><i data-lucide="briefcase"></i>${vehicle.bags} bags</span><span><i data-lucide="settings-2"></i>${vehicle.transmission}</span></div>
        <div class="vehicle-price-row"><div class="vehicle-price"><small>Starts at</small><strong>${formatMoney(vehicle.price12)}</strong><span> / 12 hrs</span></div><div class="vehicle-actions"><button class="outline-btn compact" data-view-vehicle="${vehicle.id}">Details</button><button class="primary-btn compact" data-book-vehicle="${vehicle.id}">Book</button></div></div>
      </div>
    </article>`;
}

function renderFeaturedVehicles() {
  $("#featuredVehicleGrid").innerHTML = VEHICLES.slice(0, 3).map(vehicleCard).join("");
  attachVehicleCardEvents($("#featuredVehicleGrid"));
}

function filteredVehicles() {
  let vehicles = [...VEHICLES];
  if (state.vehicleType !== "All") vehicles = vehicles.filter(v => v.type === state.vehicleType);
  if (state.search.trim()) {
    const query = state.search.trim().toLowerCase();
    vehicles = vehicles.filter(v => `${v.brand} ${v.model} ${v.type}`.toLowerCase().includes(query));
  }
  if (state.minimumSeats) vehicles = vehicles.filter(v => v.seats >= state.minimumSeats);
  if (state.sort === "price-low") vehicles.sort((a,b) => a.price12 - b.price12);
  if (state.sort === "price-high") vehicles.sort((a,b) => b.price12 - a.price12);
  if (state.sort === "seats") vehicles.sort((a,b) => b.seats - a.seats);
  return vehicles;
}

function renderVehicles() {
  const vehicles = filteredVehicles();
  $("#vehicleResultCount").textContent = vehicles.length;
  $("#vehicleGrid").innerHTML = vehicles.map(vehicleCard).join("");
  $("#vehicleEmptyState").hidden = vehicles.length > 0;
  attachVehicleCardEvents($("#vehicleGrid"));
  refreshIcons();
}

function attachVehicleCardEvents(scope) {
  $$('[data-view-vehicle]', scope).forEach(button => button.addEventListener("click", () => showVehicleDetails(button.dataset.viewVehicle)));
  $$('[data-book-vehicle]', scope).forEach(button => button.addEventListener("click", () => startBooking(button.dataset.bookVehicle)));
  $$('[data-favorite]', scope).forEach(button => button.addEventListener("click", () => toggleFavorite(button.dataset.favorite)));
}

function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id) ? state.favorites.filter(item => item !== id) : [...state.favorites, id];
  writeStorage(STORAGE.favorites, state.favorites);
  renderFeaturedVehicles();
  renderVehicles();
  showToast(state.favorites.includes(id) ? "Added to favorites." : "Removed from favorites.");
}

function showVehicleDetails(id) {
  const vehicle = getVehicle(id);
  $("#vehicleModalContent").innerHTML = `
    <div class="vehicle-detail-grid">
      <div class="vehicle-detail-media"><img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}"></div>
      <div class="vehicle-detail-copy">
        <span class="eyebrow">${vehicle.type.toUpperCase()} · ${vehicle.year}</span>
        <h2 id="vehicleModalTitle">${vehicle.brand} ${vehicle.model}</h2>
        <p class="vehicle-detail-sub">${vehicle.description}</p>
        <div class="vehicle-detail-specs">
          <div class="detail-spec"><i data-lucide="users"></i><div><small>CAPACITY</small><strong>${vehicle.seats} passengers</strong></div></div>
          <div class="detail-spec"><i data-lucide="briefcase"></i><div><small>LUGGAGE</small><strong>${vehicle.bags} bags</strong></div></div>
          <div class="detail-spec"><i data-lucide="settings-2"></i><div><small>TRANSMISSION</small><strong>${vehicle.transmission}</strong></div></div>
          <div class="detail-spec"><i data-lucide="fuel"></i><div><small>FUEL</small><strong>${vehicle.fuel}</strong></div></div>
        </div>
        <h4>Included with every ride</h4>
        <ul class="inclusion-list"><li><i data-lucide="check"></i> Cleaned and inspected vehicle</li><li><i data-lucide="check"></i> Complimentary Wi-Fi and trip essentials</li><li><i data-lucide="check"></i> Customer support access</li><li><i data-lucide="check"></i> Transparent estimated rental price</li></ul>
        <div class="detail-price-box"><div><small>12 hours / Whole day</small><strong>${formatMoney(vehicle.price12)} / ${formatMoney(vehicle.priceDay)}</strong></div><button class="primary-btn" data-modal-book="${vehicle.id}">Book this vehicle <i data-lucide="arrow-right"></i></button></div>
      </div>
    </div>`;
  $("[data-modal-book]").addEventListener("click", event => {
    closeModal("vehicleModal");
    startBooking(event.currentTarget.dataset.modalBook);
  });
  openModal("vehicleModal");
  refreshIcons();
}

function parseTimeLabel(label = "7:00 AM") {
  const match = String(label).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return { hours: 7, minutes: 0 };
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return { hours, minutes: Number(match[2]) };
}

function createDateTime(dateString, timeLabel) {
  const [year, month, day] = dateString.split("-").map(Number);
  const { hours, minutes } = parseTimeLabel(timeLabel);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function dateDifferenceDays(start, end) {
  return Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000);
}

function selectedSlot() {
  return TIME_SLOTS.find(slot => slot.id === state.scheduleSlotId) || null;
}

function slotFromPrefill(value) {
  return TIME_SLOTS.find(slot => slot.id === value || slot.start === value || String(value || "").startsWith(slot.start)) || null;
}

function slotInterval(dateString, slot) {
  const start = createDateTime(dateString, slot.start);
  const end = new Date(start.getTime() + slot.durationHours * 3600000);
  return { start, end };
}

function wholeDayInterval(startDate, endDate, timeLabel = state.wholeDayPickupTime) {
  return { start: createDateTime(startDate, timeLabel), end: createDateTime(endDate, timeLabel) };
}

function intervalsConflict(candidateStart, candidateEnd, blockedStart, blockedEnd) {
  const gap = 3 * 3600000;
  return candidateStart < new Date(blockedEnd.getTime() + gap) && new Date(candidateEnd.getTime() + gap) > blockedStart;
}

function demoBlockedIntervals() {
  const base = todayString();
  return DEMO_AVAILABILITY_BLOCKS.map(block => {
    if (block.rentalType === "12hour") {
      const slot = TIME_SLOTS.find(item => item.id === block.slotId);
      const interval = slotInterval(addDays(base, block.startOffset), slot);
      return { vehicleId: block.vehicleId, start: interval.start, end: interval.end, source: "demo" };
    }
    const interval = wholeDayInterval(addDays(base, block.startOffset), addDays(base, block.endOffset), block.time);
    return { vehicleId: block.vehicleId, start: interval.start, end: interval.end, source: "demo" };
  });
}

function bookingBlockedInterval(booking) {
  if (!booking || booking.status === "cancelled") return null;
  const vehicleId = booking.vehicleId || booking.vehicle?.id;
  const pickupDate = booking.pickupDate || booking.pickup;
  if (!vehicleId || !pickupDate) return null;

  if (booking.rentalType === "wholeday") {
    const returnDate = booking.returnDate || addDays(pickupDate, 1);
    const time = booking.wholeDayPickupTime || (booking.pickupTime && booking.pickupTime !== "Flexible" ? booking.pickupTime : "7:00 AM");
    const interval = wholeDayInterval(pickupDate, returnDate, time);
    return { vehicleId, start: interval.start, end: interval.end, source: booking.id };
  }

  const slot = TIME_SLOTS.find(item => item.id === booking.slotId) || slotFromPrefill(booking.pickupTime || booking.pickupTimeSlot?.start) || TIME_SLOTS[0];
  const interval = slotInterval(pickupDate, slot);
  return { vehicleId, start: interval.start, end: interval.end, source: booking.id };
}

function blockedIntervalsForVehicle(vehicleId) {
  const userBlocks = state.bookings.map(bookingBlockedInterval).filter(Boolean);
  return [...demoBlockedIntervals(), ...userBlocks].filter(block => block.vehicleId === vehicleId);
}

function isVehicleAvailable(vehicleId, interval) {
  return !blockedIntervalsForVehicle(vehicleId).some(block => intervalsConflict(interval.start, interval.end, block.start, block.end));
}

function availableVehicleIds(interval, scopeIds = VEHICLES.map(vehicle => vehicle.id)) {
  return scopeIds.filter(vehicleId => isVehicleAvailable(vehicleId, interval));
}

function availabilityScopeIds() {
  return state.selectedVehicleId ? [state.selectedVehicleId] : VEHICLES.map(vehicle => vehicle.id);
}

function availabilityStatusForDate(dateString, rentalType) {
  const scope = availabilityScopeIds();
  if (rentalType === "12hour") {
    let availableCombinations = 0;
    TIME_SLOTS.forEach(slot => {
      availableCombinations += availableVehicleIds(slotInterval(dateString, slot), scope).length;
    });
    const maximum = scope.length * TIME_SLOTS.length;
    if (!availableCombinations) return { status: "unavailable", available: 0, maximum };
    if (availableCombinations === maximum) return { status: "available", available: availableCombinations, maximum };
    return { status: "limited", available: availableCombinations, maximum };
  }

  const interval = wholeDayInterval(dateString, addDays(dateString, 1), state.wholeDayPickupTime);
  const count = availableVehicleIds(interval, scope).length;
  if (!count) return { status: "unavailable", available: 0, maximum: scope.length };
  if (count === scope.length) return { status: "available", available: count, maximum: scope.length };
  return { status: "limited", available: count, maximum: scope.length };
}

function firstAvailableDate(rentalType, startDate = todayString()) {
  for (let offset = 0; offset < 120; offset += 1) {
    const date = addDays(startDate, offset);
    if (availabilityStatusForDate(date, rentalType).status !== "unavailable") return date;
  }
  return startDate;
}

function getCurrentScheduleInterval() {
  if (state.rentalType === "12hour") {
    const slot = selectedSlot();
    return state.scheduleDate && slot ? slotInterval(state.scheduleDate, slot) : null;
  }
  return state.rangeStart && state.rangeEnd ? wholeDayInterval(state.rangeStart, state.rangeEnd, state.wholeDayPickupTime) : null;
}

function availableVehiclesForCurrentSchedule() {
  const interval = getCurrentScheduleInterval();
  if (!interval) return [];
  const ids = availableVehicleIds(interval);
  return VEHICLES.filter(vehicle => ids.includes(vehicle.id));
}

function updateAvailabilityScopeCopy() {
  if (state.selectedVehicleId) {
    const vehicle = getVehicle(state.selectedVehicleId);
    $("#availabilityScopeTitle").textContent = `${vehicle.brand} ${vehicle.model} availability`;
    $("#availabilityScopeText").textContent = "Unavailable dates and slots are based on this specific vehicle's reservations.";
  } else {
    $("#availabilityScopeTitle").textContent = "Fleet availability";
    $("#availabilityScopeText").textContent = "Green dates have broad availability, yellow dates have fewer choices, and red dates have no vehicle available.";
  }
}

function calendarButtonClass(dateString, type) {
  if (type === "12hour") return dateString === state.scheduleDate ? "selected" : "";
  const classes = [];
  if (state.rangeStart === dateString) classes.push("range-start");
  if (state.rangeEnd === dateString) classes.push("range-end");
  if (state.rangeStart && state.rangeEnd && dateString > state.rangeStart && dateString < state.rangeEnd) classes.push("in-range");
  return classes.join(" ");
}

function rangeCanUseDate(dateString) {
  if (!state.rangeStart || state.rangeEnd || dateString <= state.rangeStart) return availabilityStatusForDate(dateString, "wholeday").status !== "unavailable";
  const interval = wholeDayInterval(state.rangeStart, dateString, state.wholeDayPickupTime);
  return availableVehicleIds(interval, availabilityScopeIds()).length > 0;
}

function select12ScheduleDate(dateString) {
  state.scheduleDate = dateString;
  state.scheduleSlotId = null;
  state.calendarView12 = new Date(`${dateString}T12:00:00`);
  renderSchedulePicker();
}

function selectWholeDayScheduleDate(dateString) {
  state.calendarViewDay = new Date(`${dateString}T12:00:00`);
  if (!state.rangeStart || state.rangeEnd || dateString <= state.rangeStart) {
    state.rangeStart = dateString;
    state.rangeEnd = null;
  } else {
    const interval = wholeDayInterval(state.rangeStart, dateString, state.wholeDayPickupTime);
    if (!availableVehicleIds(interval, availabilityScopeIds()).length) {
      showToast("That date range is unavailable. Choose an earlier return date or a different pickup date.", "error");
      return;
    }
    state.rangeEnd = dateString;
  }
  renderSchedulePicker();
}

function renderCalendarGrid(grid, label, viewDate, rentalType, onSelect) {
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  label.textContent = `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  grid.innerHTML = weekdays.map(day => `<span class="calendar-weekday">${day}</span>`).join("");

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const days = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  for (let index = 0; index < firstDay; index += 1) grid.insertAdjacentHTML("beforeend", '<span class="calendar-blank"></span>');

  for (let day = 1; day <= days; day += 1) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12);
    const dateString = date.toISOString().split("T")[0];
    const past = dateString < todayString();
    const meta = availabilityStatusForDate(dateString, rentalType);
    const rangeDisabled = rentalType === "wholeday" && !past && !rangeCanUseDate(dateString);
    const unavailable = meta.status === "unavailable" || rangeDisabled;
    const visualStatus = unavailable ? "unavailable" : meta.status;
    const selectedClass = calendarButtonClass(dateString, rentalType);
    const title = past ? "Past date" : unavailable ? "Unavailable for this schedule" : meta.status === "limited" ? "Limited availability" : "Available";
    const button = document.createElement("button");
    button.type = "button";
    button.className = `booking-calendar-day ${visualStatus} ${selectedClass}`.trim();
    button.dataset.date = dateString;
    button.disabled = past || unavailable;
    button.title = title;
    button.setAttribute("aria-label", `${formatDate(dateString)}: ${title}`);
    button.innerHTML = `<span>${day}</span><i></i>`;
    if (dateString === todayString()) button.classList.add("today");
    if (!button.disabled) button.addEventListener("click", () => onSelect(dateString));
    grid.appendChild(button);
  }
}

function render12HourSchedule() {
  if (!state.scheduleDate || state.scheduleDate < todayString()) state.scheduleDate = firstAvailableDate("12hour");
  if (availabilityStatusForDate(state.scheduleDate, "12hour").status === "unavailable") {
    state.scheduleDate = firstAvailableDate("12hour", state.scheduleDate);
    state.calendarView12 = new Date(`${state.scheduleDate}T12:00:00`);
  }
  if (!(state.calendarView12 instanceof Date) || Number.isNaN(state.calendarView12.getTime())) state.calendarView12 = new Date(`${state.scheduleDate}T12:00:00`);

  renderCalendarGrid($("#calendar12Grid"), $("#calendar12Label"), state.calendarView12, "12hour", select12ScheduleDate);

  const scope = availabilityScopeIds();
  const dateLabel = formatDate(state.scheduleDate);
  $("#selected12DateLabel").textContent = dateLabel;
  $("#bookingDate").value = state.scheduleDate;

  const slotAvailability = TIME_SLOTS.map(slot => {
    const ids = availableVehicleIds(slotInterval(state.scheduleDate, slot), scope);
    return { slot, ids };
  });
  if (state.scheduleSlotId && !slotAvailability.find(item => item.slot.id === state.scheduleSlotId && item.ids.length)) state.scheduleSlotId = null;

  $("#bookingSlotList").innerHTML = slotAvailability.map(({ slot, ids }) => {
    const selected = state.scheduleSlotId === slot.id;
    const disabled = ids.length === 0;
    const availabilityLabel = disabled ? "Unavailable" : state.selectedVehicleId ? "Available" : `${ids.length} vehicle${ids.length === 1 ? "" : "s"} available`;
    return `<button type="button" class="booking-slot ${selected ? "selected" : ""} ${disabled ? "unavailable" : ""}" data-slot-id="${slot.id}" ${disabled ? "disabled" : ""}><span><strong>${slot.start} – ${slot.end}</strong><small>12 hours</small></span><b>${selected ? "Selected" : availabilityLabel}</b></button>`;
  }).join("");
  $$('[data-slot-id]', $("#bookingSlotList")).forEach(button => button.addEventListener("click", () => {
    state.scheduleSlotId = button.dataset.slotId;
    renderSchedulePicker();
  }));
  const availableCount = slotAvailability.filter(item => item.ids.length).length;
  $("#slotAvailabilityCount").textContent = `${availableCount} of ${TIME_SLOTS.length} slots open`;
  const slot = selectedSlot();
  $("#bookingTime").value = slot?.start || "";
}

function renderWholeDaySchedule() {
  if (state.rangeStart && state.rangeStart < todayString()) {
    state.rangeStart = null;
    state.rangeEnd = null;
  }
  if (state.rangeStart && state.rangeEnd) {
    const currentRange = wholeDayInterval(state.rangeStart, state.rangeEnd, state.wholeDayPickupTime);
    if (!availableVehicleIds(currentRange, availabilityScopeIds()).length) {
      state.rangeStart = firstAvailableDate("wholeday");
      state.rangeEnd = null;
      state.calendarViewDay = new Date(`${state.rangeStart}T12:00:00`);
    }
  }
  const anchor = state.rangeStart || firstAvailableDate("wholeday");
  if (!(state.calendarViewDay instanceof Date) || Number.isNaN(state.calendarViewDay.getTime())) state.calendarViewDay = new Date(`${anchor}T12:00:00`);
  $("#bookingWholeDayTime").value = state.wholeDayPickupTime;

  renderCalendarGrid($("#calendarDayGrid"), $("#calendarDayLabel"), state.calendarViewDay, "wholeday", selectWholeDayScheduleDate);

  $("#rangeStartLabel").textContent = state.rangeStart ? formatDate(state.rangeStart) : "Select a date";
  $("#rangeEndLabel").textContent = state.rangeEnd ? formatDate(state.rangeEnd) : "Select a date";
  $("#bookingDate").value = state.rangeStart || "";
  $("#bookingReturnDate").value = state.rangeEnd || "";
  $("#bookingTime").value = state.wholeDayPickupTime;

  if (state.rangeStart && state.rangeEnd) {
    const days = dateDifferenceDays(state.rangeStart, state.rangeEnd);
    const interval = wholeDayInterval(state.rangeStart, state.rangeEnd, state.wholeDayPickupTime);
    const count = availableVehicleIds(interval, availabilityScopeIds()).length;
    $("#rangeDurationLabel").textContent = `${days} day${days === 1 ? "" : "s"} · ${days * 24} hours`;
    $("#rangeAvailability").classList.toggle("unavailable", count === 0);
    $("#rangeAvailability span").textContent = state.selectedVehicleId ? (count ? "Selected vehicle is available for this range." : "Selected vehicle is unavailable for this range.") : `${count} vehicle${count === 1 ? "" : "s"} available for this range.`;
  } else {
    $("#rangeDurationLabel").textContent = "Minimum 1 day";
    $("#rangeAvailability").classList.remove("unavailable");
    $("#rangeAvailability span").textContent = state.rangeStart ? "Now select a return date after the pickup date." : "Select a pickup date, then select a return date.";
  }
}

function renderSchedulePicker() {
  updateAvailabilityScopeCopy();
  $("#calendar12Panel").hidden = state.rentalType !== "12hour";
  $("#calendarDayPanel").hidden = state.rentalType !== "wholeday";
  if (state.rentalType === "12hour") render12HourSchedule();
  else renderWholeDaySchedule();
  refreshIcons();
}

function startBooking(vehicleId = null, prefill = {}) {
  state.bookingStep = 1;
  state.selectedVehicleId = vehicleId || null;
  if (prefill.rentalType) state.rentalType = prefill.rentalType;

  const requestedDate = prefill.date && prefill.date >= todayString() ? prefill.date : todayString();
  state.scheduleDate = requestedDate;
  state.scheduleSlotId = slotFromPrefill(prefill.time)?.id || null;
  state.rangeStart = requestedDate;
  state.rangeEnd = addDays(requestedDate, 1);
  state.wholeDayPickupTime = "7:00 AM";
  state.calendarView12 = new Date(`${requestedDate}T12:00:00`);
  state.calendarViewDay = new Date(`${requestedDate}T12:00:00`);

  syncBookingTypeUI();
  $("#bookingLocation").value = prefill.location || $("#heroLocation").value || "Quezon City, Metro Manila";
  if (state.user) {
    $("#guestFirstName").value = state.user.firstName || "";
    $("#guestLastName").value = state.user.lastName || "";
    $("#guestEmail").value = state.user.email || "";
  }
  $("#guestPhone").value = "";
  $("#guestNotes").value = "";
  $("#bookingConsent").checked = false;
  renderSchedulePicker();
  renderBookingVehicles();
  renderBookingStep();
  openModal("bookingModal");
}

function syncBookingTypeUI() {
  $$('[data-booking-type]').forEach(button => button.classList.toggle("active", button.dataset.bookingType === state.rentalType));
  renderSchedulePicker();
}

function renderBookingVehicles() {
  const vehicles = availableVehiclesForCurrentSchedule();
  if (state.selectedVehicleId && !vehicles.some(vehicle => vehicle.id === state.selectedVehicleId)) state.selectedVehicleId = null;

  if (!vehicles.length) {
    $("#bookingVehicleList").innerHTML = '<div class="no-available-vehicles"><i data-lucide="calendar-x"></i><h4>No vehicles available</h4><p>Go back and select another date, time slot, or date range.</p></div>';
    refreshIcons();
    return;
  }

  const duration = state.rentalType === "wholeday" && state.rangeStart && state.rangeEnd ? dateDifferenceDays(state.rangeStart, state.rangeEnd) : 1;
  $("#bookingVehicleList").innerHTML = vehicles.map(vehicle => {
    const price = state.rentalType === "wholeday" ? vehicle.priceDay * duration : vehicle.price12;
    return `<button type="button" class="booking-vehicle-option ${state.selectedVehicleId === vehicle.id ? "selected" : ""}" data-select-booking-vehicle="${vehicle.id}"><img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}"><div><h4>${vehicle.brand} ${vehicle.model}</h4><p>${vehicle.seats} seats · ${vehicle.transmission} · ${vehicle.type}</p><span class="vehicle-available-label"><i data-lucide="circle-check"></i> Available for your schedule</span></div><strong>${formatMoney(price)}</strong></button>`;
  }).join("");
  $$('[data-select-booking-vehicle]').forEach(button => button.addEventListener("click", () => {
    state.selectedVehicleId = button.dataset.selectBookingVehicle;
    renderBookingVehicles();
  }));
  refreshIcons();
}

function renderBookingStep() {
  $$(".booking-step").forEach(step => step.classList.toggle("active", Number(step.dataset.step) === state.bookingStep));
  const progressItems = $$("#bookingProgress > div");
  const progressLines = $$("#bookingProgress > i");
  progressItems.forEach((item,index) => {
    const stepNumber = index + 1;
    item.classList.toggle("active", stepNumber === state.bookingStep);
    item.classList.toggle("done", stepNumber < state.bookingStep);
  });
  progressLines.forEach((line,index) => line.classList.toggle("done", index + 1 < state.bookingStep));
  $("#bookingBackBtn").hidden = state.bookingStep === 1;
  $("#bookingNextBtn").hidden = state.bookingStep === 4;
  $("#bookingSubmitBtn").hidden = state.bookingStep !== 4;
  if (state.bookingStep === 1) renderSchedulePicker();
  if (state.bookingStep === 2) renderBookingVehicles();
  if (state.bookingStep === 4) renderBookingReview();
  $(".booking-modal-card").scrollTo({ top: 0, behavior: "smooth" });
  refreshIcons();
}

function validateBookingStep() {
  if (state.bookingStep === 1) {
    if (state.rentalType === "12hour") {
      if (!state.scheduleDate) return showToast("Select a pickup date.", "error"), false;
      if (!state.scheduleSlotId) return showToast("Select an available 12-hour time slot.", "error"), false;
    } else {
      if (!state.rangeStart || !state.rangeEnd) return showToast("Select both pickup and return dates.", "error"), false;
      if (state.rangeEnd <= state.rangeStart) return showToast("Return date must be after the pickup date.", "error"), false;
    }
    if (!availableVehiclesForCurrentSchedule().length) return showToast("No vehicle is available for that schedule.", "error"), false;
  }
  if (state.bookingStep === 2 && !state.selectedVehicleId) return showToast("Select an available vehicle to continue.", "error"), false;
  if (state.bookingStep === 3) {
    const required = ["guestFirstName","guestLastName","guestEmail","guestPhone"];
    const invalid = required.some(id => !document.getElementById(id).checkValidity());
    if (invalid || !$("#bookingConsent").checked) {
      $("#bookingForm").reportValidity();
      if (!$("#bookingConsent").checked) showToast("Please confirm the booking information.", "error");
      return false;
    }
  }
  return true;
}

function bookingDraft() {
  const vehicle = getVehicle(state.selectedVehicleId);
  const slot = selectedSlot();
  const durationDays = state.rentalType === "wholeday" ? dateDifferenceDays(state.rangeStart, state.rangeEnd) : 1;
  const amount = state.rentalType === "wholeday" ? vehicle.priceDay * durationDays : vehicle.price12;
  return {
    vehicle,
    rentalType: state.rentalType,
    location: $("#bookingLocation").value,
    pickupDate: state.rentalType === "wholeday" ? state.rangeStart : state.scheduleDate,
    returnDate: state.rentalType === "wholeday" ? state.rangeEnd : null,
    pickupTime: state.rentalType === "wholeday" ? state.wholeDayPickupTime : `${slot.start} - ${slot.end}`,
    wholeDayPickupTime: state.rentalType === "wholeday" ? state.wholeDayPickupTime : null,
    slotId: state.rentalType === "12hour" ? slot.id : null,
    durationDays,
    firstName: $("#guestFirstName").value.trim(),
    lastName: $("#guestLastName").value.trim(),
    email: $("#guestEmail").value.trim(),
    phone: $("#guestPhone").value.trim(),
    notes: $("#guestNotes").value.trim(),
    amount
  };
}

function renderBookingReview() {
  const draft = bookingDraft();
  const scheduleLabel = draft.rentalType === "wholeday"
    ? `${formatDate(draft.pickupDate)} at ${draft.pickupTime} to ${formatDate(draft.returnDate)} at ${draft.pickupTime}`
    : `${formatDate(draft.pickupDate)} · ${draft.pickupTime}`;
  $("#bookingReview").innerHTML = `
    <section class="review-card"><h4>Trip details</h4><div class="review-rows"><div class="review-row"><span>Rental type</span><strong>${draft.rentalType === "wholeday" ? `${draft.durationDays}-day rental` : "12-hour rental"}</strong></div><div class="review-row"><span>Schedule</span><strong>${scheduleLabel}</strong></div><div class="review-row"><span>Location</span><strong>${escapeHTML(draft.location)}</strong></div><div class="review-row"><span>Customer</span><strong>${escapeHTML(`${draft.firstName} ${draft.lastName}`)}</strong></div><div class="review-row"><span>Contact</span><strong>${escapeHTML(draft.phone)}</strong></div><div class="review-row review-total"><span>Estimated total</span><strong>${formatMoney(draft.amount)}</strong></div></div></section>
    <section class="review-card review-vehicle"><img src="${draft.vehicle.image}" alt="${draft.vehicle.brand} ${draft.vehicle.model}"><div><span class="eyebrow">SELECTED VEHICLE</span><h4>${draft.vehicle.brand} ${draft.vehicle.model}</h4><p>${draft.vehicle.seats} seats · ${draft.vehicle.transmission} · ${draft.vehicle.type}</p><span class="vehicle-available-label"><i data-lucide="shield-check"></i> Availability rechecked</span></div></section>`;
}

function submitBooking(event) {
  event.preventDefault();
  if (!validateBookingStep()) return;
  const interval = getCurrentScheduleInterval();
  if (!interval || !isVehicleAvailable(state.selectedVehicleId, interval)) {
    showToast("This vehicle is no longer available for that schedule. Please choose another vehicle.", "error");
    state.bookingStep = 2;
    renderBookingStep();
    return;
  }
  const draft = bookingDraft();
  const booking = {
    id: `ER-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    ...draft,
    vehicleId: draft.vehicle.id
  };
  delete booking.vehicle;
  state.bookings.unshift(booking);
  writeStorage(STORAGE.bookings, state.bookings);
  updateAccountUI();
  closeModal("bookingModal");
  $("#confirmationReference").textContent = booking.id;
  openModal("confirmationModal");
  renderBookings();
}

function getBookingGroup(booking) {
  if (booking.status === "cancelled") return "cancelled";
  const bookingDate = new Date(`${booking.pickupDate}T23:59:59`);
  return bookingDate >= new Date() ? "upcoming" : "past";
}

function renderBookings() {
  const bookings = state.bookings.filter(booking => getBookingGroup(booking) === state.bookingTab);
  $("#bookingList").innerHTML = bookings.map(booking => {
    const vehicle = getVehicle(booking.vehicleId);
    const statusClass = booking.status === "cancelled" ? "cancelled" : getBookingGroup(booking) === "past" ? "completed" : "";
    const statusLabel = booking.status === "cancelled" ? "Cancelled" : getBookingGroup(booking) === "past" ? "Completed" : "Pending confirmation";
    const scheduleDate = booking.rentalType === "wholeday" && booking.returnDate ? `${formatDate(booking.pickupDate)} – ${formatDate(booking.returnDate)}` : formatDate(booking.pickupDate);
    const rentalLabel = booking.rentalType === "wholeday" ? `${booking.durationDays || dateDifferenceDays(booking.pickupDate, booking.returnDate)} day${(booking.durationDays || dateDifferenceDays(booking.pickupDate, booking.returnDate)) === 1 ? "" : "s"}` : "12 hours";
    return `<article class="booking-item"><div class="booking-item-image"><img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}"></div><div class="booking-item-copy"><small>${escapeHTML(booking.id)}</small><h3>${vehicle.brand} ${vehicle.model}</h3><div class="booking-meta"><span><i data-lucide="calendar"></i>${scheduleDate}</span><span><i data-lucide="clock"></i>${escapeHTML(booking.pickupTime)} · ${rentalLabel}</span><span><i data-lucide="map-pin"></i>${escapeHTML(booking.location)}</span></div></div><div class="booking-side"><span class="status-pill ${statusClass}">${statusLabel}</span><strong>${formatMoney(booking.amount)}</strong><div class="booking-side-actions">${getBookingGroup(booking) === "upcoming" ? `<button class="outline-btn" data-cancel-booking="${booking.id}">Cancel</button>` : ""}<button class="primary-btn" data-view-vehicle="${vehicle.id}">Vehicle</button></div></div></article>`;
  }).join("");
  $("#bookingEmpty").hidden = bookings.length > 0;
  $$('[data-cancel-booking]').forEach(button => button.addEventListener("click", () => openCancelBooking(button.dataset.cancelBooking)));
  $$('[data-view-vehicle]', $("#bookingList")).forEach(button => button.addEventListener("click", () => showVehicleDetails(button.dataset.viewVehicle)));
  refreshIcons();
}

function openCancelBooking(id) {
  state.bookingToCancel = id;
  openModal("cancelModal");
}

function confirmCancelBooking() {
  state.bookings = state.bookings.map(booking => booking.id === state.bookingToCancel ? { ...booking, status: "cancelled" } : booking);
  writeStorage(STORAGE.bookings, state.bookings);
  state.bookingToCancel = null;
  closeModal("cancelModal");
  renderBookings();
  updateAccountUI();
  showToast("Booking moved to cancelled.");
}

function updateAccountUI() {
  const bookingCount = state.bookings.length;
  $$('[data-booking-count]').forEach(element => element.textContent = bookingCount);
  $("#upcomingCount").textContent = state.bookings.filter(booking => getBookingGroup(booking) === "upcoming").length;
  if (state.user) {
    const fullName = `${state.user.firstName} ${state.user.lastName}`.trim();
    const initials = `${state.user.firstName?.[0] || ""}${state.user.lastName?.[0] || ""}`.toUpperCase() || "ER";
    $("#accountBtn span").textContent = state.user.firstName || "Account";
    $("#drawerAccountBtn span").textContent = fullName;
    $("#profileName").textContent = fullName;
    $("#profileEmail").textContent = state.user.email;
    $("#profileAvatar").textContent = initials;
    $("#accountGuestView").hidden = true;
    $("#accountUserView").hidden = false;
  } else {
    $("#accountBtn span").textContent = "Login";
    $("#drawerAccountBtn span").textContent = "Login or create account";
    $("#accountGuestView").hidden = false;
    $("#accountUserView").hidden = true;
  }
}

function openAccountModal() {
  updateAccountUI();
  openModal("accountModal");
}

function handleLogin(event) {
  event.preventDefault();
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;
  const savedUser = state.account || readStorage(STORAGE.user, null);
  if (!savedUser || savedUser.email.toLowerCase() !== email.toLowerCase()) {
    showToast("No demo account found for that email. Create an account first.", "error");
    return;
  }
  if (savedUser.password !== password) {
    showToast("Incorrect demo password.", "error");
    return;
  }
  state.account = savedUser;
  state.user = savedUser;
  writeStorage(STORAGE.session, true);
  updateAccountUI();
  showToast(`Welcome back, ${savedUser.firstName}.`);
}

function handleSignup(event) {
  event.preventDefault();
  const user = {
    firstName: $("#signupFirstName").value.trim(),
    lastName: $("#signupLastName").value.trim(),
    email: $("#signupEmail").value.trim(),
    password: $("#signupPassword").value
  };
  state.account = user;
  state.user = user;
  writeStorage(STORAGE.user, user);
  writeStorage(STORAGE.session, true);
  updateAccountUI();
  showToast("Demo account created successfully.");
}

function logout() {
  state.user = null;
  writeStorage(STORAGE.session, false);
  updateAccountUI();
  closeModal("accountModal");
  showToast("You have been logged out.");
}

function resetFilters() {
  state.vehicleType = "All";
  state.search = "";
  state.sort = "recommended";
  state.minimumSeats = 0;
  $("#vehicleSearch").value = "";
  $("#vehicleSort").value = "recommended";
  $$('[name="seatFilter"]').forEach(input => input.checked = false);
  $$('[data-filter]').forEach(button => button.classList.toggle("active", button.dataset.filter === "All"));
  renderVehicles();
}

function initEvents() {
  $$('[data-route]').forEach(element => element.addEventListener("click", event => {
    event.preventDefault();
    if (element.dataset.closeModal) closeModal(element.dataset.closeModal);
    routeTo(element.dataset.route);
  }));
  $$('[data-start-booking]').forEach(button => button.addEventListener("click", () => startBooking()));
  $$('[data-close-modal]').forEach(element => element.addEventListener("click", () => closeModal(element.dataset.closeModal)));

  $("#mobileMenuBtn").addEventListener("click", openDrawer);
  $("#closeDrawerBtn").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", () => { closeDrawer(); closeMobileFilters(); });
  $("#mobileFilterBtn").addEventListener("click", openMobileFilters);
  $("#accountBtn").addEventListener("click", openAccountModal);
  $("#drawerAccountBtn").addEventListener("click", openAccountModal);
  $("#mobileAccountBtn").addEventListener("click", openAccountModal);
  $("#openSearchBtn").addEventListener("click", () => routeTo("vehicles"));

  $$('[data-type]').forEach(button => button.addEventListener("click", () => {
    state.rentalType = button.dataset.type;
    $$('[data-type]').forEach(item => item.classList.toggle("active", item === button));
    $("#heroTimeField").hidden = state.rentalType === "wholeday";
  }));

  $("#quickBookForm").addEventListener("submit", event => {
    event.preventDefault();
    startBooking(null, {
      rentalType: state.rentalType,
      location: $("#heroLocation").value,
      date: $("#heroDate").value,
      time: $("#heroTime").value
    });
  });

  $("#vehicleSearch").addEventListener("input", event => { state.search = event.target.value; renderVehicles(); });
  $("#vehicleSort").addEventListener("change", event => { state.sort = event.target.value; renderVehicles(); });
  $$('[data-filter]').forEach(button => button.addEventListener("click", () => {
    state.vehicleType = button.dataset.filter;
    $$('[data-filter]').forEach(item => item.classList.toggle("active", item === button));
    renderVehicles();
  }));
  $$('[name="seatFilter"]').forEach(input => input.addEventListener("change", () => {
    const values = $$('[name="seatFilter"]:checked').map(item => Number(item.value));
    state.minimumSeats = values.length ? Math.max(...values) : 0;
    renderVehicles();
  }));
  $("#resetFilters").addEventListener("click", resetFilters);
  $("#emptyResetBtn").addEventListener("click", resetFilters);

  $$('[data-booking-tab]').forEach(button => button.addEventListener("click", () => {
    state.bookingTab = button.dataset.bookingTab;
    $$('[data-booking-tab]').forEach(item => item.classList.toggle("active", item === button));
    renderBookings();
  }));

  $$('[data-booking-type]').forEach(button => button.addEventListener("click", () => {
    state.rentalType = button.dataset.bookingType;
    if (state.rentalType === "12hour") {
      state.scheduleDate ||= firstAvailableDate("12hour");
      state.scheduleSlotId = null;
    } else {
      state.rangeStart ||= firstAvailableDate("wholeday");
      state.rangeEnd = state.rangeStart ? addDays(state.rangeStart, 1) : null;
    }
    syncBookingTypeUI();
    renderBookingVehicles();
  }));
  $("#bookingWholeDayTime").addEventListener("change", event => {
    state.wholeDayPickupTime = event.target.value;
    state.rangeEnd = null;
    renderSchedulePicker();
  });
  $("#calendar12Prev").addEventListener("click", () => {
    state.calendarView12 = new Date(state.calendarView12.getFullYear(), state.calendarView12.getMonth() - 1, 1);
    renderCalendarGrid($("#calendar12Grid"), $("#calendar12Label"), state.calendarView12, "12hour", select12ScheduleDate);
  });
  $("#calendar12Next").addEventListener("click", () => {
    state.calendarView12 = new Date(state.calendarView12.getFullYear(), state.calendarView12.getMonth() + 1, 1);
    renderCalendarGrid($("#calendar12Grid"), $("#calendar12Label"), state.calendarView12, "12hour", select12ScheduleDate);
  });
  $("#calendarDayPrev").addEventListener("click", () => {
    state.calendarViewDay = new Date(state.calendarViewDay.getFullYear(), state.calendarViewDay.getMonth() - 1, 1);
    renderCalendarGrid($("#calendarDayGrid"), $("#calendarDayLabel"), state.calendarViewDay, "wholeday", selectWholeDayScheduleDate);
  });
  $("#calendarDayNext").addEventListener("click", () => {
    state.calendarViewDay = new Date(state.calendarViewDay.getFullYear(), state.calendarViewDay.getMonth() + 1, 1);
    renderCalendarGrid($("#calendarDayGrid"), $("#calendarDayLabel"), state.calendarViewDay, "wholeday", selectWholeDayScheduleDate);
  });
  $("#bookingNextBtn").addEventListener("click", () => {
    if (!validateBookingStep()) return;
    state.bookingStep = Math.min(4, state.bookingStep + 1);
    renderBookingStep();
  });
  $("#bookingBackBtn").addEventListener("click", () => {
    state.bookingStep = Math.max(1, state.bookingStep - 1);
    renderBookingStep();
  });
  $("#bookingForm").addEventListener("submit", submitBooking);

  $("#authTabs").addEventListener("click", event => {
    const button = event.target.closest("[data-auth-tab]");
    if (!button) return;
    $$('[data-auth-tab]').forEach(item => item.classList.toggle("active", item === button));
    $$(".auth-form").forEach(form => form.classList.toggle("active", form.id === `${button.dataset.authTab}Form`));
  });
  $$('[data-toggle-password]').forEach(button => button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.togglePassword);
    input.type = input.type === "password" ? "text" : "password";
    button.innerHTML = `<i data-lucide="${input.type === "password" ? "eye" : "eye-off"}"></i>`;
    refreshIcons();
  }));
  $("#loginForm").addEventListener("submit", handleLogin);
  $("#signupForm").addEventListener("submit", handleSignup);
  $("#logoutBtn").addEventListener("click", logout);

  $("#newsletterForm").addEventListener("submit", event => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast("You’re on the EveryRide list.");
  });
  $("#contactForm").addEventListener("submit", event => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast("Message saved in this demo. No email was sent.");
  });

  $("#confirmCancelBtn").addEventListener("click", confirmCancelBooking);
  $("#viewBookingBtn").addEventListener("click", () => { closeModal("confirmationModal"); routeTo("bookings"); });
  $("#closeConfirmationBtn").addEventListener("click", () => { closeModal("confirmationModal"); routeTo("home"); });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const openModalElement = $(".modal-shell.open");
    if (openModalElement && openModalElement.id !== "confirmationModal") closeModal(openModalElement.id);
    closeDrawer();
    closeMobileFilters();
  });
}

function initRevealObserver() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$(".reveal").forEach(element => element.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  $$(".reveal").forEach(element => observer.observe(element));
}

function init() {
  $("#currentYear").textContent = new Date().getFullYear();
  setMinDates();
  initEvents();
  renderFeaturedVehicles();
  renderVehicles();
  renderBookings();
  updateAccountUI();
  initRevealObserver();
  const initialRoute = location.hash.replace("#", "") || "home";
  routeTo(initialRoute);
  refreshIcons();
}

document.addEventListener("DOMContentLoaded", init);
