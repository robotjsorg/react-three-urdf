import { useRef, ReactElement, Suspense } from 'react'
import { Mesh, Euler, Vector3 } from 'three'
import { Canvas, MeshProps, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { URDFRobot, URDFVisual, URDFJoint, URDFLink } from 'urdf-loader'
import URDFLoaderShim from './urdf-loader-fiber-shim'

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
  const refs = useRef<Record<string, Mesh>>({})
  const URDFRobot: URDFRobot = useLoader( URDFLoaderShim, '../T12/urdf/T12.URDF' )
  const getLinkChildren =
  (
    link: URDFLink
  ) => {
    if ( link.children.length > 0 ) {
      return link.children as URDFJoint[]
    } else {
      return null
    }
  }
  const jointMeshTree =
  (
    joint: URDFJoint,
    linkIndex: number = 0
  ): {
    jointMesh: ReactElement | null
  } => {
    const link = joint.children[0] as URDFLink
    if ( link ) {
      const visual = link.children[0] as URDFVisual
      if ( visual ) {
        const mesh = visual.children[0] as Mesh
        if ( mesh ) {
          const meshProps: meshProps =
            {
              key: link.name,
              geometry: mesh.geometry,
              position: joint.position,
              rotation: joint.rotation,
              startRotation: joint.rotation.z,
              limit: {
                lower: joint.limit.lower as number,
                upper: joint.limit.upper as number
              },
              castShadow: true,
              receiveShadow: true
            }
          const linkChildren = getLinkChildren( link )
          const nested: ReactElement[] = []
          linkChildren?.forEach( child => {
            if ( child.type == 'URDFJoint' ) {
              const { jointMesh } = jointMeshTree( child, linkIndex + 1 )
              if ( jointMesh ) {
                nested.push( jointMesh )
              }
            }
          })
          const color =
              linkIndex == 0 ? 'darkorange'
            : linkIndex == 1 ? 'gold'
            : linkIndex == 2 ? 'green'
            : linkIndex == 3 ? 'blue'
            : linkIndex == 4 ? 'purple'
            :                  'deeppink'
          return {
            jointMesh:
            <mesh {...meshProps} ref={(e) => refs.current[link.name] = e!}>
              {nested}
              <meshStandardMaterial color={color}/>
            </mesh>
          }
        }
      }
    }
    return { jointMesh: null }
  }
  const getMeshTree =
  (
    robot: URDFRobot,
    position: Vector3,
    rotation: Euler
  ): {
    combinedMesh: ReactElement
  } => {
    const mesh = robot.children[0].children[0] as Mesh
    robot.setRotationFromEuler(rotation)
    const meshProps: MeshProps =
      {
        key: robot.name,
        geometry: mesh.geometry,
        position: position,
        rotation: robot.rotation,
        castShadow: true,
        receiveShadow: true
      }
    const joints = robot.children.slice(1) as URDFJoint[]
    const meshes: ReactElement[] = []
    joints.forEach( joint => {
      const { jointMesh } = jointMeshTree( joint  )
      if ( jointMesh ) {
        meshes.push( jointMesh )
      }
    })
    const combinedMesh = (
      <mesh {...meshProps}>
        {meshes}
        <meshStandardMaterial color={'red'}/>
      </mesh>
    )
    return { combinedMesh }
  }
  const { combinedMesh: URDF } = getMeshTree( URDFRobot, props.position, props.rotation )
  const updateJoint =
  (
    mesh: Mesh,
    elapsedTime: any
  ) => {
    if ( mesh ){
      const meshProps = mesh as unknown as meshProps
      mesh.rotation.z =
        ( meshProps.startRotation + elapsedTime )
        % ( meshProps.limit.upper - meshProps.limit.lower )
        + meshProps.limit.lower
    }
  }
  useFrame((state) => {
    updateJoint(refs.current.Hip1, state.clock.getElapsedTime())
    updateJoint(refs.current.Thigh2, state.clock.getElapsedTime())
    updateJoint(refs.current.Knee3, state.clock.getElapsedTime())
    updateJoint(refs.current.Shin4, state.clock.getElapsedTime())
    updateJoint(refs.current.Ankle5, state.clock.getElapsedTime())
    updateJoint(refs.current.Foot6, state.clock.getElapsedTime())
  })
  return <>{URDF}</>
}
export function App() {
  const urdfProps1: urdfProps = {
    position: new Vector3(0, 0, 0),
    rotation: new Euler(Math.PI/2, 0, 0)
  }
  const urdfProps2: urdfProps = {
    position: new Vector3(0, -1, 0),
    rotation: new Euler(Math.PI/2, 0, 2*Math.PI/3)
  }
  const urdfProps3: urdfProps = {
    position: new Vector3(0, -2, 0),
    rotation: new Euler(Math.PI/2, 0, 4*Math.PI/3)
  }
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{
        position: [2.5, 6.5, 4.5],
        near: 0.01,
        far: 20
      }}>
      <Suspense fallback={null}>
        <URDF {...urdfProps1} />
        <URDF {...urdfProps2} />
        <URDF {...urdfProps3} />
      </Suspense>
      <gridHelper args={[10, 10]} />
      <axesHelper args={[1]} position={[-0.01, -0.01, -0.01]} />
      <directionalLight intensity={2} position={[5, 5, 5]} />
      <directionalLight intensity={2} position={[5, 5, -5]} />
      <directionalLight intensity={2} position={[-5, 5, 5]} />
      <directionalLight intensity={2} position={[-5, 5, -5]} />
      <Text
        color={'#E03131'}
        rotation={[Math.PI/2, Math.PI, Math.PI]}
        position={[0.9, 0, -0.1]}
        fontSize={0.12}>
          X
      </Text>
      <Text
        color={'#1971C2'}
        rotation={[Math.PI/2, Math.PI, Math.PI]}
        position={[0.1, 0, 0.9]}
        fontSize={0.12}>
          Z
      </Text>
      <OrbitControls
        makeDefault
        screenSpacePanning={ false }
        enableZoom={ false }
        maxPolarAngle={Math.PI/2}
        enablePan={ true }
        target={ [0.25, 0, 1] }
      />
    </Canvas>
  )
}