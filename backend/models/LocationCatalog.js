const mongoose = require("mongoose");

const locationCatalogSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    states: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.LocationCatalog || mongoose.model("LocationCatalog", locationCatalogSchema);
