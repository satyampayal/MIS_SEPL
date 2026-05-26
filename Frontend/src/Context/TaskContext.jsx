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
      toast.error(error.response?.data?.message || "Failed to load my tasks");
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

  const refreshTasks = async (role) => {
    await fetchMyTasks();

    if (["Super Admin", "Admin"].includes(role)) {
      await fetchAllTasks();
    }
  };

  const assignTask = async (data) => {
    try {
      setLoading(true);
      const res = await assignTaskApi(data);

      toast.success("Task assigned successfully");

      await fetchAllTasks();

      return {
        success: true,
        data: res.data
      };
    } catch (error) {
      toast.error(error.response?.data?.message || "Task assign failed");

      return {
        success: false
      };
    } finally {
      setLoading(false);
    }
  };

  const createPersonalTask = async (data) => {
    try {
      setLoading(true);
      const res = await createPersonalTaskApi(data);

      toast.success("Task created successfully");

      await fetchMyTasks();

      return {
        success: true,
        data: res.data
      };
    } catch (error) {
      toast.error(error.response?.data?.message || "Task creation failed");

      return {
        success: false
      };
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id, data, role) => {
    try {
      setLoading(true);

      const res = await updateTaskStatusApi(id, data);

      toast.success("Task updated");

      await fetchMyTasks();

      if (["Super Admin", "Admin"].includes(role)) {
        await fetchAllTasks();
      }

      return {
        success: true,
        data: res.data
      };
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update failed");

      return {
        success: false
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id, role) => {
    try {
      setLoading(true);

      const res = await deleteTaskApi(id);

      toast.success("Task deleted");

      await fetchMyTasks();

      if (["Super Admin", "Admin"].includes(role)) {
        await fetchAllTasks();
      }

      return {
        success: true,
        data: res.data
      };
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");

      return {
        success: false
      };
    } finally {
      setLoading(false);
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
        refreshTasks,

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