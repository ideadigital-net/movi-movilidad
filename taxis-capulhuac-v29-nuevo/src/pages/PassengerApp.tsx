// src/pages/PassengerApp.tsx - V11 LIVE MAP + CASETAS AUTO + FIX DESTINO NO ACTUALIZA + FIX GOOGLE REDIRECT
import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { tarifasBase } from '../config/tarifas'
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { onAuthStateChanged, signInAnonymously, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const CAPULHUAC = { lat: 19.1965, lng: -99.4640 }
const iconOrigen = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [28, 45], iconAnchor: [14, 45] })
const iconDestino = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [28, 45], iconAnchor: [14, 45] })
const iconDestino2 = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [28, 45], iconAnchor: [14, 45] })
const iconDestino3 = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [28, 45], iconAnchor: [14, 45] })
const iconCaseta = new L.DivIcon({ html: '<div style="background:#FF9800; border:3px solid white; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-size:15px; box-shadow:0 3px 10px rgba(0,0,0,0.5);">💰</div>', className: '', iconSize: [34, 34], iconAnchor: [17, 17] })
const iconTaxiLlegando = new L.DivIcon({ html: '<div style="font-size:36px; filter: drop-shadow(0 2px 4px black); animation: bounce 1s infinite;">🚖💨</div><style>@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}</style>', className: '', iconSize: [40, 40], iconAnchor: [20, 20] })

function getDist(a:number,b:number,c:number,d:number){ const R=6371; const dLat=(c-a)*Math.PI/180; const dLng=(d-b)*Math.PI/180; const x=Math.sin(dLat/2)**2 + Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLng/2)**2; return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)) }
function MapController({ center, zoom, bounds }: { center: [number,number], zoom: number, bounds?: [number,number][] }) { const map = useMap(); useEffect(()=>{ if(bounds&&bounds.length>=2){ map.fitBounds(bounds as any, { padding:[50,50] }) } else { map.setView(center, zoom) } }, [center, zoom, bounds]); return null }

const PUEBLOS_REALES: any = {
  'capulhuac': { lat: 19.1965, lng: -99.464, nombre: 'Capulhuac Centro' },
  'oxtotitlan': { lat: 19.21, lng: -99.47, nombre: 'Oxtotitlan' },
  'tianguistenco': { lat: 19.1822, lng: -99.4653, nombre: 'Tianguistenco Centro' },
  'xalatlaco': { lat: 19.191, lng: -99.414, nombre: 'Xalatlaco' },
  'almoloya del rio': { lat: 19.1596, lng: -99.4885, nombre: 'Almoloya del Rio' },
  'techuchulco': { lat: 19.11276, lng: -99.52423, nombre: 'San Pedro Techuchulco' },
  'la marquesa': { lat: 19.2975, lng: -99.493, nombre: 'La Marquesa' },
  'lerma': { lat: 19.285, lng: -99.512, nombre: 'Lerma Centro' },
  'toluca': { lat: 19.2925, lng: -99.6568, nombre: 'Toluca Centro' },
  'metepec': { lat: 19.257, lng: -99.601, nombre: 'Metepec Centro' },
  'tenango': { lat: 19.1047, lng: -99.5883, nombre: 'Tenango del Valle' },
  'santa fe': { lat: 19.357, lng: -99.276, nombre: 'Santa Fe CDMX' },
  'cdmx': { lat: 19.4326, lng: -99.1332, nombre: 'CDMX Centro' },
  'ixtapan': { lat: 18.8445, lng: -99.6795, nombre: 'Ixtapan de la Sal Centro' },
  'taxco': { lat: 18.5546, lng: -99.6059, nombre: 'Taxco Guerrero' },
  'puebla': { lat: 19.0413, lng: -98.2062, nombre: 'Puebla Centro' },
  'queretaro': { lat: 20.5888, lng: -100.3899, nombre: 'Queretaro' },
  'morelia': { lat: 19.7008, lng: -101.1920, nombre: 'Morelia Michoacan' },
  'cuernavaca': { lat: 18.9242, lng: -99.2216, nombre: 'Cuernavaca Morelos' },
  'pachuca': { lat: 20.1010, lng: -98.7591, nombre: 'Pachuca Hidalgo' },
  'poza rica': { lat: 20.5345, lng: -97.4445, nombre: 'Poza Rica Veracruz' },
  'veracruz': { lat: 19.1737, lng: -96.1342, nombre: 'Veracruz Puerto' },
  'xalapa': { lat: 19.54, lng: -96.91, nombre: 'Xalapa Veracruz' },
  'oaxaca': { lat: 17.0654, lng: -96.7236, nombre: 'Oaxaca Centro' },
  'acapulco': { lat: 16.8531, lng: -99.8236, nombre: 'Acapulco Guerrero' },
  'guadalajara': { lat: 20.6597, lng: -103.3496, nombre: 'Guadalajara Jalisco' },
  'san juan de los lagos': { lat: 21.2481, lng: -102.3313, nombre: 'San Juan de los Lagos Jalisco' },
  'san juan': { lat: 21.2481, lng: -102.3313, nombre: 'San Juan de los Lagos Jalisco' },
  'lagos de moreno': { lat: 21.3583, lng: -101.9281, nombre: 'Lagos de Moreno Jalisco' },
  'puerto vallarta': { lat: 20.6534, lng: -105.2253, nombre: 'Puerto Vallarta Jalisco' },
  'tequila': { lat: 20.8818, lng: -103.8365, nombre: 'Tequila Jalisco' },
  'leon': { lat: 21.1221, lng: -101.6637, nombre: 'Leon Guanajuato' },
  'monterrey': { lat: 25.6866, lng: -100.3161, nombre: 'Monterrey Nuevo Leon' },
  'cancun': { lat: 21.1619, lng: -86.8515, nombre: 'Cancun Quintana Roo' },
}

const CASETAS_DB = [
  { id: 'marquesa', nombre: 'La Marquesa', lat: 19.2975, lng: -99.493, costoTaxi: 96 },
  { id: 'tenango', nombre: 'Tenango', lat: 19.1047, lng: -99.5883, costoTaxi: 45 },
  { id: 'tenancingo', nombre: 'Tenancingo', lat: 18.96, lng: -99.59, costoTaxi: 42 },
  { id: 'ixtapan', nombre: 'Ixtapan', lat: 18.8445, lng: -99.68, costoTaxi: 55 },
  { id: 'pilcaya', nombre: 'Pilcaya', lat: 18.71, lng: -99.65, costoTaxi: 38 },
  { id: 'taxco', nombre: 'Taxco', lat: 18.60, lng: -99.61, costoTaxi: 32 },
  { id: 'tlaLpan', nombre: 'Tlalpan', lat: 19.29, lng: -99.17, costoTaxi: 138 },
  { id: 'alpuyeca', nombre: 'Alpuyeca', lat: 18.74, lng: -99.25, costoTaxi: 78 },
  { id: 'paso_morelos', nombre: 'Paso Morelos', lat: 18.25, lng: -99.55, costoTaxi: 155 },
  { id: 'la_venta', nombre: 'La Venta', lat: 17.05, lng: -99.65, costoTaxi: 132 },
  { id: 'tepozotlan', nombre: 'Tepozotlan', lat: 19.71, lng: -99.22, costoTaxi: 98 },
  { id: 'palmillas', nombre: 'Palmillas', lat: 20.05, lng: -99.85, costoTaxi: 88 },
  { id: 'queretaro', nombre: 'Queretaro', lat: 20.55, lng: -100.35, costoTaxi: 55 },
  { id: 'huimilpan', nombre: 'Huimilpan', lat: 20.37, lng: -100.27, costoTaxi: 45 },
  { id: 'zinap_ec', nombre: 'Zinapecuaro', lat: 19.92, lng: -100.62, costoTaxi: 72 },
  { id: 'morelia_entrada', nombre: 'Morelia', lat: 19.78, lng: -101.25, costoTaxi: 58 },
  { id: 'atlacomulco', nombre: 'Atlacomulco', lat: 19.795, lng: -99.874, costoTaxi: 92 },
  { id: 'el_dorado', nombre: 'El Dorado', lat: 19.85, lng: -100.15, costoTaxi: 65 },
  { id: 'maravatio', nombre: 'Maravatio', lat: 19.90, lng: -100.44, costoTaxi: 78 },
  { id: 'zinapecuaro', nombre: 'Zinapecuaro', lat: 19.86, lng: -100.82, costoTaxi: 52 },
  { id: 'panindicuaro', nombre: 'Panindicuaro', lat: 20.00, lng: -101.75, costoTaxi: 85 },
  { id: 'ocotlan', nombre: 'Ocotlan', lat: 20.35, lng: -102.77, costoTaxi: 105 },
  { id: 'zapotlanejo', nombre: 'Zapotlanejo', lat: 20.62, lng: -103.07, costoTaxi: 48 },
  { id: 'arenal', nombre: 'Arenal', lat: 20.77, lng: -103.69, costoTaxi: 45 },
  { id: 'santa_cruz', nombre: 'Santa Cruz', lat: 20.85, lng: -103.85, costoTaxi: 38 },
  { id: 'san_marcos', nombre: 'San Marcos', lat: 19.32, lng: -98.76, costoTaxi: 145 },
  { id: 'san_martin', nombre: 'San Martin', lat: 19.28, lng: -98.44, costoTaxi: 42 },
  { id: 'amozoz', nombre: 'Amozoc', lat: 19.05, lng: -98.12, costoTaxi: 78 },
  { id: 'perote', nombre: 'Perote', lat: 19.56, lng: -97.24, costoTaxi: 65 },
  { id: 'jalapa', nombre: 'Jalapa', lat: 19.59, lng: -96.94, costoTaxi: 52 },
  { id: 'plan_del_rio', nombre: 'Plan Rio', lat: 19.40, lng: -96.65, costoTaxi: 48 },
  { id: 'la_anzuela', nombre: 'Anzuela', lat: 20.39, lng: -97.45, costoTaxi: 85 },
  { id: 'tuxpan', nombre: 'Tuxpan', lat: 20.95, lng: -97.40, costoTaxi: 68 },
  { id: 'ecatepec', nombre: 'Ecatepec', lat: 19.61, lng: -99.06, costoTaxi: 55 },
  { id: 'tulancingo', nombre: 'Tulancingo', lat: 20.08, lng: -98.36, costoTaxi: 42 },
  { id: 'miahuatlan', nombre: 'Miahuatlan', lat: 18.75, lng: -98.35, costoTaxi: 68 },
  { id: 'tehuacan', nombre: 'Tehuacan', lat: 18.46, lng: -97.39, costoTaxi: 52 },
  { id: 'oaxaca_entrada', nombre: 'Oaxaca', lat: 17.12, lng: -96.78, costoTaxi: 95 },
]

function obtenerFactorTrafico(destinoNombre: string = ''){
  const hora = new Date().getHours()
  const low = destinoNombre.toLowerCase()
  let factor = 1.0
  let mensaje = 'Ruta libre'
  const picoM = hora>=7 && hora<=10
  const picoT = hora>=17 && hora<=20
  if(low.includes('cdmx') || low.includes('santa fe')){
    if(picoM){ factor=1.6; mensaje='Trafico pesado 7-10am 60% mas tiempo' }
    else if(picoT){ factor=1.8; mensaje='Trafico muy pesado 5-8pm 80% mas' }
    else { factor=1.2; mensaje='Trafico moderado CDMX' }
  } else if(low.includes('toluca') || low.includes('metepec')){
    if(picoM||picoT){ factor=1.4; mensaje='Hora pico Toluca 40% mas' }
  }
  return { factor, mensaje, hora, esHoraPico: picoM||picoT }
}

async function getRutaConParadasTraffic(origen: any, paradas: any, destino: any, evitar: boolean, nombre: string=''){
  try{
    const pts=[origen,...paradas.map((p:any)=>p.pin),destino]
    const cs=pts.map((p:any)=>`${p[1]},${p[0]}`).join(';')
    const url=`https://router.project-osrm.org/route/v1/driving/${cs}?overview=full&geometries=geojson&alternatives=2${evitar?'&exclude=motorway':''}`
    const r=await fetch(url)
    const d=await r.json()
    if(d.routes && d.routes[0]){
      const traf = obtenerFactorTrafico(nombre)
      const mejor = d.routes[0]
      const tiempoMin = Math.round((mejor.duration * traf.factor)/60)
      const tiempoSin = Math.round(mejor.duration/60)
      return { distKm: mejor.distance/1000, tiempoMin, tiempoSinTrafico: tiempoSin, tiempoExtraTrafico: tiempoMin-tiempoSin, coords: mejor.geometry.coordinates.map((c:any)=>[c[1],c[0]]), trafico: traf }
    }
  }catch(e){}
  let dist=0
  const all=[origen,...paradas.map((p:any)=>p.pin),destino]
  for(let i=0;i<all.length-1;i++) dist+=getDist(all[i][0],all[i][1],all[i+1][0],all[i+1][1])
  const traf = obtenerFactorTrafico(nombre)
  const base = Math.round(dist*3)
  return { distKm: dist, tiempoMin: Math.round(base*traf.factor), tiempoSinTrafico: base, tiempoExtraTrafico: Math.round(base*(traf.factor-1)), coords: [] as [number,number][], trafico: traf }
}

function detectarCasetasEnRuta(_rutaCoords: [number,number][], usarCasetas: boolean, destinoNombre: string = '', destinoPin?: [number,number]){
  const resultadoTabla = obtenerCasetasPorDestino(destinoNombre, usarCasetas, destinoPin)
  return resultadoTabla
}

const TABLA_CASETAS_POR_DESTINO: Record<string, { casetas: string[], total: number, nota: string }> = {
  'capulhuac': { casetas: [], total: 0, nota: 'Local' },
  'xalatlaco': { casetas: [], total: 0, nota: '5.3km libre' },
  'toluca': { casetas: [], total: 0, nota: 'Federal libre' },
  'metepec': { casetas: [], total: 0, nota: 'Libre' },
  'lerma': { casetas: [], total: 0, nota: 'Libre' },
  'tenango': { casetas: [], total: 0, nota: 'Libre' },
  'santa fe': { casetas: [], total: 0, nota: 'Opcional $96' },
  'cdmx': { casetas: ['marquesa'], total: 96, nota: '1 caseta La Marquesa' },
  'ixtapan': { casetas: ['tenango','tenancingo','ixtapan'], total: 142, nota: '3 casetas $142' },
  'taxco': { casetas: ['tenango','tenancingo','ixtapan','pilcaya','taxco'], total: 212, nota: '5 casetas $212' },
  'morelia': { casetas: ['tepozotlan','palmillas','queretaro','huimilpan','zinap_ec','morelia_entrada'], total: 416, nota: 'Morelia 6 casetas $416' },
  'puebla': { casetas: ['san_marcos','san_martin','amozoz'], total: 265, nota: 'Puebla 3 casetas $265' },
  'queretaro': { casetas: ['tepozotlan','palmillas','queretaro'], total: 241, nota: 'Queretaro 3 casetas $241' },
  'poza rica': { casetas: ['ecatepec','tulancingo','la_anzuela','tuxpan'], total: 250, nota: 'Poza Rica 4 casetas $250' },
  'veracruz': { casetas: ['san_marcos','san_martin','amozoz','perote','jalapa','plan_del_rio'], total: 380, nota: 'Veracruz 6 casetas $380' },
  'xalapa': { casetas: ['san_marcos','san_martin','amozoz','perote','jalapa'], total: 332, nota: 'Xalapa 5 casetas $332' },
  'oaxaca': { casetas: ['san_marcos','amozoz','miahuatlan','tehuacan','oaxaca_entrada'], total: 388, nota: 'Oaxaca 5 casetas $388' },
  'acapulco': { casetas: ['tlaLpan','alpuyeca','paso_morelos','la_venta'], total: 503, nota: 'Acapulco 4 casetas $503' },
  'guadalajara': { casetas: ['atlacomulco','el_dorado','maravatio','zinapecuaro','panindicuaro','ocotlan','zapotlanejo'], total: 593, nota: 'Guadalajara 7 casetas $593' },
  'puerto vallarta': { casetas: ['atlacomulco','el_dorado','maravatio','zinapecuaro','panindicuaro','zapotlanejo','arenal','santa_cruz'], total: 578, nota: 'Vallarta 8 casetas $578' },
  'tequila': { casetas: ['atlacomulco','el_dorado','maravatio','zinapecuaro','panindicuaro','zapotlanejo','arenal'], total: 545, nota: 'Tequila 7 casetas $545' },
  'pachuca': { casetas: ['ecatepec','tulancingo'], total: 97, nota: 'Pachuca 2 casetas $97' },
  'leon': { casetas: ['tepozotlan','palmillas','queretaro'], total: 241, nota: 'Leon 3 casetas' },
  'monterrey': { casetas: ['tepozotlan','palmillas','queretaro'], total: 241, nota: 'Monterrey estimado' },
  'cancun': { casetas: ['san_marcos','san_martin','amozoz','miahuatlan','tehuacan'], total: 415, nota: 'Cancun estimado' },
}

function obtenerCasetasPorDestino(destinoNombre: string, conCasetas: boolean, destinoPin?: [number,number]){
  if(!conCasetas) return { casetas: [], costoTotal: 0, ruta: 'libre' }
  const low = destinoNombre.toLowerCase().trim()
  for(const key of Object.keys(TABLA_CASETAS_POR_DESTINO).sort((a,b)=>b.length-a.length)){
    if(low.includes(key)){
      const entry = (TABLA_CASETAS_POR_DESTINO as any)[key]
      const objs = entry.casetas.map((id:any)=> CASETAS_DB.find(c=>c.id===id)).filter(Boolean)
      return { casetas: objs, costoTotal: entry.total, ruta: objs.length>0?'cuota':'libre', nota: entry.nota }
    }
  }
  if(destinoPin){
    const dist = getDist(CAPULHUAC.lat, CAPULHUAC.lng, destinoPin[0], destinoPin[1])
    if(dist < 15) return { casetas: [], costoTotal: 0, ruta: 'libre', nota: dist.toFixed(1)+'km local sin caseta' }
    if(dist < 40) return { casetas: [], costoTotal: 0, ruta: 'libre', nota: dist.toFixed(1)+'km federal libre' }
    let ids: string[] = []
    if(low.includes('vallarta')) ids = ['atlacomulco','el_dorado','maravatio','zinapecuaro','panindicuaro','zapotlanejo','arenal','santa_cruz']
    else if(low.includes('guadalajara') || low.includes('tequila')) ids = ['atlacomulco','el_dorado','maravatio','zinapecuaro','panindicuaro','ocotlan','zapotlanejo']
    else if(low.includes('veracruz') || low.includes('poza rica') || low.includes('xalapa')) ids = ['san_marcos','san_martin','amozoz','perote','jalapa','plan_del_rio']
    else if(low.includes('oaxaca')) ids = ['san_marcos','amozoz','miahuatlan','tehuacan','oaxaca_entrada']
    else if(low.includes('morelia')) ids = ['tepozotlan','palmillas','queretaro','huimilpan','zinap_ec','morelia_entrada']
    else if(low.includes('puebla')) ids = ['san_marcos','san_martin','amozoz']
    else if(low.includes('acapulco')) ids = ['tlaLpan','alpuyeca','paso_morelos','la_venta']
    else {
      if(dist < 100) ids = ['marquesa']
      else if(dist < 200) ids = ['tepozotlan','palmillas']
      else if(dist < 350) ids = ['tepozotlan','palmillas','queretaro']
      else if(dist < 600) ids = ['san_marcos','san_martin','amozoz','perote','jalapa']
      else if(dist < 1000) ids = ['atlacomulco','el_dorado','maravatio','zinapecuaro','panindicuaro','zapotlanejo']
      else {
        const num = Math.min(8, Math.max(3, Math.floor(dist/120)))
        ids = ['tepozotlan','palmillas','queretaro','san_marcos','san_martin','amozoz','atlacomulco','el_dorado'].slice(0,num)
      }
    }
    const objs = ids.map(id=> CASETAS_DB.find(c=>c.id===id)).filter(Boolean)
    const total = objs.reduce((a:any,c:any)=>a+c.costoTaxi,0)
    return { casetas: objs, costoTotal: total, ruta: 'cuota', nota: objs.length+' casetas $'+total+' - '+dist.toFixed(0)+'km' }
  }
  const obj = CASETAS_DB.find(c=>c.id==='marquesa')
  return { casetas: obj?[obj]:[], costoTotal: obj?obj.costoTaxi:96, ruta: 'cuota', nota: '1 caseta estimada' }
}

const COLORES_UNIDADES = [
  { bg: 'bg-[#FFF1F1] border-[#FFC9C9]', dot: '🔴', label: 'Unidad 1', color: '#E11D48', icon: iconDestino, chip: 'bg-red-600' },
  { bg: 'bg-[#FFFBEB] border-[#FDE68A]', dot: '🟡', label: 'Unidad 2', color: '#D97706', icon: iconDestino2, chip: 'bg-yellow-500' },
  { bg: 'bg-[#F5F3FF] border-[#DDD6FE]', dot: '🟣', label: 'Unidad 3', color: '#7C3AED', icon: iconDestino3, chip: 'bg-purple-600' },
]

export default function PassengerApp(){
  const [step,setStep]=useState(0)
  const [direccionOrigen,setDireccionOrigen]=useState('')
  const [origenPin,setOrigenPin]=useState<[number,number]>([CAPULHUAC.lat, CAPULHUAC.lng])
  const [nombreOrigen,setNombreOrigen]=useState('Capulhuac Centro')
  const [numUnidades,setNumUnidades]=useState(1)
  const [unidades,setUnidades]=useState<any[]>([{ id: 1, direccionDestino: '', destinoPin: [19.2925, -99.6568] as [number,number], nombreDestino: 'Escribe destino', paradas: [], cotizacion: null, conCasetas: true, casetasDetectadas: [], costoCasetas: 0, rutaPreview: [] }])
  const [loading,setLoading]=useState(false)
  const [buscandoDestino,setBuscandoDestino]=useState<number | null>(null)
  const [idaVuelta,setIdaVuelta]=useState(false)
  const [rutasUnidades,setRutasUnidades]=useState<any[]>([])
  const [viajesActivos,setViajesActivos]=useState<any[]>([])
  const [mensajes,setMensajes]=useState<any[]>([])
  const [textoChat,setTextoChat]=useState('')
  const [grabando,setGrabando]=useState(false)
  const mediaRecorderRef = useRef<any>(null)
  const [vozActiva,setVozActiva]=useState(true)
  const [posTaxiAnimado,setPosTaxiAnimado]=useState<[number,number] | null>(null)
  const [rutaTaxiLlegando,setRutaTaxiLlegando]=useState<[number,number][]>([])
  const [distanciaTaxi,setDistanciaTaxi]=useState(0)
  const [tiempoTaxi,setTiempoTaxi]=useState(0)
  const [usuario,setUsuario]=useState<any>(null)
  const [perfilGoogle,setPerfilGoogle]=useState<any>(null)
  const [nombreUsuario,setNombreUsuario]=useState(localStorage.getItem('pasajero_nombre')||'')
  const [telefonoUsuario,setTelefonoUsuario]=useState(localStorage.getItem('pasajero_telefono')||'')
  const [choferAsignado,setChoferAsignado]=useState<any>(null)
  const [posChoferReal,setPosChoferReal]=useState<[number,number] | null>(null)
  const TELEFONO_BASE = '527221417521'

  const hablar = (t:string)=>{ if(!vozActiva) return; if('speechSynthesis' in window){ window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='es-MX'; u.rate=1.0; window.speechSynthesis.speak(u) } }

  // FIX DEFINITIVO GOOGLE - REDIRECT EN VEZ DE POPUP
  useEffect(()=>{
    // 1. Manejar el resultado del redirect de Google
    getRedirectResult(auth).then((result)=>{
      if(result && result.user){
        const u = result.user
        setUsuario(u)
        setPerfilGoogle({ photoURL: u.photoURL, displayName: u.displayName, email: u.email })
        setNombreUsuario(u.displayName||'')
        localStorage.setItem('pasajero_nombre', u.displayName||'')
        localStorage.setItem('pasajero_foto', u.photoURL||'')
        localStorage.setItem('pasajero_email', u.email||'')
        hablar(`Bienvenido ${u.displayName}`)
        setStep(1)
      }
    }).catch((e)=>{ console.log('redirect error', e) })

    // 2. Auth state
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(!u){
        try{ await signInAnonymously(auth) }catch{}
      } else {
        setUsuario(u)
        if(u.photoURL||u.displayName) setPerfilGoogle({ photoURL: u.photoURL, displayName: u.displayName, email: u.email })
        const n=localStorage.getItem('pasajero_nombre')
        const tel=localStorage.getItem('pasajero_telefono')
        if(n) setNombreUsuario(n)
        if(tel) setTelefonoUsuario(tel)
        if(u.displayName&&!n) setNombreUsuario(u.displayName)
      }
    })
    return ()=>unsub()
  }, [])

  const loginGoogle = async ()=>{
    try{
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      // FIX: redirect en vez de popup - no lo bloquea el celular ni Vercel
      await signInWithRedirect(auth, provider)
    }catch(e:any){
      console.log(e)
      alert('Error Google: ' + e.message)
    }
  }

  useEffect(()=>{ if(numUnidades>unidades.length){ const n=[...unidades]; for(let i=unidades.length;i<numUnidades;i++) n.push({ id:i+1, direccionDestino:'', destinoPin:[19.2925+i*0.02,-99.6568+i*0.02] as [number,number], nombreDestino:'Escribe destino', paradas:[], cotizacion:null, conCasetas:true, casetasDetectadas:[], costoCasetas:0, rutaPreview:[] }); setUnidades(n) } else if(numUnidades<unidades.length) setUnidades(unidades.slice(0,numUnidades)) }, [numUnidades])

  useEffect(()=>{ if(!viajesActivos.length) return; const q=query(collection(db,'viajes'), where('codigoGrupo','==',viajesActivos[0].codigoGrupo)); const unsub=onSnapshot(q,(snap)=>{ snap.forEach(d=>{ const data=d.data(); if(data.choferId&&!choferAsignado){ setChoferAsignado({ id:data.choferId, nombre:data.choferNombre, telefono:data.choferTelefono }); hablar(`Tu taxi ${data.choferNombre} aceptó`); setStep(5) } if(data.choferLat&&data.choferLng) setPosChoferReal([data.choferLat,data.choferLng]) }) }); return ()=>unsub() }, [viajesActivos])
  useEffect(()=>{ if(!viajesActivos.length) return; const q=query(collection(db,'chats'), where('codigoGrupo','==',viajesActivos[0].codigoGrupo), orderBy('createdAt','asc')); const unsub=onSnapshot(q,(snap)=>{ const l:any[]=[]; snap.forEach(d=>l.push(d.data())); if(l.length) setMensajes(l) }); return ()=>unsub() }, [viajesActivos])
  useEffect(()=>{ if(!choferAsignado||!origenPin) return; const pos=posChoferReal||[origenPin[0]+0.02,origenPin[1]+0.02] as [number,number]; (async()=>{ try{ const url=`https://router.project-osrm.org/route/v1/driving/${pos[1]},${pos[0]};${origenPin[1]},${origenPin[0]}?overview=full&geometries=geojson`; const r=await fetch(url); const d=await r.json(); if(d.routes?.[0]){ const coords=d.routes[0].geometry.coordinates.map((c:any)=>[c[1],c[0]] as [number,number]); setRutaTaxiLlegando(coords); setDistanciaTaxi(d.routes[0].distance/1000); setTiempoTaxi(Math.round(d.routes[0].duration/60)); let idx=0; const it=setInterval(()=>{ if(idx<coords.length){ setPosTaxiAnimado(coords[idx]); idx+=Math.max(1,Math.floor(coords.length/80)) } else { clearInterval(it); setPosTaxiAnimado(origenPin) } }, 80) } }catch{} })() }, [choferAsignado, posChoferReal])

  const reverseGeocode=async(lat:number,lng:number)=>{ try{ const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`); const d=await r.json(); return d.display_name?.split(',').slice(0,3).join(', ')||`${lat.toFixed(4)},${lng.toFixed(4)}` }catch{ return `${lat.toFixed(4)},${lng.toFixed(4)}` } }
const geocodeDireccion=async(txt:string)=>{
    try{
      const low=txt.toLowerCase().trim()
      const k=Object.keys(PUEBLOS_REALES).sort((a,b)=>b.length-a.length).find(k=>low.includes(k))
      if(k){ const p=PUEBLOS_REALES[k]; return { lat:p.lat, lng:p.lng, nombre:p.nombre } }
      const esLejano = ['veracruz','poza rica','puebla','guadalajara','morelia','oaxaca','acapulco','vallarta','tequila','queretaro','pachuca','monterrey','cancun','leon','tuxpan','xalapa'].some(x=> low.includes(x))
      if(esLejano){
        const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(txt+', Mexico')}&countrycodes=mx&limit=5`)
        const d=await r.json()
        if(d.length){
          for(const item of d){
            const disp=item.display_name.toLowerCase()
            if(disp.includes('calle calvario') || disp.includes('zentlapati')) continue
            if(disp.includes('calle') && !low.includes('calle')) continue
            return { lat: parseFloat(item.lat), lng: parseFloat(item.lon), nombre: item.display_name.split(',').slice(0,3).join(', ') }
          }
          return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), nombre: d[0].display_name.split(',').slice(0,3).join(', ') }
        }
      }
      const viewbox='-99.8,18.7,-99.1,19.6'
      const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(txt)}&countrycodes=mx&viewbox=${viewbox}&bounded=1&limit=5`)
      const d=await r.json()
      if(d.length){
        for(const item of d){
          const lat=parseFloat(item.lat); const lon=parseFloat(item.lon)
          if(getDist(CAPULHUAC.lat, CAPULHUAC.lng, lat, lon)<120) return { lat, lng: lon, nombre:item.display_name.split(',').slice(0,4).join(', ') }
        }
      }
      const r2=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(txt+', Mexico')}&countrycodes=mx&limit=3`)
      const d2=await r2.json()
      if(d2.length) return { lat:parseFloat(d2[0].lat), lng:parseFloat(d2[0].lon), nombre:d2[0].display_name.split(',').slice(0,4).join(', ') }
    }catch(e){}
    return null
  }
  const getRutaConParadas=async(o:[number,number], paradas:any[], dest:[number,number], evitar:boolean)=>{ const r=await getRutaConParadasTraffic(o, paradas, dest, evitar, ''); return { distKm:r.distKm, tiempoMin:r.tiempoMin, coords:r.coords } }

  const buscarDestinoLive = async (texto:string, idx:number)=>{
    if(!texto || texto.length<3) return
    setBuscandoDestino(idx)
    const res=await geocodeDireccion(texto)
    if(res){
      const n=[...unidades]
      n[idx].destinoPin=[res.lat,res.lng]
      n[idx].nombreDestino=res.nombre
      try{
        const rutaPreview=await getRutaConParadas(origenPin, n[idx].paradas, [res.lat,res.lng], !n[idx].conCasetas)
        n[idx].rutaPreview=rutaPreview.coords
        const det=detectarCasetasEnRuta(rutaPreview.coords, n[idx].conCasetas, n[idx].nombreDestino || n[idx].direccionDestino, n[idx].destinoPin)
        n[idx].casetasDetectadas=det.casetas
        n[idx].costoCasetas=det.costoTotal
      }catch{}
      setUnidades(n)
    }
    setBuscandoDestino(null)
  }

  const toggleCasetas = async (idx:number, conCasetas:boolean)=>{
    const n=[...unidades]
    n[idx].conCasetas=conCasetas
    setUnidades(n)
    if(n[idx].destinoPin && n[idx].nombreDestino!=='Escribe destino'){
      try{
        const rutaPreview=await getRutaConParadas(origenPin, n[idx].paradas, n[idx].destinoPin, !conCasetas)
        n[idx].rutaPreview=rutaPreview.coords
        const det=detectarCasetasEnRuta(rutaPreview.coords, conCasetas, n[idx].nombreDestino || n[idx].direccionDestino, n[idx].destinoPin)
        n[idx].casetasDetectadas=det.casetas
        n[idx].costoCasetas=det.costoTotal
        setUnidades([...n])
      }catch{}
    }
  }

  const cotizar=async()=>{
    if(unidades.some(u=>!u.direccionDestino)) return alert('Escribe destino para cada unidad')
    setLoading(true)
    let oCoords=origenPin
    if(direccionOrigen){ const ro=await geocodeDireccion(direccionOrigen); if(ro){ oCoords=[ro.lat,ro.lng]; setOrigenPin(oCoords); setNombreOrigen(ro.nombre) } }
    const nuevasRutas:any[]=[]; const up=[...unidades]
    for(let i=0;i<up.length;i++){
      const roDest=await geocodeDireccion(up[i].direccionDestino)
      if(!roDest){ alert(`No encontré ${up[i].direccionDestino}`); setLoading(false); return }
      up[i].destinoPin=[roDest.lat,roDest.lng]; up[i].nombreDestino=roDest.nombre
      for(let pi=0; pi<up[i].paradas.length; pi++){ const pa=up[i].paradas[pi]; if(pa.direccion?.trim()){ const rp=await geocodeDireccion(pa.direccion); if(rp){ up[i].paradas[pi].pin=[rp.lat,rp.lng]; up[i].paradas[pi].nombre=rp.nombre } } }
      const evitar=!up[i].conCasetas
      const rd=await getRutaConParadas(oCoords,[],up[i].destinoPin,evitar)
      let rf=rd; let extraKm=0; let extraParadas=0
      if(up[i].paradas.length){ const rc=await getRutaConParadas(oCoords,up[i].paradas,up[i].destinoPin,evitar); extraKm=Math.max(0,rc.distKm-rd.distKm)*12; extraParadas=up[i].paradas.length*10; rf=rc }
      const det=detectarCasetasEnRuta(rf.coords, up[i].conCasetas, up[i].nombreDestino || up[i].direccionDestino)
      const kmCob=Math.max(0,rd.distKm-4); let base=Math.max(80,Math.round(50+kmCob*12)); const tg=tarifasBase.find(t=>up[i].direccionDestino.toLowerCase().includes(t.destino.toLowerCase())); if(tg) base=tg.precio
      const sinCas=Math.round(base+extraKm+extraParadas); const final=idaVuelta?Math.round((sinCas+det.costoTotal)*1.5):sinCas+det.costoTotal
      up[i].cotizacion={ distDirecta:rd.distKm, distTotal:rf.distKm, tiempo:rf.tiempoMin, precioBase:base, extraParadas, extraKm, costoCasetas:det.costoTotal, casetas:det.casetas, precioSinCasetas:sinCas, precio:final }
      up[i].casetasDetectadas=det.casetas; up[i].costoCasetas=det.costoTotal
      nuevasRutas.push({ id:up[i].id, coords:rf.coords, casetas:det.casetas })
    }
    setUnidades(up); setRutasUnidades(nuevasRutas); setLoading(false); setStep(4); hablar(`Cotización ${up.reduce((a,u)=>a+(u.cotizacion?.precio||0),0)} pesos`)
  }

  const reservar=async()=>{
    if(unidades.some(u=>!u.cotizacion)) return
    const grupo=Math.floor(1000+Math.random()*9000).toString(); const creados:any[]=[]
    for(let i=0;i<unidades.length;i++){ const u=unidades[i]; const v={ codigo:`${grupo}-${i+1}`, codigoGrupo:grupo, unidadNum:i+1, totalUnidades:unidades.length, pasajeroId:usuario?.uid||'local-'+telefonoUsuario, pasajeroNombre:nombreUsuario, pasajeroTelefono:telefonoUsuario, pasajeroFoto:perfilGoogle?.photoURL||'', pasajeroEmail:perfilGoogle?.email||'', origen:nombreOrigen, destino:u.nombreDestino, direccionDestino:u.direccionDestino, origenCoords:{ lat:origenPin[0], lng:origenPin[1] }, destinoCoords:{ lat:u.destinoPin[0], lng:u.destinoPin[1] }, paradas:u.paradas.map((p:any)=>({ nombre:p.nombre, direccion:p.direccion })), conCasetas:u.conCasetas, casetas:u.casetasDetectadas, costoCasetas:u.costoCasetas, precio:u.cotizacion.precio, idaVuelta, estado:'pendiente', createdAt:serverTimestamp() }; try{ await addDoc(collection(db,'viajes'),v); creados.push(v) }catch{ creados.push(v) } }
    setViajesActivos(creados); setStep(5)
  }

  const enviarMensaje=async()=>{ if(!textoChat.trim()||!viajesActivos.length) return; const m={ de:'pasajero', deNombre:nombreUsuario, texto:textoChat, tipo:'texto', hora:new Date().toLocaleTimeString(), timestamp:Date.now(), codigoGrupo:viajesActivos[0].codigoGrupo }; setMensajes([...mensajes,m]); setTextoChat(''); try{ await addDoc(collection(db,'chats'),{ viajeCodigo:viajesActivos[0].codigo, ...m, createdAt:serverTimestamp() }) }catch{} }
  const panico=async()=>{ if(!confirm('¿ACTIVAR PÁNICO? Se avisa a chofer y base 7221417521')) return; if(navigator.geolocation) navigator.geolocation.getCurrentPosition(async p=>{ const link=`https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`; const msg=`🚨 PANICO ${nombreUsuario} ${telefonoUsuario} Grupo ${viajesActivos[0]?.codigoGrupo||''} ${link}`; try{ await addDoc(collection(db,'panicos'),{ pasajeroNombre:nombreUsuario, pasajeroTelefono:telefonoUsuario, link, hora:new Date().toLocaleString(), createdAt:serverTimestamp() }) }catch{}; let tel=choferAsignado?.telefono?.replace(/\D/g,'')||''; if(tel.length===10) tel='52'+tel; window.open(`https://wa.me/${tel||TELEFONO_BASE}?text=${encodeURIComponent(msg)}`,'_blank') }) }
  const total=unidades.reduce((a,u)=>a+(u.cotizacion?.precio||0),0)
  const mapBounds = unidades[0]?.destinoPin ? [origenPin, unidades[0].destinoPin] as [number,number][] : undefined

  return(
    <div className="h-[100dvh] w-screen flex flex-col bg-[#0A0A0A] overflow-hidden relative">
      <header className="z-[40] shrink-0 bg-[#0A0A0A]/90 backdrop-blur-2xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {perfilGoogle?.photoURL ? <img src={perfilGoogle.photoURL} className="w-[44px] h-[44px] rounded-full border-[2px] border-[#FFD60A] object-cover shadow-lg" alt="" /> : <div className="w-[44px] h-[44px] rounded-full bg-[#FFD60A] flex items-center justify-center text-black font-black text-[18px]">{nombreUsuario?.[0]||'M'}</div>}
            <div className="absolute -bottom-1 -right-1 w-[14px] h-[14px] bg-[#00E676] rounded-full border-2 border-[#0A0A0A]"></div>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2"><span className="font-black text-white text-[15px] tracking-tight">{perfilGoogle?.displayName||nombreUsuario||'Invitado'}</span>{perfilGoogle&&<span className="text-[9px] bg-[#4285F4] text-white px-2 py-[2px] rounded-full font-bold tracking-wide">✓ Google</span>}</div>
            <div className="text-[11px] text-white/60 font-medium truncate max-w-[200px]">{perfilGoogle?.email||telefonoUsuario||'Sin registro'} • {nombreOrigen.slice(0,18)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setVozActiva(!vozActiva)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${vozActiva?'bg-white text-black shadow':'bg-white/10 text-white'}`}>🔊</button>
          <button onClick={panico} className="w-[48px] h-[48px] rounded-full bg-[#E11D48] text-white flex items-center justify-center font-black shadow-xl border-2 border-white/20 animate-pulse">🚨</button>
        </div>
      </header>
      <div className="z-[30] shrink-0 bg-[#0A0A0A]/80 backdrop-blur-xl px-3 py-3 border-b border-white/5">
        <div className="flex gap-[8px]">
          {[
            { n:0, label:'Perfil', icon:'👤' },
            { n:1, label:'Origen', icon:'📍' },
            { n:2, label:numUnidades>1?`Dest x${numUnidades}`:'Destino', icon:'🔴' },
            { n:3, label:'Detalles', icon:'🟢' },
            { n:4, label:'Precio', icon:'💰' },
          ].map(s=>(
            <button key={s.n} onClick={()=>setStep(s.n)} className={`flex-1 h-[56px] rounded-[18px] flex flex-col items-center justify-center gap-1 transition-all border ${step===s.n?'bg-[#FFD60A] border-[#FFD60A] text-black shadow-[0_4px_20px_rgba(255,214,10,0.4)] scale-[1.02]':'bg-white/[0.06] border-white/10 text-white/60 hover:bg-white/[0.10]'} ${step>s.n?'!bg-white/[0.12] !text-white':''}`}>
              <span className="text-[18px] leading-none">{s.icon}</span>
              <span className="text-[9px] font-black tracking-[0.08em] uppercase">{s.label}</span>
              {step===s.n&&<div className="w-1 h-1 bg-black rounded-full mt-[2px]"></div>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MapContainer center={origenPin} zoom={13} style={{ height:'100%', width:'100%' }} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {unidades.map((u,i)=> u.rutaPreview?.length>0 && !rutasUnidades.length ? <Polyline key={`preview-${u.id}`} positions={u.rutaPreview} color={COLORES_UNIDADES[i].color} weight={5} opacity={0.5} dashArray="10 10" /> : null)}
            {rutasUnidades.map((r,i)=>(<Polyline key={`final-${i}`} positions={r.coords} color={COLORES_UNIDADES[i].color} weight={7} opacity={0.85} />))}
            {rutaTaxiLlegando.length>0&&<Polyline positions={rutaTaxiLlegando} color="#00E676" weight={7} opacity={0.95} dashArray="14 14" />}
            <Marker position={origenPin} icon={iconOrigen} />
            {unidades.map((u,i)=>(<Marker key={`d-${u.id}`} position={u.destinoPin} icon={COLORES_UNIDADES[i].icon} />))}
            {unidades.flatMap((u,ui)=>u.paradas.map((p:any,pi:number)=>({...p,ui,pi}))).map((p:any)=>(<Marker key={`p-${p.id}`} position={p.pin} icon={new L.DivIcon({ html:`<div style="background:#00C853; color:white; border:3px solid white; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13px; box-shadow:0 4px 12px rgba(0,0,0,0.4);">P${p.pi+1}</div>`, className:'', iconSize:[36,36], iconAnchor:[18,18] })} />))}
            {unidades.flatMap(u=>u.casetasDetectadas||[]).map((c:any,i)=>(<Marker key={`caseta-live-${c.id}-${i}`} position={[c.lat,c.lng]} icon={iconCaseta} />))}
            {rutasUnidades.flatMap(r=>r.casetas||[]).map((c:any,i)=>(<Marker key={`caseta-final-${c.id}-${i}`} position={[c.lat,c.lng]} icon={iconCaseta} />))}
            {posTaxiAnimado&&<Marker position={posTaxiAnimado} icon={iconTaxiLlegando} />}
            <MapController center={step===5&&posTaxiAnimado?posTaxiAnimado:origenPin} zoom={step===5?16:13} bounds={mapBounds} />
          </MapContainer>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col max-h-[72dvh] pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-t-[32px] shadow-[0_-16px_48px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-black/5">
            <div className="shrink-0 bg-white pt-4 pb-3 flex justify-center"><div className="w-10 h-[5px] bg-black/15 rounded-full"></div></div>
            <div className="overflow-y-auto px-5 pb-4 max-h-[50dvh] custom-scroll">
              {step===0&&(
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><h2 className="text-[24px] font-black tracking-tight text-black">Tu perfil</h2><span className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-bold">1 / 5</span></div>
                  {!perfilGoogle?(
                    <div className="space-y-3">
                      <button onClick={loginGoogle} className="w-full h-[56px] bg-black text-white rounded-[18px] font-black text-[14px] flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]"><span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-black">G</span> Continuar con Google (celular OK)</button>
                      <input value={nombreUsuario} onChange={e=>setNombreUsuario(e.target.value)} placeholder="Nombre completo" className="w-full h-[52px] px-4 border-2 border-black/10 rounded-[16px] text-[15px] font-bold bg-black/[0.03] focus:border-black outline-none" />
                      <input value={telefonoUsuario} onChange={e=>setTelefonoUsuario(e.target.value)} placeholder="WhatsApp 722..." className="w-full h-[52px] px-4 border-2 border-black/10 rounded-[16px] text-[15px] font-bold bg-black/[0.03] focus:border-black outline-none" />
                    </div>
                  ):(
                    <div className="space-y-3">
                      <div className="bg-black rounded-[24px] p-4 flex gap-4 items-center text-white"><img src={perfilGoogle.photoURL} className="w-16 h-16 rounded-full border-2 border-[#FFD60A]" alt="" /><div><div className="font-black text-[17px]">{perfilGoogle.displayName}</div><div className="text-[12px] text-white/70">{perfilGoogle.email}</div><div className="text-[11px] text-[#FFD60A] mt-1 font-bold">✓ Verificado • {telefonoUsuario||'Agrega teléfono'}</div></div></div>
                      <input value={telefonoUsuario} onChange={e=>setTelefonoUsuario(e.target.value)} placeholder="WhatsApp para que chofer te llame" className="w-full h-[52px] px-4 border-2 border-black/10 rounded-[16px] text-[15px] font-bold" />
                    </div>
                  )}
                </div>
              )}
              {step===1&&(
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><h2 className="text-[24px] font-black tracking-tight text-black">¿Dónde te recogemos?</h2><span className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-bold">2 / 5</span></div>
                  <div className="relative"><div className="absolute left-4 top-[16px] w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center text-white">📍</div><input value={direccionOrigen} onChange={e=>setDireccionOrigen(e.target.value)} onBlur={async()=>{ if(direccionOrigen.length>3){ const ro=await geocodeDireccion(direccionOrigen); if(ro){ setOrigenPin([ro.lat,ro.lng]); setNombreOrigen(ro.nombre) } } }} placeholder="Calle Morelos 15, Capulhuac..." className="w-full h-[56px] pl-14 pr-4 border-2 border-[#BFDBFE] bg-[#EFF6FF] rounded-[18px] text-[15px] font-bold outline-none focus:border-[#2563EB]" /></div>
                  <button onClick={async()=>{ if(!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(async pos=>{ const {latitude,longitude}=pos.coords; setOrigenPin([latitude,longitude]); const n=await reverseGeocode(latitude,longitude); setNombreOrigen(n); setDireccionOrigen(n); hablar(`Origen ${n}`) }) }} className="w-full h-[48px] bg-[#2563EB] text-white rounded-[16px] font-black text-[13px]">📍 Usar mi ubicación GPS actual</button>
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-3 rounded-[16px] text-[12px] font-bold text-[#1E40AF] truncate">📍 {nombreOrigen}</div>
                </div>
              )}
              {step===2&&(
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><h2 className="text-[24px] font-black tracking-tight text-black">¿A dónde vas?</h2><div className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-full"><button onClick={()=>setNumUnidades(Math.max(1,numUnidades-1))} className="w-7 h-7 bg-white text-black rounded-full font-black">−</button><span className="font-black w-5 text-center text-[14px]">{numUnidades}</span><button onClick={()=>setNumUnidades(Math.min(5,numUnidades+1))} className="w-7 h-7 bg-white text-black rounded-full font-black">+</button></div></div>
                  <div className="text-[11px] text-black/60 bg-black/[0.04] p-3 rounded-[14px] font-medium">✨ Escribe y el mapa se actualiza solo. Toca 🔍 para buscar.</div>
                  {unidades.map((u,i)=>{ const c=COLORES_UNIDADES[i]; return (<div key={u.id} className={`${c.bg} border-2 rounded-[20px] p-4`}><div className="flex justify-between items-center mb-3"><span className="font-black text-[13px] text-black">{c.dot} {c.label}</span>{buscandoDestino===i?<span className="text-[10px] bg-black text-white px-2 py-1 rounded-full animate-pulse">Buscando...</span>:u.rutaPreview?.length>0?<span className="text-[10px] bg-green-600 text-white px-2 py-1 rounded-full">📍 En mapa</span>:null}{u.cotizacion&&<span className="bg-black text-white text-[11px] px-3 py-1 rounded-full font-black">${u.cotizacion.precio}</span>}</div><div className="flex gap-2"><div className="relative flex-1"><div className={`absolute left-3 top-[14px] w-6 h-6 ${c.chip} rounded-full flex items-center justify-center text-white text-[10px]`}>🔴</div><input value={u.direccionDestino} onChange={e=>{ const n=[...unidades]; n[i].direccionDestino=e.target.value; setUnidades(n) }} onBlur={e=>buscarDestinoLive(e.target.value,i)} onKeyDown={e=>{ if(e.key==='Enter') buscarDestinoLive(u.direccionDestino,i) }} placeholder={i===0?'Toluca Centro':i===1?'Almoloya del Río':'Techuchulco...'} className="w-full h-[52px] pl-11 pr-4 border-2 border-black/10 rounded-[16px] text-[14px] font-bold bg-white outline-none focus:border-black" /></div><button onClick={()=>buscarDestinoLive(u.direccionDestino,i)} className="w-[52px] h-[52px] bg-black text-white rounded-[16px] flex items-center justify-center font-black shrink-0 active:scale-95">🔍</button></div><div className="text-[11px] mt-2 text-black/60 font-medium truncate flex justify-between"><span>{u.nombreDestino}</span>{u.rutaPreview?.length>0&&<span className="text-[10px] bg-black/10 px-2 py-0.5 rounded-full">Ruta preview</span>}</div>{u.rutaPreview?.length>0&&<div className="text-[10px] mt-1 text-black/50">Ruta: {u.rutaPreview.length} puntos • {u.casetasDetectadas.length>0?`💰 ${u.casetasDetectadas.length} casetas $${u.costoCasetas}`:'🛣 Sin casetas en preview'}</div>}</div>) })}
                </div>
              )}
              {step===3&&(
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><h2 className="text-[24px] font-black tracking-tight text-black">Detalles</h2><span className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-bold">4 / 5</span></div>
                  {unidades.map((u,i)=>{ const c=COLORES_UNIDADES[i]; return (<div key={u.id} className={`${c.bg} border-2 rounded-[20px] p-4 space-y-3`}><div className="font-black text-[13px] text-black flex justify-between"><span>{c.dot} {c.label} → {u.nombreDestino.slice(0,22)}</span>{u.rutaPreview?.length>0&&<span className="text-[10px] bg-black text-white px-2 py-1 rounded-full">Live en mapa</span>}</div><div className="flex gap-2"><button onClick={()=>toggleCasetas(i,true)} className={`flex-1 h-[44px] rounded-[14px] font-black text-[12px] border-2 transition-all ${u.conCasetas?'bg-[#FB923C] text-white border-[#FB923C] shadow':'bg-white border-black/10'}`}>💰 Con casetas {u.conCasetas&&u.costoCasetas>0?`$${u.costoCasetas}`:''}</button><button onClick={()=>toggleCasetas(i,false)} className={`flex-1 h-[44px] rounded-[14px] font-black text-[12px] border-2 transition-all ${!u.conCasetas?'bg-[#22C55E] text-white border-[#22C55E] shadow':'bg-white border-black/10'}`}>🛣 Libre</button></div>{u.casetasDetectadas.length>0? (<div className="bg-[#FFF7ED] border-2 border-[#FDBA74] p-3 rounded-[14px] text-[11px]"><div className="font-black flex justify-between"><span>💰 Casetas detectadas LIVE:</span><span className="bg-[#FB923C] text-white px-2 py-0.5 rounded-full">${u.costoCasetas}</span></div><div className="mt-2 space-y-1">{u.casetasDetectadas.map((ca:any)=><div key={ca.id} className="flex justify-between font-bold"><span>📍 {ca.nombre}</span><span className="font-black">${ca.costoTaxi}</span></div>)}</div></div>) : (<div className="bg-white border-2 border-dashed border-black/10 p-3 rounded-[14px] text-[11px] text-center text-black/40">{u.conCasetas?'Buscando casetas en ruta... escribe destino para ver':'Modo libre sin casetas - ruta por carreteras libres'}</div>)}<div className="bg-white rounded-[16px] p-3 border-2 border-[#BBF7D0]"><div className="flex justify-between items-center mb-2"><span className="font-black text-[12px] text-[#15803D]">🟢 Paradas - ¿Dónde se para?</span><button onClick={()=>{ const n=[...unidades]; n[i].paradas=[...n[i].paradas,{ id:Date.now(), pin:[origenPin[0]+0.002,origenPin[1]+0.002], nombre:`Parada ${n[i].paradas.length+1}`, direccion:'' }]; setUnidades(n) }} className="bg-[#16A34A] text-white text-[10px] px-3 py-1.5 rounded-full font-black">+ Agregar</button></div>{u.paradas.length===0?<div className="text-[11px] text-black/40 text-center py-3 font-medium">Sin paradas • Viaje directo</div>:u.paradas.map((p:any,pi:number)=><div key={p.id} className="bg-[#F0FDF4] rounded-[14px] p-3 mb-2 border border-[#BBF7D0]"><div className="flex justify-between items-center mb-2"><span className="font-black text-[11px] text-[#15803D]">🟢 Parada {pi+1}</span><button onClick={()=>{ const n=[...unidades]; n[i].paradas=n[i].paradas.filter((x:any)=>x.id!==p.id); setUnidades(n) }} className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">✕</button></div><input value={p.direccion} onChange={e=>{ const n=[...unidades]; n[i].paradas[pi].direccion=e.target.value; setUnidades(n) }} onBlur={async()=>{ if(p.direccion.length>3){ const rp=await geocodeDireccion(p.direccion); if(rp){ const n=[...unidades]; n[i].paradas[pi].pin=[rp.lat,rp.lng]; n[i].paradas[pi].nombre=rp.nombre; setUnidades(n) } } }} placeholder="Ej: Oxxo Capulhuac..." className="w-full h-[44px] px-3 border-2 border-[#86EFAC] rounded-[12px] text-[12px] font-bold bg-white outline-none focus:border-[#16A34A]" /></div>)}</div></div>) })}
                  <label className="flex items-center gap-3 bg-black text-white p-4 rounded-[16px] cursor-pointer"><input type="checkbox" checked={idaVuelta} onChange={e=>setIdaVuelta(e.target.checked)} className="w-5 h-5 accent-[#FFD60A]" /><span className="font-black text-[13px]">Ida y vuelta x1.5 (todas)</span></label>
                </div>
              )}
              {step===4&&(
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><h2 className="text-[24px] font-black tracking-tight text-black">Cotización</h2><span className="text-[10px] bg-[#FFD60A] text-black px-3 py-1 rounded-full font-black">5 / 5</span></div>
                  {!unidades[0]?.cotizacion?(<div className="bg-black/[0.04] p-8 rounded-[20px] text-center"><div className="text-[14px] font-bold">Listo para cotizar final</div><div className="text-[11px] text-black/50 mt-1">{numUnidades} unidad(es) • Preview ya en mapa • Casetas: {unidades.reduce((a,u)=>a+u.costoCasetas,0)>0?`$${unidades.reduce((a,u)=>a+u.costoCasetas,0)} detectadas`: '0'}</div></div>):(
                    <div className="space-y-3">
                      {unidades.map((u,i)=><div key={u.id} className="bg-black/[0.04] rounded-[16px] p-4"><div className="flex justify-between font-black text-[13px] text-black"><span>{COLORES_UNIDADES[i].dot} U{i+1}: {u.nombreDestino.slice(0,22)}</span><span>${u.cotizacion.precio}</span></div><div className="text-[11px] text-black/60 mt-1 font-medium">📍 {nombreOrigen.slice(0,20)} → {u.nombreDestino.slice(0,20)}</div><div className="text-[10px] mt-1 flex justify-between text-black/50"><span>{u.cotizacion.distDirecta.toFixed(1)}km {u.cotizacion.tiempo}min {u.conCasetas?`💰 $${u.costoCasetas}`:'Libre'}</span><span>Base ${u.cotizacion.precioBase}</span></div></div>)}
                      <div className="bg-[#FFD60A] rounded-[20px] p-5 text-center border-2 border-black"><div className="text-[11px] font-bold text-black/60 uppercase tracking-wide">Total {numUnidades} taxi(s) + casetas</div><div className="text-[40px] font-black tracking-tighter text-black leading-none mt-1">${total} MXN</div></div>
                    </div>
                  )}
                </div>
              )}
              {step===5&&(
                <div className="space-y-3">
                  <div className="bg-[#16A34A] rounded-[20px] p-4 text-white"><div className="font-black text-[15px]">✅ {viajesActivos.length} viaje(s) Grupo {viajesActivos[0]?.codigoGrupo}</div>{choferAsignado?(<div className="mt-2"><div className="font-black">🚕 {choferAsignado.nombre} aceptó</div><div className="text-[12px] opacity-90">📍 Taxi a {distanciaTaxi.toFixed(1)} km • {tiempoTaxi} min • Míralo en mapa 🚖💨</div></div>):<div className="text-[12px] mt-1 opacity-90">Buscando choferes cercanos...</div>}</div>
                  <div className="bg-black/[0.04] rounded-[20px] p-3"><div className="font-black text-[13px] mb-2 text-black">💬 Chat grupo {viajesActivos[0]?.codigoGrupo}</div><div className="bg-white rounded-[16px] p-3 h-[160px] overflow-y-auto border mb-2">{mensajes.length===0?<div className="text-[11px] text-black/40 text-center mt-12">Chatea referencia: Casa azul...</div>:mensajes.map((m,i)=><div key={i} className={`mb-2 p-2 rounded-[14px] text-[12px] max-w-[80%] ${m.de==='pasajero'?'bg-black text-white ml-auto':'bg-black/[0.06] text-black'}`}><div className="font-bold text-[9px] opacity-60">{m.deNombre} • {m.hora}</div>{m.texto}{m.tipo==='voz'&&m.audioUrl&&<audio controls src={m.audioUrl} className="w-full mt-1 h-7" />}</div>)}</div><div className="flex gap-2"><input value={textoChat} onChange={e=>setTextoChat(e.target.value)} placeholder="Casa azul, portón negro..." className="flex-1 h-[44px] px-4 border-2 border-black/10 rounded-full text-[13px] font-bold outline-none focus:border-black" onKeyDown={e=>e.key==='Enter'&&enviarMensaje()} /><button onClick={enviarMensaje} className="bg-black text-white px-4 h-[44px] rounded-full font-black text-[12px]">Enviar</button><button onClick={async()=>{ if(grabando){ mediaRecorderRef.current?.stop(); setGrabando(false); return } try{ const s=await navigator.mediaDevices.getUserMedia({ audio:true }); const r=new MediaRecorder(s); mediaRecorderRef.current=r; const ch:any[]=[]; r.ondataavailable=(e:any)=>ch.push(e.data); r.onstop=async()=>{ const b=new Blob(ch,{type:'audio/webm'}); const url=URL.createObjectURL(b); const msg={ de:'pasajero', deNombre:nombreUsuario, texto:'🎤 Voz', tipo:'voz', audioUrl:url, hora:new Date().toLocaleTimeString(), timestamp:Date.now(), codigoGrupo:viajesActivos[0].codigoGrupo }; setMensajes((pr:any)=>[...pr,msg]); try{ await addDoc(collection(db,'chats'),{ viajeCodigo:viajesActivos[0].codigo, ...msg, createdAt:serverTimestamp() }) }catch{}; s.getTracks().forEach(t=>t.stop()) }; r.start(); setGrabando(true) }catch{ alert('No mic') } }} className={`${grabando?'bg-[#E11D48] animate-pulse':'bg-[#16A34A]'} text-white w-[44px] h-[44px] rounded-full font-black flex items-center justify-center shrink-0`}>{grabando?'■':'🎤'}</button></div></div>
                </div>
              )}
            </div>
            <div className="shrink-0 bg-white border-t border-black/10 p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
              <div className="flex gap-3">
                {step>0&&step<5&&<button onClick={()=>setStep(step-1)} className="h-[56px] flex-1 bg-black/10 rounded-[18px] font-black text-[14px] text-black active:scale-[0.98]">← Atrás</button>}
                {step===0&&<button onClick={()=>{ if(!nombreUsuario||!telefonoUsuario) return alert('Pon nombre y teléfono'); localStorage.setItem('pasajero_nombre',nombreUsuario); localStorage.setItem('pasajero_telefono',telefonoUsuario); setStep(1) }} className="h-[56px] flex-1 bg-black text-white rounded-[18px] font-black text-[15px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] active:scale-[0.98]">{perfilGoogle|| (nombreUsuario&&telefonoUsuario)?'Continuar →':'Guardar perfil →'}</button>}
                {step===1&&<button onClick={()=>setStep(2)} className="h-[56px] flex-1 bg-black text-white rounded-[18px] font-black text-[15px] shadow-lg active:scale-[0.98]">Siguiente: Destino →</button>}
                {step===2&&<button onClick={()=>setStep(3)} disabled={unidades.some(u=>!u.direccionDestino)} className="h-[56px] flex-1 bg-black text-white rounded-[18px] font-black text-[15px] shadow-lg disabled:bg-black/20 active:scale-[0.98]">Siguiente: Detalles → {unidades[0]?.rutaPreview?.length>0?'✅ Mapa actualizado':''}</button>}
                {step===3&&<button onClick={cotizar} disabled={loading} className="h-[56px] flex-1 bg-[#FFD60A] text-black rounded-[18px] font-black text-[15px] shadow-[0_8px_24px_rgba(255,214,10,0.4)] border-2 border-black disabled:bg-black/20 active:scale-[0.98]">{loading?'Calculando...':'COTIZAR → Ver precio'}</button>}
                {step===4&&!unidades[0]?.cotizacion&&<button onClick={cotizar} disabled={loading} className="h-[56px] flex-1 bg-[#FFD60A] text-black rounded-[18px] font-black text-[15px] shadow-lg border-2 border-black active:scale-[0.98]">{loading?'Calculando casetas...':'COTIZAR'}</button>}
                {step===4&&unidades[0]?.cotizacion&&<button onClick={reservar} className="h-[56px] flex-1 bg-[#16A34A] text-white rounded-[18px] font-black text-[15px] shadow-[0_8px_24px_rgba(22,163,74,0.4)] active:scale-[0.98]">RESERVAR ${total} →</button>}
                {step===5&&<button onClick={()=>setStep(4)} className="h-[56px] flex-1 bg-black/10 rounded-[18px] font-black text-[14px] text-black active:scale-[0.98]">Ver resumen</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}