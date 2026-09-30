import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const [trips, setTrips] = useState([])

  useEffect(() => {
    supabase.from('trips').select('*').eq('status','completado').then(({data}) => {
      setTrips(data || [])
    })
  }, [])

  const total = trips.reduce((sum, t) => sum + (t.tarifa || 0), 0)

  return (
    <div style={{minHeight:'100vh', background:'#0a0a0a', color:'white', padding:24, fontFamily:'system-ui'}}>
      <h1 style={{fontSize:28, fontWeight:900}}>MOVI+ <span style={{color:'#00ff88'}}>Admin</span></h1>
      
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:24}}>
        <div style={{background:'#151515', border:'1px solid #222', borderRadius:16, padding:20}}>
          <p style={{color:'#888', fontSize:12, margin:0}}>VIAJES COMPLETADOS</p>
          <p style={{fontSize:42, fontWeight:900, margin:'8px 0 0 0'}}>{trips.length}</p>
        </div>
        <div style={{background:'#00ff88', borderRadius:16, padding:20, color:'black'}}>
          <p style={{color:'#00000088', fontSize:12, margin:0, fontWeight:700}}>GANANCIAS TOTALES</p>
          <p style={{fontSize:42, fontWeight:900, margin:'8px 0 0 0'}}>${total}</p>
        </div>
      </div>

      <div style={{marginTop:32, background:'#151515', borderRadius:16, padding:20}}>
        <h3 style={{margin:'0 0 16px 0'}}>Últimos viajes</h3>
        {trips.map(t => (
          <div key={t.id} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #222'}}>
            <span><b style={{color:'#00ff88'}}>{t.codigo}</b> {t.origen} → {t.destino}</span>
            <span style={{fontWeight:700}}>${t.tarifa}</span>
          </div>
        ))}
        {trips.length === 0 && <p style={{color:'#666'}}>Aún no hay viajes completados</p>}
      </div>
    </div>
  )
}