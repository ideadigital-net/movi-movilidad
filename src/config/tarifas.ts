export const TARIFAS = {
  centroCapulhuac: { lat: 19.1936, lng: -99.4612 },
  base: 45, kmBase: 4, precioPorKmExtra: 12, minima: 45, maxima: 800
}

export const DESTINOS_RAPIDOS: any = {
  "ixtapan de la sal": { lat: 18.8438, lng: -99.6737 },
  "ixtapan": { lat: 18.8438, lng: -99.6737 },
  "malinalco": { lat: 18.9485, lng: -99.4944 },
  "tepoztlan": { lat: 18.9844, lng: -99.1003 },
  "mercado municipal tepoztlan": { lat: 18.9844, lng: -99.1003 },
  "cuernavaca": { lat: 18.9242, lng: -99.2216 },
  "aeropuerto cdmx": { lat: 19.4363, lng: -99.072 },
  "la marquesa": { lat: 19.297, lng: -99.436 },
}

export const CASETAS_POR_DESTINO: any = {
  "tepoztlan": 161, "cuernavaca": 161, "cuautla": 120,
  "aeropuerto cdmx": 93, "aeropuerto": 93, "santa fe": 93, "cdmx": 93, "marquesa": 93,
}

export function calcularTarifaPorKmReales(distKm: number) {
  let precio = TARIFAS.base
  if (distKm > TARIFAS.kmBase) precio = TARIFAS.base + (distKm - TARIFAS.kmBase) * TARIFAS.precioPorKmExtra
  precio = Math.round(precio)
  if (precio < TARIFAS.minima) precio = TARIFAS.minima
  if (precio > TARIFAS.maxima) precio = TARIFAS.maxima
  return precio
}

export async function obtenerRutaConTrazo(lat1: number, lng1: number, lat2: number, lng2: number) {
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`)
    const data = await res.json()
    if (data.routes && data.routes[0]) {
      return {
        distKm: Math.round(data.routes[0].distance / 100 / 10), // a km con 1 decimal
        geometry: data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]), // a [lat,lng]
        durationMin: Math.round(data.routes[0].duration / 60)
      }
    }
  } catch {}
  return null
}

export function detectarCasetaAutomatica(nombre: string) {
  const limpio = nombre.toLowerCase()
  for (const key in CASETAS_POR_DESTINO) {
    if (limpio.includes(key)) return CASETAS_POR_DESTINO[key]
  }
  return 0
}

export async function buscarYAprenderDestino(supabase: any, texto: string, origenLat: number, origenLng: number) {
  const nombreLimpio = texto.toLowerCase().trim()
  if (!nombreLimpio) return null

  const { data: aprendido } = await supabase.from('destinos_aprendidos').select('*').eq('nombre_limpio', nombreLimpio).maybeSingle()
  if (aprendido) {
    const ruta = await obtenerRutaConTrazo(origenLat, origenLng, aprendido.lat, aprendido.lng)
    const distReal = ruta?.distKm || aprendido.distancia_km
    const precioBase = calcularTarifaPorKmReales(distReal)
    return { lat: aprendido.lat, lng: aprendido.lng, precio: precioBase, dist: distReal, origen: 'MEMORIA 🧠', casetaAuto: detectarCasetaAutomatica(nombreLimpio), trazo: ruta?.geometry || [], duracion: ruta?.durationMin || 0 }
  }

  if (DESTINOS_RAPIDOS[nombreLimpio]) {
    const c = DESTINOS_RAPIDOS[nombreLimpio]
    const ruta = await obtenerRutaConTrazo(origenLat, origenLng, c.lat, c.lng)
    const distReal = ruta?.distKm || 0
    const precioBase = calcularTarifaPorKmReales(distReal)
    await supabase.from('destinos_aprendidos').insert({ nombre: texto, nombre_limpio: nombreLimpio, lat: c.lat, lng: c.lng, distancia_km: distReal, precio_base: precioBase }).select()
    return { lat: c.lat, lng: c.lng, precio: precioBase, dist: distReal, origen: 'RAPIDO ⚡', casetaAuto: detectarCasetaAutomatica(nombreLimpio), trazo: ruta?.geometry || [], duracion: ruta?.durationMin || 0 }
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto + ", Mexico")}&limit=1`)
    const data = await res.json()
    if (data && data[0]) {
      const lat = parseFloat(data[0].lat); const lng = parseFloat(data[0].lon)
      const ruta = await obtenerRutaConTrazo(origenLat, origenLng, lat, lng)
      if (!ruta || ruta.distKm > 300) return null
      const precioBase = calcularTarifaPorKmReales(ruta.distKm)
      await supabase.from('destinos_aprendidos').insert({ nombre: texto, nombre_limpio: nombreLimpio, lat, lng, distancia_km: ruta.distKm, precio_base: precioBase }).select()
      return { lat, lng, precio: precioBase, dist: ruta.distKm, origen: 'IA 🌎', casetaAuto: detectarCasetaAutomatica(nombreLimpio), trazo: ruta.geometry, duracion: ruta.durationMin }
    }
  } catch {}
  return null
}