export default function Admin(){
  return (
    <div className="min-h-screen bg-[#050507] text-white p-6">
      <div className="mx-auto max-w-">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white text-black grid place-items-center font-black">M+</div>
            <span className="font-black">MOVI+ CONTROL</span>
          </div>
          <a href="/" className="text- font-mono text-white/40">/admin</a>
        </div>

        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded- bg-[#101012] border border-white/10 p-5">
            <div className="text- text-white/40 tracking-widest">VIAJES HOY</div>
            <div className="mt-2 text- font-black">12</div>
            <div className="text- text-emerald-400">+3 vs ayer</div>
          </div>
          <div className="rounded- bg-[#101012] border border-white/10 p-5">
            <div className="text- text-white/40 tracking-widest">INGRESOS</div>
            <div className="mt-2 text- font-black">$1,068</div>
            <div className="text- text-white/40">MXN</div>
          </div>
          <div className="rounded- bg-[#E8C547] text-black p-5">
            <div className="text- font-black tracking-widest opacity-60">CÓDIGO ACTIVO</div>
            <div className="mt-2 text- font-black tracking-widest">8421</div>
            <div className="text-">Capulhuac → Santiago</div>
          </div>
          <div className="rounded- bg-[#101012] border border-white/10 p-5">
            <div className="text- text-white/40 tracking-widest">CONDUCTORES</div>
            <div className="mt-2 text- font-black">4</div>
            <div className="text- text-emerald-400">2 en viaje</div>
          </div>
        </div>

        <div className="mt-6 rounded- bg-[#101012] border border-white/10 p-6">
          <div className="font-bold">Próximo paso: conectar a Supabase</div>
          <div className="mt-2 text-white/50 text-">Aquí verás los viajes reales de la tabla `trips`. Ya tienes `supabase.ts` listo, solo falta cambiar el código estático 8421 por datos reales.</div>
        </div>
      </div>
    </div>
  )
}