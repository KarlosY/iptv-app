import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="app-layout" style={{ display: "block", background: "var(--bg-primary)", minHeight: "100vh", padding: "40px 24px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--accent)", textDecoration: "none", marginBottom: "32px", fontWeight: "600" }}>
                    <ArrowLeft size={16} /> Back to Home
                </Link>
                
                <h1 style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "24px" }}>Terms & Conditions</h1>
                
                <div style={{ color: "var(--text-secondary)", lineHeight: "1.7", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <p>Last updated: March 10, 2026</p>

                    <section>
                        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", marginTop: "16px", marginBottom: "8px" }}>1. Introduction</h2>
                        <p>Welcome to IPTV Ykar (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using our application, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.</p>
                    </section>
                    
                    <section>
                        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", marginTop: "16px", marginBottom: "8px" }}>2. Use of Service</h2>
                        <p>IPTV Ykar is an open-source media player interface designed to consume publicly available M3U8 streams. We aggregate and provide a user interface for these streams, but we do not host, store, or distribute any media content ourselves.</p>
                    </section>

                    <section>
                        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", marginTop: "16px", marginBottom: "8px" }}>3. Content Disclaimer</h2>
                        <p>All channel data, logos, and streams are provided by the <strong>iptv-org</strong> community and other third-party sources. We do not claim ownership, nor do we assume responsibility for the legality, availability, or accuracy of the streams provided.</p>
                        <p>Users are solely responsible for ensuring they have the legal right to consume the content they access through our player in their respective jurisdictions.</p>
                    </section>

                    <section>
                        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", marginTop: "16px", marginBottom: "8px" }}>4. Modifications to Service</h2>
                        <p>We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
