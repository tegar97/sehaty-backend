exports.getAllUsers = (req, res) => {
  res.status(200).json({ message: "Get all users2" });
};

exports.getUserById = (req, res) => {
  const userId = req.params.id;
  res.status(200).json({ message: `Get user with ID: ${userId}` });
};
