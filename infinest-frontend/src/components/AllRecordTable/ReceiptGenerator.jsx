'use client';
import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { IoMdPrint } from "react-icons/io";
import { MdPreview } from "react-icons/md";
import { FaDownload, FaWhatsapp } from "react-icons/fa";
import { IoCloseCircleOutline } from "react-icons/io5";
import authApi from "../authApi";

// Enhanced PrintableReceipt Component
const PrintableReceipt = React.forwardRef(({ clientData, shopPhoneNumber, shopAddress, shopEmail, shopName }, ref) => {
  const totalPaid = (clientData?.MobileName || []).reduce((s, m) => s + (Number(m.paid_amount) || 0), 0);
  return (
    <div ref={ref} className="bg-white p-6 rounded-lg shadow-lg border max-w-sm mx-auto text-sm font-mono">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {shopName || clientData.owner_name || "INFINFEST MOBILE SERVICE"}
        </h2>
        <p className="text-xs text-gray-600">
          📞 Phone: {shopPhoneNumber || "9876543210"}
        </p>
        {shopEmail && shopEmail.trim() !== "" && shopEmail !== "N/A" && (
          <p className="text-xs text-gray-600">📧 Email: {shopEmail}</p>
        )}
        {shopAddress && shopAddress.trim() !== "" && shopAddress !== "N/A" && (
          <p className="text-xs text-gray-600">📍 Address: {shopAddress}</p>
        )}
      </div>

      {/* Customer Details */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Customer:</span>
          <span className="text-gray-900">{clientData.client_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Mobile:</span>
          <span className="text-gray-900">{clientData.mobile_number}</span>
        </div>
        {clientData.bill_no && (
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Bill No:</span>
            <span className="text-gray-900">{clientData.bill_no}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Date:</span>
          <span className="text-gray-900">{new Date().toLocaleDateString("en-IN")}</span>
        </div>
      </div>

      {/* Services Table */}
      <div className="mb-4">
        <h3 className="font-bold text-gray-800 mb-3 text-center border-b border-gray-300 pb-1">📱 DEVICES FOR SERVICE</h3>
        <table className="w-full border-collapse border border-gray-400 text-xs table-fixed">
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '60%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-2 text-left">#</th>
              <th className="border border-gray-400 px-2 py-2 text-left">Device</th>
              <th className="border border-gray-400 px-2 py-2 text-left">Issue</th>
              <th className="border border-gray-400 px-2 py-2 text-right">Paid</th>
            </tr>
          </thead>
          <tbody>
            {clientData.MobileName.map((mobile, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-400 px-2 py-2 text-center font-semibold">{index + 1}</td>
                <td className="border border-gray-400 px-2 py-2"><div className="truncate max-w-full">{mobile.mobile_name}</div></td>
                <td className="border border-gray-400 px-2 py-2">{mobile.issue || "General Service"}</td>
                <td className="border border-gray-400 px-2 py-2 text-right">{(typeof mobile.paid_amount !== 'undefined' && mobile.paid_amount !== null) ? mobile.paid_amount : 0}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total paid for printable receipt */}
        <div className="flex justify-end mt-3">
          <div className="text-sm font-semibold">Total Paid: {totalPaid}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center border-t-2 border-gray-800 pt-4 mt-6">
        <p className="text-xs text-gray-600 mb-2">⭐ Thank you for choosing our service! ⭐</p>
        <p className="text-xs text-gray-500">For support: {shopPhoneNumber || "9876543210"}</p>
        <p className="text-xs text-gray-400 mt-2">Generated: {new Date().toLocaleString("en-IN")}</p>
      </div>
    </div>
  );
});

PrintableReceipt.displayName = "PrintableReceipt";

// PDF generation temporarily disabled while debugging build issue (jspdf removed)
// let _jspdfPromise = null;
// const loadJsPdf = async () => {
//   if (!_jspdfPromise) {
//     _jspdfPromise = Promise.all([
//       import("jspdf").then(m => m.default || m),
//       import("jspdf-autotable").then(m => m.default || m)
//     ]).then(([JSPDF]) => JSPDF);
//   }
//   return _jspdfPromise;
// };

const generateEnhancedPDF = async (clientData, shopPhoneNumber, shopAddress, shopEmail, shopName) => {
  // Stub: return minimal object to prevent runtime errors
  return {
    output: () => ({
      // mimic jsPDF output method interface used later ("blob")
      blob: () => new Blob([], { type: 'application/pdf' })
    }),
    save: () => console.warn('PDF save disabled during build debugging'),
  };
};

// Main Enhanced ReceiptGenerator Component
const ReceiptGenerator = ({ clientData, shopPhoneNumber, closeModal, shopAddress }) => {
  const receiptRef = useRef(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [shopEmail, setShopEmail] = useState(null);
  const [shopName, setShopName] = useState(null);
  const [profileAddress, setProfileAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch shop details from profile
  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const res = await authApi.get("/profile/get", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data && res.data.email) {
          setShopEmail(res.data.email);
        }
        if (res.data && res.data.name) {
          setShopName(res.data.name);
        }
        if (res.data && res.data.address) {
          setProfileAddress(res.data.address);
        }
      } catch (err) {
        console.error("Error fetching shop details:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopDetails();
  }, []);

  // Cleanup function to revoke object URLs
  useEffect(() => {
    return () => {
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${clientData.bill_no || 'Service'}`,
    onAfterPrint: () => {
      console.log("Receipt printed successfully!");
    }
  });

  // Manual print fallback: serialize the receipt node into a new window and print it
  const printManual = () => {
    try {
      const node = receiptRef && receiptRef.current;
      if (!node) return;
      // Attempt to include app stylesheet (if available) and provide fallback inline styles
      const cssHref = (typeof window !== 'undefined' && window.location) ? `${window.location.origin}/styles.css` : '/styles.css';
      const fallbackStyles = `
        body{font-family: Arial,Helvetica,sans-serif; margin:0; padding:8px; color:#111}
        .receipt-wrap{ width:80mm; box-sizing:border-box; margin:0 auto; }
        h2{ margin:0 0 6px; font-size:16px; text-align:center }
        .shop{ text-align:center; margin-bottom:6px }
        table{ width:100%; border-collapse:collapse; margin-top:6px; font-size:12px }
        th, td{ border:1px solid #333; padding:6px }
        thead th{ background:#f3f3f3; font-weight:700; }
        .right{ text-align:right }
        .total{ text-align:right; font-weight:700; margin-top:8px }
        footer{ margin-top:12px; text-align:center; font-size:11px; color:#555 }
      `;

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title>` +
        `<link rel="stylesheet" href="${cssHref}">` +
        `<style>${fallbackStyles}</style></head><body><div class="receipt-wrap">${node.outerHTML}</div></body></html>`;
      const w = window.open('', '_blank');
      if (!w) { alert('Popup blocked: allow popups to print'); return; }
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => { try { w.print(); w.close(); } catch (e) { /* ignore */ } }, 300);
    } catch (e) {
      console.error('Manual print failed:', e);
    }
  };

  // Guarded print handler: wait briefly for the forwarded ref to mount before invoking print
  const printIfReady = () => {
    const maxAttempts = 12; // up to ~1.2s
    let attempts = 0;

    const attemptPrint = () => {
      attempts += 1;
      if (receiptRef && receiptRef.current) {
        // Use manual print to avoid react-to-print console warning in some environments
        printManual();
        return;
      }

      if (attempts < maxAttempts) {
        // small delay to allow React to mount the forwarded ref
        setTimeout(attemptPrint, 100);
        return;
      }

      console.warn('Print requested but receipt element did not mount in time. Please try again.');
    };

    attemptPrint();
  };

  const handlePreview = () => {
    (async () => {
      const finalAddress = profileAddress || shopAddress;
  console.warn('Preview disabled (jspdf removed temporarily).');
  setPreviewURL(null);
  setShowPreviewModal(false);
    })();
  };

  const handleDownloadPDF = () => {
    (async () => {
      const finalAddress = profileAddress || shopAddress;
  console.warn('Download disabled (jspdf removed temporarily).');
    })();
  };

  const handleWhatsApp = () => {
    const serviceMobile = clientData?.MobileName?.find(item => !!item._id);
    if (!serviceMobile?._id) {
      alert("⚠️ Mobile ID missing. Please contact support.");
      return;
    }

    const customerMobile = clientData.mobile_number.startsWith("91")
      ? clientData.mobile_number
      : "91" + clientData.mobile_number;

    const receiptLink = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/receipt/${serviceMobile._id}`;
    const customer = clientData.client_name || "";
    const shop = clientData.owner_name || "INFINFEST MOBILE SERVICE";
    const billNumber = clientData.bill_no || "N/A";

    const servicedMobiles = clientData.MobileName.map((device, index) => {
  const paid = (typeof device.paid_amount !== 'undefined' && device.paid_amount !== null) ? device.paid_amount : 0;
  return `${index + 1}. 📱 ${device.mobile_name} - ${device.issue || "General Service"} (Paid: ${paid})`;
    }).join("\n");

    const message = `🧾 *${shop}* - Service Receipt\n\n👤 Customer: ${customer}\n📞 Mobile: ${clientData.mobile_number}\n🧾 Bill No: ${billNumber}\n\n📱 *Devices:*\n${servicedMobiles}\n\n🔗 View Online: ${receiptLink}\n\n✨ Thank you for choosing our service!`;

    window.open(`https://web.whatsapp.com/send?phone=${customerMobile}&text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <>
      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[9998] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading receipt...</p>
          </div>
        </div>
      )}

      {/* Main Modal */}
      {!loading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[9998] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                🧾 Receipt Generator
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-red-600 transition-colors duration-200"
              >
                <IoCloseCircleOutline size={28} />
              </button>
            </div>

            {/* Receipt Preview */}
            <div className="p-6 bg-gray-50">
              <div className="mb-6">
                <PrintableReceipt
                  ref={receiptRef}
                  clientData={clientData}
                  shopPhoneNumber={shopPhoneNumber}
                  shopAddress={profileAddress || shopAddress}
                  shopEmail={shopEmail}
                  shopName={shopName}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={printIfReady} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <IoMdPrint size={20} />
                  <span className="font-medium">Print</span>
                </button>

                <button 
                  onClick={handlePreview} 
                  className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <MdPreview size={20} />
                  <span className="font-medium">Preview</span>
                </button>

                <button 
                  onClick={handleDownloadPDF} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <FaDownload size={18} />
                  <span className="font-medium">Download</span>
                </button>

                <button 
                  onClick={handleWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <FaWhatsapp size={18} />
                  <span className="font-medium">WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[99999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
            {/* Preview Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">📄 Receipt Preview</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleDownloadPDF} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                  <FaDownload size={16} />
                  Download
                </button>
                <button 
                  onClick={() => {
                    setShowPreviewModal(false);
                    if (previewURL) {
                      URL.revokeObjectURL(previewURL);
                      setPreviewURL(null);
                    }
                  }} 
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                  <IoCloseCircleOutline size={18} />
                  Close
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 p-4">
              {previewURL ? (
                <iframe 
                  src={previewURL} 
                  title="PDF Preview" 
                  className="w-full h-full border rounded-lg shadow-inner"
                  style={{ minHeight: '500px' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-500">Loading preview...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReceiptGenerator;
