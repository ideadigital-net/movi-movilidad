// src/config/tarifas.ts - FIX PASO 1
export const tarifasBase = [
  { destino: 'Amecameca', precio: 801, tiempo: 133, tipo: 'LIBRE', km: 45 },
  { destino: 'Mercado Municipal Tepoztlan', precio: 961, tiempo: 81, tipo: 'CUOTA', km: 65 },
  { destino: 'Toluca Centro', precio: 336, tiempo: 45, tipo: 'LIBRE', km: 28 },
  { destino: 'CDMX Observatorio', precio: 1200, tiempo: 95, tipo: 'CUOTA', km: 80 },
  { destino: 'Chalco', precio: 600, tiempo: 70, tipo: 'LIBRE', km: 35 },
  { destino: 'Cuernavaca', precio: 1500, tiempo: 110, tipo: 'CUOTA', km: 95 },
]

// Busca en localStorage / memoria que aprende
export const buscarYAprenderDestino = async (_origen: string, destino: string) => {
  try {
    const guardadas = JSON.parse(localStorage.getItem('tarifas_aprendidas') || '[]')
    const encontrada = guardadas.find((t: any) => 
      t.destino.toLowerCase().includes(destino.toLowerCase())
    )
    return encontrada || null
  } catch {
    return null
  }
}

// Guarda una nueva tarifa aprendida
export const guardarTarifaAprendida = (tarifa: any) => {
  try {
    const guardadas = JSON.parse(localStorage.getItem('tarifas_aprendidas') || '[]')
    guardadas.push(tarifa)
    localStorage.setItem('tarifas_aprendidas', JSON.stringify(guardadas))
  } catch {}
}

// CONFIG PASO 1 - Editables desde /tarifas
export const CONFIG = {
  TARIFA_BASE: 50,
  RADIO_BASE_KM: 4,
  PRECIO_POR_KM: 12,
  FACTOR_IDA_VUELTA: 1.5,
  MINIMO: 80,
  PRECIO_ESPERA: 1,
  NOCTURNO_PORC: 50,
}