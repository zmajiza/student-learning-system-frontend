import "./LoadingSpinner.css";

export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="loadingWrapper">
      <div className="spinner"></div>
      <p>{text}</p>
    </div>
  );
}