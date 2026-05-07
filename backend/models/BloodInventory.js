const mongoose = require("mongoose");

const bloodInventorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    units: {
      type: Number,
      required: true,
      min: 0,
    },
    reserved: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["Stable", "Watch", "Critical"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

bloodInventorySchema.pre("validate", function syncBloodGroupFields() {
  if (!this.type && this.bloodGroup) {
    this.type = this.bloodGroup;
  }

  if (!this.bloodGroup && this.type) {
    this.bloodGroup = this.type;
  }
});

module.exports =
  mongoose.models.BloodInventory || mongoose.model("BloodInventory", bloodInventorySchema);
