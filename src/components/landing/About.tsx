export default function About() {
  const logos = ['Acme Corp', 'GlobalTech', 'Startup Inc', 'Nexus', 'Pioneer'];

  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold text-slate-500 tracking-wider uppercase mb-8">
          Trusted by forward-thinking organizations, startups, and enterprises
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-60 grayscale filter hover:grayscale-0 transition-all duration-300">
          {logos.map((logo, index) => (
            <div key={index} className="text-xl sm:text-2xl font-bold text-slate-400">
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
