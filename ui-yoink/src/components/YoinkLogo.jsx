export default function YoinkLogo({ light = false }) {
  return (
    <span className={`yoink-logo${light ? ' yoink-logo-light' : ''}`} aria-label="Yoink home">
      <img src="/yoink-logo.png" alt="" aria-hidden="true" />
      <span className="yoink-wordmark">YOINK</span>
    </span>
  );
}
