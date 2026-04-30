const  Site=require('../model/Project');

exports.addProject=async (req,res)=>{
     try {
    
        console.log("Upload started:", new Date());
        console.log("========== ADD SITE DEBUG ==========");
          console.log("BODY:", req.body);
          console.log("FILE:", req.file);
        const {
          name,
          code,
          location,
          manager,
          phone,
          startDate,
          status,
          progress,
          description
        } = req.body;
    
        // validation
        if (
          !name ||
          !code ||
          !location ||
          !manager ||
          !phone ||
          !startDate
        ) {
          return res.status(400).json({
            message: "Please fill all required fields"
          });
        }
    
        // duplicate code check
        const existingSite = await Site.findOne({ code });
    
        if (existingSite) {
          return res.status(400).json({
            message: "Site code already exists"
          });
        }
    
        // console.log("New Site Create  sai Phale")
    
        const newSite = new Site({
          name,
          code,
          location,
          manager,
          phone,
          startDate,
          status,
          progress,
          description,
          poFileUrl: req.file ? req.file.path : "",
          poFilePublicId: req.file ? req.file.filename : ""
        });
    
        // console.log("New Site Create ke Baad")
        await newSite.save();
    
        res.status(201).json({
          message: "Site added successfully 🚀",
          data: newSite
        });
    
      } catch (error) {
        console.log("Error haio bhai jii");
        console.log("Upload finished:", new Date());
        res.status(500).json({
          message: "Server Error",
          error: error.message
        });
      }
}

// get all
exports.getAllProjects=async (req,res)=>{
    try {
      const allSites = await Site.find().sort({ createdAt: -1 });
  
      res.status(200).json({
        message: "All sites fetched successfully",
        data: allSites
      });
  
    } catch (error) {
      console.log(error);
  
      res.status(500).json({
        message: "Server Error",
        error: error.message
      });
    }
}

// deleted project
exports.deleteProject=async(req,res)=>{
   try {
      const { projectId } = req.params;
  
      const deletedSite = await Site.findByIdAndDelete(projectId);
  
      if (!deletedSite) {
        return res.status(404).json({
          message: "Project not found"
        });
      }
  
      res.status(200).json({
        message: "Project deleted successfully",
        data: deletedSite
      });
  
    } catch (error) {
      console.log(error);
  
      res.status(500).json({
        message: "Server Error",
        error: error.message
      });
    }

}