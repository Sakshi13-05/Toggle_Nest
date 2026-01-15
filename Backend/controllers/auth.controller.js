export const verifyUser = async (req, res) => {
  res.status(200).json({
    message: "User verified successfully",
    user: req.user,
  });
};
