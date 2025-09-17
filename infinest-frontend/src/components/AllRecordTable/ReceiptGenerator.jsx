'use client';


import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IoMdPrint } from "react-icons/io";
import { MdPreview } from "react-icons/md";
import { FaDownload, FaWhatsapp, FaFileInvoice } from "react-icons/fa";
import { IoCloseCircleOutline } from "react-icons/io5";

// PrintableReceipt Component
const PrintableReceipt = React.forwardRef(({ clientData, shopPhoneNumber, shopAddress }, ref) => (
  <div ref={ref} className="bg-white p-4 rounded shadow border w-[300px] text-sm">
    <h2 className="text-lg font-bold text-center">
      {clientData.owner_name || "INFINFEST MOBILE SERVICE"}
    </h2>
    <p className="text-center text-xs">{shopAddress || "Shop Address, City, Pincode"}</p>


    <p className="text-center text-xs mb-2">
      Phone: {shopPhoneNumber || "9876543210"}
    </p>
    <hr className="my-2" /><p><strong>Customer Name:</strong> {clientData.client_name}</p>
    <p><strong>Mobile Number:</strong> {clientData.mobile_number}</p>
    {clientData.bill_no && <p><strong>Bill No:</strong> {clientData.bill_no}</p>}

    <h3 className="mt-4 font-semibold">Mobiles Given for Service:</h3>
    <table className="w-full mt-2 border border-gray-300 text-xs">
      <thead className="bg-gray-200">
        <tr>
          <th className="border px-2 py-1">#</th>
          <th className="border px-2 py-1">Model</th>
          <th className="border px-2 py-1">Issue</th>
        </tr>
      </thead>
      <tbody>
        {clientData.MobileName.map((mobile, index) => (
          <tr key={index}>
            <td className="border px-2 py-1">{index + 1}</td>
            <td className="border px-2 py-1">{mobile.mobile_name}</td>
            <td className="border px-2 py-1">{mobile.issue || "N/A"}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p className="mt-4 text-xs text-center text-gray-500">
      Thank you for choosing our service!
    </p>
  </div>
));

PrintableReceipt.displayName = "PrintableReceipt";
// Main ReceiptGenerator Component
const ReceiptGenerator = ({ clientData, shopPhoneNumber, closeModal, shopAddress }) => {
  const receiptRef = useRef(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false); const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: "Receipt",
  });

  const generatePDFContent = (doc, shopAddress) => {


    doc.setFontSize(10);
    doc.text(clientData.owner_name || "INFINFEST MOBILE SERVICE", 4, 6);
    doc.setFontSize(8);
    doc.text(shopAddress || "Shop Address, City, Pincode", 4, 10);
    doc.text(`Phone: ${shopPhoneNumber || "9876543210"}`, 4, 14);
    doc.line(2, 17, 56, 17);

    doc.text(`Customer Name: ${clientData.client_name}`, 4, 21);
    doc.text(`Mobile Number: ${clientData.mobile_number}`, 4, 25);
    if (clientData.bill_no) {
      doc.text(`Bill No: ${clientData.bill_no}`, 4, 29);
    }

    doc.text("Mobiles Given for Service:", 4, 35);
    const mobileRows = clientData.MobileName.map((mobile, index) => [
      String(index + 1),
      mobile.mobile_name,
      mobile.issue || "N/A",
      new Date(mobile.added_date || mobile.addedDate).toLocaleDateString("en-IN"),
      mobile.delivery_date
        ? new Date(mobile.delivery_date).toLocaleDateString("en-IN")
        : "N/A",
    ]);
    autoTable(doc, {
      head: [["#", "Model", "Issue", "In", "Out"]],
      body: mobileRows,
      startY: 38,
      theme: "grid",
      styles: { fontSize: 6.5, cellPadding: 0.5 },
      margin: { left: 2, right: 2 },
      headStyles: { fillColor: [220, 220, 220] },
    });
    const finalY = doc.previousAutoTable?.finalY || 50;
    doc.setFontSize(7);
    doc.text("Thank you for choosing our service!", 4, finalY + 6);
  };
  const handleGeneratePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [58, 1000],
    });
    generatePDFContent(doc, shopAddress);
    const blob = doc.output("blob");
    const pdfURL = URL.createObjectURL(blob);
    setPreviewURL(pdfURL);
    setShowPreviewModal(true);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [58, 1000],
    });
    generatePDFContent(doc, shopAddress);
    doc.save("Receipt.pdf");
  };
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg relative shadow-lg">
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 text-gray-600 hover:text-red-600"
          >
            <IoCloseCircleOutline size={24} />
          </button>
          <PrintableReceipt
            ref={receiptRef}
            clientData={clientData}
            shopPhoneNumber={shopPhoneNumber}
            shopAddress={shopAddress}
          />
          <div className="flex justify-end mt-6 gap-4">
            <button onClick={handlePrint} className="bg-blue-600 text-white p-2 rounded">
              <IoMdPrint />
            </button>
            <button onClick={handleGeneratePDF} className="bg-gray-800 text-white p-2 rounded">
              <MdPreview />
            </button>
            <button onClick={handleDownloadPDF} className="bg-purple-600 text-white p-2 rounded">
              <FaDownload />
            </button>
            <button
              onClick={() => {
                const serviceMobile = clientData?.MobileName?.find(item => !!item._id);
                if (!serviceMobile?._id) {
                  console.warn("⚠️ Mobile ID missing. Please contact support.");
                  return;
                }
                const billMobileId = serviceMobile._id;
                const customerMobile = clientData.mobile_number.startsWith("91")
                  ? clientData.mobile_number
                  : "91" + clientData.mobile_number;
                const receiptLink = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/receipt/${billMobileId}`;
                const customer = clientData.client_name || "";
                const shop = clientData.owner_name || "INFINFEST MOBILE SERVICE";
                const billNumber = clientData.bill_no || "N/A";
                const servicedMobiles = clientData.MobileName.map((device) => {
                  const deliveryDate = device.delivery_date
                    ? new Date(device.delivery_date).toLocaleDateString("en-IN")
                    : "N/A";
                  return `\n📱 ${device.mobile_name}\n⚠️ ${device.issue || "N/A"}\n📅 Delivery: ${deliveryDate}`;
                }).join("\n");
                const billMessage = `🧾 *${shop}*\nCustomer: ${customer}\nMobile: ${clientData.mobile_number}\nBill No: ${billNumber}\n\nMobiles:\n${servicedMobiles}\nThank you!`;
                window.open(`https://web.whatsapp.com/send?phone=${customerMobile}&text=${encodeURIComponent(billMessage)}`, "_blank");
              }}
              className="bg-yellow-500 text-white p-2 rounded"
            >
              <FaFileInvoice />
            </button>
            <button
              onClick={() => {
                const firstValidMobile = clientData?.MobileName?.find(mob => !!mob._id);
                if (!firstValidMobile?._id) {
                  console.warn("⚠️ Missing mobile ID. Contact admin.");
                  return;
                }
                const mobileId = firstValidMobile._id;
                const receiverMobile = clientData.mobile_number.startsWith("91")
                  ? clientData.mobile_number
                  : "91" + clientData.mobile_number;
                const link = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/receipt/${mobileId}`;
                const customerName = clientData.client_name || "";
                const shopName = clientData.owner_name || "INFINFEST MOBILE SERVICE";
                //const billNo = clientData.bill_no || "N/A";
                // const mobileDetails = clientData.MobileName.map((m) => {
                //   const d = m.delivery_date
                //     ? new Date(m.delivery_date).toLocaleDateString("en-IN")
                //     : "N/A";
                //   return `\n📱 ${m.mobile_name}\n⚠️ ${m.issue || "N/A"}\n📅 Delivery: ${d}`;
                // }).join("\n");
                const message = `🧾 *${shopName}*\n📱 Mobile Service Receipt for ${customerName}\nCustomer: ${customerName}\n🔗 ${link}`;
                window.open(`https://web.whatsapp.com/send?phone=${receiverMobile}&text=${encodeURIComponent(message)}`, "_blank");
                // window.open(`https://web.whatsapp.com/send?phone=${shopPhoneNumber}&text=${encodeURIComponent(message)}`, "_blank");
                //  const message = `🧾 *${shopName}*\nCustomer: ${customerName}\nMobile: ${clientData.mobile_number}\nBill No: ${billNo}\n\nMobiles:\n${mobileDetails}\n🔗 View Receipt: ${link}\n\nThank you!`;
                // window.open(`https://web.whatsapp.com/send?phone=${whatsappSenderNumber}&text=${encodeURIComponent(message)}`, "_blank");
              }}
              className="bg-green-600 text-white p-2 rounded"
            >
              <FaWhatsapp />
            </button>
          </div>
        </div>
      </div>
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white w-11/12 max-w-2xl h-5/6 rounded-lg p-4 shadow-xl relative">
            <iframe src={previewURL} title="PDF Preview" className="w-full h-[80%] border rounded"></iframe>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={handleDownloadPDF} className="bg-blue-600 text-white px-4 py-2 rounded">
                <FaDownload />
              </button>
              <button onClick={() => setShowPreviewModal(false)} className="bg-red-500 text-white px-4 py-2 rounded">
                <IoCloseCircleOutline />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReceiptGenerator;




























