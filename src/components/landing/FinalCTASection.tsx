import EmailSignInForm from './EmailSignInForm';

export default function FinalCTASection() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-8 bg-brand-navy">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white">
          Ready to find your{' '}
          <em className="italic text-brand-gold">people?</em>
        </h2>
        <p className="text-lg text-slate-400 mt-4">
          Join the cohort network. It takes two minutes.
        </p>
        <div className="mt-10">
          <EmailSignInForm variant="cta" />
        </div>
      </div>
    </section>
  );
}
