// services/taskService.js
import axios from "axios";

const API = import.meta.env.VITE_API_URL|| 'http://localhost:5000';

const getToken = () => localStorage.getItem("token");

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`
  }
});

export const assignTaskApi = (data) =>
  axios.post(`${API}/api/tasks/assign`, data, authHeader());

export const createPersonalTaskApi = (data) =>
  axios.post(`${API}/api/tasks/personal`, data, authHeader());

export const getMyTasksApi = () =>
  axios.get(`${API}/api/tasks/my-tasks`, authHeader());

export const getAllTasksApi = () =>
  axios.get(`${API}/api/tasks/all`, authHeader());

export const updateTaskStatusApi = (id, data) =>
  axios.put(`${API}/api/tasks/status/${id}`, data, authHeader());

export const updateTaskApi = (id, data) =>
  axios.put(`${API}/api/tasks/${id}`, data, authHeader());

export const deleteTaskApi = (id) =>
  axios.delete(`${API}/api/tasks/${id}`, authHeader());