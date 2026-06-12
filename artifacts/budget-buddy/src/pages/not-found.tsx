import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
      <div className="text-8xl mb-6 float">🥺</div>
      <h1 className="text-4xl font-bold font-serif gradient-text mb-4">Oopsie! 404</h1>
      <p className="text-muted-foreground mb-8">
        We can't find that page. Maybe it got lost in the void? 🌌
      </p>
      <Link to="/dashboard" className="px-8 py-3 gradient-btn">
        Take Me Home 🏠
      </Link>
    </div>
  );
}