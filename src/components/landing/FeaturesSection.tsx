import { Globe, Coffee, MessageCircle } from 'lucide-react';

const features = [
  {
    icon: Globe,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    title: 'Cohort Map',
    description:
      'See where 144 CTOs are based — and who\'s traveling to your city next. Pin your home, announce trips, and discover neighbors you never knew you had.',
  },
  {
    icon: Coffee,
    iconBg: 'bg-brand-gold-subtle',
    iconColor: 'text-brand-gold',
    title: 'Coffee Roulette',
    description:
      'Every week, get matched with someone whose skills complement yours. You teach what you know, learn what you don\'t. Serendipity, engineered.',
  },
  {
    icon: MessageCircle,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    title: 'Direct Messages',
    description:
      'Real-time, private conversations with anyone in the cohort. No Slack noise. No email threads. Just the conversation you need.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-8 bg-[#F9FAFB]">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy-light">
            More than a directory. A{' '}
            <em className="italic text-brand-gold">launchpad.</em>
          </h2>
          <p className="text-lg text-slate-600 mt-4 max-w-xl mx-auto">
            Three features designed for how busy executives actually network.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-gold/30 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold text-brand-navy-light mt-6">
                  {feature.title}
                </h3>
                <p className="text-base text-slate-600 mt-3 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
