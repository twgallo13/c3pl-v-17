// V17.1.2-p7e-fix2 — RMA Adjustments data adapter (flagged, null-safe)


export type RmaAdjustment = {
  id: string;
  artifact_type?: string;
  const useApi = (

    const res = await fetch(
  

    const rows = safeArr(json?.items ?? json); // support {items: []} o
      id: safeStr(r?.id),
      amount: safeNum(r?.

  } cat
    return [];
}
















