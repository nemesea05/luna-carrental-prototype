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
  ["heroDate", "bookingDate", "bookingReturnDate"].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.min = today;
  });
  $("#heroDate").value ||= today;
  $("#bookingDate").value ||= today;
  $("#bookingReturnDate").value ||= addDays(today, 1);
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

function startBooking(vehicleId = null, prefill = {}) {
  state.bookingStep = 1;
  state.selectedVehicleId = vehicleId || null;
  if (prefill.rentalType) state.rentalType = prefill.rentalType;
  syncBookingTypeUI();
  $("#bookingLocation").value = prefill.location || $("#heroLocation").value || "Quezon City, Metro Manila";
  $("#bookingDate").value = prefill.date || todayString();
  $("#bookingTime").value = prefill.time || "7:00 AM";
  $("#bookingReturnDate").value = addDays($("#bookingDate").value, 1);
  if (state.user) {
    $("#guestFirstName").value = state.user.firstName || "";
    $("#guestLastName").value = state.user.lastName || "";
    $("#guestEmail").value = state.user.email || "";
  }
  $("#guestPhone").value = "";
  $("#guestNotes").value = "";
  $("#bookingConsent").checked = false;
  renderBookingVehicles();
  renderBookingStep();
  openModal("bookingModal");
}

function syncBookingTypeUI() {
  $$('[data-booking-type]').forEach(button => button.classList.toggle("active", button.dataset.bookingType === state.rentalType));
  $("#bookingTimeField").hidden = state.rentalType === "wholeday";
  $("#returnDateField").hidden = state.rentalType !== "wholeday";
}

function renderBookingVehicles() {
  $("#bookingVehicleList").innerHTML = VEHICLES.map(vehicle => {
    const price = state.rentalType === "wholeday" ? vehicle.priceDay : vehicle.price12;
    return `<button type="button" class="booking-vehicle-option ${state.selectedVehicleId === vehicle.id ? "selected" : ""}" data-select-booking-vehicle="${vehicle.id}"><img src="${vehicle.image}" alt=""><div><h4>${vehicle.brand} ${vehicle.model}</h4><p>${vehicle.seats} seats · ${vehicle.transmission} · ${vehicle.type}</p></div><strong>${formatMoney(price)}</strong></button>`;
  }).join("");
  $$('[data-select-booking-vehicle]').forEach(button => button.addEventListener("click", () => {
    state.selectedVehicleId = button.dataset.selectBookingVehicle;
    renderBookingVehicles();
  }));
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
  if (state.bookingStep === 2) renderBookingVehicles();
  if (state.bookingStep === 4) renderBookingReview();
  $(".booking-modal-card").scrollTo({ top: 0, behavior: "smooth" });
  refreshIcons();
}

function validateBookingStep() {
  if (state.bookingStep === 1) {
    const date = $("#bookingDate").value;
    if (!date) return showToast("Select a pickup date.", "error"), false;
    if (date < todayString()) return showToast("Pickup date cannot be in the past.", "error"), false;
    if (state.rentalType === "wholeday") {
      const returnDate = $("#bookingReturnDate").value;
      if (!returnDate || returnDate <= date) return showToast("Return date must be after the pickup date.", "error"), false;
    }
  }
  if (state.bookingStep === 2 && !state.selectedVehicleId) return showToast("Select a vehicle to continue.", "error"), false;
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
  const price = state.rentalType === "wholeday" ? vehicle.priceDay : vehicle.price12;
  return {
    vehicle,
    rentalType: state.rentalType,
    location: $("#bookingLocation").value,
    pickupDate: $("#bookingDate").value,
    returnDate: state.rentalType === "wholeday" ? $("#bookingReturnDate").value : null,
    pickupTime: state.rentalType === "12hour" ? $("#bookingTime").value : "Flexible",
    firstName: $("#guestFirstName").value.trim(),
    lastName: $("#guestLastName").value.trim(),
    email: $("#guestEmail").value.trim(),
    phone: $("#guestPhone").value.trim(),
    notes: $("#guestNotes").value.trim(),
    amount: price
  };
}

function renderBookingReview() {
  const draft = bookingDraft();
  $("#bookingReview").innerHTML = `
    <section class="review-card"><h4>Trip details</h4><div class="review-rows"><div class="review-row"><span>Rental type</span><strong>${draft.rentalType === "wholeday" ? "Whole day" : "12 hours"}</strong></div><div class="review-row"><span>Pickup</span><strong>${formatDate(draft.pickupDate)} · ${draft.pickupTime}</strong></div>${draft.returnDate ? `<div class="review-row"><span>Return</span><strong>${formatDate(draft.returnDate)}</strong></div>` : ""}<div class="review-row"><span>Location</span><strong>${escapeHTML(draft.location)}</strong></div><div class="review-row"><span>Customer</span><strong>${escapeHTML(`${draft.firstName} ${draft.lastName}`)}</strong></div><div class="review-row"><span>Contact</span><strong>${escapeHTML(draft.phone)}</strong></div><div class="review-row review-total"><span>Estimated total</span><strong>${formatMoney(draft.amount)}</strong></div></div></section>
    <section class="review-card review-vehicle"><img src="${draft.vehicle.image}" alt="${draft.vehicle.brand} ${draft.vehicle.model}"><div><span class="eyebrow">SELECTED VEHICLE</span><h4>${draft.vehicle.brand} ${draft.vehicle.model}</h4><p>${draft.vehicle.seats} seats · ${draft.vehicle.transmission} · ${draft.vehicle.type}</p></div></section>`;
}

function submitBooking(event) {
  event.preventDefault();
  if (!validateBookingStep()) return;
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
    return `<article class="booking-item"><div class="booking-item-image"><img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}"></div><div class="booking-item-copy"><small>${escapeHTML(booking.id)}</small><h3>${vehicle.brand} ${vehicle.model}</h3><div class="booking-meta"><span><i data-lucide="calendar"></i>${formatDate(booking.pickupDate)}</span><span><i data-lucide="clock"></i>${escapeHTML(booking.pickupTime)}</span><span><i data-lucide="map-pin"></i>${escapeHTML(booking.location)}</span></div></div><div class="booking-side"><span class="status-pill ${statusClass}">${statusLabel}</span><strong>${formatMoney(booking.amount)}</strong><div class="booking-side-actions">${getBookingGroup(booking) === "upcoming" ? `<button class="outline-btn" data-cancel-booking="${booking.id}">Cancel</button>` : ""}<button class="primary-btn" data-view-vehicle="${vehicle.id}">Vehicle</button></div></div></article>`;
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
    syncBookingTypeUI();
    renderBookingVehicles();
  }));
  $("#bookingDate").addEventListener("change", event => {
    $("#bookingReturnDate").min = addDays(event.target.value, 1);
    if ($("#bookingReturnDate").value <= event.target.value) $("#bookingReturnDate").value = addDays(event.target.value, 1);
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
