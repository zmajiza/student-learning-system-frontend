export const getRole = () =>
  (localStorage.getItem("role") || "").toLowerCase();

export const isAdmin = () => getRole() === "admin";
export const isStudent = () => getRole() === "student";