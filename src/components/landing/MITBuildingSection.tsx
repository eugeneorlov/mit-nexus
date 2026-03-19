export default function MITBuildingSection() {
  return (
    <section
      className="relative h-[400px] md:h-[500px] w-full overflow-hidden"
      style={{
        backgroundImage: 'url(/images/mit-great-dome.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/80 via-brand-navy/60 to-brand-navy/80" />

      {/* Text overlay */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white">
          Where leaders become a{' '}
          <em className="italic text-brand-gold">network.</em>
        </h2>
        <p className="text-base md:text-lg text-slate-300 text-center mt-4">
          Built for MIT CXO cohort.
        </p>
      </div>

      {/* Photo credit */}
      <p className="absolute bottom-2 right-4 text-[10px] text-slate-500/50">
        Photo: Wikimedia Commons (CC BY-SA 4.0)
      </p>
    </section>
  );
}
