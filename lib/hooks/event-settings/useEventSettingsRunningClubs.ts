import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useEventSettingsRunningClubs(eventId: string) {
  const [runningClubs, setRunningClubs] = useState<any[]>([])
  const [loadingRunningClubs, setLoadingRunningClubs] = useState(false)

  const fetchRunningClubs = async () => {
    try {
      setLoadingRunningClubs(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("running_clubs")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setRunningClubs(data || [])
    } catch (error: any) {
      console.error("Erro ao buscar clubes:", error)
    } finally {
      setLoadingRunningClubs(false)
    }
  }

  return {
    runningClubs,
    setRunningClubs,
    loadingRunningClubs,
    fetchRunningClubs,
  }
}

