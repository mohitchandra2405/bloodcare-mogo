import { useEffect, useState } from "react";
import ComplaintForm from "../components/ComplaintForm";
import ReviewForm from "../components/ReviewForm";
import { parseApiResponse } from "../utils/api";
import {
  formatCategory,
  formatPriority,
  formatStatus,
  formatTimelineEntry,
} from "../content/formatters";

const API_URL = "http://localhost:5000/api/complaints";
const sortByUpvotes = (items) =>
  [...items].sort((first, second) => {
    const voteGap = (second.upvotes || 1) - (first.upvotes || 1);
    if (voteGap !== 0) {
      return voteGap;
    }

    return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
  });

function SubmitComplaint({ currentUser, copy, language }) {
  const [complaints, setComplaints] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyIssues = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await parseApiResponse(
          response,
          "Unable to load complaints. Make sure the backend server is running on http://localhost:5000."
        );
        setAllComplaints(sortByUpvotes(data));
        const mine = sortByUpvotes(
          data.filter((complaint) => complaint.email === currentUser?.email)
        );
        setComplaints(mine);
      } catch (error) {
        console.error("Failed to load user issues", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyIssues();
  }, [currentUser]);

  const handleComplaintSubmitted = (complaint) => {
    setAllComplaints((current) => {
      const exists = current.some((entry) => entry.id === complaint.id);
      return sortByUpvotes(
        exists
        ? current.map((entry) => (entry.id === complaint.id ? complaint : entry))
        : [complaint, ...current]
      );
    });
    setComplaints((current) => {
      if (complaint.email !== currentUser?.email) {
        return current;
      }

      const exists = current.some((entry) => entry.id === complaint.id);
      return sortByUpvotes(
        exists
        ? current.map((entry) => (entry.id === complaint.id ? complaint : entry))
        : [complaint, ...current]
      );
    });
  };

  const handleReviewAdded = (updatedComplaint) => {
    setAllComplaints((current) =>
      sortByUpvotes(current.map((complaint) =>
        complaint.id === updatedComplaint.id ? updatedComplaint : complaint
      ))
    );
    setComplaints((current) =>
      sortByUpvotes(current.map((complaint) =>
        complaint.id === updatedComplaint.id ? updatedComplaint : complaint
      ))
    );
  };

  const handleComplaintUpdated = (updatedComplaint) => {
    setAllComplaints((current) =>
      sortByUpvotes(current.map((complaint) =>
        complaint.id === updatedComplaint.id ? updatedComplaint : complaint
      ))
    );
    setComplaints((current) =>
      sortByUpvotes(current.map((complaint) =>
        complaint.id === updatedComplaint.id ? updatedComplaint : complaint
      ))
    );
  };

  const handleUpvote = async (complaintId) => {
    try {
      const complaint = allComplaints.find((entry) => entry.id === complaintId);
      const alreadyUpvoted = complaint?.upvotedBy?.includes(currentUser?.email);
      const response = await fetch(`${API_URL}/${complaintId}/upvote`, {
        method: alreadyUpvoted ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: currentUser?.name,
          email: currentUser?.email,
        }),
      });

      const data = await parseApiResponse(
        response,
        "Unable to upvote this complaint. Make sure the backend server is running on http://localhost:5000."
      );

      if (!response.ok) {
        throw new Error(data.message || "Failed to upvote complaint.");
      }

      handleComplaintUpdated(data.complaint);
    } catch (error) {
      console.error("Failed to upvote complaint", error);
    }
  };

  return (
    <section className="user-page-grid submit-page-grid">
      <div className="panel submit-form-panel">
        <div className="section-heading">
          <p className="eyebrow">{copy.submit.eyebrow}</p>
          <h2>{copy.submit.title}</h2>
        </div>
        <ComplaintForm
          currentUser={currentUser}
          knownComplaints={allComplaints}
          onSubmitted={handleComplaintSubmitted}
          onComplaintUpdated={handleComplaintUpdated}
          copy={copy}
          language={language}
        />
      </div>

      <div className="panel submit-reports-panel">
        <div className="section-heading">
          <p className="eyebrow">{copy.submit.reportsEyebrow}</p>
          <h2>{copy.submit.reportsTitle}</h2>
          <p className="section-copy">
            {copy.submit.reportsBody}
          </p>
        </div>
        {loading ? (
          <p>{copy.submit.loading}</p>
        ) : complaints.length === 0 ? (
          <p>{copy.submit.empty}</p>
        ) : (
          <div className="complaint-stack">
            {complaints.map((complaint) => (
              <article key={complaint.id} className="complaint-card">
                <div className="complaint-card-header">
                  <div>
                    <h3>{complaint.subject}</h3>
                    <p>
                      {complaint.department} - {formatCategory(copy, complaint.category)} -{" "}
                      {formatPriority(copy, complaint.priority)} {copy.shared.prioritySuffix}
                    </p>
                  </div>
                  <span className="status-pill">{formatStatus(copy, complaint.status)}</span>
                </div>

                <div className="complaint-card-actions">
                  <span className="support-count">{complaint.upvotes || 1} supports</span>
                </div>

                <p>{complaint.description}</p>

                <div className="meta-grid">
                  <span>
                    {copy.submit.locationLabel}:{" "}
                    {complaint.location?.label || copy.submit.noLocation}
                  </span>
                  <span>{copy.submit.sentimentLabel}: {complaint.sentiment}</span>
                  <span>{copy.submit.reporterLabel}: {complaint.name}</span>
                  <span>{copy.submit.assignedLabel}: {complaint.assignedDepartment}</span>
                </div>

                {complaint.photos?.length ? (
                  <div className="attachment-block">
                    <strong>{copy.submit.attachmentsTitle}</strong>
                    <div className="attachment-grid">
                      {complaint.photos.map((photo) => (
                        <div key={photo.id || photo.name} className="attachment-card">
                          <img src={photo.url || photo.dataUrl} alt={photo.name} />
                          <span>{photo.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {complaint.resolutionNotes ? (
                  <div className="resolution-summary">
                    <strong>{copy.submit.resolutionTitle}</strong>
                    <p>{complaint.resolutionNotes}</p>
                  </div>
                ) : null}

                <div className="timeline-block">
                  <strong>{copy.submit.timelineTitle}</strong>
                  <div className="timeline-list">
                    {complaint.timeline.map((entry) => (
                      <div
                        key={`${complaint.id}-${entry.at}-${entry.type}`}
                        className={`timeline-item timeline-${entry.type
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        <span>{formatTimelineEntry(copy, entry).type}</span>
                        <p>{formatTimelineEntry(copy, entry).detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <ReviewForm
                  complaintId={complaint.id}
                  currentUser={currentUser}
                  onReviewAdded={handleReviewAdded}
                  copy={copy}
                />

                <div className="review-list">
                  {complaint.reviews.length === 0 ? (
                    <p>{copy.submit.noReviews}</p>
                  ) : (
                    complaint.reviews.map((review) => (
                      <div key={review.id} className="review-card">
                        <strong>
                          {review.reviewerName} - {review.rating}/5
                        </strong>
                        <p>{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default SubmitComplaint;
