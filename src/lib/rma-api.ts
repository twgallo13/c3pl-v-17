// V17.1.2-p7c-fix — RMA Adjustments data adapter (flagged, null-safe, clean)


  amount?: number;
  posted_at?:

  const useApi = (

    const res = await fetch(
  

    const rows = safeArr((json as any)?.items ?? json); // support {ite
      id: safeStr(r?.id),
      amount: safeNum(r?.

  } cat
    return [];
}






      id: safeStr(r?.id),
      artifact_type: safeStr(r?.artifact_type ?? r?.type ?? ''),
      amount: safeNum(r?.amount, 0),
      gl_journal_id: r?.gl_journal_id != null ? String(r.gl_journal_id) : null,
      posted_at: r?.posted_at != null ? String(r.posted_at) : null,
    }));
  } catch (e) {
    console.error('V17.1.2-p7c-fix rma adapter error:', e);
    return [];
  }
}