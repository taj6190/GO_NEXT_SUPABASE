"use client";

import { useState, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import api from "@/lib/api";
import { Review, ReviewSummary } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store";
import StarRating from "@/components/ui/StarRating";
import toast from "react-hot-toast";

interface Props {
  productId: string;
}

export default function ReviewSection({ productId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadReviews();
    loadSummary();
  }, [productId, page]);

  const loadReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/product/${productId}?page=${page}&limit=5`);
      if (data.success) {
        setReviews(data.data || []);
        setTotal(data.meta?.total || 0);
      }
    } catch {}
  };

  const loadSummary = async () => {
    try {
      const { data } = await api.get(`/reviews/product/${productId}/summary`);
      if (data.success) setSummary(data.data);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    try {
      await api.post("/reviews", { product_id: productId, rating, title, comment });
      toast.success("Review submitted!");
      setShowForm(false);
      setRating(0); setTitle(""); setComment("");
      loadReviews();
      loadSummary();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / 5);

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-[var(--star-filled)] mb-2">{summary.average_rating.toFixed(1)}</div>
            <StarRating rating={summary.average_rating} size={20} />
            <p className="text-sm text-[var(--text-muted)] mt-1">{summary.total_reviews} reviews</p>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star] || 0;
              const pct = summary.total_reviews > 0 ? (count / summary.total_reviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-muted)] w-12">{star} star</span>
                  <div className="review-bar">
                    <div className="review-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-[var(--text-muted)] w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write Review Button */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <button onClick={() => setShowForm(!showForm)} className="btn-secondary">
            Write a Review
          </button>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            <a href="/login" className="text-[var(--accent-light)] underline">Login</a> to write a review
          </p>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card-static p-6 space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Your Rating *</label>
            <StarRating rating={rating} size={28} interactive onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summary of your review" className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Review</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell others about your experience..." className="input-field" rows={4} />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Submitting..." : "Submit Review"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="glass-card-static p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{review.user_name[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{review.user_name}</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size={12} />
                      {review.is_verified_purchase && (
                        <span className="badge bg-green-500/20 text-green-400 text-[10px]">
                          <ThumbsUp size={10} /> Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{timeAgo(review.created_at)}</span>
            </div>
            {review.title && <p className="font-semibold text-sm">{review.title}</p>}
            {review.comment && <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{review.comment}</p>}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${p === page ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {reviews.length === 0 && !showForm && (
        <p className="text-center text-[var(--text-muted)] py-8">No reviews yet. Be the first to review!</p>
      )}
    </div>
  );
}
