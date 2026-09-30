import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PanicButton from '../components/PanicButton'

export default function DriverApp() {
  const { user, loginGoogle, loginEmail, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [viajes, setViajes] = useState<any[]>([])
  const [codigoInput, setCodigoInput] = useState('')
  const [driverInfo, setDriverInfo] = useState<any>(null)
  const [vehicleInfo, setVehicleInfo] = useState<any>(null)
  const [viajeActivo, setViajeActivo] = useState<any>(null)

  useEffect(() => {
    cargarPerfil()
    cargarViajes()
    const sub = supabase.channel('trips-driver').on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => cargarViajes()).subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [user])

  const cargarPerfil = async () => {
    if (!user) return
    const { data: d } = await supabase.from('drivers').select('*, vehicles(*)').eq('id', user.id).single()
    if (d) {
      setDriverInfo(d)
      if (d.vehicles && d.vehicles.length > 0) setVehicleInfo(d.vehicles[0])
    }
  }

  const cargarViajes = async () => {
    const { data } = await supabase.from('trips').select('*').eq('status', 'buscando').order('created_at', { ascending: false }).limit(20)
    if (data) setViajes(data)
  }

  const aceptarViaje = async (codigo: number) => {
    const { data } = await supabase.from('trips').update({ status: 'en_camino', driver_id: user?.id }).eq('codigo', codigo).select().single()
    if (data) setViajeActivo(data)
  }

  const buscarPorCodigo = async () => {
    if (!codigoInput) return
    const { data } = await supabase.from('trips').select('*').eq('codigo', parseInt(codigoInput)).single()
    if (data) setViajes([data]); else alert('Código no encontrado')
  }

  const finalizarViaje = async () => {
    if (!viajeActivo) return
    await supabase.from('trips').update({ status: 'completado' }).eq('codigo', viajeActivo.codigo)
    setViajeActivo(null)
    cargarViajes()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="bg-zinc-900 p-8 rounded-2xl border text-center max-w-sm w-full">
          <div className="text-4xl mb-4">🚐</div>
          <div className="font-black text-lg">CONDUCTOR - PLATAFORMA MOVILIDAD CAPULHUAC</div>
          <div className="text- text-white/50 mt-2 mb-4">Tu error es porque Google no está activado en Supabase. Usa correo por mientras.</div>

          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu correo" className="w-full p-3 rounded-full bg-black border border-zinc-700 text-sm mb-2" />
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="contraseña" className="w-full p-3 rounded-full bg-black border border-zinc-700 text-sm mb-3" />
          <button onClick={()=>loginEmail(email, pass)} className="w-full bg-white text-black py-3 rounded-full font-black text-sm mb-2">ENTRAR CON CORREO</button>
          <button onClick={loginGoogle} className="w-full bg-zinc-800 text-white py-3 rounded-full font-black text-sm border border-zinc-700">Login con Google - Conductor</button>
          <div className="text- text-white/30 mt-3">Si no tienes cuenta, se crea automático al poner correo y pass</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="bg-zinc-900 p-3 rounded-xl border flex justify-between items-center mb-4">
        <div><div className="font-black text-sm">CONDUCTOR PANEL</div><div className="text- text-white/50">{user.email}</div></div>
        <button onClick={logout} className="text- bg-zinc-800 px-3 py-1 rounded-full">Salir</button>
      </div>
      <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 mb-4">
        <div className="text-xs font-black mb-2">MI UNIDAD</div>
        <div className="text-sm">{driverInfo?.nombre || 'Conductor verificado'} • {vehicleInfo?.placas || 'PQR-123'} • {vehicleInfo?.modelo || 'Urvan Blanca'}</div>
      </div>
      {viajeActivo && (
        <div className="bg-green-900/30 p-4 rounded-xl border border-green-500/50 mb-4">
          <div className="font-black text-sm text-green-400">VIAJE EN CURSO - {viajeActivo.codigo}</div>
          <div className="text-xs mt-1">A: {viajeActivo.destino}</div>
          <button onClick={finalizarViaje} className="w-full mt-3 bg-green-500 text-black py-3 rounded-full font-black text-sm">✓ FINALIZAR VIAJE</button>
          <div className="mt-3"><PanicButton codigo={viajeActivo.codigo} tipo="conductor" /></div>
        </div>
      )}
      <div className="bg-zinc-900 p-3 rounded-xl border flex gap-2 mb-4">
        <input value={codigoInput} onChange={e=>setCodigoInput(e.target.value)} placeholder="Código pasajero" className="flex-1 p-3 rounded-full bg-black border border-zinc-700 text-sm" />
        <button onClick={buscarPorCodigo} className="bg-white text-black px-5 rounded-full font-black text-xs">BUSCAR</button>
      </div>
      <div className="text-xs font-black mb-2">VIAJES DISPONIBLES ({viajes.length})</div>
      {viajes.map(v => (
        <div key={v.id} className="bg-zinc-900 p-3 rounded-xl border border-white/10 mb-2">
          <div className="font-black text-sm">Código {v.codigo} - ${v.tarifa}</div>
          <div className="text- text-white/60">A: {v.destino}</div>
          <button onClick={()=>aceptarViaje(v.codigo)} className="w-full mt-3 bg-blue-600 text-white py-2 rounded-full font-black text-xs">ACEPTAR VIAJE</button>
        </div>
      ))}
      <div className="mt-6"><PanicButton codigo={viajeActivo?.codigo || 0} tipo="conductor" /></div>
    </div>
  )
}