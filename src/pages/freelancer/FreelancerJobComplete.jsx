import { useEffect, useMemo, useState } from "react";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { contractService } from "../../services/contractService";

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function requestStatus(item) {
  return String(item?.completionRequest?.status || "not_submitted").toLowerCase();
}

export default function FreelancerJobComplete() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await contractService.list({ mine: "freelancer" });
      setItems(toArray(data));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => items.filter((item) => String(item.status || "").toLowerCase() !== "cancelled"),
    [items]
  );

  const selectedItem = useMemo(
    () => filtered.find((item) => String(item._id || item.contractId) === String(selectedId || "")) || null,
    [filtered, selectedId]
  );
  const selectedRejected = requestStatus(selectedItem) === "rejected";

  const toAttachment = (inputFile) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: inputFile.name,
          type: inputFile.type || "application/octet-stream",
          size: inputFile.size,
          dataUrl: String(reader.result || ""),
        });
      reader.onerror = () => reject(new Error("Failed to read selected file"));
      reader.readAsDataURL(inputFile);
    });

  const submit = async () => {
    if (!selectedId) return;

    setBusyId(selectedId);
    setError("");
    try {
      const trimmedLink = link.trim();
      const trimmedNotes = notes.trim();
      let attachment = null;
      const previousState = requestStatus(selectedItem);

      if (!trimmedLink && !file) {
        throw new Error("Provide at least one delivery link or attachment.");
      }

      if (previousState === "rejected" && !trimmedNotes) {
        throw new Error("Client rejected this work. Please fill revision notes before resubmitting.");
      }

      if (file) {
        if (file.size > 2_000_000) throw new Error("Attachment must be 2MB or smaller.");
        attachment = await toAttachment(file);
      }

      await contractService.submitCompletion(selectedId, {
        deliveryLink: trimmedLink,
        deliveryNotes: trimmedNotes,
        deliveryAttachment: attachment,
      });

      setSelectedId("");
      setLink("");
      setNotes("");
      setFile(null);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">Job Complete</div>
        <div className="muted">Submit your completed work with attachment/link. Client will accept or reject.</div>
      </div>

      <ErrorBox message={error} />

      {selectedId && (
        <div className="card">
          <div className="h2">Submit Completed Work</div>
          {selectedRejected && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-3">
              Client rejected your previous submission.
              {selectedItem?.completionRequest?.clientFeedback
                ? ` Reason: ${selectedItem.completionRequest.clientFeedback}`
                : " Please add revision details in Notes before submitting again."}
            </div>
          )}
          <div className="grid2">
            <div>
              <label className="block mb-1">Work Link</label>
              <input
                className="input"
                type="url"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1">Attachment (max 2MB)</label>
              <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
              <label className="block mb-1">
                {selectedRejected ? "Revision Notes (required)" : "Notes (optional)"}
              </label>
              <textarea
                className="textarea"
                placeholder={selectedRejected
                  ? "Explain what you fixed based on client feedback."
                  : "Explain what was delivered and how to verify it."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          <div className="flex gap-3" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btnOk"
              disabled={busyId === selectedId || (selectedRejected && !notes.trim())}
              onClick={submit}
            >
              {busyId === selectedId
                ? "Submitting..."
                : selectedRejected
                  ? "Resubmit for Client Review"
                  : "Submit for Client Review"}
            </button>
            <button type="button" className="btn" disabled={busyId === selectedId} onClick={() => setSelectedId("")}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Client</th>
              <th>Contract</th>
              <th>Request</th>
              <th>Submitted</th>
              <th>Client Feedback</th>
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const id = item._id || item.contractId;
              const contractState = String(item.status || "active").toLowerCase();
              const reqState = requestStatus(item);
              const canSubmit = contractState === "active" && reqState !== "pending";
              const submitLabel = reqState === "rejected" ? "Resubmit Work" : "Submit Work";
              return (
                <tr key={id}>
                  <td>{item.jobTitle || item.jobId || "-"}</td>
                  <td>{item.clientName || item.clientId || "-"}</td>
                  <td><span className="badge">{contractState}</span></td>
                  <td><span className="badge">{reqState.replace("_", " ")}</span></td>
                  <td>{formatDate(item.completionRequest?.submittedAt)}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{item.completionRequest?.clientFeedback || "-"}</td>
                  <td>
                    <button type="button" className="btn btnOk" disabled={!canSubmit} onClick={() => setSelectedId(id)}>
                      {submitLabel}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="muted">No contracts available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
