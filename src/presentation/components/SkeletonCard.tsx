"use client";
export function SkeletonCard() {
    return (
        <div className="glass-card" style={{ overflow: "hidden" }}>
            {/* Logo area skeleton */}
            <div
                className="skeleton"
                style={{ width: "100%", aspectRatio: "16/9" }}
            />
            {/* Body skeletons */}
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="skeleton" style={{ height: "14px", borderRadius: "4px", width: "85%" }} />
                <div className="skeleton" style={{ height: "14px", borderRadius: "4px", width: "60%" }} />
                <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                    <div className="skeleton" style={{ height: "18px", borderRadius: "99px", width: "60px" }} />
                    <div className="skeleton" style={{ height: "18px", borderRadius: "99px", width: "40px" }} />
                </div>
            </div>
        </div>
    );
}

export function SkeletonGrid({ count = 24 }: { count?: number }) {
    return (
        <div className="channel-grid">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
