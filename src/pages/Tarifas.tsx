import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'

interface Ruta {
  id: string
  origen: string
  destino: string
  precio: number
  tiempo: number
  tipo: 'LIBRE' | 'CUOTA'
}

interface TarifasConfig {
  base: number
  porKm: number
  porMin: number
  minimo: number
  comision: number
  iva: number
  precioLibre: number
  precioCuota: number
  precioPausar: number
}

export default function Tarifas() {
  const [config, setConfig] = useState<TarifasConfig>({
    base: 50,
    porKm: 12,
    porMin: 3.5,
    minimo: 80,
    comision: 15,
    iva: 16,
    precioLibre: 0,
    precioCuota: 45,
    precioPausar: 30
  })

  const [rutas, setRutas] = useState<Ruta[]>([
    { id: '1', origen: 'Capulhuac', destino: 'Amecameca', precio: 800, tiempo: 133, tipo: 'LIBRE' },
    { id: '2', origen: 'Capulhuac', destino: 'Mercado Municipal Tepoztlan', precio: 961, tiempo: 81, tipo: 'CUOTA' },
    { id: '3', origen: 'Capulhuac', destino: 'Toluca Centro', precio: 450, tiempo: 45, tipo: 'LIBRE' },
    { id: '4', origen: 'Capulhuac', destino: 'CDMX Observatorio', precio: 1200, tiempo: 95, tipo: 'CUOTA' },
  ])

  const [nuevaRuta, setNuevaRuta] = useState<Omit<Ruta, 'id'>>({
    origen: 'Capulhuac',
    destino: '',
    precio: 0,
    tiempo: 0,
    tipo: 'LIBRE'
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Cargar de Firebase
  useEffect(() => {
    const cargar = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'configuracion', 'tarifas'))
        if (configDoc.exists()) {
          setConfig(configDoc.data() as TarifasConfig)
        }
        const rutasSnap = await getDocs(collection(db, 'rutas'))
        if (!rutasSnap.empty) {
          setRutas(rutasSnap.docs.map(d => ({ id: d.id, ...d.data() } as Ruta)))
        }
      } catch (e) {
        console.log('Usando datos locales, no hay Firestore aún', e)
      }
      setLoading(false)
    }
    cargar()
  }, [])

  const guardarConfig = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'configuracion', 'tarifas'), config)
      // Guardar rutas
      for (const ruta of rutas) {
        await setDoc(doc(db, 'rutas', ruta.id), ruta)
      }
      alert('✅ Tarifas guardadas en Firebase correctamente')
    } catch (e: any) {
      console.error(e)
      alert('Guardado local (Firebase aún sin reglas): ' + e.message)
      localStorage.setItem('tarifas_config', JSON.stringify(config))
      localStorage.setItem('tarifas_rutas', JSON.stringify(rutas))
    }
    setSaving(false)
  }

  const agregarRuta = () => {
    if (!nuevaRuta.destino || !nuevaRuta.precio) {
      alert('Pon destino y precio')
      return
    }
    const id = Date.now().toString()
    setRutas([...rutas, { ...nuevaRuta, id }])
    setNuevaRuta({ origen: 'Capulhuac', destino: '', precio: 0, tiempo: 0, tipo: 'LIBRE' })
  }

  const eliminarRuta = async (id: string) => {
    setRutas(rutas.filter(r => r.id !== id))
    try {
      await deleteDoc(doc(db, 'rutas', id))
    } catch {}
  }

  const actualizarRuta = (id: string, campo: keyof Ruta, valor: any) => {
    setRutas(rutas.map(r => r.id === id ? { ...r, [campo]: valor } : r))
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Cargando tarifas...</div>
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-6">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-wider">CONFIGURACIÓN DE TARIFAS</h1>
            <p className="text-gray-400 text-sm mt-1">PLATAFORMA MOVILIDAD CAPULHUAC • Admin Panel</p>
          </div>
          <button
            onClick={guardarConfig}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-full font-bold text-sm tracking-wide disabled:opacity-50"
          >
            {saving ? 'GUARDANDO...' : '💾 GUARDAR EN FIREBASE'}
          </button>
        </div>

        {/* CARDS DE CONFIG GLOBAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-4 text-gray-300">SERVICIO EJECUTIVO</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Tarifa Base MXN</label>
                <input type="number" value={config.base} onChange={e => setConfig({...config, base: Number(e.target.value)})}
                  className="w-full mt-1 bg-black border border-[#333] rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">$ por KM</label>
                  <input type="number" value={config.porKm} onChange={e => setConfig({...config, porKm: Number(e.target.value)})}
                    className="w-full mt-1 bg-black border border-[#333] rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">$ por Min</label>
                  <input type="number" step="0.1" value={config.porMin} onChange={e => setConfig({...config, porMin: Number(e.target.value)})}
                    className="w-full mt-1 bg-black border border-[#333] rounded-xl px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Mínimo</label>
                <input type="number" value={config.minimo} onChange={e => setConfig({...config, minimo: Number(e.target.value)})}
                  className="w-full mt-1 bg-black border border-[#333] rounded-xl px-3 py-2" />
              </div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-4 text-gray-300">TIPOS DE SERVICIO</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-black border border-[#222] rounded-xl px-3 py-3">
                <span className="text-sm">LIBRE</span>
                <input type="number" value={config.precioLibre} onChange={e => setConfig({...config, precioLibre: Number(e.target.value)})}
                  className="w-20 bg-[#111] border border-[#333] rounded-lg px-2 py-1 text-right" />
              </div>
              <div className="flex justify-between items-center bg-black border border-[#222] rounded-xl px-3 py-3">
                <span className="text-sm">CUOTA</span>
                <input type="number" value={config.precioCuota} onChange={e => setConfig({...config, precioCuota: Number(e.target.value)})}
                  className="w-20 bg-[#111] border border-[#333] rounded-lg px-2 py-1 text-right" />
              </div>
              <div className="flex justify-between items-center bg-black border border-[#222] rounded-xl px-3 py-3">
                <span className="text-sm">PAUSAR</span>
                <input type="number" value={config.precioPausar} onChange={e => setConfig({...config, precioPausar: Number(e.target.value)})}
                  className="w-20 bg-[#111] border border-[#333] rounded-lg px-2 py-1 text-right" />
              </div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-4 text-gray-300">COMISIONES</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">% Plataforma</label>
                <input type="number" value={config.comision} onChange={e => setConfig({...config, comision: Number(e.target.value)})}
                  className="w-full mt-1 bg-black border border-[#333] rounded-xl px-3 py-2" />
                <p className="text-[11px] text-gray-500 mt-1">Se descuenta de cada viaje</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">IVA %</label>
                <input type="number" value={config.iva} onChange={e => setConfig({...config, iva: Number(e.target.value)})}
                  className="w-full mt-1 bg-black border border-[#333] rounded-xl px-3 py-2" />
              </div>
              <div className="bg-blue-600/20 border border-blue-600/30 rounded-xl p-3 mt-4">
                <p className="text-xs text-blue-300">Ejemplo: Viaje $800</p>
                <p className="text-sm font-bold mt-1">Tu ganancia: ${(800 * (1 - config.comision/100)).toFixed(0)} MXN</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE RUTAS */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-5">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold">TARIFAS POR RUTA • {rutas.length} rutas</h3>
            <span className="text-xs bg-[#222] px-3 py-1 rounded-full">Editable en tiempo real</span>
          </div>

          {/* Agregar nueva */}
          <div className="grid grid-cols-12 gap-2 mb-4 bg-black border border-dashed border-[#333] rounded-xl p-3">
            <input value={nuevaRuta.origen} onChange={e => setNuevaRuta({...nuevaRuta, origen: e.target.value})}
              placeholder="Origen" className="col-span-3 bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm" />
            <input value={nuevaRuta.destino} onChange={e => setNuevaRuta({...nuevaRuta, destino: e.target.value})}
              placeholder="Destino (Ej: Chalco)" className="col-span-3 bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm" />
            <input type="number" value={nuevaRuta.precio || ''} onChange={e => setNuevaRuta({...nuevaRuta, precio: Number(e.target.value)})}
              placeholder="$" className="col-span-2 bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm" />
            <input type="number" value={nuevaRuta.tiempo || ''} onChange={e => setNuevaRuta({...nuevaRuta, tiempo: Number(e.target.value)})}
              placeholder="min" className="col-span-1 bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm" />
            <select value={nuevaRuta.tipo} onChange={e => setNuevaRuta({...nuevaRuta, tipo: e.target.value as any})}
              className="col-span-2 bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-sm">
              <option>LIBRE</option>
              <option>CUOTA</option>
            </select>
            <button onClick={agregarRuta} className="col-span-1 bg-white text-black rounded-lg font-bold">+</button>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            {rutas.map(ruta => (
              <div key={ruta.id} className="grid grid-cols-12 gap-2 items-center bg-black border border-[#1f1f1f] rounded-xl p-2 hover:border-[#333]">
                <input value={ruta.origen} onChange={e => actualizarRuta(ruta.id, 'origen', e.target.value)}
                  className="col-span-3 bg-transparent px-2 py-2 text-sm outline-none" />
                <input value={ruta.destino} onChange={e => actualizarRuta(ruta.id, 'destino', e.target.value)}
                  className="col-span-3 bg-transparent px-2 py-2 text-sm outline-none font-medium" />
                <div className="col-span-2 flex items-center">
                  <span className="text-xs text-gray-500 mr-1">$</span>
                  <input type="number" value={ruta.precio} onChange={e => actualizarRuta(ruta.id, 'precio', Number(e.target.value))}
                    className="w-full bg-[#111] border border-[#222] rounded-lg px-2 py-1.5 text-sm" />
                </div>
                <input type="number" value={ruta.tiempo} onChange={e => actualizarRuta(ruta.id, 'tiempo', Number(e.target.value))}
                  className="col-span-1 bg-[#111] border border-[#222] rounded-lg px-2 py-1.5 text-sm text-center" />
                <select value={ruta.tipo} onChange={e => actualizarRuta(ruta.id, 'tipo', e.target.value)}
                  className={`col-span-2 rounded-lg px-2 py-1.5 text-xs font-bold border ${ruta.tipo === 'LIBRE' ? 'bg-blue-900/30 border-blue-600 text-blue-300' : 'bg-orange-900/30 border-orange-600 text-orange-300'}`}>
                  <option>LIBRE</option>
                  <option>CUOTA</option>
                </select>
                <button onClick={() => eliminarRuta(ruta.id)} className="col-span-1 text-red-500 hover:bg-red-900/20 rounded-lg py-1.5">✕</button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <div className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-xl p-3">
              <p className="text-xs text-gray-500">Total Rutas LIBRE: {rutas.filter(r=>r.tipo==='LIBRE').length}</p>
              <p className="text-xs text-gray-500 mt-1">Total Rutas CUOTA: {rutas.filter(r=>r.tipo==='CUOTA').length}</p>
            </div>
            <div className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-xl p-3">
              <p className="text-xs text-gray-500">Promedio Precio: ${(rutas.reduce((a,b)=>a+b.precio,0)/rutas.length || 0).toFixed(0)} MXN</p>
              <p className="text-xs text-gray-500 mt-1">Ingreso estimado día: ${(rutas.reduce((a,b)=>a+b.precio,0)*2).toFixed(0)} MXN</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-6">Plataforma Movilidad Capulhuac • Configuración guardada en Firebase Firestore • movi-movilidad.firebaseapp.com</p>
      </div>
    </div>
  )
}
