import User from "../models/User.js";

export const updateOnboarding = async (req, res) => {
    const {
        email,
        role,
        position,
        teamName,
        teamSize,
        projectName,
        jobFunction
    } = req.body;

    try {
        // Find user by email and update, or create if doesn't exist (upsert)
        // We assume the email comes from the authenticated frontend user
        const updatedUser = await User.findOneAndUpdate(
            { email },
            {
                role,
                position,
                teamName,
                teamSize,
                projectName,
                jobFunction, // mapped from frontend
                onboardingComplete: true
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            message: "Onboarding completed successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Onboarding Error:", error);
        res.status(500).json({ message: "Server error updating onboarding data" });
    }
};
