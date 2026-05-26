import axios from "axios";
import BASE_URL from "../../config/api";

const API = `${BASE_URL}/task`;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const assignTaskApi = (data) => {
  return axios.post(`${API}/assign`, data, getAuthConfig());
};

export const createPersonalTaskApi = (data) => {
  return axios.post(`${API}/personal`, data, getAuthConfig());
};

export const getMyTasksApi = () => {
  return axios.get(`${API}/my-tasks`, getAuthConfig());
};

export const getAllTasksApi = () => {
  return axios.get(`${API}/all`, getAuthConfig());
};

export const updateTaskStatusApi = (id, data) => {
  return axios.patch(`${API}/status/${id}`, data, getAuthConfig());
};

export const deleteTaskApi = (id) => {
  return axios.delete(`${API}/delete/${id}`, getAuthConfig());
};