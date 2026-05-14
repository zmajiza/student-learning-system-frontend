import api from "./api";

export const getAssignments = async () => {
  const res = await api.get("/assignments");

  const data = res?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

export const createAssignment = async (data) => {
  const res = await api.post("/assignments", data);
  return res.data;
};

export const updateAssignment = async (id, data) => {
  const res = await api.put(`/assignments/${id}`, data);
  return res.data;
};

export const deleteAssignment = async (id) => {
  const res = await api.delete(`/assignments/${id}`);
  return res.data;
};