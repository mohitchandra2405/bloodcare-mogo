const express = require("express");
const BloodInventory = require("../models/BloodInventory");
const BloodRequest = require("../models/BloodRequest");
const Donor = require("../models/Donor");
const LocationCatalog = require("../models/LocationCatalog");

const router = express.Router();
const requestStatusOrder = {
  Pending: 0,
  Approved: 1,
  Completed: 2,
  Rejected: 3,
};
const bloodGroupOrder = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

router.get("/summary", async (req, res, next) => {
  try {
    const [inventory, requests, donors] = await Promise.all([
      BloodInventory.find().lean(),
      BloodRequest.find().lean(),
      Donor.find().lean(),
    ]);

    const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0);
    const reservedUnits = inventory.reduce((sum, item) => sum + item.reserved, 0);
    const criticalGroups = inventory.filter((item) => item.status === "Critical").length;
    const activeRequests = requests.filter((request) => ["Pending", "Approved"].includes(request.status)).length;
    const trackedCountries = new Set(
      [...donors.map((donor) => donor.country), ...requests.map((request) => request.country)].filter(Boolean)
    ).size;
    const trackedStates = new Set(
      [...donors, ...requests].map((entry) => `${entry.country || "Unknown"}:${entry.state || "Unknown"}`)
    ).size;
    const eligibleDonors = donors.filter((donor) => donor.eligible).length;

    res.json({
      totalUnits,
      reservedUnits,
      criticalGroups,
      activeRequests,
      donorCount: donors.length,
      eligibleDonors,
      requestCount: requests.length,
      trackedCountries,
      trackedStates,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/inventory", async (req, res, next) => {
  try {
    const inventory = await BloodInventory.find().lean();
    res.json(sortInventory(inventory.map(serializeInventory)));
  } catch (error) {
    next(error);
  }
});

router.get("/locations", async (req, res, next) => {
  try {
    const locations = await LocationCatalog.find().sort({ country: 1 }).lean();
    const sortedCatalog = Object.fromEntries(
      locations.map((location) => [
        location.country,
        [...location.states].sort((left, right) => left.localeCompare(right)),
      ])
    );

    res.json(sortedCatalog);
  } catch (error) {
    next(error);
  }
});

router.patch("/inventory/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const inventoryItem = await BloodInventory.findOne({
      $or: [{ type }, { bloodGroup: type }],
    });

    if (!inventoryItem) {
      return res.status(404).json({ message: "Blood group not found." });
    }

    const units = Number(req.body.units);
    const reserved = Number(req.body.reserved);

    if (Number.isFinite(units)) {
      inventoryItem.units = Math.max(0, units);
    }

    if (Number.isFinite(reserved)) {
      inventoryItem.reserved = Math.max(0, reserved);
    }

    inventoryItem.status = getInventoryStatus(inventoryItem.units);
    await inventoryItem.save();

    return res.json(serializeInventory(inventoryItem.toObject()));
  } catch (error) {
    next(error);
  }
});

router.get("/donors", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const donorQuery = search
      ? {
          $or: ["name", "bloodGroup", "city", "state", "country", "phone"].map((field) => ({
            [field]: { $regex: escapeRegex(search), $options: "i" },
          })),
        }
      : {};

    const donors = await Donor.find(donorQuery).sort({ createdAt: -1, _id: -1 }).lean();
    res.json(donors);
  } catch (error) {
    next(error);
  }
});

router.post("/donors", async (req, res, next) => {
  try {
    const { name, age, bloodGroup, country, state, city, phone, weight, hasRecentIllness, onMedication, lastDonation } =
      req.body;

    if (!name || !age || !bloodGroup || !country || !state || !city || !phone || !weight) {
      return res.status(400).json({
        message: "Name, age, blood group, country, state, city, phone, and weight are required.",
      });
    }

    const ageValue = Number(age);
    const weightValue = Number(weight);
    const recentIllness = hasRecentIllness === true || String(hasRecentIllness).toLowerCase() === "yes";
    const medication = onMedication === true || String(onMedication).toLowerCase() === "yes";
    const eligible = isDonorEligible({
      age: ageValue,
      weight: weightValue,
      hasRecentIllness: recentIllness,
      onMedication: medication,
      lastDonation,
    });

    const donor = await Donor.create({
      id: `DN-${Date.now()}`,
      name,
      age: ageValue,
      bloodGroup,
      country,
      state,
      city,
      phone,
      weight: weightValue,
      hasRecentIllness: recentIllness,
      onMedication: medication,
      lastDonation: lastDonation || "Not donated yet",
      eligible,
      donationHistory: lastDonation
        ? [{ date: lastDonation, location: `${city} BloodCare Register`, units: 1 }]
        : [],
    });

    return res.status(201).json(donor.toObject());
  } catch (error) {
    next(error);
  }
});

router.get("/requests", async (req, res, next) => {
  try {
    const requests = await BloodRequest.find().sort({ createdAt: -1, _id: -1 }).lean();
    res.json(requests);
  } catch (error) {
    next(error);
  }
});

router.post("/requests", async (req, res, next) => {
  try {
    const { patient, hospital, bloodGroup, units, urgency, country, state, city, requestedByName, requestedByEmail } =
      req.body;

    if (!patient || !hospital || !bloodGroup || !units || !country || !state || !city) {
      return res.status(400).json({
        message: "Patient, hospital, blood group, units, country, state, and city are required.",
      });
    }

    const request = await BloodRequest.create({
      id: `RQ-${Date.now()}`,
      patient,
      hospital,
      bloodGroup,
      units: Number(units),
      urgency: urgency || "High",
      country,
      state,
      city,
      status: "Pending",
      eta: urgency === "Emergency" ? "15 min" : "Today",
      requestedByName: requestedByName || null,
      requestedByEmail: requestedByEmail || null,
    });

    return res.status(201).json(request.toObject());
  } catch (error) {
    next(error);
  }
});

router.patch("/requests/:id/status", async (req, res, next) => {
  try {
    const request = await BloodRequest.findOne({ id: req.params.id });

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    const result = await applyRequestStatusChange(request, req.body.status);
    if (result.error) {
      return res.status(result.statusCode).json({ message: result.error });
    }

    return res.json(result.payload);
  } catch (error) {
    next(error);
  }
});

router.patch("/requests/:id/fulfill", async (req, res, next) => {
  try {
    const request = await BloodRequest.findOne({ id: req.params.id });

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    const result = await applyRequestStatusChange(request, "Completed");
    if (result.error) {
      return res.status(result.statusCode).json({ message: result.error });
    }

    return res.json(result.payload);
  } catch (error) {
    next(error);
  }
});

function getInventoryStatus(units) {
  if (units <= 10) return "Critical";
  if (units <= 18) return "Watch";
  return "Stable";
}

function normalizeRequestStatus(value) {
  return ["Pending", "Approved", "Rejected", "Completed"].find(
    (entry) => entry.toLowerCase() === String(value || "").toLowerCase()
  );
}

function isDonorEligible({ age, weight, hasRecentIllness, onMedication, lastDonation }) {
  if (!Number.isFinite(age) || age < 18 || age > 65) {
    return false;
  }

  if (!Number.isFinite(weight) || weight < 50) {
    return false;
  }

  if (hasRecentIllness || onMedication) {
    return false;
  }

  if (!lastDonation || lastDonation === "Not donated yet") {
    return true;
  }

  const lastDonationDate = new Date(lastDonation);
  if (Number.isNaN(lastDonationDate.getTime())) {
    return true;
  }

  const elapsedDays = Math.floor((Date.now() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24));
  return elapsedDays >= 90;
}

async function applyRequestStatusChange(request, requestedStatus) {
  const status = normalizeRequestStatus(requestedStatus);
  if (!status) {
    return {
      error: "Status must be Pending, Approved, Rejected, or Completed.",
      statusCode: 400,
    };
  }

  if (request.status === status) {
    const inventory = await BloodInventory.findOne({
      $or: [{ type: request.bloodGroup }, { bloodGroup: request.bloodGroup }],
    }).lean();
    return {
      payload: {
        request: request.toObject(),
        inventory: inventory ? serializeInventory(inventory) : null,
      },
    };
  }

  if (["Completed", "Rejected"].includes(request.status)) {
    return {
      error: "Closed requests cannot be changed.",
      statusCode: 400,
    };
  }

  const allowedTransitions = {
    Pending: ["Approved", "Rejected"],
    Approved: ["Completed", "Rejected"],
  };

  if (!(allowedTransitions[request.status] || []).includes(status)) {
    return {
      error: "This request cannot move to the selected status.",
      statusCode: 400,
    };
  }

  const inventoryItem = await BloodInventory.findOne({
    $or: [{ type: request.bloodGroup }, { bloodGroup: request.bloodGroup }],
  });
  if (!inventoryItem) {
    return {
      error: "Blood group inventory not found.",
      statusCode: 404,
    };
  }

  const availableUnits = Math.max(0, Number(inventoryItem.units || 0) - Number(inventoryItem.reserved || 0));

  if (request.status === "Pending" && status === "Approved") {
    if (availableUnits < request.units) {
      return {
        error: "Not enough available units to approve this request.",
        statusCode: 400,
      };
    }

    inventoryItem.reserved += request.units;
  }

  if (request.status === "Approved" && status === "Completed") {
    inventoryItem.reserved = Math.max(0, inventoryItem.reserved - request.units);
    inventoryItem.units = Math.max(0, inventoryItem.units - request.units);
  }

  if (request.status === "Approved" && status === "Rejected") {
    inventoryItem.reserved = Math.max(0, inventoryItem.reserved - request.units);
  }

  inventoryItem.status = getInventoryStatus(inventoryItem.units);
  request.status = status;
  request.eta =
    status === "Approved" ? "Reserved" : status === "Rejected" ? "Rejected" : status === "Completed" ? "Completed" : request.eta;

  await Promise.all([inventoryItem.save(), request.save()]);

  return {
    payload: {
      request: request.toObject(),
      inventory: serializeInventory(inventoryItem.toObject()),
    },
  };
}

function sortInventory(inventory) {
  return [...inventory].sort(
    (left, right) => bloodGroupOrder.indexOf(left.type) - bloodGroupOrder.indexOf(right.type)
  );
}

function serializeInventory(entry) {
  return {
    ...entry,
    type: entry.type || entry.bloodGroup,
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = router;
