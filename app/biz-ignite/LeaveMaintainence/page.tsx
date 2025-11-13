"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LeaveMaintenance() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to LeaveBalance by default
    router.push("/biz-ignite/LeaveMaintainence/LeaveBalance")
  }, [router])

  return null
}
