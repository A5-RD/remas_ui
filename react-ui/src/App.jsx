import React from 'react'
import Sigma from './components/Sigma'
import Psi from './components/Psi'

export default function App(){
  return (
    <div className="app">
      <div className="left">
        <Psi />
      </div>
      <div className="right">
        <Sigma />
      </div>
    </div>
  )
}
