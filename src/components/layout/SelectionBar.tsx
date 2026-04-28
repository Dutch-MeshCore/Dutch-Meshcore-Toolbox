import { useLang } from '../../hooks/useLang'

interface Props {
  selectionSize: number
  onSelectAll: () => void
  onClear: () => void
  onExportTxt: () => void
  onExportRtfm: () => void
  onExportJson: () => void
  onExportCoreScope?: () => void
}

export default function SelectionBar({
  selectionSize,
  onSelectAll,
  onClear,
  onExportTxt,
  onExportRtfm,
  onExportJson,
  onExportCoreScope,
}: Props) {
  const { t } = useLang()

  return (
    <div className={`sel-bar${selectionSize > 0 ? ' visible' : ''}`}>
      <span className="sel-count">{selectionSize} {t('sel_selected')}</span>
      <button className="btn" onClick={onSelectAll}>{t('sel_all')}</button>
      <button className="btn" onClick={onClear}>{t('sel_clear')}</button>
      <div className="vr" />
      <button className="btn" onClick={onExportTxt}>⬇ TXT</button>
      <button className="btn" onClick={onExportRtfm}>⬇ RTfM</button>
      <button className="btn" onClick={onExportJson}>⬇ JSON</button>
      {onExportCoreScope && <button className="btn" onClick={onExportCoreScope}>⬇ CoreScope</button>}
    </div>
  )
}
