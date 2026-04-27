import React, { useState } from "react";



import { Trash2, Plus } from "lucide-react";

export default function MultiItemExcelEntryUI() {
  const [selectedDate, setSelectedDate] = useState("");
  const [items, setItems] = useState([
    { description: "", qty: "" }
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addRow = () => {
    setItems([...items, { description: "", qty: "" }]);
  };

  const removeRow = (index) => {
    if (items.length === 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate) {
      setMessage("Please select a date");
      return;
    }

    const validItems = items.filter(
      (item) => item.description.trim() && item.qty
    );

    if (validItems.length === 0) {
      setMessage("Please enter at least one item");
      return;
    }

    const formatDate = (inputDate) => {
  const [year, day, month] = inputDate.split("-");
  return `${month}-${day}-${year}`;
};
    const payload = {
      date:formatDate(selectedDate),
      items: validItems,
    };

    console.log("Payload:", payload);

    try {
      setLoading(true);
      setMessage("");

      // Replace with your backend API
      await fetch("http://localhost:5000/add-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setTimeout(() => {
        setMessage("Items submitted successfully 🚀");
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-2xl shadow-sm border border-gray-200 bg-white">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">
              Excel Item Entry Tool
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter multiple items for one selected date
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Date
                </label>
                <input className="w-full border rounded-lg px-3 py-2"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                  >
                    <div className="md:col-span-7">
                      <input className="w-full border rounded-lg px-3 py-2"
                        placeholder="Enter Item Description"
                        value={item.description}
                        onChange={(e) =>
                          handleChange(index, "description", e.target.value)
                        }
                      />
                    </div>

                    <div className="md:col-span-3">
                      <input className="w-full border rounded-lg px-3 py-2"
                        type="number"
                        placeholder="Quantity"
                        value={item.qty}
                        onChange={(e) =>
                          handleChange(index, "qty", e.target.value)
                        }
                      />
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                      <button
                        type="button"
                        variant="outline"
                        onClick={addRow}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        variant="outline"
                        onClick={() => removeRow(index)}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl px-8"
                >
                  {loading ? "Submitting..." : "Submit Items"}
                </button>
              </div>

              {message && (
                <p className="text-sm font-medium pt-2">{message}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
