const Project = require('../model/Project');
const cloudinary = require("../config/cloudinary");
const Bill=require('../model/projectBill')

const updateProjectProgress=async (projectId)=>{
  console.log("Updating project progress for projectId:", projectId);
  const projectBills=await Bill.find({project:projectId})
  const totalAmount=projectBills.reduce((acc,bill)=>acc+bill.billAmount,0);
  const project=await Project.findById(projectId);
  if(project){
    project.progress= Math.round((totalAmount / project.orderAmount) * 100,2);
    await project.save();
  }
}

const deleteFileFromCloudinary=async(publicId)=>{
  try{
    if(publicId){
      await cloudinary.uploader.destroy(publicId,{
        resource_type:"raw"
      })
    }
  }catch(error){
    console.log("Error deleting file from Cloudinary:", error);
   }
}
exports.addProject = async (req, res) => {
  try {

    const {
      name,
      code,
      location,
      manager,
      phone,
      clientName
    } = req.body;

    // validation
    if (
      !name ||
      !code ||
      !location ||
      !manager ||
      !phone ||
      !clientName
    ) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    // duplicate code check
    const existingProject = await Project.findOne({ code });

    if (existingProject) {
      return res.status(400).json({
        message: "Project  code already exists"
      });
    }

    // console.log("New Site Create  sai Phale")

    const newProject = new Project({
      name,
      code,
      location,
      manager,
      phone,
      clientName,
      poFile: req.file ? req.file.path : "",
      poFilePublicId: req.file ? req.file.filename : ""
    });

    // console.log("New Site Create ke Baad")
    await newProject.save();

    res.status(201).json({
      message: "Site added successfully 🚀",
      data: newProject
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
// Update project 
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const formData = req.body;

    // 📂 File (Cloudinary handled already)
    const poFileObj = req.file;
    console.log('Project Po File Obje')

    // 🔍 Find existing project
    const existingProject = await Project.findById(projectId);

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // 🧠 Smart update object
    const updateData = {
      ...formData,

      // ✅ Only update file if new uploaded
      poFile: poFileObj ? poFileObj.path : existingProject.poFileUrl,
      poFilePublicId: poFileObj
        ? poFileObj.filename
        : existingProject.poFilePublicId,
    };

    // 🚀 Update
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      updateData,
      // {allotedCompany: req.body.allotedCompany},
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Project updated successfully 🚀",
      data: updatedProject,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// get all
exports.getAllProjects = async (req, res) => {
  try {
    const allSites = await Project.find().sort({ createdAt: -1 });

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
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
     if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    // 🔍 Find project first
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
      // 🧹 Delete file from Cloudinary (if exists)
    // if (project.poFilePublicId) {
    //   await cloudinary.uploader.destroy(project.poFilePublicId, {
    //     resource_type: "raw", // important for pdf/image
    //   });
      
    // }
    const poFilePublicId=project.poFilePublicId;
     await Project.findByIdAndDelete(projectId);
     await deleteFileFromCloudinary(poFilePublicId);


    res.status(200).json({
      success:true,
      message: "Project deleted successfully",
       
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }

}

exports.getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId || projectId === "") {
      return res.status(400).json({
        success: false,
        message: "Project Id Is missing"
      })
    }
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Project not found"
      })
    }
    await updateProjectProgress(projectId);
    return res.status(200).json({
      success: true,
      message: "Project is found",
      data: project
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message
    })
  }
}

// Add bill to project
exports.addBillToProject = async (req, res) => {
try{
  const projectId= req.params.projectId;

  if(!projectId){
    return res.status(400).json({
      success:false,
      message:"Project Id is required"
    })
  }
  const {billType, billNumber, billAmount, billDate,billTypeCount}=req.body;

  if(!billType || !billNumber || !billAmount || !billDate || !billTypeCount){
    return res.status(400).json({
      success:false,
      message:"Please fill all required fields"
    })
  }
  const createBill=await Bill.create({
    project:projectId,
    billType,
     billTypeCount,
    billNumber,
    billAmount,
    billDate,
    billFile:req.file ? req.file.path : "",
    billFilePublicId:req.file ? req.file.filename : "",
   
  })

  if(!createBill){
    return res.status(500).json({
      success:false,
      message:"Failed to add bill to project"
    })
  }
    await updateProjectProgress(projectId);




  console.log(createBill);
  return res.status(200).json({
    success:true,
    message:"Bill added to project successfully",
    data:createBill
  })


}catch(error){
  return res.status(500).json({
    message:"server Error",
    error:error?.message
  })
}

}

exports.getProjectBills=async (req,res)=>{
try{

  const projectId= req.params.projectId;

  if(!projectId){
    return res.status(400).json({
      success:false,
      message:"Project Id is required"
    })
  }
  const bills=await Bill.find({project:projectId});
  return res.status(200).json({
    success:true,
    message:"Bills fetched successfully",
    data:bills
  })
}catch(error){
  return res.status(500).json({
    message:"server Error",
    error:error?.message
  })
}
}

exports.deleteProjectBill=async (req,res)=>{
  try{
    const {projectId, billId}=req.params;
    if(!projectId || !billId){
      return res.status(400).json({
        success:false,
        message:"Project Id and Bill Id are required"
      })
    }
    const projectExists=await Project.findById(projectId);
    if(!projectExists){
      return res.status(404).json({
        success:false,
        message:"Project not found"
      })
    }
     const billExist=await Bill.findById(billId);
     if(!billExist){
      return res.status(404).json({
        success:false,
        message:"Bill not found"
      })
     }
     const billFilePublicId=billExist.billFilePublicId;
     await Bill.findByIdAndDelete(billId);

     await deleteFileFromCloudinary(billFilePublicId);
     await updateProjectProgress(projectId);
     return res.status(200).json({
      success:true,
      message:"Bill deleted successfully"
     })
  }catch(error){
    return res.status(500).json({
      message:"server Error",
      error:error?.message
    })
  }
}
