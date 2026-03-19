const steps = [
  {
    number: '01',
    title: 'Enter your email',
    description: "We'll send a magic link — no password to remember.",
  },
  {
    number: '02',
    title: 'Set up your profile',
    description: 'Name, company, what you can help with, what you want to learn.',
  },
  {
    number: '03',
    title: 'Start connecting',
    description: 'Browse the directory, get your first match, and explore the map.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-8 bg-[#080E1A]">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Up and running in{' '}
            <em className="italic text-brand-gold">two minutes</em>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col">
              <span className="text-5xl font-bold text-brand-gold/30 leading-none">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold text-white mt-4">
                {step.title}
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
