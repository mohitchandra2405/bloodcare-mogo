import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/api/blood`;
const AUTH_API_URL = `${API_BASE_URL}/api/auth`;
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const pages = {
  login: "login",
  users: "users",
  admin: "admin",
};
const requestStatusOrder = {
  Pending: 0,
  Approved: 1,
  Completed: 2,
  Rejected: 3,
};
const userDemoCredentials = {
  email: "donor@bloodcare.local",
  password: "user123",
};
const adminDemoCredentials = {
  email: "mohitchandra2405@gmail.com",
  password: "Mohit2405",
};
const offlineStorageKey = "bloodcare-nexus-offline-demo-v1";

const fallbackInventory = [
  { type: "A+", units: 42, reserved: 8, status: "Stable" },
  { type: "A-", units: 16, reserved: 4, status: "Watch" },
  { type: "B+", units: 36, reserved: 10, status: "Stable" },
  { type: "B-", units: 9, reserved: 3, status: "Critical" },
  { type: "AB+", units: 22, reserved: 5, status: "Stable" },
  { type: "AB-", units: 7, reserved: 2, status: "Critical" },
  { type: "O+", units: 58, reserved: 18, status: "Stable" },
  { type: "O-", units: 12, reserved: 6, status: "Watch" },
];

const fallbackLocations = {
  Australia: ["New South Wales", "Queensland", "Victoria", "Western Australia"],
  Brazil: ["Bahia", "Parana", "Rio de Janeiro", "Sao Paulo"],
  Germany: ["Bavaria", "Berlin", "Hamburg", "Hesse"],
  India: ["Delhi", "Karnataka", "Maharashtra", "Tamil Nadu", "Telangana"],
  Japan: ["Aichi", "Kanagawa", "Osaka", "Tokyo"],
  Kenya: ["Kisumu County", "Mombasa County", "Nairobi County", "Nakuru County"],
  "United Kingdom": ["England", "Northern Ireland", "Scotland", "Wales"],
  "United States": ["California", "Illinois", "New York", "Texas", "Washington"],
};

const fallbackDonors = [
  {
    id: "DN-1001",
    name: "Aarav Sharma",
    age: 29,
    bloodGroup: "O+",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    phone: "+91 98765 41001",
    weight: 74,
    hasRecentIllness: false,
    onMedication: false,
    lastDonation: "2026-02-18",
    eligible: true,
    donationHistory: [
      { date: "2026-02-18", location: "Bengaluru Central Bank", units: 1 },
      { date: "2025-10-10", location: "St. John's Drive", units: 1 },
    ],
  },
  {
    id: "DN-1002",
    name: "Meera Iyer",
    age: 34,
    bloodGroup: "AB-",
    country: "India",
    state: "Karnataka",
    city: "Mysuru",
    phone: "+91 98765 41002",
    weight: 58,
    hasRecentIllness: false,
    onMedication: false,
    lastDonation: "2025-12-06",
    eligible: true,
    donationHistory: [{ date: "2025-12-06", location: "Mysuru Red Cross", units: 1 }],
  },
  {
    id: "DN-1003",
    name: "Kabir Khan",
    age: 23,
    bloodGroup: "B-",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    phone: "+91 98765 41003",
    weight: 68,
    hasRecentIllness: false,
    onMedication: false,
    lastDonation: "2026-01-19",
    eligible: false,
    donationHistory: [{ date: "2026-01-19", location: "Mumbai Metro Camp", units: 1 }],
  },
  {
    id: "DN-1004",
    name: "Sophia Carter",
    age: 28,
    bloodGroup: "O-",
    country: "United Kingdom",
    state: "England",
    city: "London",
    phone: "+44 7700 900101",
    weight: 57,
    hasRecentIllness: false,
    onMedication: false,
    lastDonation: "2026-03-02",
    eligible: true,
    donationHistory: [{ date: "2026-03-02", location: "London North Bank", units: 1 }],
  },
];

const fallbackRequests = [
  {
    id: "RQ-2401",
    patient: "Emergency Trauma",
    hospital: "CityCare Hospital",
    bloodGroup: "O-",
    units: 4,
    urgency: "Emergency",
    country: "India",
    state: "Delhi",
    city: "Delhi",
    status: "Pending",
    eta: "18 min",
  },
  {
    id: "RQ-2402",
    patient: "Thalassemia Support",
    hospital: "Metro Children Hospital",
    bloodGroup: "B+",
    units: 2,
    urgency: "High",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    status: "Approved",
    eta: "42 min",
  },
  {
    id: "RQ-2403",
    patient: "Scheduled Surgery",
    hospital: "St. Thomas Hospital",
    bloodGroup: "A+",
    units: 3,
    urgency: "Routine",
    country: "United Kingdom",
    state: "England",
    city: "London",
    status: "Completed",
    eta: "Completed",
  },
  {
    id: "RQ-2404",
    patient: "Accident Response",
    hospital: "Charite Trauma Unit",
    bloodGroup: "O-",
    units: 2,
    urgency: "Emergency",
    country: "Germany",
    state: "Berlin",
    city: "Berlin",
    status: "Approved",
    eta: "Reserved",
  },
];

const requestStatusCopy = {
  Pending: "Waiting for admin review and stock reservation.",
  Approved: "Reserved by the blood bank and prepared for issue.",
  Rejected: "Closed without dispatch and kept for audit.",
  Completed: "Delivered and recorded in the issue register.",
};

const donationSupportItems = [
  "Carry a valid government ID when visiting a blood centre.",
  "Eat a normal meal and drink water before donation.",
  "Wait at least 12 weeks between whole-blood donations unless your centre advises otherwise.",
  "Report recent illness, medication, or travel during screening.",
];

const adminControlNotes = [
  "Verify patient match, blood group, and unit count before approval.",
  "Reserve stock only after confirming compatibility and dispatch capacity.",
  "Reject incomplete requests so they remain visible in the audit trail.",
  "Complete requests only after blood issue or transfer has been confirmed.",
];

function getPageFromHash(hash) {
  const value = String(hash || "");

  if (value.startsWith("#/admin")) {
    return pages.admin;
  }

  if (value.startsWith("#/users")) {
    return pages.users;
  }

  return pages.login;
}

function getLoginDefaults(role) {
  return role === "admin"
    ? { role: "admin", email: adminDemoCredentials.email, password: adminDemoCredentials.password }
    : { role: "donor", email: userDemoCredentials.email, password: userDemoCredentials.password };
}

function getOfflineDemoUser(role, email, password) {
  const normalizedRole = String(role || "donor").toLowerCase();
  const normalizedEmail = String(email || "").toLowerCase();

  if (
    normalizedRole === "admin" &&
    normalizedEmail === adminDemoCredentials.email &&
    password === adminDemoCredentials.password
  ) {
    return {
      id: adminDemoCredentials.email,
      name: "Blood Bank Admin",
      email: adminDemoCredentials.email,
      role: "admin",
    };
  }

  if (
    normalizedRole !== "admin" &&
    normalizedEmail === userDemoCredentials.email &&
    password === userDemoCredentials.password
  ) {
    return {
      id: "donor-demo",
      name: "Aarav Donor",
      email: userDemoCredentials.email,
      role: "donor",
    };
  }

  return null;
}

function getDefaultState(country, locationCatalog) {
  const states = locationCatalog[country] || [];
  return states[0] || "";
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to complete the request.");
  }

  return data;
}

function getStockStatus(units) {
  if (Number(units || 0) <= 10) return "Critical";
  if (Number(units || 0) <= 18) return "Watch";
  return "Stable";
}

function getOfflineData() {
  try {
    const raw = window.localStorage.getItem(offlineStorageKey);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed || !Array.isArray(parsed.requests)) {
      return null;
    }

    return {
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : fallbackInventory,
      donors: Array.isArray(parsed.donors) ? parsed.donors : fallbackDonors,
      requests: parsed.requests,
      locationCatalog: parsed.locationCatalog || fallbackLocations,
    };
  } catch (error) {
    return null;
  }
}

function saveOfflineData(data) {
  try {
    window.localStorage.setItem(offlineStorageKey, JSON.stringify(data));
  } catch (error) {
    // Local storage can be unavailable in some restricted browser modes.
  }
}

function createOfflineRequest(form, userSession) {
  const createdAt = new Date().toISOString();
  const units = Math.max(1, Number(form.units || 1));

  return {
    id: `RQ-DEMO-${Date.now().toString().slice(-6)}`,
    patient: form.patient || "Blood support request",
    hospital: form.hospital || "User submitted request",
    bloodGroup: form.bloodGroup,
    units,
    urgency: form.urgency,
    country: form.country,
    state: form.state,
    city: form.city,
    status: "Pending",
    eta: form.urgency === "Emergency" ? "Urgent review" : "Awaiting review",
    requestedByName: userSession?.name || "Portal User",
    requestedByEmail: userSession?.email || null,
    createdAt,
    updatedAt: createdAt,
  };
}

function updateOfflineInventory(inventory, request, nextStatus) {
  if (!request) {
    return inventory;
  }

  return inventory.map((item) => {
    if (item.type !== request.bloodGroup) {
      return item;
    }

    let units = Number(item.units || 0);
    let reserved = Number(item.reserved || 0);
    const requestedUnits = Number(request.units || 0);

    if (nextStatus === "Approved" && request.status === "Pending") {
      reserved += requestedUnits;
    }

    if (nextStatus === "Rejected" && request.status === "Approved") {
      reserved = Math.max(0, reserved - requestedUnits);
    }

    if (nextStatus === "Completed" && request.status === "Approved") {
      reserved = Math.max(0, reserved - requestedUnits);
      units = Math.max(0, units - requestedUnits);
    }

    return {
      ...item,
      units,
      reserved,
      status: getStockStatus(units),
    };
  });
}

function getOfflineRequestNotice(request, nextStatus) {
  if (nextStatus === "Approved") {
    return `Request ${request.id} approved in demo mode and stock reserved.`;
  }

  if (nextStatus === "Rejected") {
    return `Request ${request.id} rejected in demo mode.`;
  }

  return `Request ${request.id} completed in demo mode.`;
}

function formatLocation(entry) {
  return [entry.city, entry.state, entry.country].filter(Boolean).join(", ");
}

function formatDateTime(value) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isFreshRequest(request, hours = 24) {
  const createdAt = new Date(request?.createdAt || 0);
  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  return Date.now() - createdAt.getTime() <= hours * 60 * 60 * 1000;
}

function buildCoverageData(donors, requests) {
  const countries = new Map();

  const ensureCountry = (country) => {
    if (!country) {
      return null;
    }

    if (!countries.has(country)) {
      countries.set(country, {
        country,
        donors: 0,
        eligibleDonors: 0,
        recipients: 0,
        requestedUnits: 0,
        pending: 0,
        approved: 0,
        completed: 0,
        rejected: 0,
        states: new Map(),
      });
    }

    return countries.get(country);
  };

  const ensureState = (countryEntry, state, city) => {
    const stateKey = state || "Unknown";

    if (!countryEntry.states.has(stateKey)) {
      countryEntry.states.set(stateKey, {
        state: stateKey,
        donors: 0,
        recipients: 0,
        requestedUnits: 0,
        cities: new Set(),
      });
    }

    const stateEntry = countryEntry.states.get(stateKey);
    if (city) {
      stateEntry.cities.add(city);
    }

    return stateEntry;
  };

  donors.forEach((donor) => {
    const countryEntry = ensureCountry(donor.country);
    if (!countryEntry) {
      return;
    }

    countryEntry.donors += 1;
    if (donor.eligible) {
      countryEntry.eligibleDonors += 1;
    }

    const stateEntry = ensureState(countryEntry, donor.state, donor.city);
    stateEntry.donors += 1;
  });

  requests.forEach((request) => {
    const countryEntry = ensureCountry(request.country);
    if (!countryEntry) {
      return;
    }

    countryEntry.recipients += 1;
    countryEntry.requestedUnits += Number(request.units || 0);
    const statusKey = String(request.status || "").toLowerCase();
    if (Object.prototype.hasOwnProperty.call(countryEntry, statusKey)) {
      countryEntry[statusKey] += 1;
    }

    const stateEntry = ensureState(countryEntry, request.state, request.city);
    stateEntry.recipients += 1;
    stateEntry.requestedUnits += Number(request.units || 0);
  });

  return [...countries.values()]
    .map((countryEntry) => ({
      ...countryEntry,
      states: [...countryEntry.states.values()]
        .map((stateEntry) => ({
          ...stateEntry,
          cities: [...stateEntry.cities].sort((left, right) => left.localeCompare(right)),
        }))
        .sort(
          (left, right) =>
            right.recipients + right.donors - (left.recipients + left.donors) ||
            left.state.localeCompare(right.state)
        ),
    }))
    .sort(
      (left, right) =>
        right.donors + right.recipients - (left.donors + left.recipients) ||
        left.country.localeCompare(right.country)
    );
}

function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash(window.location.hash));
  const [inventory, setInventory] = useState(fallbackInventory);
  const [donors, setDonors] = useState(fallbackDonors);
  const [requests, setRequests] = useState(fallbackRequests);
  const [locationCatalog, setLocationCatalog] = useState(fallbackLocations);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [requestBusyId, setRequestBusyId] = useState("");
  const [inventoryBusy, setInventoryBusy] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [portalAuthBusy, setPortalAuthBusy] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [adminSession, setAdminSession] = useState(null);
  const [loginForm, setLoginForm] = useState(getLoginDefaults("donor"));
  const [userLoginForm, setUserLoginForm] = useState(userDemoCredentials);
  const [adminLoginForm, setAdminLoginForm] = useState(adminDemoCredentials);
  const [userAuthBusy, setUserAuthBusy] = useState(false);
  const [adminAuthBusy, setAdminAuthBusy] = useState(false);
  const [donorForm, setDonorForm] = useState({
    name: "",
    age: "",
    bloodGroup: "O+",
    country: "India",
    state: getDefaultState("India", fallbackLocations),
    city: "",
    phone: "",
    weight: "",
    hasRecentIllness: "No",
    onMedication: "No",
    lastDonation: "",
  });
  const [requestForm, setRequestForm] = useState({
    patient: "",
    hospital: "",
    bloodGroup: "O+",
    units: "1",
    urgency: "High",
    country: "India",
    state: getDefaultState("India", fallbackLocations),
    city: "",
  });

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/login");
    }

    const handleHashChange = () => {
      setCurrentPage(getPageFromHash(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [inventoryData, donorsData, requestsData, locationsData] = await Promise.all([
          fetchJson(`${API_URL}/inventory`),
          fetchJson(`${API_URL}/donors`),
          fetchJson(`${API_URL}/requests`),
          fetchJson(`${API_URL}/locations`),
        ]);

        if (!active) {
          return;
        }

        setInventory(inventoryData);
        setDonors(donorsData);
        setRequests(requestsData);
        setLocationCatalog(locationsData);
        setErrorMessage("");
      } catch (error) {
        if (active) {
          const offlineData = getOfflineData() || {
            inventory: fallbackInventory,
            donors: fallbackDonors,
            requests: fallbackRequests,
            locationCatalog: fallbackLocations,
          };

          setInventory(offlineData.inventory);
          setDonors(offlineData.donors);
          setRequests(offlineData.requests);
          setLocationCatalog(offlineData.locationCatalog);
          saveOfflineData(offlineData);
          setErrorMessage(
            "Online database is not connected. Demo mode saves requests in this browser for admin approval."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    const nextState = getDefaultState(donorForm.country, locationCatalog);
    if (nextState && !locationCatalog[donorForm.country]?.includes(donorForm.state)) {
      setDonorForm((current) => ({ ...current, state: nextState }));
    }
  }, [donorForm.country, donorForm.state, locationCatalog]);

  useEffect(() => {
    const nextState = getDefaultState(requestForm.country, locationCatalog);
    if (nextState && !locationCatalog[requestForm.country]?.includes(requestForm.state)) {
      setRequestForm((current) => ({ ...current, state: nextState }));
    }
  }, [requestForm.country, requestForm.state, locationCatalog]);

  const countries = useMemo(() => Object.keys(locationCatalog), [locationCatalog]);
  const donorStates = locationCatalog[donorForm.country] || [];
  const requestStates = locationCatalog[requestForm.country] || [];
  const totalUnits = inventory.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const eligibleDonors = donors.filter((donor) => donor.eligible).length;
  const activeRequests = requests.filter((request) => ["Pending", "Approved"].includes(request.status)).length;
  const pendingRequests = requests.filter((request) => request.status === "Pending").length;
  const approvedRequests = requests.filter((request) => request.status === "Approved").length;
  const completedRequests = requests.filter((request) => request.status === "Completed").length;
  const rejectedRequests = requests.filter((request) => request.status === "Rejected").length;
  const emergencyRequests = requests.filter((request) => request.urgency === "Emergency").length;
  const totalRequestedUnits = requests.reduce((sum, request) => sum + Number(request.units || 0), 0);
  const recentRequests = useMemo(() => requests.filter((request) => isFreshRequest(request)), [requests]);

  const filteredDonors = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return donors;
    }

    return donors.filter((donor) =>
      [donor.name, donor.bloodGroup, donor.city, donor.state, donor.country, donor.phone].some((value) =>
        String(value || "").toLowerCase().includes(normalized)
      )
    );
  }, [donors, query]);

  const latestDonors = useMemo(() => donors.slice(0, 6), [donors]);

  const requestStatusData = useMemo(() => {
    return ["Pending", "Approved", "Rejected", "Completed"].map((status) => ({
      status,
      count: requests.filter((request) => request.status === status).length,
    }));
  }, [requests]);

  const requestTypeData = useMemo(() => {
    return bloodGroups
      .map((group) => ({
        name: group,
        count: requests.filter((request) => request.bloodGroup === group).length,
        units: requests
          .filter((request) => request.bloodGroup === group)
          .reduce((sum, request) => sum + Number(request.units || 0), 0),
      }))
      .filter((entry) => entry.count > 0);
  }, [requests]);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((left, right) => {
      const statusGap = requestStatusOrder[left.status] - requestStatusOrder[right.status];
      if (statusGap !== 0) {
        return statusGap;
      }

      return String(right.id || "").localeCompare(String(left.id || ""));
    });
  }, [requests]);

  const coverageData = useMemo(() => buildCoverageData(donors, requests), [donors, requests]);

  useEffect(() => {
    if (!coverageData.length) {
      setSelectedCountry("");
      return;
    }

    if (!coverageData.some((entry) => entry.country === selectedCountry)) {
      setSelectedCountry(coverageData[0].country);
    }
  }, [coverageData, selectedCountry]);

  const selectedCountryData =
    coverageData.find((entry) => entry.country === selectedCountry) || coverageData[0] || null;

  useEffect(() => {
    if (currentPage === pages.admin && !adminSession) {
      setLoginForm(getLoginDefaults("admin"));
      if (window.location.hash !== "#/login") {
        window.history.replaceState(null, "", "#/login");
        setCurrentPage(pages.login);
      }
    }

    if (currentPage === pages.users && !userSession) {
      setLoginForm(getLoginDefaults("donor"));
      if (window.location.hash !== "#/login") {
        window.history.replaceState(null, "", "#/login");
        setCurrentPage(pages.login);
      }
    }
  }, [adminSession, currentPage, userSession]);

  const openPage = (page) => {
    if (page === pages.admin && !adminSession) {
      setLoginForm(getLoginDefaults("admin"));
      window.location.hash = "#/login";
    } else if (page === pages.users && !userSession) {
      setLoginForm(getLoginDefaults("donor"));
      window.location.hash = "#/login";
    } else if (page === pages.admin) {
      window.location.hash = "#/admin";
    } else if (page === pages.users) {
      window.location.hash = "#/users";
    } else {
      window.location.hash = "#/login";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAuthenticatedPage = (page) => {
    setCurrentPage(page);
    window.location.hash = page === pages.admin ? "#/admin" : "#/users";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePortalLogin = async (event) => {
    event.preventDefault();
    setPortalAuthBusy(true);

    try {
      const payload = await fetchJson(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      if (loginForm.role === "admin") {
        setAdminSession(payload.user);
        setUserSession(null);
        setNotice(`Welcome back, ${payload.user.name}.`);
        openAuthenticatedPage(pages.admin);
      } else {
        setUserSession(payload.user);
        setAdminSession(null);
        setNotice(`Welcome to the user portal, ${payload.user.name}.`);
        openAuthenticatedPage(pages.users);
      }
    } catch (error) {
      const demoUser = getOfflineDemoUser(loginForm.role, loginForm.email, loginForm.password);

      if (demoUser) {
        if (demoUser.role === "admin") {
          setAdminSession(demoUser);
          setUserSession(null);
          setNotice("Backend is offline, so the admin portal is using demo data.");
          openAuthenticatedPage(pages.admin);
        } else {
          setUserSession(demoUser);
          setAdminSession(null);
          setNotice("Backend is offline, so the user portal is using demo data.");
          openAuthenticatedPage(pages.users);
        }
      } else {
        setNotice(error.message);
      }
    } finally {
      setPortalAuthBusy(false);
    }
  };

  const handleDonorSubmit = async (event) => {
    event.preventDefault();

    try {
      const donor = await fetchJson(`${API_URL}/donors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donorForm),
      });

      setDonors((current) => [donor, ...current]);
      setDonorForm((current) => ({
        ...current,
        name: "",
        age: "",
        city: "",
        phone: "",
        weight: "",
        hasRecentIllness: "No",
        onMedication: "No",
        lastDonation: "",
      }));
      setNotice(`Saved successfully. ${donor.name} is now registered in MongoDB.`);
    } catch (error) {
      setNotice(error.message);
    }
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();

    try {
      const request = await fetchJson(`${API_URL}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestForm,
          requestedByName: userSession?.name || "Portal User",
          requestedByEmail: userSession?.email || null,
        }),
      });

      setRequests((current) => [request, ...current]);
      setRequestForm((current) => ({
        ...current,
        patient: "",
        hospital: "",
        units: "1",
        urgency: "High",
        city: "",
      }));
      setNotice(`Request ${request.id} sent successfully. The admin can now approve it from the admin portal.`);
    } catch (error) {
      const request = createOfflineRequest(requestForm, userSession);
      const nextRequests = [request, ...requests];

      setRequests(nextRequests);
      saveOfflineData({
        inventory,
        donors,
        requests: nextRequests,
        locationCatalog,
      });
      setRequestForm((current) => ({
        ...current,
        patient: "",
        hospital: "",
        units: "1",
        urgency: "High",
        city: "",
      }));
      setErrorMessage("Online database is not connected. Demo mode saves requests in this browser for admin approval.");
      setNotice(`Request ${request.id} saved. Login as admin to approve or reject it.`);
    }
  };

  const handleRequestAction = async (requestId, nextStatus) => {
    setRequestBusyId(requestId);

    try {
      const endpoint =
        nextStatus === "Completed"
          ? `${API_URL}/requests/${requestId}/fulfill`
          : `${API_URL}/requests/${requestId}/status`;

      const payload = await fetchJson(endpoint, {
        method: "PATCH",
        headers: nextStatus === "Completed" ? undefined : { "Content-Type": "application/json" },
        body: nextStatus === "Completed" ? undefined : JSON.stringify({ status: nextStatus }),
      });

      setRequests((current) =>
        current.map((request) => (request.id === payload.request.id ? payload.request : request))
      );

      if (payload.inventory) {
        setInventory((current) =>
          current.map((item) => (item.type === payload.inventory.type ? payload.inventory : item))
        );
      }

      setNotice(
        nextStatus === "Approved"
          ? `Request ${payload.request.id} approved and stock reserved.`
          : nextStatus === "Rejected"
            ? `Request ${payload.request.id} rejected and removed from the active queue.`
          : `Request ${payload.request.id} marked as completed.`
      );
    } catch (error) {
      const targetRequest = requests.find((request) => request.id === requestId);

      if (!targetRequest) {
        setNotice(error.message);
        return;
      }

      const updatedRequest = {
        ...targetRequest,
        status: nextStatus,
        eta:
          nextStatus === "Approved"
            ? "Reserved"
            : nextStatus === "Completed"
              ? "Completed"
              : nextStatus === "Rejected"
                ? "Closed"
                : targetRequest.eta,
        updatedAt: new Date().toISOString(),
      };
      const nextRequests = requests.map((request) => (request.id === requestId ? updatedRequest : request));
      const nextInventory = updateOfflineInventory(inventory, targetRequest, nextStatus);

      setRequests(nextRequests);
      setInventory(nextInventory);
      saveOfflineData({
        inventory: nextInventory,
        donors,
        requests: nextRequests,
        locationCatalog,
      });
      setErrorMessage("Online database is not connected. Demo mode saves admin decisions in this browser.");
      setNotice(getOfflineRequestNotice(updatedRequest, nextStatus));
    } finally {
      setRequestBusyId("");
    }
  };

  const handleInventoryUpdate = async (type, units, reserved) => {
    setInventoryBusy(true);

    try {
      const payload = await fetchJson(`${API_URL}/inventory/${encodeURIComponent(type)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          units: Number(units),
          reserved: Number(reserved),
        }),
      });

      setInventory((current) => current.map((item) => (item.type === payload.type ? payload : item)));
      setNotice(`Inventory updated for ${payload.type}.`);
      return payload;
    } catch (error) {
      setNotice(error.message);
      throw error;
    } finally {
      setInventoryBusy(false);
    }
  };

  const handleUserLogin = async (event) => {
    event.preventDefault();
    setUserAuthBusy(true);

    try {
      const payload = await fetchJson(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userLoginForm.email,
          password: userLoginForm.password,
          role: "donor",
        }),
      });

      setUserSession(payload.user);
      setNotice(`Welcome to the user portal, ${payload.user.name}.`);
    } catch (error) {
      const demoUser = getOfflineDemoUser("donor", userLoginForm.email, userLoginForm.password);

      if (demoUser) {
        setUserSession(demoUser);
        setNotice("Backend is offline, so the user portal is using demo data.");
      } else {
        setNotice(error.message);
      }
    } finally {
      setUserAuthBusy(false);
    }
  };

  const handleUserLogout = () => {
    setUserSession(null);
    setNotice("User logged out.");
    openPage(pages.login);
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setAdminAuthBusy(true);

    try {
      const payload = await fetchJson(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminLoginForm.email,
          password: adminLoginForm.password,
          role: "admin",
        }),
      });

      setAdminSession(payload.user);
      setNotice(`Welcome back, ${payload.user.name}.`);
    } catch (error) {
      const demoUser = getOfflineDemoUser("admin", adminLoginForm.email, adminLoginForm.password);

      if (demoUser) {
        setAdminSession(demoUser);
        setNotice("Backend is offline, so the admin portal is using demo data.");
      } else {
        setNotice(error.message);
      }
    } finally {
      setAdminAuthBusy(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    setNotice("Admin logged out.");
    openPage(pages.login);
  };

  const sharedPageProps = {
    currentPage,
    openPage,
    loading,
    errorMessage,
    notice,
  };

  const shouldShowPortalLogin =
    currentPage === pages.login ||
    (currentPage === pages.users && !userSession) ||
    (currentPage === pages.admin && !adminSession);

  return shouldShowPortalLogin ? (
    <LoginPage
      currentPage={pages.login}
      openPage={openPage}
      loading={loading}
      errorMessage={errorMessage}
      notice={notice}
      loginForm={loginForm}
      setLoginForm={setLoginForm}
      portalAuthBusy={portalAuthBusy}
      onPortalLogin={handlePortalLogin}
    />
  ) : currentPage === pages.admin ? (
    <AdminPage
      {...sharedPageProps}
      adminSession={adminSession}
      adminLoginForm={adminLoginForm}
      setAdminLoginForm={setAdminLoginForm}
      adminAuthBusy={adminAuthBusy}
      onAdminLogin={handleAdminLogin}
      onAdminLogout={handleAdminLogout}
      donors={donors}
      inventory={inventory}
      latestDonors={latestDonors}
      sortedRequests={sortedRequests}
      totalRequestedUnits={totalRequestedUnits}
      pendingRequests={pendingRequests}
      approvedRequests={approvedRequests}
      completedRequests={completedRequests}
      rejectedRequests={rejectedRequests}
      emergencyRequests={emergencyRequests}
      recentRequests={recentRequests}
      requestStatusData={requestStatusData}
      requestTypeData={requestTypeData}
      requestBusyId={requestBusyId}
      onRequestAction={handleRequestAction}
      coverageData={coverageData}
      selectedCountry={selectedCountry}
      setSelectedCountry={setSelectedCountry}
      selectedCountryData={selectedCountryData}
      onInventoryUpdate={handleInventoryUpdate}
      inventoryBusy={inventoryBusy}
    />
  ) : (
    <UsersPage
      {...sharedPageProps}
      userSession={userSession}
      userLoginForm={userLoginForm}
      setUserLoginForm={setUserLoginForm}
      userAuthBusy={userAuthBusy}
      onUserLogin={handleUserLogin}
      onUserLogout={handleUserLogout}
      donors={donors}
      inventory={inventory}
      totalUnits={totalUnits}
      eligibleDonors={eligibleDonors}
      activeRequests={activeRequests}
      donorForm={donorForm}
      setDonorForm={setDonorForm}
      donorStates={donorStates}
      requestForm={requestForm}
      setRequestForm={setRequestForm}
      requestStates={requestStates}
      countries={countries}
      locationCatalog={locationCatalog}
      requestStatusData={requestStatusData}
      requestTypeData={requestTypeData}
      filteredDonors={filteredDonors}
      query={query}
      setQuery={setQuery}
      onDonorSubmit={handleDonorSubmit}
      onRequestSubmit={handleRequestSubmit}
      coverageData={coverageData}
      selectedCountry={selectedCountry}
      setSelectedCountry={setSelectedCountry}
      selectedCountryData={selectedCountryData}
    />
  );
}

function LoginPage({
  currentPage,
  openPage,
  loading,
  errorMessage,
  notice,
  loginForm,
  setLoginForm,
  portalAuthBusy,
  onPortalLogin,
}) {
  const activeCredentials = loginForm.role === "admin" ? adminDemoCredentials : userDemoCredentials;

  return (
    <div className="app-shell">
      <header className="hero">
        <nav className="topbar">
          <Brand title="BloodCare Nexus" subtitle="Secure Access Portal" badge="L" />
          <PortalNavigation currentPage={currentPage} openPage={openPage} />
        </nav>

        <section className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Single access page</p>
            <h1>Sign in once, then continue to the right blood bank dashboard for your role.</h1>
            <p>
              Choose whether you are entering as a user or as an administrator. The login will take you directly to the
              correct dashboard after authentication.
            </p>
          </div>

          <div className="command-panel">
            <div className="command-header">
              <span>Selected role</span>
              <strong>{loginForm.role === "admin" ? "Admin access" : "User access"}</strong>
            </div>
            <article className="queue-card">
              <div>
                <strong>{loginForm.role === "admin" ? "admin" : "user"}</strong>
                <span>Portal type</span>
              </div>
              <div>
                <p>{activeCredentials.email}</p>
                <small>Password: {activeCredentials.password}</small>
              </div>
              <em>Login</em>
            </article>
            <article className="queue-card">
              <div>
                <strong>Live</strong>
                <span>MongoDB</span>
              </div>
              <div>
                <p>Connected blood bank data</p>
                <small>Requests, donors, stock, and admin approvals are backed by the database.</small>
              </div>
              <em>Ready</em>
            </article>
          </div>
        </section>
      </header>

      <main>
        <StatusStack loading={loading} errorMessage={errorMessage} notice={notice} />

        <section className="owner-login-layout">
          <article className="panel owner-login-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Portal Sign In</p>
                <h2>Choose your role and continue</h2>
              </div>
              <Icon label="L" />
            </div>

            <div className="role-toggle" aria-label="Portal role selector">
              <button
                className={`role-option ${loginForm.role === "donor" ? "active" : ""}`}
                type="button"
                onClick={() => setLoginForm(getLoginDefaults("donor"))}
              >
                User / Donor
              </button>
              <button
                className={`role-option ${loginForm.role === "admin" ? "active" : ""}`}
                type="button"
                onClick={() => setLoginForm(getLoginDefaults("admin"))}
              >
                Admin
              </button>
            </div>

            <form className="login-form" onSubmit={onPortalLogin}>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label>
                Password
                <input
                  required
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
              <button className="primary-btn full" type="submit" disabled={portalAuthBusy}>
                <Icon label={loginForm.role === "admin" ? "A" : "U"} />{" "}
                {portalAuthBusy
                  ? "Signing in..."
                  : loginForm.role === "admin"
                    ? "Login as Admin"
                    : "Login as User"}
              </button>
            </form>
          </article>
        </section>
      </main>
    </div>
  );
}

function UsersPage({
  currentPage,
  openPage,
  loading,
  errorMessage,
  notice,
  userSession,
  userLoginForm,
  setUserLoginForm,
  userAuthBusy,
  onUserLogin,
  onUserLogout,
  donors,
  inventory,
  totalUnits,
  eligibleDonors,
  activeRequests,
  donorForm,
  setDonorForm,
  donorStates,
  requestForm,
  setRequestForm,
  requestStates,
  countries,
  locationCatalog,
  requestStatusData,
  requestTypeData,
  filteredDonors,
  query,
  setQuery,
  onDonorSubmit,
  onRequestSubmit,
  coverageData,
  selectedCountry,
  setSelectedCountry,
  selectedCountryData,
}) {
  if (!userSession) {
    return (
      <div className="app-shell">
        <header className="hero">
          <nav className="topbar">
            <Brand title="BloodCare Nexus" subtitle="User Portal Access" badge="U" />
            <PortalNavigation currentPage={currentPage} openPage={openPage} />
          </nav>

          <section className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">User login</p>
              <h1>Access the international donor and recipient portal with a secure user sign-in.</h1>
              <p>
                This page is the public-facing user portal. Donors and general users can enter the live blood donation
                dashboard, register records, and track availability after signing in.
              </p>
              <div className="hero-actions">
                <button className="primary-btn" type="button" onClick={() => openPage(pages.admin)}>
                  <Icon label="A" /> Open Admin Login
                </button>
              </div>
            </div>

            <div className="command-panel">
              <div className="command-header">
                <span>Access details</span>
                <strong>User account</strong>
              </div>
              <article className="queue-card">
                <div>
                  <strong>donor</strong>
                  <span>User role</span>
                </div>
                <div>
                  <p>{userDemoCredentials.email}</p>
                  <small>Password: {userDemoCredentials.password}</small>
                </div>
                <em>Login</em>
              </article>
              <article className="queue-card">
                <div>
                  <strong>Live</strong>
                  <span>MongoDB</span>
                </div>
                <div>
                  <p>User data and requests</p>
                  <small>All donor registrations and requests are stored in the connected database</small>
                </div>
                <em>Ready</em>
              </article>
            </div>
          </section>
        </header>

        <main>
          <StatusStack loading={loading} errorMessage={errorMessage} notice={notice} />

          <section className="owner-login-layout">
            <article className="panel owner-login-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">User Sign In</p>
                  <h2>Login to open the user portal</h2>
                </div>
                <Icon label="L" />
              </div>

              <form className="login-form" onSubmit={onUserLogin}>
                <label>
                  User Email
                  <input
                    required
                    type="email"
                    value={userLoginForm.email}
                    onChange={(event) => setUserLoginForm({ ...userLoginForm, email: event.target.value })}
                  />
                </label>
                <label>
                  Password
                  <input
                    required
                    type="password"
                    value={userLoginForm.password}
                    onChange={(event) => setUserLoginForm({ ...userLoginForm, password: event.target.value })}
                  />
                </label>
                <button className="primary-btn full" type="submit" disabled={userAuthBusy}>
                  <Icon label="U" /> {userAuthBusy ? "Signing in..." : "Login as User"}
                </button>
              </form>
            </article>
          </section>
        </main>
      </div>
    );
  }

  const trackedCountries = coverageData.length;
  const trackedStates = coverageData.reduce((sum, entry) => sum + entry.states.length, 0);
  const watchInventory = inventory.filter((item) => item.status !== "Stable").slice(0, 4);
  const demandPriority = [...requestTypeData]
    .sort((left, right) => right.units - left.units || right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 5);

  return (
    <div className="app-shell">
      <header className="hero">
        <nav className="topbar">
          <Brand title="BloodCare Nexus" subtitle="User Portal" badge="U" />
          <PortalNavigation currentPage={currentPage} openPage={openPage} />
        </nav>

        <section className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Main blood bank dashboard</p>
            <h1>Manage blood donation operations, hospital requests, and donor records from one official portal.</h1>
            <p>
              This dashboard stays connected to the same live MongoDB records, but now focuses on stock readiness,
              request handling, donor registration, and regional coverage without visual demo charts.
            </p>
            <div className="hero-actions">
              <a className="primary-btn" href="#main-requests">
                <Icon label="R" /> Review Requests
              </a>
              <a className="secondary-btn" href="#user-register">
                <Icon label="+" /> Register Donor
              </a>
              <button className="secondary-btn" type="button" onClick={() => openPage(pages.admin)}>
                <Icon label="A" /> Admin Portal
              </button>
              <button className="secondary-btn" type="button" onClick={onUserLogout}>
                <Icon label="X" /> Logout
              </button>
            </div>
          </div>

          <div className="command-panel">
            <div className="command-header">
              <span>Dashboard view</span>
              <strong>Today at a glance</strong>
            </div>
            <article className="queue-card">
              <div>
                <strong>{totalUnits}</strong>
                <span>Units live</span>
              </div>
              <div>
                <p>Available blood stock</p>
                <small>{inventory.length} blood groups tracked in the live inventory</small>
              </div>
              <em>Stock</em>
            </article>
            <article className="queue-card">
              <div>
                <strong>{activeRequests}</strong>
                <span>Open queue</span>
              </div>
              <div>
                <p>Hospital requests</p>
                <small>Pending and approved requests remain visible for admin action</small>
              </div>
              <em>Queue</em>
            </article>
            <article className="queue-card">
              <div>
                <strong>{trackedStates}</strong>
                <span>States</span>
              </div>
              <div>
                <p>Regional service coverage</p>
                <small>{trackedCountries} countries are represented in the live donor and request records</small>
              </div>
              <em>Region</em>
            </article>
          </div>
        </section>
      </header>

      <main>
        <StatusStack loading={loading} errorMessage={errorMessage} notice={notice} />

        <section className="stats-grid" aria-label="User summary">
          <Metric icon={<Icon label="U" />} label="Available Units" value={totalUnits} tone="red" />
          <Metric icon={<Icon label="D" />} label="Registered Donors" value={donors.length} tone="blue" />
          <Metric icon={<Icon label="E" />} label="Eligible Donors" value={eligibleDonors} tone="green" />
          <Metric icon={<Icon label="Q" />} label="Open Requests" value={activeRequests} tone="amber" />
        </section>

        <section className="dashboard-grid">
          <article className="panel wide">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Inventory Snapshot</p>
                <h2>Available blood units</h2>
              </div>
              <span className="data-pill">Live stock view</span>
            </div>
            <div className="inventory-grid">
              {inventory.map((item) => (
                <article className="inventory-card" key={`user-inventory-${item.type}`}>
                  <div>
                    <p>{item.type}</p>
                    <span className={getInventoryToneClass(item.status)}>{item.status}</span>
                  </div>
                  <strong>{item.units}</strong>
                  <small>{item.reserved} units reserved</small>
                  <small>Immediate blood bank availability</small>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Operations Desk</p>
                <h2>Supply watch and donor guidance</h2>
              </div>
            </div>
            <div className="stack-list">
              {watchInventory.length ? (
                watchInventory.map((item) => (
                  <div className="tech-row" key={`watch-${item.type}`}>
                    <span>
                      {item.type} stock
                      <br />
                      <small>{item.units} available | {item.reserved} reserved</small>
                    </span>
                    <strong className={getInventoryToneClass(item.status)}>{item.status}</strong>
                  </div>
                ))
              ) : (
                <div className="tech-row">
                  <span>All blood groups</span>
                  <strong className="status-good">Stable</strong>
                </div>
              )}
              <div className="tech-row">
                <span>
                  Eligible donors
                  <br />
                  <small>Profiles ready to be contacted for donation</small>
                </span>
                <strong>{eligibleDonors}</strong>
              </div>
            </div>
            <ul className="note-list">
              {donationSupportItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mini-stat-grid">
              <article className="mini-stat-card">
                <span>Active countries</span>
                <strong>{trackedCountries}</strong>
              </article>
              <article className="mini-stat-card">
                <span>Tracked states</span>
                <strong>{trackedStates}</strong>
              </article>
            </div>
          </article>
        </section>

        <section className="dashboard-grid" id="main-requests">
          <article className="panel wide">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Request Status</p>
                <h2>Blood request tracking</h2>
              </div>
              <span className="data-pill">{activeRequests} open requests</span>
            </div>
            <div className="table-list">
              {requestStatusData.map((entry) => (
                <div className="row-card" key={`request-status-${entry.status}`}>
                  <div>
                    <strong>{entry.status}</strong>
                    <span>{requestStatusCopy[entry.status]}</span>
                  </div>
                  <b>{entry.count}</b>
                  <span>
                    {entry.status === "Pending"
                      ? "Needs admin review"
                      : entry.status === "Approved"
                        ? "Stock reserved"
                        : entry.status === "Completed"
                          ? "Issue confirmed"
                          : "Closed for audit"}
                  </span>
                  <em>{entry.status}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Demand Priority</p>
                <h2>Most requested blood groups</h2>
              </div>
            </div>
            <div className="stack-list">
              {demandPriority.length ? (
                demandPriority.map((item) => (
                  <div className="tech-row" key={`demand-${item.name}`}>
                    <span>
                      {item.name} demand
                      <br />
                      <small>{item.count} request{item.count === 1 ? "" : "s"} logged</small>
                    </span>
                    <strong>{item.units} units</strong>
                  </div>
                ))
              ) : (
                <div className="tech-row">
                  <span>No active demand</span>
                  <strong className="status-good">Clear</strong>
                </div>
              )}
              <div className="tech-row">
                <span>
                  Pending approvals
                  <br />
                  <small>Visible in the admin portal for decision and stock reservation</small>
                </span>
                <strong>{requestStatusData.find((entry) => entry.status === "Pending")?.count || 0}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="split-grid">
          <article className="panel" id="user-register">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Donor Registration</p>
                <h2>New donor signup</h2>
              </div>
              <Icon label="D" />
            </div>
            <form className="form-grid" onSubmit={onDonorSubmit}>
              <label>
                Full Name
                <input
                  required
                  value={donorForm.name}
                  onChange={(event) => setDonorForm({ ...donorForm, name: event.target.value })}
                  placeholder="Enter donor name"
                />
              </label>
              <label>
                Age
                <input
                  required
                  min="18"
                  type="number"
                  value={donorForm.age}
                  onChange={(event) => setDonorForm({ ...donorForm, age: event.target.value })}
                  placeholder="Age"
                />
              </label>
              <label>
                Blood Group
                <select
                  value={donorForm.bloodGroup}
                  onChange={(event) => setDonorForm({ ...donorForm, bloodGroup: event.target.value })}
                >
                  {bloodGroups.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </label>
              <label>
                Weight (kg)
                <input
                  required
                  min="0"
                  type="number"
                  value={donorForm.weight}
                  onChange={(event) => setDonorForm({ ...donorForm, weight: event.target.value })}
                  placeholder="Weight"
                />
              </label>
              <label>
                Country
                <select
                  value={donorForm.country}
                  onChange={(event) =>
                    setDonorForm({
                      ...donorForm,
                      country: event.target.value,
                      state: getDefaultState(event.target.value, locationCatalog),
                    })
                  }
                >
                  {countries.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>
              </label>
              <label>
                State / Province
                <select
                  value={donorForm.state}
                  onChange={(event) => setDonorForm({ ...donorForm, state: event.target.value })}
                >
                  {donorStates.map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </select>
              </label>
              <label>
                City
                <input
                  required
                  value={donorForm.city}
                  onChange={(event) => setDonorForm({ ...donorForm, city: event.target.value })}
                  placeholder="City"
                />
              </label>
              <label>
                Phone
                <input
                  required
                  value={donorForm.phone}
                  onChange={(event) => setDonorForm({ ...donorForm, phone: event.target.value })}
                  placeholder="+91 ..."
                />
              </label>
              <label>
                Recent Illness?
                <select
                  value={donorForm.hasRecentIllness}
                  onChange={(event) => setDonorForm({ ...donorForm, hasRecentIllness: event.target.value })}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </label>
              <label>
                On Medication?
                <select
                  value={donorForm.onMedication}
                  onChange={(event) => setDonorForm({ ...donorForm, onMedication: event.target.value })}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </label>
              <label>
                Last Donation Date
                <input
                  type="date"
                  value={donorForm.lastDonation}
                  onChange={(event) => setDonorForm({ ...donorForm, lastDonation: event.target.value })}
                />
              </label>
              <button className="primary-btn full" type="submit">
                <Icon label="+" /> Save Donor
              </button>
            </form>
          </article>

          <article className="panel" id="user-request">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Blood Request</p>
                <h2>Request blood units</h2>
              </div>
              <Icon label="R" />
            </div>
            <form className="form-grid" onSubmit={onRequestSubmit}>
              <label>
                Patient / Case
                <input
                  required
                  value={requestForm.patient}
                  onChange={(event) => setRequestForm({ ...requestForm, patient: event.target.value })}
                  placeholder="Patient name or case"
                />
              </label>
              <label>
                Hospital / Organization
                <input
                  required
                  value={requestForm.hospital}
                  onChange={(event) => setRequestForm({ ...requestForm, hospital: event.target.value })}
                  placeholder="Hospital name"
                />
              </label>
              <label>
                Blood Group
                <select
                  value={requestForm.bloodGroup}
                  onChange={(event) => setRequestForm({ ...requestForm, bloodGroup: event.target.value })}
                >
                  {bloodGroups.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </label>
              <label>
                Units Needed
                <input
                  required
                  min="1"
                  type="number"
                  value={requestForm.units}
                  onChange={(event) => setRequestForm({ ...requestForm, units: event.target.value })}
                />
              </label>
              <label>
                Urgency
                <select
                  value={requestForm.urgency}
                  onChange={(event) => setRequestForm({ ...requestForm, urgency: event.target.value })}
                >
                  <option>Routine</option>
                  <option>High</option>
                  <option>Emergency</option>
                </select>
              </label>
              <label>
                Country
                <select
                  value={requestForm.country}
                  onChange={(event) =>
                    setRequestForm({
                      ...requestForm,
                      country: event.target.value,
                      state: getDefaultState(event.target.value, locationCatalog),
                    })
                  }
                >
                  {countries.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>
              </label>
              <label>
                State / Province
                <select
                  value={requestForm.state}
                  onChange={(event) => setRequestForm({ ...requestForm, state: event.target.value })}
                >
                  {requestStates.map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </select>
              </label>
              <label>
                City
                <input
                  required
                  value={requestForm.city}
                  onChange={(event) => setRequestForm({ ...requestForm, city: event.target.value })}
                  placeholder="City"
                />
              </label>
              <button className="primary-btn full" type="submit">
                <Icon label="S" /> Submit Request
              </button>
            </form>
          </article>
        </section>

        <RegionalCoverageSection
          eyebrow="Regional Coverage"
          title="Live donor and recipient coverage"
          pill="Regional totals match the same live donor and request records"
          detailHeading="Country coverage"
          coverageData={coverageData}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          selectedCountryData={selectedCountryData}
        />

        <section className="panel table-panel" id="user-profiles">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Donor Profiles</p>
              <h2>Search donors and donation history</h2>
            </div>
            <div className="search-box">
              <Icon label="?" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search donor, city, state, blood group"
              />
            </div>
          </div>

          <div className="profile-grid">
            {filteredDonors.map((donor) => (
              <article className="profile-card" key={donor.id}>
                <div className="profile-topline">
                  <div>
                    <strong>{donor.name}</strong>
                    <span>{formatLocation(donor)}</span>
                  </div>
                  <b>{donor.bloodGroup}</b>
                </div>

                <div className="profile-meta">
                  <span>Age: {donor.age}</span>
                  <span>Weight: {donor.weight} kg</span>
                  <span>Phone: {donor.phone}</span>
                </div>

                <div className="chip-list">
                  <span className={donor.eligible ? "state-chip success" : "state-chip alert"}>
                    {donor.eligible ? "Eligible" : "Temporarily ineligible"}
                  </span>
                  <span className="state-chip">Illness: {donor.hasRecentIllness ? "Yes" : "No"}</span>
                  <span className="state-chip">Medication: {donor.onMedication ? "Yes" : "No"}</span>
                </div>

                <div className="history-block">
                  <strong>Donation History</strong>
                  {donor.donationHistory?.length ? (
                    <ul className="history-list">
                      {donor.donationHistory.map((entry, index) => (
                        <li key={`${donor.id}-${entry.date}-${index}`}>
                          <span>{entry.date}</span>
                          <span>{entry.location}</span>
                          <span>{entry.units} unit</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted-copy">No donations recorded yet.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function AdminPage({
  currentPage,
  openPage,
  loading,
  errorMessage,
  notice,
  adminSession,
  adminLoginForm,
  setAdminLoginForm,
  adminAuthBusy,
  onAdminLogin,
  onAdminLogout,
  donors,
  inventory,
  latestDonors,
  sortedRequests,
  totalRequestedUnits,
  pendingRequests,
  approvedRequests,
  completedRequests,
  rejectedRequests,
  emergencyRequests,
  recentRequests,
  requestStatusData,
  requestTypeData,
  requestBusyId,
  onRequestAction,
  coverageData,
  selectedCountry,
  setSelectedCountry,
  selectedCountryData,
  onInventoryUpdate,
  inventoryBusy,
}) {
  const screeningHolds = donors.filter((donor) => !donor.eligible).slice(0, 4);
  const emergencyQueue = sortedRequests
    .filter((request) => request.urgency === "Emergency" && ["Pending", "Approved"].includes(request.status))
    .slice(0, 4);
  const criticalStock = inventory.filter((item) => item.status !== "Stable").slice(0, 4);
  const freshQueueCount = recentRequests.filter((request) => request.status === "Pending").length;
  const [selectedStockType, setSelectedStockType] = useState(() => inventory[0]?.type || "O+");
  const [stockValues, setStockValues] = useState(() => ({
    units: String(inventory[0]?.units ?? 0),
    reserved: String(inventory[0]?.reserved ?? 0),
  }));
  const selectedInventoryItem = inventory.find((item) => item.type === selectedStockType) || inventory[0] || null;

  useEffect(() => {
    if (!selectedInventoryItem) {
      return;
    }

    setSelectedStockType(selectedInventoryItem.type);
    setStockValues({
      units: String(selectedInventoryItem.units ?? 0),
      reserved: String(selectedInventoryItem.reserved ?? 0),
    });
  }, [selectedInventoryItem]);

  const handleStockSubmit = async (event) => {
    event.preventDefault();

    if (!selectedInventoryItem) {
      return;
    }

    try {
      await onInventoryUpdate(selectedInventoryItem.type, stockValues.units, stockValues.reserved);
    } catch (error) {
      // Notice banner is already handled in the shared request helper.
    }
  };

  if (!adminSession) {
    return (
      <div className="app-shell">
        <header className="hero">
          <nav className="topbar">
            <Brand title="BloodCare Nexus" subtitle="Admin Portal Access" badge="A" />
            <PortalNavigation currentPage={currentPage} openPage={openPage} />
          </nav>

          <section className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Admin login</p>
              <h1>Sign in as the blood bank administrator to supervise approvals, stock control, and global demand.</h1>
              <p>
                This admin login uses the real account from the MongoDB-backed backend, so only the management portal
                can access approvals, stock controls, testing signals, and international monitoring tools.
              </p>
            </div>

            <div className="command-panel">
              <div className="command-header">
                <span>Demo credentials</span>
                <strong>Admin access</strong>
              </div>
              <article className="queue-card">
                <div>
                  <strong>admin</strong>
                  <span>Admin user</span>
                </div>
                <div>
                  <p>{adminDemoCredentials.email}</p>
                  <small>Password: {adminDemoCredentials.password}</small>
                </div>
                <em>Login</em>
              </article>
            </div>
          </section>
        </header>

        <main>
          <StatusStack loading={loading} errorMessage={errorMessage} notice={notice} />

          <section className="owner-login-layout">
            <article className="panel owner-login-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Admin Sign In</p>
                  <h2>Login to open the admin dashboard</h2>
                </div>
                <Icon label="L" />
              </div>

              <form className="login-form" onSubmit={onAdminLogin}>
                <label>
                  Admin Email
                  <input
                    required
                    type="email"
                    value={adminLoginForm.email}
                    onChange={(event) => setAdminLoginForm({ ...adminLoginForm, email: event.target.value })}
                  />
                </label>
                <label>
                  Password
                  <input
                    required
                    type="password"
                    value={adminLoginForm.password}
                    onChange={(event) => setAdminLoginForm({ ...adminLoginForm, password: event.target.value })}
                  />
                </label>
                <button className="primary-btn full" type="submit" disabled={adminAuthBusy}>
                  <Icon label="A" /> {adminAuthBusy ? "Signing in..." : "Login as Admin"}
                </button>
              </form>
            </article>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <nav className="topbar">
          <Brand title="BloodCare Nexus" subtitle="Admin Control Portal" badge="A" />
          <PortalNavigation currentPage={currentPage} openPage={openPage} />
        </nav>

        <section className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Administrator webpage</p>
            <h1>Control international blood operations, approve every request, and supervise release readiness in one place.</h1>
            <p>
              This admin portal is the management view. It focuses on live request totals, blood stock, regional
              coverage, testing priorities, recent donors, and the actions to approve or complete hospital requests.
            </p>
            <div className="hero-actions">
              <button className="primary-btn" type="button" onClick={() => openPage(pages.users)}>
                <Icon label="U" /> Open User Portal
              </button>
              <button className="secondary-btn" type="button" onClick={onAdminLogout}>
                <Icon label="X" /> Logout
              </button>
            </div>
          </div>

          <div className="command-panel">
            <div className="command-header">
              <span>Control flow</span>
              <strong>Admin controls</strong>
            </div>
            <article className="queue-card">
              <div>
                <strong>{pendingRequests}</strong>
                <span>Pending</span>
              </div>
              <div>
                <p>Needs approval</p>
                <small>Check request details and reserve blood units</small>
              </div>
              <em>Queue</em>
            </article>
            <article className="queue-card">
              <div>
                <strong>{approvedRequests}</strong>
                <span>Approved</span>
              </div>
              <div>
                <p>Reserved stock</p>
                <small>These requests are ready to be dispatched</small>
              </div>
              <em>Queue</em>
            </article>
            <article className="queue-card">
              <div>
                <strong>{completedRequests}</strong>
                <span>Completed</span>
              </div>
              <div>
                <p>Delivered</p>
                <small>Units are already issued and tracked</small>
              </div>
              <em>Audit</em>
            </article>
          </div>
        </section>
      </header>

      <main>
        <StatusStack loading={loading} errorMessage={errorMessage} notice={notice} />

        {recentRequests.length ? (
          <section className="notice-stack">
            <div className="notice-banner info">
              {recentRequests.length} new request{recentRequests.length === 1 ? "" : "s"} reached the admin desk in
              the last 24 hours. {freshQueueCount ? `${freshQueueCount} still need active review.` : "All recent items have been processed."}
            </div>
          </section>
        ) : null}

        <section className="stats-grid" aria-label="Admin summary">
          <Metric icon={<Icon label="R" />} label="Total Requests" value={sortedRequests.length} tone="red" />
          <Metric icon={<Icon label="P" />} label="Pending Approval" value={pendingRequests} tone="amber" />
          <Metric icon={<Icon label="E" />} label="Emergency Requests" value={emergencyRequests} tone="blue" />
          <Metric icon={<Icon label="D" />} label="Registered Donors" value={donors.length} tone="green" />
        </section>

        <section className="dashboard-grid">
          <article className="panel wide">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Demand Overview</p>
                <h2>Total requests by blood type</h2>
              </div>
              <span className="data-pill">{totalRequestedUnits} requested units</span>
            </div>
            <div className="table-list">
              {requestTypeData.length ? (
                requestTypeData
                  .slice()
                  .sort(
                    (left, right) =>
                      right.units - left.units || right.count - left.count || left.name.localeCompare(right.name)
                  )
                  .map((entry) => (
                    <div className="row-card" key={`admin-demand-${entry.name}`}>
                      <div>
                        <strong>{entry.name}</strong>
                        <span>Requests by blood group</span>
                      </div>
                      <b>{entry.count}</b>
                      <span>{entry.units} units requested</span>
                      <em>{entry.units >= 10 ? "High load" : "Tracked"}</em>
                    </div>
                  ))
              ) : (
                <div className="row-card">
                  <div>
                    <strong>No requests yet</strong>
                    <span>Blood demand will appear here after submissions.</span>
                  </div>
                  <b>0</b>
                  <span>0 units requested</span>
                  <em>Idle</em>
                </div>
              )}
            </div>
          </article>

          <article className="panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Status Desk</p>
                <h2>Request stages</h2>
              </div>
            </div>
            <div className="stack-list">
              {requestStatusData.map((entry) => (
                <div className="tech-row" key={`admin-status-${entry.status}`}>
                  <span>
                    {entry.status}
                    <br />
                    <small>{requestStatusCopy[entry.status]}</small>
                  </span>
                  <strong>{entry.count}</strong>
                </div>
              ))}
            </div>
            <ul className="note-list">
              {adminControlNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mini-stat-grid">
              <article className="mini-stat-card">
                <span>Rejected</span>
                <strong>{rejectedRequests}</strong>
              </article>
              <article className="mini-stat-card">
                <span>Emergency</span>
                <strong>{emergencyRequests}</strong>
              </article>
            </div>
          </article>
        </section>

        <RegionalCoverageSection
          eyebrow="Regional Coverage"
          title="Live donor and recipient coverage"
          pill="Admin totals match the live donor and request records"
          detailHeading="Country detail"
          coverageData={coverageData}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          selectedCountryData={selectedCountryData}
        />

        <section className="dashboard-grid">
          <article className="panel wide">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Testing and Release Desk</p>
                <h2>Clinical checks and approval readiness</h2>
              </div>
              <span className="data-pill">{screeningHolds.length} donor holds to review</span>
            </div>

            <div className="admin-signal-grid">
              <article className="signal-card">
                <span>Emergency crossmatch queue</span>
                <strong>{emergencyRequests}</strong>
                <small>Urgent requests waiting for immediate screening and release decisions.</small>
              </article>
              <article className="signal-card">
                <span>Donor screening holds</span>
                <strong>{donors.filter((donor) => !donor.eligible).length}</strong>
                <small>Profiles currently flagged by age, weight, illness, medication, or donation gap rules.</small>
              </article>
              <article className="signal-card">
                <span>Watch and critical stock</span>
                <strong>{inventory.filter((item) => item.status !== "Stable").length}</strong>
                <small>Blood groups requiring extra replenishment or allocation attention.</small>
              </article>
              <article className="signal-card">
                <span>Approved dispatches</span>
                <strong>{approvedRequests}</strong>
                <small>Requests already cleared and ready for final issue or delivery confirmation.</small>
              </article>
              <article className="signal-card">
                <span>New requests in 24h</span>
                <strong>{recentRequests.length}</strong>
                <small>Fresh submissions that recently entered the admin desk from the user portal.</small>
              </article>
              <article className="signal-card">
                <span>Rejected requests</span>
                <strong>{rejectedRequests}</strong>
                <small>Requests closed without issue, kept for audit and workload reporting.</small>
              </article>
            </div>

            <div className="dashboard-grid admin-review-grid">
              <div className="stack-list">
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">Emergency List</p>
                    <h2>Priority issue queue</h2>
                  </div>
                </div>
                {(emergencyQueue.length ? emergencyQueue : sortedRequests.slice(0, 4)).map((request) => (
                  <div className="tech-row" key={`urgent-${request.id}`}>
                    <span>
                      {request.hospital}
                      <br />
                      {request.bloodGroup} | {request.units} units | {request.city}, {request.country}
                    </span>
                    <strong>{request.status}</strong>
                  </div>
                ))}
              </div>

              <div className="stack-list">
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">Screening Holds</p>
                    <h2>Donor checks</h2>
                  </div>
                </div>
                {(screeningHolds.length ? screeningHolds : donors.slice(0, 4)).map((donor) => (
                  <div className="tech-row" key={`hold-${donor.id}`}>
                    <span>
                      {donor.name}
                      <br />
                      {donor.bloodGroup} | {donor.city}, {donor.country}
                    </span>
                    <strong>{donor.eligible ? "Clear" : "Review"}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Stock Editor</p>
                <h2>Update blood inventory</h2>
              </div>
            </div>

            <form className="login-form" onSubmit={handleStockSubmit}>
              <label>
                Blood Group
                <select value={selectedStockType} onChange={(event) => setSelectedStockType(event.target.value)}>
                  {inventory.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Available Units
                <input
                  required
                  min="0"
                  type="number"
                  value={stockValues.units}
                  onChange={(event) => setStockValues((current) => ({ ...current, units: event.target.value }))}
                />
              </label>
              <label>
                Reserved Units
                <input
                  required
                  min="0"
                  type="number"
                  value={stockValues.reserved}
                  onChange={(event) => setStockValues((current) => ({ ...current, reserved: event.target.value }))}
                />
              </label>
              <button className="primary-btn full" type="submit" disabled={inventoryBusy || !selectedInventoryItem}>
                <Icon label="S" /> {inventoryBusy ? "Saving..." : "Save Inventory Update"}
              </button>
            </form>

            <div className="stack-list compact-top">
              {criticalStock.length ? (
                criticalStock.map((item) => (
                  <div className="tech-row" key={`critical-${item.type}`}>
                    <span>
                      {item.type} monitoring
                      <br />
                      {item.units} available | {item.reserved} reserved
                    </span>
                    <strong className={getInventoryToneClass(item.status)}>{item.status}</strong>
                  </div>
                ))
              ) : (
                <div className="tech-row">
                  <span>All inventory groups</span>
                  <strong className="status-good">Stable</strong>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Inventory Watch</p>
              <h2>Admin stock visibility by blood group</h2>
            </div>
          </div>

          <div className="inventory-grid">
            {inventory.map((item) => (
              <article className="inventory-card" key={item.type}>
                <div>
                  <p>{item.type}</p>
                  <span className={getInventoryToneClass(item.status)}>{item.status}</span>
                </div>
                <strong>{item.units}</strong>
                <small>{item.reserved} units reserved</small>
                <small>Available now for approvals</small>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-grid">
          <article className="panel wide">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Approval Queue</p>
                <h2>Approve and complete blood requests</h2>
              </div>
              <span className="data-pill">{sortedRequests.length} tracked requests</span>
            </div>

            <div className="request-grid">
              {sortedRequests.map((request) => (
                <article className="request-card" key={request.id}>
                  <div className="request-topline">
                    <div>
                      <strong>{request.hospital}</strong>
                      <span>{request.patient}</span>
                    </div>
                    <StatusChip status={request.status} />
                  </div>

                  <div className="request-meta">
                    <b>{request.bloodGroup}</b>
                    <span>{request.units} units</span>
                    <em>{request.urgency}</em>
                  </div>

                  <p>{formatLocation(request)}</p>

                  <div className="request-source">
                    <span>Requested by: {request.requestedByName || "Hospital intake desk"}</span>
                    <span>Submitted: {formatDateTime(request.createdAt)}</span>
                  </div>

                  <div className="chip-list">
                    <span className="state-chip">Request ID: {request.id}</span>
                    <span className="state-chip">ETA: {request.eta}</span>
                    {request.requestedByEmail ? <span className="state-chip">{request.requestedByEmail}</span> : null}
                    {isFreshRequest(request) ? <span className="state-chip info">New</span> : null}
                  </div>

                  <div className="request-actions">
                    {request.status === "Pending" ? (
                      <>
                        <button
                          className="primary-btn small"
                          type="button"
                          disabled={requestBusyId === request.id}
                          onClick={() => onRequestAction(request.id, "Approved")}
                        >
                          <Icon label="A" /> Approve
                        </button>
                        <button
                          className="danger-btn small"
                          type="button"
                          disabled={requestBusyId === request.id}
                          onClick={() => onRequestAction(request.id, "Rejected")}
                        >
                          <Icon label="R" /> Reject
                        </button>
                      </>
                    ) : null}

                    {request.status === "Approved" ? (
                      <>
                        <button
                          className="secondary-btn small"
                          type="button"
                          disabled={requestBusyId === request.id}
                          onClick={() => onRequestAction(request.id, "Completed")}
                        >
                          <Icon label="C" /> Complete
                        </button>
                        <button
                          className="danger-btn small"
                          type="button"
                          disabled={requestBusyId === request.id}
                          onClick={() => onRequestAction(request.id, "Rejected")}
                        >
                          <Icon label="R" /> Reject
                        </button>
                      </>
                    ) : request.status === "Completed" ? (
                      <span className="state-chip success">Fulfilled</span>
                    ) : request.status === "Rejected" ? (
                      <span className="state-chip alert">Rejected</span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Recent Donors</p>
                <h2>Latest donor entries</h2>
              </div>
            </div>
            <div className="stack-list">
              {latestDonors.map((donor) => (
                <div className="tech-row" key={donor.id}>
                  <span>
                    {donor.name}
                    <br />
                    {donor.city}, {donor.country}
                  </span>
                  <strong>{donor.bloodGroup}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

function RegionalCoverageSection({
  eyebrow,
  title,
  pill,
  detailHeading,
  coverageData,
  selectedCountry,
  setSelectedCountry,
  selectedCountryData,
}) {
  return (
    <section className="dashboard-grid">
      <article className="panel wide">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <span className="data-pill">{pill}</span>
        </div>

        <div className="coverage-toolbar">
          <label>
            Focus country
            <select
              value={selectedCountryData?.country || ""}
              onChange={(event) => setSelectedCountry(event.target.value)}
              disabled={!coverageData.length}
            >
              {coverageData.map((entry) => (
                <option key={entry.country} value={entry.country}>
                  {entry.country}
                </option>
              ))}
            </select>
          </label>
          <div className="mini-stat-grid compact">
            <article className="mini-stat-card">
              <span>Countries</span>
              <strong>{coverageData.length}</strong>
            </article>
            <article className="mini-stat-card">
              <span>States</span>
              <strong>{coverageData.reduce((sum, entry) => sum + entry.states.length, 0)}</strong>
            </article>
          </div>
        </div>

        <div className="coverage-list">
          {coverageData.length ? (
            coverageData.map((entry) => (
              <button
                key={entry.country}
                className={`coverage-row ${selectedCountryData?.country === entry.country ? "active" : ""}`}
                type="button"
                onClick={() => setSelectedCountry(entry.country)}
              >
                <div className="coverage-row-head">
                  <strong>{entry.country}</strong>
                  <span>{entry.states.length} states or provinces tracked</span>
                </div>
                <div className="coverage-kpi">
                  <span>Donors</span>
                  <strong>{entry.donors}</strong>
                </div>
                <div className="coverage-kpi">
                  <span>Recipients</span>
                  <strong>{entry.recipients}</strong>
                </div>
                <div className="coverage-kpi">
                  <span>Units</span>
                  <strong>{entry.requestedUnits}</strong>
                </div>
                <div className="coverage-kpi">
                  <span>Eligible</span>
                  <strong>{entry.eligibleDonors}</strong>
                </div>
              </button>
            ))
          ) : (
            <p className="muted-copy">No live regional coverage data is available yet.</p>
          )}
        </div>
      </article>

      <article className="panel">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">{detailHeading}</p>
            <h2>{selectedCountryData ? selectedCountryData.country : "No live country data yet"}</h2>
          </div>
        </div>

        {selectedCountryData ? (
          <>
            <div className="country-summary-grid">
              <div className="country-summary-card">
                <span>Donors</span>
                <strong>{selectedCountryData.donors}</strong>
              </div>
              <div className="country-summary-card">
                <span>Recipients</span>
                <strong>{selectedCountryData.recipients}</strong>
              </div>
              <div className="country-summary-card">
                <span>Units Requested</span>
                <strong>{selectedCountryData.requestedUnits}</strong>
              </div>
              <div className="country-summary-card">
                <span>Eligible Donors</span>
                <strong>{selectedCountryData.eligibleDonors}</strong>
              </div>
            </div>

            <div className="state-list">
              {selectedCountryData.states.map((stateEntry) => (
                <div className="state-row" key={`${selectedCountryData.country}-${stateEntry.state}`}>
                  <div>
                    <strong>{stateEntry.state}</strong>
                    <span>{stateEntry.cities.join(", ") || "No cities logged yet"}</span>
                  </div>
                  <small>{stateEntry.donors} donors</small>
                  <small>{stateEntry.recipients} recipients</small>
                  <small>{stateEntry.requestedUnits} units</small>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="muted-copy">No live donor or request locations are available yet.</p>
        )}
      </article>
    </section>
  );
}

function Brand({ title, subtitle, badge }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Icon label={badge} />
      </span>
      <div>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

function PortalNavigation({ currentPage, openPage }) {
  return (
    <div className="nav-links">
      <button
        className={`nav-button ${currentPage === pages.login ? "active" : ""}`}
        type="button"
        onClick={() => openPage(pages.login)}
      >
        Login
      </button>
      <button
        className={`nav-button ${currentPage === pages.users ? "active" : ""}`}
        type="button"
        onClick={() => openPage(pages.users)}
      >
        User Portal
      </button>
      <button
        className={`nav-button ${currentPage === pages.admin ? "active" : ""}`}
        type="button"
        onClick={() => openPage(pages.admin)}
      >
        Admin Portal
      </button>
    </div>
  );
}

function StatusStack({ loading, errorMessage, notice }) {
  return (
    <section className="notice-stack" aria-live="polite">
      <div className={`notice-banner ${errorMessage ? "warning" : "info"}`}>
        {loading
          ? "Syncing donor, request, and inventory data from MongoDB."
          : errorMessage || "Connected to BloodCare API and MongoDB."}
      </div>
      {notice ? <div className="notice-banner success">{notice}</div> : null}
    </section>
  );
}

function Metric({ icon, label, value, tone }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </article>
  );
}

function StatusChip({ status }) {
  return <span className={`status-chip status-${String(status || "").toLowerCase()}`}>{status}</span>;
}

function Icon({ label }) {
  return (
    <span className="icon-badge" aria-hidden="true">
      {label}
    </span>
  );
}

function getInventoryToneClass(status) {
  if (status === "Critical") return "status-critical";
  if (status === "Watch") return "status-watch";
  return "status-good";
}

export default App;
