const mongoose = require("mongoose");

const bloodRequestSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    patient: {
      type: String,
      required: true,
      trim: true,
    },
    hospital: {
      type: String,
      required: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      trim: true,
    },
    units: {
      type: Number,
      required: true,
      min: 1,
    },
    urgency: {
      type: String,
      required: true,
      enum: ["Routine", "High", "Emergency"],
      default: "High",
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
    },
    eta: {
      type: String,
      required: true,
      trim: true,
    },
    requestedByName: {
      type: String,
      default: null,
      trim: true,
    },
    requestedByEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.BloodRequest || mongoose.model("BloodRequest", bloodRequestSchema);
