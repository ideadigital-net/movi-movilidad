export default function Home(){
  return (
    <div className="min-h-screen bg-[#050507] text-white antialiased">
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#050507]/90 border-b border-white/[0.06]">
        <div className="mx-auto max-w- px-4 sm:px-6 h- flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white text-black grid place-items-center font-black">M+</div>
            <span className="font-black text- tracking-tighter">MOVI<span className="text-[#E8C547]">+</span></span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text- font-mono">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/> LIVE • CAPULHUAC
          </div>
        </div>
      </header>
      <main className="mx-auto max-w- px-4 sm:px-6 py-8 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="order-1">
            <div className="inline-flex px-3 py-1.5 rounded-full bg-[#E8C547]/10 border border-[#E8C547]/20 text-[#E8C547] text- font-bold tracking-widest">NUEVA ERA DE MOVILIDAD EN EDOMEX</div>
            <h1 className="mt-6 font-black tracking-[-0.05em] leading-[0.9]" style={{fontSize:'clamp(38px, 6vw, 84px)'}}>
              Movilidad<br/><span className="text-white/40 font-light">que impone</span><br/><span className="text-[#E8C547]">respeto.</span>
            </h1>
            <p className="mt-6 text- sm:text- leading-7 text-white/60 max-w-">Plataforma premium para Capulhuac. Conductores verificados, código de 4 dígitos, tarifa transparente y control total en tiempo real.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="/app" className="h- px-8 rounded-full bg-white text-black font-bold text- grid place-items-center">Solicitar viaje →</a>
              <div className="h- px-6 rounded-full bg-white/5 border border-white/10 grid place-items-center text-white/60 text-">Arquitectura Supabase lista</div>
            </div>
          </div>
          <div className="order-2 relative lg:sticky lg:top-">
            <div className="absolute -inset-6 bg-[#E8C547]/10 blur- rounded-" />
            <div className="relative rounded- bg-[#0E0E10] border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-5 flex justify-between border-b border-white/5">
                <span className="text- font-mono text-white/50 tracking-widest">TRIP • LIVE DEMO</span>
                <span className="text- px-3 py-1 rounded-full bg-[#E8C547] text-black font-black">EN CURSO</span>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex justify-between">
                  <div><div className="text- text-white/40 uppercase tracking-widest">ORIGEN</div><div className="font-bold mt-2 text-">Capulhuac Centro</div></div>
                  <div className="text-right"><div className="text- text-white/40 uppercase tracking-widest">DESTINO</div><div className="font-bold mt-2 text-">Santiago Tiangui.</div></div>
                </div>
                <div className="rounded- bg-white text-black p-5 flex justify-between items-center">
                  <div><div className="text- font-black tracking-widest opacity-60">CÓDIGO PARA INICIAR VIAJE</div><div className="text- font-black tracking-[0.25em] leading-none mt-2">8 4 2 1</div></div>
                  <div className="h-14 w-14 rounded-full bg-black text-white grid place-items-center">▶</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <a href="/driver" className="h-11 rounded-xl bg-[#1C1C1F] border border-white/10 grid place-items-center font-bold text- text-white/60">/driver</a>
                  <a href="/app" className="h-11 rounded-xl bg-white text-black grid place-items-center font-bold text-">/app</a>
                  <a href="/admin" className="h-11 rounded-xl bg-[#1C1C1F] border border-white/10 grid place-items-center font-bold text- text-white/60">/admin</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}