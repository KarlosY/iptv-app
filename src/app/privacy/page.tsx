import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="app-layout" style={{ display: "block", background: "var(--bg-primary)", minHeight: "100vh", padding: "40px 24px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--accent)", textDecoration: "none", marginBottom: "32px", fontWeight: "600" }}>
                    <ArrowLeft size={16} /> Back to Home
                </Link>
                
                <h1 style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "24px" }}>Privacy Policy</h1>
                
                <div style={{ color: "var(--text-secondary)", lineHeight: "1.7", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <p>Last updated: March 10, 2026</p>

                    <section>
                        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", marginTop: "16px", marginBottom: "8px" }}>1. Information We Collect</h2>
                        <p>At IPTV Ykar, we respect your privacy. Our core application does not require you to create an account, provide an email address, or share any personally identifiable information (PII) to use the service.</p>
                    </section>

                    <section>
                        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", marginTop: "16px", marginBottom: "8px" }}>2. Local Storage</h2>
                        <p>To improve your user experience, we store non-identifying preferences locally in your browser using <strong>localStorage</strong> (via Zustand). This includes:</p>
                        <ul style={{ listStyleType: "disc", marginLeft: "20px", marginTop: "8px" }}>
                            <li>Channels you have marked as &apos;Favorites&apos;.</li>
                            <li>The history of your &apos;Recently Viewed&apos; channels.</li>
                            <li>Active UI filters (e.g., selected country or category).</li>
                        </ul>
                        <p style={{ marginTop: "8px" }}>This data never leaves your device and is not transmitted to any of our servers.</p>
                    </section>

                    <section>
                        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", marginTop: "16px", marginBottom: "8px" }}>3. Third-Party Services</h2>
                        <p>Our application interacts directly with public APIs (like <em>iptv-org.github.io</em>) to fetch channel metadata and streams. When your browser connects to these third-party services or stream URLs, those servers may log standard web request information (such as your IP address and user-agent string) in accordance with their own privacy policies.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
