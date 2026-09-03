import Link from "next/link";
import { Heart } from "lucide-react";

export default function Favorites() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
          <Heart className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-lg font-semibold text-neutral-900 mb-2">
          Favorites coming soon
        </h1>
        <p className="text-sm text-neutral-500 mb-6">
          We're working on letting you save your go-to spots. Check back
          soon.
        </p>
        <Link
          href="/browse"
          className="inline-block bg-primary text-white text-sm rounded-full px-6 py-2.5"
        >
          Browse restaurants
        </Link>
      </div>
    </div>
  );
}