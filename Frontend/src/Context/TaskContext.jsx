// context/TaskContext.jsx
import { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";
import {
  assignTaskApi,
  createPersonalTaskApi,
  getMyTasksApi,
  getAllTasksApi,
  updateTaskStatusApi,
  deleteTaskApi
} from "../Services/taskServices";

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [myTasks, setMyTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await getMyTasksApi();
      setMyTasks(res.data.tasks || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      const res = await getAllTasksApi();
      setAllTasks(res.data.tasks || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load all tasks");
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (data) => {
    try {
      const res = await assignTaskApi(data);
      toast.success("Task assigned successfully");
      fetchAllTasks();
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Task assign failed");
    }
  };

  const createPersonalTask = async (data) => {
    try {
      const res = await createPersonalTaskApi(data);
      toast.success("Task created");
      fetchMyTasks();
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Task creation failed");
    }
  };

  const updateTaskStatus = async (id, data) => {
    try {
      await updateTaskStatusApi(id, data);
      toast.success("Task updated");
      fetchMyTasks();
      fetchAllTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update failed");
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteTaskApi(id);
      toast.success("Task deleted");
      fetchMyTasks();
      fetchAllTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <TaskContext.Provider
      value={{
        myTasks,
        allTasks,
        loading,
        fetchMyTasks,
        fetchAllTasks,
        assignTask,
        createPersonalTask,
        updateTaskStatus,
        deleteTask
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);