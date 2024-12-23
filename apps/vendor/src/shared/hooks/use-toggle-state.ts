import { useState } from 'react'

type StateType = [boolean, () => void, () => void, () => void] & {
  state: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useToggleState = (initial = false) => {
  const [state, setState] = useState<boolean>(initial)

  const close = () => {
    setState(false)
  }

  const open = () => {
    setState(true)
  }

  const toggle = () => {
    setState((state) => !state)
  }

  const hookData = [state, open, close, toggle] as StateType
  hookData.state = state
  hookData.open = open
  hookData.close = close
  hookData.toggle = toggle
  return hookData
}
