import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['Admin', 'Member'] }, // Capitalized to match frontend state
    position: String,
    teamName: String,
    teamSize: String,
    projectName: String,
    jobFunction: String, // Matches 'jobFunction' in frontend state
    onboardingComplete: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
