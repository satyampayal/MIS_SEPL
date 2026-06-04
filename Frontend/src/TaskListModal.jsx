// import React, { useState } from "react";
// import {
//   X,
//   CheckCircle,
//   Clock,
//   AlertTriangle,
//   Eye,
//   CalendarDays,
//   User,
//   Plus
// } from "lucide-react";
// import { useTasks } from "./Context/TaskContext";
// import AddTaskModal from "./AddTaskModal";

// export default function TaskListModal({
//   isOpen,
//   onClose,
//   tasks = [],
//   type = "tasks",
//   onAddTask,
//   onRefreshTasks
// }) {
//   const { updateTaskStatus } = useTasks();

//   const [selectedTask, setSelectedTask] = useState(null);
//   const [remarks, setRemarks] = useState("");

//   if (!isOpen) return null;

//   const getTitle = () => {
//     switch (type) {
//       case "pending":
//         return "Pending Tasks";
//       case "overdue":
//         return "Overdue Tasks";
//       case "completed":
//         return "Completed Today";
//       case "urgent":
//         return "Urgent Tasks";
//       case "today":
//         return "Today's Tasks";
//       default:
//         return "Task List";
//     }
//   };

//   const getPriorityClass = (priority) => {
//     switch (priority) {
//       case "urgent":
//         return "bg-red-100 text-red-700";
//       case "high":
//         return "bg-orange-100 text-orange-700";
//       case "medium":
//         return "bg-blue-100 text-blue-700";
//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   const getStatusClass = (status) => {
//     switch (status) {
//       case "completed":
//         return "bg-green-100 text-green-700";
//       case "in_progress":
//         return "bg-purple-100 text-purple-700";
//       case "hold":
//         return "bg-yellow-100 text-yellow-700";
//       case "cancelled":
//         return "bg-gray-200 text-gray-700";
//       default:
//         return "bg-orange-100 text-orange-700";
//     }
//   };

//   const handleStatusUpdate = async (taskId, status) => {
//     await updateTaskStatus(taskId, {
//       status,
//       remarks
//     });
//     onRefreshTasks();
//     setSelectedTask(null);
//     setRemarks("");
//   };



//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//       <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
//         {/* Header */}

//         <div className="flex items-center justify-between border-b px-6 py-4">
//           <div>
//             <h2 className="text-xl font-bold text-gray-800">{getTitle()}</h2>
           
//             <p className="text-sm text-gray-500">
//               {tasks.length} task{tasks.length !== 1 ? "s" : ""} found
//             </p>
//           </div>
//            <button
//             onClick={onAddTask}
//             className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
//           >
//             <Plus size={16} />
//             Add Task
//           </button>

//           <button
//             onClick={onClose}
//             className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
//           >
//             <X size={22} />
//           </button>
//         </div>

//         {/* Body */}
//         <div className="max-h-[72vh] overflow-y-auto p-6">
//           {tasks.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-16 text-center">
//               <CheckCircle className="mb-3 text-green-500" size={48} />
//               <h3 className="text-lg font-semibold text-gray-800">
//                 No tasks found
//               </h3>
//               <p className="text-sm text-gray-500">
//                 Nothing pending here. Clean dashboard, clean mind.
//               </p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto rounded-xl border">
//               <table className="w-full min-w-[900px] text-left text-sm">
//                 <thead className="bg-gray-50 text-xs uppercase text-gray-500">
//                   <tr>
//                     <th className="px-4 py-3">Task</th>
//                     <th className="px-4 py-3">Assigned By</th>
//                     <th className="px-4 py-3">Priority</th>
//                     <th className="px-4 py-3">Due Date</th>
//                     <th className="px-4 py-3">Status</th>
//                     <th className="px-4 py-3 text-right">Action</th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y">
//                   {tasks.map((task) => {
//                     const isOverdue =
//                       new Date(task.dueDate) < new Date() &&
//                       task.status !== "completed";

//                     return (
//                       <tr key={task._id} className="hover:bg-gray-50">
//                         <td className="px-4 py-4">
//                           <div className="font-semibold text-gray-800">
//                             {task.title}
//                           </div>
//                           <div className="line-clamp-1 text-xs text-gray-500">
//                             {task.description || "No description"}
//                           </div>
//                         </td>

//                         <td className="px-4 py-4">
//                           <div className="flex items-center gap-2 text-gray-700">
//                             <User size={16} />
//                             {task.assignedBy?.fullName || "Self"}
//                           </div>
//                         </td>

//                         <td className="px-4 py-4">
//                           <span
//                             className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPriorityClass(
//                               task.priority
//                             )}`}
//                           >
//                             {task.priority}
//                           </span>
//                         </td>

//                         <td className="px-4 py-4">
//                           <div
//                             className={`flex items-center gap-2 ${isOverdue ? "text-red-600" : "text-gray-700"
//                               }`}
//                           >
//                             {isOverdue ? (
//                               <AlertTriangle size={16} />
//                             ) : (
//                               <CalendarDays size={16} />
//                             )}
//                             {new Date(task.dueDate).toLocaleDateString(
//                               "en-IN"
//                             )}
//                           </div>
//                         </td>

//                         <td className="px-4 py-4">
//                           <span
//                             className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
//                               task.status
//                             )}`}
//                           >
//                             {task.status?.replace("_", " ")}
//                           </span>
//                         </td>

//                         <td className="px-4 py-4">
//                           <div className="flex justify-end gap-2">
//                             <button
//                               onClick={() => {
//                                 setSelectedTask(task);
//                                 setRemarks(task.remarks || "");
//                               }}
//                               className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
//                             >
//                               <Eye size={15} />
//                               View
//                             </button>

//                             {task.status !== "completed" && (
//                               <button
//                                 onClick={() =>
//                                   handleStatusUpdate(task._id, "completed")
//                                 }
//                                 className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
//                               >
//                                 <CheckCircle size={15} />
//                                 Complete
//                               </button>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         {/* Task Detail Modal */}
//         {selectedTask && (
//           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
//             <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
//               <div className="flex items-center justify-between border-b px-6 py-4">
//                 <h3 className="text-lg font-bold text-gray-800">
//                   Task Details
//                 </h3>

//                 <button
//                   onClick={() => setSelectedTask(null)}
//                   className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>

//               <div className="space-y-4 p-6">
//                 <div>
//                   <h4 className="text-xl font-bold text-gray-900">
//                     {selectedTask.title}
//                   </h4>
//                   <p className="mt-1 text-sm text-gray-600">
//                     {selectedTask.description || "No description added."}
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                   <InfoBox
//                     label="Priority"
//                     value={selectedTask.priority}
//                   />

//                   <InfoBox
//                     label="Status"
//                     value={selectedTask.status?.replace("_", " ")}
//                   />

//                   <InfoBox
//                     label="Due Date"
//                     value={new Date(selectedTask.dueDate).toLocaleDateString(
//                       "en-IN"
//                     )}
//                   />

//                   <InfoBox
//                     label="Assigned By"
//                     value={selectedTask.assignedBy?.name || "Self"}
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-700">
//                     Remarks
//                   </label>

//                   <textarea
//                     value={remarks}
//                     onChange={(e) => setRemarks(e.target.value)}
//                     rows="3"
//                     placeholder="Add your work update..."
//                     className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
//                   />
//                 </div>

//                 <div className="flex flex-wrap justify-end gap-3 pt-2">
//                   <button
//                     onClick={() =>
//                       handleStatusUpdate(selectedTask._id, "in_progress")
//                     }
//                     className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
//                   >
//                     <Clock size={16} />
//                     Start Progress
//                   </button>

//                   <button
//                     onClick={() =>
//                       handleStatusUpdate(selectedTask._id, "hold")
//                     }
//                     className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
//                   >
//                     Hold
//                   </button>

//                   <button
//                     onClick={() =>
//                       handleStatusUpdate(selectedTask._id, "completed")
//                     }
//                     className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
//                   >
//                     <CheckCircle size={16} />
//                     Mark Complete
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
   
//     </div>
//   );
// }

// function InfoBox({ label, value }) {
//   return (
//     <div className="rounded-xl bg-gray-50 p-4">
//       <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
//       <p className="mt-1 capitalize text-gray-800">{value || "-"}</p>
//     </div>
//   );
// }