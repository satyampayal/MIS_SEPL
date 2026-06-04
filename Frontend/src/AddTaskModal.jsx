// import React, { useState } from "react";
// import { X } from "lucide-react";
// import { useTasks } from "./Context/TaskContext";

// export default function AddTaskModal({
//   isOpen,
//   onClose,
//   mode = "personal",
//   users = [],
//   onRefreshTasks
// }) {
//   const { createPersonalTask, assignTask } = useTasks();

//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     assignedTo: "",
//     priority: "medium",
//     dueDate: ""
//   });

//   if (!isOpen) return null;

//   const isAssignMode = mode === "assign";

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.title || !formData.dueDate) {
//       alert("Title and due date are required");
//       return;
//     }

//     if (isAssignMode && !formData.assignedTo) {
//       alert("Please select user");
//       return;
//     }

//     if (isAssignMode) {
//       await assignTask(formData);
//     } else {
//       await createPersonalTask({
//         title: formData.title,
//         description: formData.description,
//         priority: formData.priority,
//         dueDate: formData.dueDate
//       });
//     }

//     setFormData({
//       title: "",
//       description: "",
//       assignedTo: "",
//       priority: "medium",
//       dueDate: ""
//     });

    
//     onRefreshTasks();
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
//       <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
//         <div className="flex items-center justify-between border-b px-6 py-4">
//           <h2 className="text-lg font-bold text-gray-800">
//             {isAssignMode ? "Assign New Task" : "Add Personal Task"}
//           </h2>

//           <button
//             onClick={onClose}
//             className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4 p-6">
//           <div>
//             <label className="mb-1 block text-sm font-semibold text-gray-700">
//               Task Title
//             </label>
//             <input
//               name="title"
//               value={formData.title}
//               onChange={handleChange}
//               placeholder="Enter task title"
//               className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block text-sm font-semibold text-gray-700">
//               Description
//             </label>
//             <textarea
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               rows="3"
//               placeholder="Enter task details"
//               className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
//             />
//           </div>

//           {isAssignMode && (
//             <div>
//               <label className="mb-1 block text-sm font-semibold text-gray-700">
//                 Assign To
//               </label>
//               <select
//                 name="assignedTo"
//                 value={formData.assignedTo}
//                 onChange={handleChange}
//                 className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
//               >
//                 <option value="">Select User</option>
//                 {users.map((user) => (
//                   <option key={user._id} value={user._id}>
//                     {user.fullName || user.name} - {user.role}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}

//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//             <div>
//               <label className="mb-1 block text-sm font-semibold text-gray-700">
//                 Priority
//               </label>
//               <select
//                 name="priority"
//                 value={formData.priority}
//                 onChange={handleChange}
//                 className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
//               >
//                 <option value="low">Low</option>
//                 <option value="medium">Medium</option>
//                 <option value="high">High</option>
//                 <option value="urgent">Urgent</option>
//               </select>
//             </div>

//             <div>
//               <label className="mb-1 block text-sm font-semibold text-gray-700">
//                 Due Date
//               </label>
//               <input
//                 type="date"
//                 name="dueDate"
//                 value={formData.dueDate}
//                 onChange={handleChange}
//                 className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
//               />
//             </div>
//           </div>

//           <div className="flex justify-end gap-3 pt-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="rounded-xl border px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
//             >
//               {isAssignMode ? "Assign Task" : "Add Task"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }