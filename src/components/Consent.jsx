import { useState } from "react";

const ConsentBanner = () => {
  const [consentGiven, setConsentGiven] = useState(
    localStorage.getItem("userConsent") === "granted"
  );

  const handleConsent = (consent) => {
    localStorage.setItem("userConsent", consent ? "granted" : "denied");
    setConsentGiven(consent);

    window.gtag("consent", "update", {
      ad_storage: consent ? "granted" : "denied",
      analytics_storage: consent ? "granted" : "denied",
    });
  };

  if (consentGiven) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, width: "100%", background: "#000", color: "#fff", padding: "10px", textAlign: "center" }}>
      <p>This site uses cookies to improve your experience. Do you accept?</p>
      <button onClick={() => handleConsent(true)}>Accept</button>
      <button onClick={() => handleConsent(false)}>Reject</button>
    </div>
  );
};

export default ConsentBanner;
