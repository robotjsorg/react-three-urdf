import { Canvas, AxesHelperProps, GridHelperProps, DirectionalLightProps, Vector3, Euler } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"

import { URDF } from "./URDF"
import { Suspense } from "react"

export interface URDFProps {
  position: Vector3,
  rotation: Euler
}

export function App() {
  const gridHelperProps: GridHelperProps = {args: [10, 10]}
  const axesHelperProps: AxesHelperProps = {args: [1], position: [-0.01, -0.01, -0.01]}
  const directionalLightProps1: DirectionalLightProps = {intensity: 2, position: [5, 5, 5]}
  const directionalLightProps2: DirectionalLightProps = {intensity: 2, position: [5, 5, -5]}
  const directionalLightProps3: DirectionalLightProps = {intensity: 2, position: [-5, 5, 5]}
  const directionalLightProps4: DirectionalLightProps = {intensity: 2, position: [-5, 5, -5]}

  const URDFProps1: URDFProps = {position: [0, 0, 0], rotation: [Math.PI/2, 0, 0]}
  const URDFProps2: URDFProps = {position: [0, -1, 0], rotation: [Math.PI/2, 0, 0]}
  const URDFProps3: URDFProps = {position: [0, -2, 0], rotation: [Math.PI/2, 0, 0]}

  return (
    <Canvas dpr={[1, 2]} camera={{ position: [1, 2, 3], near: 0.01, far: 20 }}>
      <Suspense fallback={null}>
        <URDF {...URDFProps1} />
        <URDF {...URDFProps2} />
        <URDF {...URDFProps3} />
      </Suspense>

      <gridHelper {...gridHelperProps} />
      <axesHelper {...axesHelperProps} />
      <Text color={"#E03131"} rotation={[Math.PI/2, Math.PI, Math.PI]} position={[0.9, 0, -0.1]} fontSize={0.12}>X</Text>
      <Text color={"#1971C2"} rotation={[Math.PI/2, Math.PI, Math.PI]} position={[0.1, 0, 0.9]} fontSize={0.12}>Z</Text>

      <directionalLight {...directionalLightProps1} />
      <directionalLight {...directionalLightProps2} />
      <directionalLight {...directionalLightProps3} />
      <directionalLight {...directionalLightProps4} />

      <OrbitControls makeDefault screenSpacePanning={ false } enableZoom={ false } maxPolarAngle={Math.PI/2} enablePan={ true } target={ [0.25, 0, 1] } />
    </Canvas>
  )
}