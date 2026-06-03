import React from 'react'

export default function Psi(){
  function send(type, payload){
    window.dispatchEvent(new CustomEvent('sigma:control', { detail: { type, payload }}))
  }

  return (
    <div className="psi-panel">
      <h3>Sigma Controls</h3>
      <div>
        <label>Model URL</label>
        <input id="modelUrl" defaultValue="/models/example.glb" />
        <button onClick={()=> send('loadModel', document.getElementById('modelUrl').value)}>Load</button>
      </div>
      <div>
        <button onClick={()=> send('rotate', 0.2)}>Rotate</button>
      </div>
    </div>
  )
}
