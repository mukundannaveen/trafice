import { startTransition, useEffect, useState } from "react";

import {
  API_BASE_URL,
  systemNotes,
  vehicleOptions,
  violationOptions,
  workflowSteps
} from "./data/solutionSpec";

const initialForm = {
  ownerName: "",
  vehicleType: vehicleOptions[0],
  violationType: violationOptions[0].label,
  location: "",
  officerName: "AI Camera Unit",
  signalState: "Red",
  notes: "",
  manualPlate: ""
};

function SectionTitle({ eyebrow, title, body }) {
  return (
    <header className="section-title">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <span>{body}</span>
    </header>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [challan, setChallan] = useState(null);
  const [challans, setChallans] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChallans() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/challans`);
        if (!response.ok) {
          throw new Error("Could not load saved challans.");
        }
        const payload = await response.json();
        setChallans(payload.items ?? []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoadingList(false);
      }
    }

    loadChallans();
  }, []);

  useEffect(() => {
    if (!selectedVideo) {
      setVideoPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedVideo);
    setVideoPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedVideo]);

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedVideo(nextFile);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!selectedVideo) {
      setError("Please choose a video file before generating the e-challan.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("video", selectedVideo);
      payload.append("owner_name", form.ownerName.trim() || "Unknown Owner");
      payload.append("vehicle_type", form.vehicleType);
      payload.append("violation_type", form.violationType);
      payload.append("location", form.location.trim() || "Unknown Location");
      payload.append("officer_name", form.officerName.trim() || "AI Camera Unit");
      payload.append("signal_state", form.signalState);
      payload.append("notes", form.notes.trim());
      payload.append("manual_plate", form.manualPlate.trim());

      const response = await fetch(`${API_BASE_URL}/api/challans/from-video`, {
        method: "POST",
        body: payload
      });

      const responsePayload = await response.json();
      if (!response.ok) {
        throw new Error(responsePayload.detail || "Failed to generate the e-challan.");
      }

      setChallan(responsePayload);
      startTransition(() => {
        setChallans((current) => [
          responsePayload,
          ...current.filter((item) => item.challan_id !== responsePayload.challan_id)
        ]);
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function downloadChallan() {
    if (!challan) {
      return;
    }

    const blob = new Blob([JSON.stringify(challan, null, 2)], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${challan.challan_id}.json`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <div className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Traffic Enforcement Console</p>
          <h1>Upload a video and generate an e-challan from the vehicle number plate</h1>
          <p className="hero-text">
            This version is built for operator workflow first: upload the evidence clip, capture
            a plate value through placeholder OCR, and issue a structured challan record that can
            later plug into YOLO, ByteTrack, and PaddleOCR.
          </p>
          <div className="hero-badges">
            <span>Video Upload</span>
            <span>Plate OCR Placeholder</span>
            <span>Challan JSON</span>
            <span>Review Status</span>
          </div>
        </div>
        <div className="hero-panel">
          <h3>How this behaves today</h3>
          <ul>
            {systemNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="workspace-grid">
        <form className="upload-card" onSubmit={handleSubmit}>
          <SectionTitle
            eyebrow="Step 1"
            title="Upload Violation Evidence"
            body="Add the clip and operator details. The backend will create the challan record immediately."
          />

          <label className="field">
            <span>Violation Video</span>
            <input type="file" accept="video/*" onChange={handleFileChange} />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>Owner Name</span>
              <input
                name="ownerName"
                placeholder="Enter owner or suspect name"
                value={form.ownerName}
                onChange={handleInputChange}
              />
            </label>

            <label className="field">
              <span>Vehicle Type</span>
              <select name="vehicleType" value={form.vehicleType} onChange={handleInputChange}>
                {vehicleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>Violation Type</span>
              <select name="violationType" value={form.violationType} onChange={handleInputChange}>
                {violationOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Signal State</span>
              <select name="signalState" value={form.signalState} onChange={handleInputChange}>
                <option value="Red">Red</option>
                <option value="Amber">Amber</option>
                <option value="Green">Green</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </label>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>Location</span>
              <input
                name="location"
                placeholder="Intersection or checkpoint"
                value={form.location}
                onChange={handleInputChange}
              />
            </label>

            <label className="field">
              <span>Officer Name</span>
              <input
                name="officerName"
                placeholder="AI Camera Unit"
                value={form.officerName}
                onChange={handleInputChange}
              />
            </label>
          </div>

          <label className="field">
            <span>Manual Plate Override (Optional)</span>
            <input
              name="manualPlate"
              placeholder="Example: MH12AB1234"
              value={form.manualPlate}
              onChange={handleInputChange}
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              name="notes"
              rows="4"
              placeholder="Optional review remarks"
              value={form.notes}
              onChange={handleInputChange}
            />
          </label>

          {error ? <p className="status-message error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Generating Challan..." : "Generate e-Challan"}
          </button>
        </form>

        <div className="preview-column">
          <article className="preview-card">
            <SectionTitle
              eyebrow="Step 2"
              title="Preview and OCR Status"
              body="Use a filename with a number plate or type a manual override for predictable demo behavior."
            />
            {videoPreviewUrl ? (
              <video className="video-preview" controls src={videoPreviewUrl} />
            ) : (
              <div className="empty-preview">Video preview appears here after file selection.</div>
            )}
          </article>

          <article className="workflow-card">
            <SectionTitle
              eyebrow="Flow"
              title="Generation Pipeline"
              body="This keeps the future AI pipeline swappable while already supporting operator testing."
            />
            <div className="workflow-list">
              {workflowSteps.map((step, index) => (
                <article className="workflow-item" key={step.title}>
                  <span>{`0${index + 1}`}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="results-grid">
        <article className="result-card">
          <SectionTitle
            eyebrow="Step 3"
            title="Generated e-Challan"
            body="The result below comes from the backend response and can be downloaded as JSON."
          />

          {challan ? (
            <div className="challan-panel">
              <div className="challan-header">
                <div>
                  <p className="label">Challan ID</p>
                  <h3>{challan.challan_id}</h3>
                </div>
                <span className={`status-pill ${challan.status}`}>
                  {challan.status.replace("_", " ")}
                </span>
              </div>

              <div className="metric-grid">
                <div className="metric-card">
                  <span>Vehicle Number</span>
                  <strong>{challan.vehicle_number}</strong>
                </div>
                <div className="metric-card">
                  <span>Fine Amount</span>
                  <strong>{formatCurrency(challan.fine_amount)}</strong>
                </div>
                <div className="metric-card">
                  <span>Violation</span>
                  <strong>{challan.violation_type}</strong>
                </div>
                <div className="metric-card">
                  <span>Confidence</span>
                  <strong>{Math.round(challan.detection_summary.confidence * 100)}%</strong>
                </div>
              </div>

              <div className="detail-grid">
                <p><span>Owner</span>{challan.owner_name}</p>
                <p><span>Location</span>{challan.location}</p>
                <p><span>Officer</span>{challan.officer_name}</p>
                <p><span>OCR Mode</span>{challan.detection_summary.ocr_mode}</p>
                <p><span>Video File</span>{challan.original_video_name}</p>
                <p><span>Signal</span>{challan.detection_summary.signal_state || "N/A"}</p>
              </div>

              <p className="helper-note">{challan.detection_summary.notes}</p>

              <button className="secondary-button" type="button" onClick={downloadChallan}>
                Download Challan JSON
              </button>
            </div>
          ) : (
            <div className="empty-result">
              Submit a video to generate the first challan record.
            </div>
          )}
        </article>

        <article className="history-card">
          <SectionTitle
            eyebrow="Stored Records"
            title="Recent Challans"
            body="Saved records come from backend JSON files, so the list survives page refreshes."
          />

          {isLoadingList ? (
            <div className="empty-result">Loading saved challans...</div>
          ) : challans.length > 0 ? (
            <div className="history-list">
              {challans.slice(0, 6).map((item) => (
                <article className="history-item" key={item.challan_id}>
                  <div className="history-topline">
                    <strong>{item.vehicle_number}</strong>
                    <span className={`status-pill ${item.status}`}>{item.status.replace("_", " ")}</span>
                  </div>
                  <p>{item.violation_type}</p>
                  <small>{item.location}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-result">No challans have been generated yet.</div>
          )}
        </article>
      </section>
    </div>
  );
}

export default App;
