import { Link } from "react-router-dom";

function PlaceholderPage({ title }) {
  return (
    <main className="placeholder-page">
      <h1>GradTrack</h1>

      <h2>{title}</h2>

      <Link to="/login">Back to Login</Link>
    </main>
  );
}

export default PlaceholderPage;
