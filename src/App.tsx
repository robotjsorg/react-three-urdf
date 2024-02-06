import { useState, useEffect, useRef, useCallback, ReactElement } from "react"
import { Canvas, MeshProps, Vector3, Euler, useFrame } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import URDFLoader, { URDFRobot, URDFVisual, URDFJoint, URDFLink } from "urdf-loader"
interface urdfProps {
  position: Vector3
  rotation: Euler
}
interface limit {
  lower: number
  upper: number
}
type meshProps = MeshProps & {
  limit: limit
  startRotation: number
}
const URDF = (
  props: urdfProps
) => {
  const [ URDFRobot, setURDFRobot ] = useState<URDFRobot>()
  const [ URDF, setURDF ] = useState<ReactElement>()
  const refs = useRef<Record<string, THREE.Mesh>>({})
  useEffect(()=>{
    if ( URDFRobot == null ) {
      const loader = new URDFLoader()
      loader.load( "../T12/urdf/T12.URDF", urdf => {
        setURDFRobot( urdf )
      })
    }
  }, [URDFRobot])
  const getLinkChildren = ( link: URDFLink ) => {
    if ( link.children.length > 0 ) {
      return link.children as URDFJoint[]
    } else {
      return null
    }
  }
  const jointMeshTree = useCallback(
    (
      joint: URDFJoint
    ): {
      element: ReactElement | null
    } => {
      const link = joint.children[0] as URDFLink
      if ( link ) {
        const visual = link.children[0] as URDFVisual
        if ( visual ) {
          const mesh = visual.children[0] as THREE.Mesh
          if ( mesh ) {
            const meshProps: meshProps = { limit: {lower: joint.limit.lower as number, upper: joint.limit.upper as number}, startRotation: joint.rotation.z, key: link.name, geometry: mesh.geometry, position: joint.position, rotation: joint.rotation, castShadow: true, receiveShadow: true }
            const linkChildren = getLinkChildren( link )
            const nested: ReactElement[] = []
            linkChildren?.forEach(child => {
              if ( child.type == "URDFJoint" ) {
                const { element } = jointMeshTree( child )
                if ( element ) {
                  nested.push( element )
                }
              }
            })
            return {
              element:
              <mesh {...meshProps} ref={(meshElement) => refs.current[link.name] = meshElement!}>
                {nested}
                <meshStandardMaterial/>
              </mesh>
            }
          }
        }
      }
      return {element: null}
    }, []
  )
  const getMeshTree = useCallback(
    (
      robot: URDFRobot | undefined,
      position: Vector3,
      rotation: Euler
    ) => {
      if ( robot ) {
        const mesh = robot.children[0].children[0] as THREE.Mesh
        if ( mesh ) {
          const pos = position as number[]
          const rot = rotation as number[]
          robot.translateX(pos[0])
          robot.translateY(pos[1])
          robot.translateZ(pos[2])
          robot.rotateX(rot[0])
          robot.rotateY(rot[1])
          robot.rotateZ(rot[2])
          const meshProps: MeshProps = { key: robot.name, geometry: mesh.geometry, position: robot.position, rotation: robot.rotation, castShadow: true, receiveShadow: true }
          const joints = robot.children.slice(1) as URDFJoint[]
          const meshes: ReactElement[] = []
          joints.forEach( joint => {
            const { element } = jointMeshTree( joint  )
            if ( element ) {
              meshes.push( element )
            }
          })
          setURDF(
            <mesh {...meshProps}>
              {meshes}
              <meshStandardMaterial/>
            </mesh>
          )
        }
      }
    }, [jointMeshTree]
  )
  useEffect(()=>{
    if ( URDFRobot && URDF == null ) {
      getMeshTree( URDFRobot, props.position, props.rotation )
    }
  }, [URDFRobot, getMeshTree, props])
  useFrame((state) => {
    if ( refs.current.Thigh6 ){
      const meshProps = refs.current.Thigh6 as unknown as meshProps
      refs.current.Thigh6.rotation.z = (( meshProps.startRotation + state.clock.getElapsedTime() ) % ( meshProps.limit.upper - meshProps.limit.lower )) + meshProps.limit.lower
    }
  })
  return <>{URDF}</>
}
export function App() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [1, 2, 3], near: 0.01, far: 20 }}>
      <URDF position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]} />
      <URDF position={[0, -1, 0]} rotation={[Math.PI/2, 0, 0]} />
      <URDF position={[0, -2, 0]} rotation={[Math.PI/2, 0, 0]} />
      <gridHelper args={[10, 10]} />
      <axesHelper args={[1]} position={[-0.01, -0.01, -0.01]} />
      <Text color={"#E03131"} rotation={[Math.PI/2, Math.PI, Math.PI]} position={[0.9, 0, -0.1]} fontSize={0.12}>X</Text>
      <Text color={"#1971C2"} rotation={[Math.PI/2, Math.PI, Math.PI]} position={[0.1, 0, 0.9]} fontSize={0.12}>Z</Text>
      <directionalLight intensity={2} position={[5, 5, 5]} />
      <directionalLight intensity={2} position={[5, 5, -5]} />
      <directionalLight intensity={2} position={[-5, 5, 5]} />
      <directionalLight intensity={2} position={[-5, 5, -5]} />
      <OrbitControls makeDefault screenSpacePanning={ false } enableZoom={ false } maxPolarAngle={Math.PI/2} enablePan={ true } target={ [0.25, 0, 1] } />
    </Canvas>
  )
}