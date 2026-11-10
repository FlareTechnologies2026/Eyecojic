import { useContext } from 'react'
import { EycoContext } from '../context/eycoContext'

export function useEyco() {
  const ctx = useContext(EycoContext)
  if (!ctx) throw new Error('useEyco must be used inside <EycoProvider>')
  return ctx
}
