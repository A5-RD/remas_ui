import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function Sigma(){
  const mountRef = useRef(null)
  useEffect(() => {
    const el = mountRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 1000)
    camera.position.set(0, 1.5, 3)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(renderer.domElement)

    const light = new THREE.HemisphereLight(0xffffff, 0x444444)
    light.position.set(0, 20, 0)
    scene.add(light)

    const grid = new THREE.GridHelper(10, 10)
    scene.add(grid)

    let mixer = null

    const loader = new GLTFLoader()
    function loadModel(url){
      loader.load(url, (gltf) => {
        scene.clear()
        scene.add(light)
        scene.add(grid)
        const root = gltf.scene
        scene.add(root)
        if (gltf.animations && gltf.animations.length){
          mixer = new THREE.AnimationMixer(root)
          gltf.animations.forEach((clip)=> mixer.clipAction(clip).play())
        }
      })
    }

    // listen for simple control events from Psi
    function onMessage(e){
      const { type, payload } = e.detail || {}
      if (type === 'loadModel') loadModel(payload)
      if (type === 'rotate') {
        scene.rotation.y += (payload || 0.1)
      }
    }
    window.addEventListener('sigma:control', onMessage)

    const clock = new THREE.Clock()
    function animate(){
      requestAnimationFrame(animate)
      const dt = clock.getDelta()
      if (mixer) mixer.update(dt)
      renderer.render(scene, camera)
    }
    animate()

    function handleResize(){
      const w = el.clientWidth
      const h = el.clientHeight
      camera.aspect = w/h
      camera.updateProjectionMatrix()
      renderer.setSize(w,h)
    }
    window.addEventListener('resize', handleResize)

    return ()=>{
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('sigma:control', onMessage)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="sigma-canvas" />
}
