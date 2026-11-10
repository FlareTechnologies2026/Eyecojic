import { useContext } from 'react'
import { MinervaContext } from '../context/minervaContext'

export function useMinerva() {
  const ctx = useContext(MinervaContext)
  if (!ctx) throw new Error('useMinerva must be used inside <MinervaProvider>')
  return ctx
}
