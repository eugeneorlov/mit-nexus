export default function QuoteSection() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-8 bg-[#F9FAFB]">
      <div className="max-w-6xl mx-auto">
        <div className="relative max-w-3xl mx-auto text-center">
          {/* Decorative quote mark */}
          <span
            className="absolute -top-8 left-0 text-8xl font-serif text-brand-gold/30 leading-none select-none"
            aria-hidden="true"
          >
            &ldquo;
          </span>

          <blockquote className="text-2xl md:text-3xl font-light italic text-brand-navy-light leading-relaxed relative z-10">
            The program gives you frameworks. The cohort gives you a network. This is where the network comes alive.
          </blockquote>

          <p className="text-base text-slate-500 mt-6">
            — Built for the MIT CXO 2026
          </p>
        </div>
      </div>
    </section>
  );
}
