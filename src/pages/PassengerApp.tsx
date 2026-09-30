import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import { buscarYAprenderDestino } from '../config/tarifas'
import { useAuth } from '../context/AuthContext'
import PanicButton from '../components/PanicButton'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const COLORES = ['#3b82f6', '#ef4444', '#22c55e', '#eab308']

function MapEvents({ onClickMapa }: any) {
  useMapEvents({ click(e) { onClickMapa(e.latlng.lat, e.latlng.lng) } });
  return null
}

function hablar(texto: string, rate = 0.95) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const msg = new SpeechSynthesisUtterance(texto)
  msg.lang = 'es-MX'
  msg.rate = rate
  msg.pitch = 1.0
  msg.volume = 1
  window.speechSynthesis.speak(msg)
}

function playSonido(tipo: 'bienvenida' | 'mitad' | 'llegada', destino: string, unidad: number, duracion: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }
    if (tipo === 'bienvenida') {
      playTone(523, 0, 0.3)
      playTone(659, 0.25, 0.3)
      playTone(784, 0.5, 0.5)
      setTimeout(() => {
        hablar(`Bienvenido a Servicios de Plataforma Movilidad Capulhuac. Unidad ${unidad} con destino a ${destino}. Le deseamos un buen viaje. Duración estimada: ${duracion} minutos. Por favor, abróchese el cinturón de seguridad y disfrute del recorrido. Gracias por su confianza.`)
      }, 700)
    } else if (tipo === 'mitad') {
      playTone(600, 0, 0.2)
      setTimeout(() => {
        hablar(`Vamos a mitad de camino hacia ${destino}. Unidad ${unidad}. Le recordamos mantener sus pertenencias a la vista.`)
      }, 300)
    } else {
      playTone(523, 0, 0.3)
      playTone(659, 0.3, 0.3)
      playTone(784, 0.6, 0.6)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400])
      setTimeout(() => {
        hablar(`Gracias por usar nuestros servicios de Plataforma Movilidad Capulhuac. Unidad ${unidad} ha llegado a su destino: ${destino}. Por favor, revise que no olvide ninguna pertenencia antes de bajar de la unidad. Verifique su asiento y portaobjetos. Que tenga un excelente día. Le esperamos pronto. Gracias por su preferencia.`)
      }, 800)
    }
  } catch {
    if (tipo === 'bienvenida') hablar(`Bienvenido a Servicios de Plataforma Movilidad Capulhuac. Unidad ${unidad} con destino a ${destino}.`)
    else if (tipo === 'llegada') hablar(`Gracias por usar Plataforma Movilidad Capulhuac. Llegamos a ${destino}. Revise sus pertenencias.`)
  }
}

export default function PassengerApp() {
  const { user, loginGoogle, logout } = useAuth()
  const [unidades, setUnidades] = useState(2)
  const [destinos, setDestinos] = useState(['amecameca', 'Mercado Municipal Tepoztlan'])
  const [tiposCobro, setTiposCobro] = useState(['efectivo','efectivo'])
  const [esCuota, setEsCuota] = useState([false, true])
  const [costosCaseta, setCostosCaseta] = useState([0, 161])
  const [preciosBase, setPreciosBase] = useState([0,0])
  const [preciosFinal, setPreciosFinal] = useState([0,0])
  const [distancias, setDistancias] = useState([0,0])
  const [duraciones, setDuraciones] = useState([0,0])
  const [origenes, setOrigenes] = useState(['',''])
  const [coords, setCoords] = useState({ lat: 19.1936, lng: -99.4612 })
  const [trazos, setTrazos] = useState<any[]>([])
  const [destCoords, setDestCoords] = useState<any[]>([])
  const [driverCoords, setDriverCoords] = useState<any[]>([null, null])
  const [simulando, setSimulando] = useState<boolean[]>([false, false])
  const [progreso, setProgreso] = useState<number[]>([0, 0])
  const progresoRef = useRef<number[]>([0,0,0,0])
  const trazosRef = useRef<any[]>([])
  const intervalRefs = useRef<any[]>([])
  const avisadoMitad = useRef<boolean[]>([false,false,false,false])
  const [direccionOrigen, setDireccionOrigen] = useState('Capulhuac Centro')
  const [seleccionandoMapa, setSeleccionandoMapa] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [codigos, setCodigos] = useState<number[]>([])
  const [llegadas, setLlegadas] = useState<boolean[]>([false, false])
  const [driverInfo, setDriverInfo] = useState<any>(null)
  const [vehicleInfo, setVehicleInfo] = useState<any>(null)

  useEffect(() => {
    window.speechSynthesis.getVoices()
    navigator.geolocation.getCurrentPosition((p) => {
      setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      obtenerDireccionOrigen(p.coords.latitude, p.coords.longitude)
    })
  }, [])

  const obtenerDireccionOrigen = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.display_name) setDireccionOrigen(data.display_name.split(',').slice(0,3).join(', '))
    } catch {}
  }

  const manejarMovimientoPin = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    obtenerDireccionOrigen(lat, lng)
  }

  useEffect(() => {
    const calcular = async () => {
      const nBase: number[] = [];
      const nFinal: number[] = [];
      const nDists: number[] = [];
      const nDur: number[] = [];
      const nOrig: string[] = [];
      const nTrazos: any[] = [];
      const nDestCoords: any[] = []
      for (let i = 0; i < destinos.length; i++) {
        const texto = destinos[i]
        if (!texto.trim()) {
          nBase.push(0); nFinal.push(0); nDists.push(0); nDur.push(0); nOrig.push(''); nTrazos.push([]); nDestCoords.push(null); continue
        }
        const res = await buscarYAprenderDestino(supabase, texto, coords.lat, coords.lng)
        if (res) {
          const caseta = esCuota[i]? (costosCaseta[i] || res.casetaAuto || 0) : 0;
          nBase.push(res.precio); nFinal.push(res.precio + caseta); nDists.push(res.dist); nDur.push(res.duracion); nOrig.push(res.origen); nTrazos.push(res.trazo); nDestCoords.push([res.lat, res.lng])
        } else {
          nBase.push(0); nFinal.push(0); nDists.push(0); nDur.push(0); nOrig.push('❌'); nTrazos.push([]); nDestCoords.push(null)
        }
      }
      setPreciosBase(nBase); setPreciosFinal(nFinal); setDistancias(nDists); setDuraciones(nDur); setOrigenes(nOrig); setTrazos(nTrazos); setDestCoords(nDestCoords)
      trazosRef.current = nTrazos
    }
    const t = setTimeout(calcular, 600);
    return () => clearTimeout(t)
  }, [destinos, esCuota, costosCaseta, coords])

  useEffect(() => {
    const cargarDriverDemo = async () => {
      const { data } = await supabase.from('drivers').select('*, vehicles(*)').limit(1).single()
      if (data) {
        setDriverInfo(data)
        if (data.vehicles && data.vehicles.length > 0) setVehicleInfo(data.vehicles[0])
      }
    }
    if (codigos.length > 0) cargarDriverDemo()
  }, [codigos])

  const iniciarSimulacion = (index: number) => {
    const trazoActual = trazosRef.current[index] || trazos[index]
    if (!trazoActual || trazoActual.length === 0) return alert('Espera que cargue la ruta')
    if (intervalRefs.current[index]) clearInterval(intervalRefs.current[index])
    progresoRef.current[index] = progresoRef.current[index] || 0
    if (progresoRef.current[index] >= trazoActual.length - 1) {
      progresoRef.current[index] = 0;
      setLlegadas(prev => { const c=[...prev]; c[index]=false; return c });
      avisadoMitad.current[index]=false
    }
    playSonido('bienvenida', destinos[index], index+1, duraciones[index])
    const nuevoSim = [...simulando]; nuevoSim[index] = true; setSimulando(nuevoSim)
    intervalRefs.current[index] = setInterval(() => {
      const max = trazoActual.length - 1
      progresoRef.current[index] += 2
      if (!avisadoMitad.current[index] && progresoRef.current[index] >= max * 0.5) {
        avisadoMitad.current[index] = true
        playSonido('mitad', destinos[index], index+1, duraciones[index])
      }
      if (progresoRef.current[index] >= max) {
        progresoRef.current[index] = max
        clearInterval(intervalRefs.current[index])
        setSimulando(prev => { const c = [...prev]; c[index] = false; return c })
        setLlegadas(prev => { const c=[...prev]; c[index]=true; return c })
        playSonido('llegada', destinos[index], index+1, duraciones[index])
      }
      const pos = Math.floor(progresoRef.current[index])
      const punto = trazoActual[pos]
      setProgreso([...progresoRef.current])
      setDriverCoords(prev => { const c = [...prev]; c[index] = { lat: punto[0], lng: punto[1] }; return c })
    }, 120)
  }

  const detenerSimulacion = (index: number) => {
    if (intervalRefs.current[index]) clearInterval(intervalRefs.current[index]);
    setSimulando(prev => { const c = [...prev]; c[index] = false; return c })
  }

  const reiniciarSimulacion = (index: number) => {
    if (intervalRefs.current[index]) clearInterval(intervalRefs.current[index]);
    progresoRef.current[index] = 0;
    avisadoMitad.current[index]=false;
    setProgreso([...progresoRef.current]);
    setDriverCoords(prev => { const c = [...prev]; c[index] = null; return c });
    setSimulando(prev => { const c = [...prev]; c[index] = false; return c });
    setLlegadas(prev => { const c=[...prev]; c[index]=false; return c })
  }

  const handleClickMapa = async (lat: number, lng: number) => {
    if (seleccionandoMapa!== null) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        const nombre = data.display_name? data.display_name.split(',')[0] : `Punto`;
        const copia = [...destinos];
        copia[seleccionandoMapa] = nombre.trim();
        setDestinos(copia)
      } catch {};
      setSeleccionandoMapa(null);
      return
    };
    manejarMovimientoPin(lat, lng)
  }

  const borrarServicio = (index: number) => {
    if (intervalRefs.current[index]) clearInterval(intervalRefs.current[index]);
    setDestinos(destinos.filter((_, i) => i!== index));
    setTiposCobro(tiposCobro.filter((_, i) => i!== index));
    setEsCuota(esCuota.filter((_, i) => i!== index));
    setCostosCaseta(costosCaseta.filter((_, i) => i!== index));
    setDriverCoords(driverCoords.filter((_, i) => i!== index));
    setProgreso(progreso.filter((_, i) => i!== index));
    setSimulando(simulando.filter((_, i) => i!== index));
    setLlegadas(llegadas.filter((_, i) => i!== index));
    progresoRef.current.splice(index,1);
    trazosRef.current.splice(index,1);
    setUnidades(prev => Math.max(1, prev - 1))
  }

  const agregarServicio = () => {
    if (unidades >= 4) return;
    setDestinos([...destinos, '']);
    setTiposCobro([...tiposCobro, 'efectivo']);
    setEsCuota([...esCuota, false]);
    setCostosCaseta([...costosCaseta, 0]);
    setDriverCoords([...driverCoords, null]);
    setProgreso([...progreso, 0]);
    setSimulando([...simulando, false]);
    setLlegadas([...llegadas, false]);
    progresoRef.current.push(0);
    setUnidades(unidades + 1)
  }

  const solicitarViaje = async () => {
    hablar(`Bienvenido a Servicios de Plataforma Movilidad Capulhuac. Estamos preparando sus ${unidades} unidades desde ${direccionOrigen}. En breve iniciamos. Gracias por elegirnos.`, 0.95)
    setLoading(true);
    const nuevosCodigos: number[] = [];
    const grupo = Math.random().toString(36).substring(2,7).toUpperCase();
    for (let i = 0; i < unidades; i++) {
      const codigo = Math.floor(1000+Math.random()*9000);
      const { data } = await supabase.from('trips').insert({
        origen: direccionOrigen,
        destino: destinos[i],
        codigo,
        status: 'buscando',
        pasajero_nombre: `U${i+1}/${unidades} G${grupo} $${preciosFinal[i]}`,
        tarifa: preciosFinal[i],
        lat_origen: coords.lat,
        lng_origen: coords.lng,
        tipo_pago: tiposCobro[i]
      }).select().single();
      if (data) nuevosCodigos.push(data.codigo)
    };
    setCodigos(nuevosCodigos);
    setLoading(false)
  }

  const total = preciosFinal.slice(0, unidades).reduce((a,b)=>a+b,0)
  const codigoPanic = codigos.length > 0? codigos[0] : 0

  return (
    <div className="min-h-screen bg-black text-white">
      {!user? (
        <div className="bg-zinc-900 p-3 flex justify-between items-center border-b border-white/10">
          <div className="text-xs">🔒 Inicia sesión para seguridad</div>
          <button onClick={loginGoogle} className="bg-white text-black px-4 py-2 rounded-full text-xs font-black">Login con Google</button>
        </div>
      ) : (
        <div className="bg-blue-900/30 p-3 flex justify-between items-center border-b border-blue-500/30">
          <div className="text-xs">👤 {user.email} - Verificado ✓</div>
          <button onClick={logout} className="text- bg-zinc-800 px-3 py-1 rounded-full">Salir</button>
        </div>
      )}

      <div style={{ height: '380px', position: 'relative' }}>
        <MapContainer center={[coords.lat, coords.lng]} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents onClickMapa={handleClickMapa} />
          <Marker draggable={true} position={[coords.lat, coords.lng]} eventHandlers={{ dragend: (e:any) => { const p = e.target.getLatLng(); manejarMovimientoPin(p.lat, p.lng) } }} />
          {destCoords.map((dc: any, i: number) => dc && <Marker key={`dest-${i}`} position={dc} icon={L.divIcon({ html: `<div style="background:${COLORES[i]}; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; border:2px solid white;">${i+1}</div>`, className: '' })} />)}
          {trazos.map((t: any, i: number) => t?.length > 0 && <Polyline key={`trazo-${i}`} positions={t} pathOptions={{ color: COLORES[i], weight: 5, opacity: 0.35, dashArray: esCuota[i]? undefined : "10 10" }} />)}
          {trazos.map((t: any, i: number) => t?.length > 0 && progreso[i] > 0 && <Polyline key={`prog-${i}`} positions={t.slice(0, progreso[i])} pathOptions={{ color: COLORES[i], weight: 8, opacity: 1 }} />)}
          {driverCoords.map((dc: any, i: number) => dc && <Marker key={`driver-${i}`} position={[dc.lat, dc.lng]} icon={L.divIcon({ html: `<div style="background:${llegadas[i]? '#22c55e' : 'black'}; border:3px solid ${llegadas[i]? 'white' : COLORES[i]}; width:${llegadas[i]? '52px' : '42px'}; height:${llegadas[i]? '52px' : '42px'}; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:${llegadas[i]? '26px' : '18px'}; box-shadow:0 0 15px ${COLORES[i]};">${llegadas[i]? '✓' : '🚐'}</div>`, className: '' })} />)}
        </MapContainer>
        {simulando.some(s=>s) && <div className="absolute top-2 left-2 right-2 bg-blue-600 text-white p-2 rounded-xl font-bold text-center z-[1000] text-xs">🔊 Unidad en tránsito - Plataforma Movilidad Capulhuac</div>}
        {llegadas.some(l=>l) && <div className="absolute top-12 left-2 right-2 bg-green-600 text-white p-3 rounded-xl font-black text-center z-[1000]">✓ Llegada - Revise sus pertenencias</div>}
      </div>

      <div className="p-4">
        <div className="bg-zinc-900 p-3 rounded-xl border text-center">
          <div className="text-sm font-black tracking-wider">PLATAFORMA MOVILIDAD CAPULHUAC</div>
          <div className="text- text-white/50">SERVICIO EJECUTIVO • {unidades} unidades • ${total} MXN</div>
        </div>

        {destinos.slice(0, unidades).map((d,i)=>(
          <div key={i} className={`mt-3 p-3 rounded-xl border-l-4 ${llegadas[i]? 'bg-green-950/40 border-green-500' : simulando[i]? 'bg-blue-950/20' : 'bg-zinc-900'}`} style={{borderLeftColor: llegadas[i]? '#22c55e' : COLORES[i]}}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text- font-black text-white" style={{background: COLORES[i]}}>{i+1}</span>
                <span className="text- font-bold">{simulando[i]? `En tránsito ${Math.round((progreso[i]/ (trazos[i]?.length||1))*100)}%` : llegadas[i]? 'Destino alcanzado' : `Unidad ${i+1} - ${duraciones[i]} min`}</span>
                <button onClick={()=>borrarServicio(i)} className="text- bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">✕</button>
              </div>
              <div className="font-black">${preciosFinal[i]}</div>
            </div>
            <div className="w-full bg-black h-2 rounded-full mt-2 overflow-hidden">
              <div className="h-full" style={{width: `${trazos[i]? (progreso[i]/(trazos[i].length||1))*100 : 0}%`, background: COLORES[i]}}></div>
            </div>
            <input value={d} onChange={e=>{ const c=[...destinos]; c[i]=e.target.value; setDestinos(c)}} className="w-full mt-3 p-3 rounded-xl bg-black border border-zinc-700 text-sm" placeholder="Destino" />
            <div className="flex gap-2 mt-2">
              <button onClick={()=>setSeleccionandoMapa(i)} className="py-3 px-4 rounded-full text-xs font-bold bg-zinc-800 border border-zinc-600">📍 MAPA</button>
              <button onClick={()=>{ const c=[...esCuota]; c[i]=!c[i]; setEsCuota(c)}} className={`flex-1 py-3 rounded-full text-xs font-bold border ${esCuota[i]?'bg-white text-black':'bg-black text-white border-zinc-600'}`}>{esCuota[i]?`CUOTA`:`LIBRE`}</button>
              {!simulando[i]? (
                llegadas[i]? (
                  <button onClick={()=>reiniciarSimulacion(i)} className="flex-1 py-3 rounded-full text-xs font-black bg-green-600 text-white">↻ REINICIAR</button>
                ) : (
                  <button onClick={()=>iniciarSimulacion(i)} className="flex-1 py-3 rounded-full text-xs font-black text-white" style={{background: COLORES[i]}}>▶ INICIAR VIAJE</button>
                )
              ) : (
                <button onClick={()=>detenerSimulacion(i)} className="flex-1 py-3 rounded-full text-xs font-black bg-zinc-700 text-white">⏸ PAUSAR</button>
              )}
            </div>
          </div>
        ))}

        <button onClick={solicitarViaje} disabled={loading} className="w-full mt-5 py-4 rounded-full bg-white text-black font-black text-sm">{loading?'Procesando...':`SOLICITAR ${unidades} UNIDADES - $${total}`}</button>

        {codigos.length > 0 && (
          <div className="mt-4 bg-zinc-900 p-4 rounded-xl border border-white/10">
            <div className="text-xs font-black tracking-wider mb-2">TU UNIDAD ASIGNADA - VERIFICADA</div>
            {driverInfo? (
              <div className="flex gap-3">
                <img src={driverInfo.foto_url || 'https://i.pravatar.cc/100?img=12'} className="w-14 h-14 rounded-full border-2 border-white" />
                <div className="flex-1">
                  <div className="font-bold text-sm">{driverInfo.nombre} ⭐ 4.9 - Verificado</div>
                  <div className="text- text-white/60">Lic: {driverInfo.licencia} • Tel: {driverInfo.telefono}</div>
                  {vehicleInfo? (
                    <div className="mt-2 space-y-1">
                      <div className="text- font-bold bg-white text-black inline-block px-2 py-0.5 rounded-full">{vehicleInfo.modelo} {vehicleInfo.color} • {vehicleInfo.placas}</div>
                      <div className="text- text-white/50">{vehicleInfo.anio} • {vehicleInfo.capacidad} lugares • Seguro vigente</div>
                    </div>
                  ) : (
                    <div className="text- mt-1">Nissan Urvan Blanca - PQR-123 (demo)</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-white/50">Buscando conductor más cercano... Si no tienes conductores en la tabla, se muestra demo.</div>
            )}
            <div className="mt-3 text- bg-black p-2 rounded-lg border border-zinc-800">Códigos: {codigos.join(', ')} - Comparte con el conductor</div>
          </div>
        )}

        <div className="mt-4">
          <PanicButton codigo={codigoPanic} tipo="pasajero" />
          <div className="text- text-white/40 text-center mt-2">Al presionar se comparte tu ubicación exacta con central de seguridad de Capulhuac y con tu conductor. Úsalo solo en emergencias.</div>
        </div>

      </div>
    </div>
  )
}