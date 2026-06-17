import { useMemo } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { motion } from "framer-motion";

interface UpiQrCodeProps {
  upiId: string;
  name: string;
  amount: number;
  transactionNote?: string;
}

/**
 * Build a UPI deep-link URL following the NPCI spec.
 * Format: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>
 */
function buildUpiDeepLink(
  upiId: string,
  name: string,
  amount: number,
  transactionNote?: string,
): string {
  const params = new URLSearchParams();
  params.set("pa", upiId);
  params.set("pn", name);
  params.set("am", amount.toFixed(2));
  params.set("cu", "INR");
  if (transactionNote) {
    params.set("tn", transactionNote.slice(0, 50));
  }
  return `upi://pay?${params.toString()}`;
}

export default function UpiQrCode({
  upiId,
  name,
  amount,
  transactionNote,
}: UpiQrCodeProps) {
  const upiDeepLink = useMemo(
    () => buildUpiDeepLink(upiId, name, amount, transactionNote),
    [upiId, name, amount, transactionNote],
  );

  return (
    <motion.div
      className="upi-qr-code"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="upi-qr-code-header">
        <span className="upi-qr-icon">📲</span>
        <span className="upi-qr-title">Scan to pay</span>
      </div>

      <div
        className="upi-qr-code-container"
        role="img"
        aria-label={`UPI QR code for ₹${amount.toFixed(2)} payable to ${upiId}`}
      >
        <div className="upi-qr-code-wrapper">
          <QRCode
            value={upiDeepLink}
            size={180}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#2A2A2A"
            includeMargin={false}
          />
        </div>
      </div>

      <div className="upi-qr-amount">
        <span className="upi-qr-amount-label">Amount</span>
        <span className="upi-qr-amount-value">₹{amount.toFixed(2)}</span>
      </div>

      <p className="upi-qr-hint">
        Open any UPI app (GPay / PhonePe / Paytm) and scan this QR code to pay
      </p>
    </motion.div>
  );
}
