import React from "react";
import { toWords } from "number-to-words";
import { X, Printer, CheckCircle2, ArrowLeft } from "lucide-react";
import spppl from '../assets/SPPPL.jpeg';
import sepl from '../assets/SEPL.jpeg';

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
export default function ChallanPreview({
  formData,
  items = [],
  totalAmount = 0,
  onBack,
  onConfirm,
  challanProject = {}
}) {
  const formatDate = (date) => {
    if (!date) {
      return new Date().toLocaleDateString("en-IN");
    }
    return new Date(date).toLocaleDateString("en-IN");
  };

  const amountInWords = (amount) => {
    const value = Number(amount || 0);
    if (!value) return "Zero Rupees Only";

    return `${toWords(value)
      .replace(/\b\w/g, (char) => char.toUpperCase())} Rupees Only`;
  };

  const getDocumentTitle = () => {
    switch (formData.documentType) {
      case "DDC":
        return "Direct Delivery Challan";
      case "DC":
        return "Delivery Challan";
      case "LPN":
        return "Local Purchase Note";
      case "ISTN":
        return "Inter Site Transfer Note";
      case "MRN":
        return "Material Receipt Note";
      case "MRS":
        return "Material Return Slip";
      case "CN":
        return "Credit Note / Vendor Return";
      default:
        return "Delivery Challan";
    }
  };

  const getFromText = () => {
    if (formData.fromMainStoreName) return formData.fromMainStoreName;
    if (formData.fromSiteName) return formData.fromSiteName;
    if (formData.vendorName) return formData.vendorName;

    if (["DDC", "LPN", "MRN"].includes(formData.documentType)) return "Vendor";
    if (["DC", "CN"].includes(formData.documentType)) return "Main Store";
    if (["ISTN", "MRS"].includes(formData.documentType)) return "Site Store";

    return "-";
  };

  const getToText = () => {
    if (formData.toMainStoreName) return formData.toMainStoreName;
    if (formData.toSiteName) return formData.toSiteName;

    if (["DC", "DDC", "LPN", "ISTN"].includes(formData.documentType)) {
      return formData.projectName || "Site Store";
    }

    if (["MRN", "MRS"].includes(formData.documentType)) return "Main Store";
    if (formData.documentType === "CN") return formData.vendorName || "Vendor";

    return "-";
  };

  // console.log(challanProject);
  const rateShow = ["LPN"].includes(formData.documentType) ? true : false;
  // console.log(rateShow);


const downloadPDF = async () => {
  const element = document.getElementById("challan-print-area");

  if (!element) {
    toast.error("Print area not found");
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(formData.documentNumber ? `${formData.documentNumber}.pdf` : "challan.pdf");
};
  // console.log(formData)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 text-slate-100">
      <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
              Challan Preview
            </p>
            <h2 className="text-xl font-bold text-white">
              Review before creating approval request
            </h2>
          </div>

          <button
            onClick={onBack}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-5">
          <div
            id="challan-print-area"
            style={{
              backgroundColor: "#ffffff",
              color: "#000000",
              boxShadow: "none",
            }}
            className="mx-auto p-6 text-[12px]"
          >
            <div className="border border-black">
              <div className="relative border-b border-black p-4 text-center">
                {/* Logo Left */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <img
                    src={challanProject?.allotedCompany == "Sachin Electrical Private Limited" ? sepl : spppl}
                    alt="company logo"
                    className="h-32 w-40 object-contain"
                  />
                </div>

                {/* Company Details Center */}
                <div className="px-28">
                  <h1 className="text-xl font-bold uppercase"
                    style={{ color: "#1d4ed8" }}>
                    {challanProject?.allotedCompany || "Sachin Electrical Private Limited"}
                  </h1>

                  <p className='text-[16px] font-semibold  '>
                    2B/536, Vasundhara, Sahibabad, Ghaziabad, Uttar Pradesh,
                    201012 - India
                  </p>

                  <p className='text-[16px] font-semibold'>
                    Phone : 0120 4155654 / Email : info@sachinelectrical.com
                  </p>

                  <p className='text-[16px] font-semibold'>
                    GSTIN:- 09AAKCS1319M1ZZ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-black">
                <div className="p-2 font-semibold">CONSIGNEE COPY</div>
                <div className="border-x border-black p-2 text-center text-lg font-bold">
                  {getDocumentTitle()}
                </div>
                <div className="p-2 text-right text-[16px] font-semibold">
                  Date: {formatDate(formData.documentDate)}
                </div>
              </div>

              <div className="grid grid-cols-2 border-b border-black text-[16px]">
                <div className="space-y-3 p-b-3">
                  <p className='border-b border-black p-1'>
                    <b>Document Number: </b>
                    {formData.documentNumber || "-"}
                  </p>
                   <p className='border-b border-black p-1'>
                    <b>Document Type: </b>
                    {formData.documentType || "-"}
                  </p>
                  {/* <p>
                    <b>Approval Status: </b>
                    Pending Site Approval
                  </p> */}
                </div>

                <div className="space-y-1 border-l border-black p-b-3">
                   <p className='border-b border-black p-1'>
                    <b>Place of Supply: </b>
                    {challanProject.placeOfDelivery || "-"}
                  </p>
                   <p className='border-b border-black p-2'>
                    <b>Consignee Name: </b>
                    {challanProject.consigneeName || "-"}
                  </p>
                  <p className='border-b border-black p-1'>
                    <b>Consignee Address: </b>
                    {challanProject.consigneeAddress || "-"}
                  </p>
                  <p className='border-b border-black p-1'>
                    <b>GSTIN: </b>
                    {challanProject.gstNumber || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-1 border-b border-black  p-b-3">
                <p className='text-[14px] font-semibold border-b border-black p-1'>
                  <b>Name of Project / Site: </b>
                  {formData.projectName || "-"}
                </p>
                {/* <p>
                  <b>Purpose: </b>
                  Approval based digital material movement
                </p> */}
                <p className='text-[16px] font-semibold border-b border-black p-1'>
                  <b>Remarks: </b>
                  {formData.remarks || "-"}
                </p>
              </div>

              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr>
                    <th className="border border-black p-1 w-10">Sr.</th>
                    <th className="border border-black p-1">Material</th>
                    <th className="border border-black p-1 w-24">Type</th>
                    <th className="border border-black p-1 w-16">UOM</th>
                    <th className="border border-black p-1 w-24">HSN</th>
                    <th className="border border-black p-1 w-16">Qty</th>
                    <th className="border border-black p-1 w-20">Rate</th>
                    <th className="border border-black p-1 w-24">Amount</th>
                    <th className="border border-black p-1 w-20">Return </th>
                    <th className="border border-black p-1 w-24">Remarks</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-black p-1 text-center">
                        {index + 1}
                      </td>

                      <td className="border border-black p-1">
                        <b>{item.itemName || "-"}</b>
                        {/* {item.itemCode ? ` (${item.itemCode})` : ""} */}
                        {item.remarks ? (
                          <div className="text-[10px]">Note: {item.remarks}</div>
                        ) : null}
                      </td>

                      <td className="border border-black p-1 text-center">
                        {item.itemPurpose || "-"}
                      </td>

                      <td className="border border-black p-1 text-center">
                        {item.unit || "-"}
                      </td>

                     

                      <td className="border border-black p-1 text-center">
                        {item.hsnCode || "-"}
                      </td>

                   
                       <td className="border border-black p-1 text-center">
                       <b> {item.quantity || 0}</b>
                      </td>

                     
                        <td className="border border-black p-1 text-right ">
                        <b>  {rateShow ? Number(item.rate).toFixed(0):''}</b>
                        </td>
                      

                       <td className="border border-black p-1 text-right">
                         <b>  {rateShow ? Number(item.amount).toFixed(0):''}</b>
                      </td>
                         <td className="border border-black p-1 text-center">
                        {item.isReturnable
                          ? `Yes ${item.expectedReturnDate ? `(${formatDate(item.expectedReturnDate)})` : ""}`
                          : ""}
                      </td>
                      <td className="border border-black p-1 text-right">

                      </td>
                    </tr>
                  ))}

                  {Array.from({ length: Math.max(0, 20 - items.length) }).map(
                    (_, index) => (
                      <tr key={`blank-${index}`}>
                        <td className="h-7 border border-black p-1">&nbsp;</td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                      </tr>
                    )
                  )}

                  <tr>
                    <td
                      colSpan="7"
                      className="border border-black p-2 text-right font-bold"
                    >
                      Total
                    </td>
                    <td className="border border-black p-2 text-right font-bold">
                       { rateShow ?Number(totalAmount).toFixed(2):''}
                    </td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>

                  </tr>

                </tbody>
              </table>

              <div className="space-y-2 border-b border-black p-3 text-[14px]">
                <p>
                  <b>Challan Total in Words: </b>
                   { rateShow ? amountInWords(totalAmount):''}
                </p>

                <p className="font-semibold">
                  Certified that the above material is issued through digital
                  challan control and will be updated in stock only after
                  approval.
                </p>
              </div>

              <div className="grid grid-cols-3">
                <div className="min-h-[115px] border-r border-black p-3">
                  <p className="font-bold">Prepared By</p>
                  <div className="mt-16 border-t border-black pt-1">
                    Store / MIS User
                  </div>
                </div>

                <div className="min-h-[115px] border-r border-black p-3">
                  <p className="font-bold">Site Approval</p>
                  <div className="mt-16 border-t border-black pt-1">
                    Site Incharge Signature
                  </div>
                </div>

                <div className="min-h-[115px] p-3 text-right">
                  <p className="font-bold">Authorised Signatory</p>
                  <div className="mt-16 border-t border-black pt-1">
                    For Sachin Electrical Pvt. Ltd.
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="mt-2 text-right text-xs">Page 1 of 1</div> */}
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-800 bg-slate-950/95 px-5 py-4 backdrop-blur">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Edit
          </button>

          <button
            onClick={downloadPDF}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <Printer size={18} />
            Download PDF
          </button>

          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <CheckCircle2 size={18} />
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
}