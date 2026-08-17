import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="KEY CRAFT 5000 ホーム">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M7 11 20 4l13 7v18l-13 7-13-7Z" fill="currentColor" opacity=".13" />
        <path d="m12 14 8-4 8 4-8 4-8-4Zm0 5 8 4 8-4v7l-8 4-8-4v-7Z" fill="currentColor" />
      </svg>
      <span><b>KEY CRAFT</b><small>5000</small></span>
    </Link>
  );
}
