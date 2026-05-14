const MasterStore = require('../model/masterStore'); // Assuming you have a MasterStore model

// Create a new Master Store
exports.createMasterStore = async (req, res) => {
  try {
    const {
      storeName,
      storeType,
      location,
      storeIncharge,
      contactNumber,
      storeCode,
      associtedSite
    } = req.body;

    if (
      !storeName ||
      !storeType ||
      !location ||
      !storeIncharge ||
      !contactNumber ||
      !storeCode
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    const existingStore = await MasterStore.findOne({
      storeCode
    });

    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: "Store code already exists"
      });
    }

    const masterStore = await MasterStore.create({
      storeName,
      storeType,
      location,
      storeIncharge,
      contactNumber,
      storeCode,
      associtedSite
    });

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: masterStore
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all Master Stores
exports.getAllMasterStores = async (req, res) => {
    try {
        const masterStores = await MasterStore.find();
        res.status(200).json({
            success:true,
            data:masterStores   
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single Master Store by ID
exports.getMasterStoreById = async (req, res) => {
    try {
        const masterStore = await MasterStore.findById(req.params.id);
        if (!masterStore) {
            return res.status(404).json({ error: 'Master Store not found' });
        }
        res.status(200).json({
            success:true,
            data:masterStore
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a Master Store by ID
exports.updateMasterStore = async (req, res) => {
    try {
        const masterStore = await MasterStore.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!masterStore) {
            return res.status(404).json({ error: 'Master Store not found' });
        }
        res.status(200).json(masterStore);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a Master Store by ID
exports.deleteMasterStore = async (req, res) => {
    try {
        const masterStore = await MasterStore.findByIdAndDelete(req.params.id);
        if (!masterStore) {
            return res.status(404).json({ error: 'Master Store not found' });
        }
        res.status(200).json({ message: 'Master Store deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};