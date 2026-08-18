export default function ComingSoon({ pageName }: { pageName: string }) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center">
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">{pageName}</h2>
      <p className="text-sm text-neutral-500">Coming soon.</p>
    </div>
  );
}