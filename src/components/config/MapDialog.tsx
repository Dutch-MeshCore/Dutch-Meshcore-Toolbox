import { useEffect, useRef, useState } from 'react'
import { useLang } from '../../hooks/useLang'

interface Props {
  open: boolean
  lat: number
  lon: number
  onSet: (lat: number, lon: number) => void
  onCancel: () => void
}

export default function MapDialog({ open, lat, lon, onSet, onCancel }: Props) {
  const { t } = useLang()
  const mapRef = useRef<unknown>(null)
  const markerRef = useRef<unknown>(null)
  const [pos, setPos] = useState<[number, number]>([lat || 52.3, lon || 5.3])

  useEffect(() => {
    if (!open) return
    let map: { remove: () => void } | null = null

    import('leaflet').then(L => {
      // Create map after paint so the div is visible
      setTimeout(() => {
        const container = document.getElementById('usb-config-map')
        if (!container || mapRef.current) return

        const leafletMap = L.map(container).setView(pos, 8)
        map = leafletMap as unknown as { remove: () => void }
        mapRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(leafletMap)

        const marker = L.marker(pos, { draggable: true }).addTo(leafletMap)
        markerRef.current = marker

        marker.on('dragend', () => {
          const latlng = marker.getLatLng()
          setPos([Math.round(latlng.lat * 100000) / 100000, Math.round(latlng.lng * 100000) / 100000])
        })

        leafletMap.on('click', (e) => {
            const newPos: [number, number] = [
              Math.round(e.latlng.lat * 100000) / 100000,
              Math.round(e.latlng.lng * 100000) / 100000,
            ]
            setPos(newPos)
            marker.setLatLng(newPos)
          })
      }, 50)
    })

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [open])

  function requestLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(p => {
      const newPos: [number, number] = [
        Math.round(p.coords.latitude * 100000) / 100000,
        Math.round(p.coords.longitude * 100000) / 100000,
      ]
      setPos(newPos)
      const marker = markerRef.current as { setLatLng: (p: [number, number]) => void } | null
      const map = mapRef.current as { setView: (p: [number, number], z: number) => void } | null
      marker?.setLatLng(newPos)
      map?.setView(newPos, 13)
    })
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{t('map_title')}</h2>
          <button className="btn" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <div id="usb-config-map" />
          <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: '.5rem' }}>
            Lat: {pos[0]}, Lon: {pos[1]}
          </p>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={requestLocation}>{t('map_request')}</button>
          <button className="btn" onClick={onCancel}>{t('map_cancel')}</button>
          <button className="btn btn-accent" onClick={() => onSet(pos[0], pos[1])}>{t('map_set')}</button>
        </div>
      </div>
    </div>
  )
}
