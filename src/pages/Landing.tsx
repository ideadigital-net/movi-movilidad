import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* HEADER */}
      <header className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-black">M</div>
          <span className="font-bold tracking-widest">MOVI</span>
        </div>
        <div className="flex gap-3">
          <Link to="/tarifas" className="text-xs text-zinc-400 hover:text-white">Admin</Link>
          <Link to="/driver" className="text-xs bg-zinc-800 px-4 py-2 rounded-full hover:bg-zinc-700">Soy Conductor</Link>
        </div>
      </header>

      {/* HERO */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-block bg-zinc-900 border border-zinc-800 text- tracking-widest px-3 py-1 rounded-full mb-6">
            CAPULHUAC • TENANGO • TOLUCA • CDMX
          </div>
          <h1 className="text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter">
            TU VIAJE,<br />
            <span className="text-zinc-500">EN MINUTOS.</span>
          </h1>
          <p className="text-zinc-400 mt-6 max-w-md text-sm leading-relaxed">
            La plataforma de movilidad de Capulhuac. Pide tu viaje ejecutivo,
            ve la tarifa por ruta en tiempo real y viaja seguro.
          </p>
          <div className="flex gap-3 mt-8">
            <Link to="/app" className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-zinc-200 transition">
              PEDIR VIAJE AHORA →
            </Link>
            <a href="#rutas" className="border border-zinc-800 px-8 py-4 rounded-full font-bold text-sm hover:bg-zinc-900 transition">
              Ver Tarifas
            </a>
          </div>
          <div className="flex gap-6 mt-10 text-xs text-zinc-500">
            <div><b className="text-white text-lg block">4+</b> Rutas activas</div>
            <div><b className="text-white text-lg block">$450</b> Desde</div>
            <div><b className="text-white text-lg block">24/7</b> Servicio</div>
          </div>
        </div>

        <div className="relative">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between text- tracking-widest text-zinc-500 mb-8">
              <span>VIAJE EJECUTIVO</span>
              <span className="text-green-400">● Disponible</span>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between">
                <div>
                  <p className="text- text-zinc-500">ORIGEN</p>
                  <p className="font-bold">Capulhuac</p>
                </div>
                <div className="text-right">
                  <p className="text- text-zinc-500">DESTINO</p>
                  <p className="font-bold">Toluca Centro</p>
                </div>
              </div>
              <div className="bg-white text-black rounded-2xl p-5 flex justify-between items-center">
                <div>
                  <p className="text- opacity-60">TARIFA FIJA</p>
                  <p className="text-2xl font-black">$450 MXN</p>
                </div>
                <div className="text-right text-xs">
                  <p>45 km • 50 min</p>
                  <p className="opacity-60">LIBRE</p>
                </div>
              </div>
              <Link to="/app" className="block w-full bg-white text-black text-center py-4 rounded-full font-black hover:bg-zinc-200">
                CONFIRMAR VIAJE
              </Link>
            </div>
          </div>
          {/* Glow */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w- h- bg-white/10 blur- rounded-full"></div>
        </div>
      </main>

      {/* RUTAS */}
      <section id="rutas" className="max-w-7xl mx-auto px-6 py-20 border-t border-zinc-900">
        <h2 className="text-sm tracking-widest text-zinc-500 mb-8">RUTAS POPULARES DESDE CAPULHUAC</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { a: "Amecameca", p: "$800", k: "13 km" },
            { a: "Toluca Centro", p: "$450", k: "45 km" },
            { a: "CDMX Observatorio", p: "$1200", k: "95 km" },
            { a: "Chalco", p: "$550", k: "20 km" },
          ].map((r) => (
            <div key={r.a} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-xs text-zinc-500">Capulhuac →</p>
              <p className="font-bold mt-1">{r.a}</p>
              <div className="flex justify-between items-end mt-6">
                <p className="text-xl font-black">{r.p}</p>
                <p className="text-xs text-zinc-500">{r.k}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-10 text- tracking-widest text-zinc-600">
        MOVI MOVILIDAD © 2026 • CAPULHUAC, ESTADO DE MÉXICO
      </footer>
    </div>
  );
}