const { users, bloodInventory, locationCatalog, donors, bloodRequests } = require("./store");
const User = require("../models/User");
const BloodInventory = require("../models/BloodInventory");
const LocationCatalog = require("../models/LocationCatalog");
const Donor = require("../models/Donor");
const BloodRequest = require("../models/BloodRequest");

async function ensureSeedData() {
  await seedCollection(User, users);
  await seedCollection(BloodInventory, bloodInventory);
  await seedCollection(
    LocationCatalog,
    Object.entries(locationCatalog).map(([country, states]) => ({ country, states }))
  );
  await seedCollection(Donor, donors);
  await seedCollection(BloodRequest, bloodRequests);
}

async function resetAndSeedData() {
  await Promise.all([
    User.deleteMany({}),
    BloodInventory.deleteMany({}),
    LocationCatalog.deleteMany({}),
    Donor.deleteMany({}),
    BloodRequest.deleteMany({}),
  ]);

  await ensureSeedData();
}

async function seedCollection(Model, documents) {
  const count = await Model.countDocuments();

  if (count > 0) {
    return;
  }

  await Model.insertMany(documents);
}

module.exports = {
  ensureSeedData,
  resetAndSeedData,
};
