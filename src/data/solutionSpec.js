export const API_BASE_URL = "http://localhost:8000";

export const vehicleOptions = [
  "Car",
  "Motorcycle",
  "Truck",
  "Bus",
  "Auto Rickshaw"
];

export const violationOptions = [
  { label: "Red Light Jump", fine: 1000 },
  { label: "Wrong Way Driving", fine: 1500 },
  { label: "No Helmet", fine: 1000 },
  { label: "No Seatbelt", fine: 1000 },
  { label: "Overspeed", fine: 2000 }
];

export const workflowSteps = [
  {
    title: "Upload the violation video",
    detail: "The operator adds a traffic clip from mobile, CCTV export, or roadside camera capture."
  },
  {
    title: "Extract the plate number",
    detail: "The backend currently uses a placeholder OCR strategy and is ready to swap to PaddleOCR later."
  },
  {
    title: "Generate the e-challan",
    detail: "The system assigns a challan ID, fine amount, evidence file, and a JSON record for review."
  }
];

export const systemNotes = [
  "Use a filename like MH12AB1234-red-light.mp4 to simulate auto plate extraction immediately.",
  "If OCR is uncertain, the challan is marked review_required instead of silently trusting a bad plate read.",
  "The backend stores both uploaded videos and generated challan JSON files locally for traceability."
];
