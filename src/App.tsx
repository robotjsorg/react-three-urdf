import { useRef, ReactElement, Suspense } from 'react' //, useMemo
import { Mesh, Euler, Vector3 } from 'three'
import { Canvas, MeshProps, useLoader } from '@react-three/fiber' //, useFrame
import { OrbitControls, Text } from '@react-three/drei'
import { URDFRobot, URDFVisual, URDFJoint, URDFLink } from 'urdf-loader'
import URDFLoaderShim from './urdf-loader-fiber-shim'

// import { suspend } from 'suspend-react'

interface urdfProps {
  filepath: string
  position: Vector3
  rotation: Euler
}
interface limit {
  lower: number
  upper: number
}
type meshProps = MeshProps & {
  axis: Vector3
  limit: limit
  startRotation: number
}
const getLinkChildren = (
  link: URDFLink
) => {
  if ( link.children.length > 0 ) {
    return link.children as URDFJoint[]
  } else {
    return null
  }
}
const URDF =
(
  props: urdfProps
) => {
  const refs = useRef<Record<string, Mesh>>({})
  // const URDFRobot = useMemo(() => useLoader(
  //   URDFLoaderShim,
  //   props.filepath
  // ), [])
  const URDFRobot: URDFRobot = useLoader(
    URDFLoaderShim,
    props.filepath
  )
  console.log(URDFRobot)
  const jointMeshTree = (
    joint: URDFJoint,
    linkIndex: number = 0
  ): ReactElement | null => {
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
              material: mesh.material,
              axis: joint.axis,
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
              const jointMesh = jointMeshTree( child, linkIndex + 1 )
              if ( jointMesh ) {
                nested.push( jointMesh )
              }
            }
          })
          const mod = linkIndex % 7
          const color =
              mod == 0 ? 'darkorange'
            : mod == 1 ? 'gold'
            : mod == 2 ? 'green'
            : mod == 3 ? 'blue'
            : mod == 4 ? 'purple'
            : mod == 5 ? 'deeppink'
            :            'red'
          return (
            <mesh {...meshProps} ref={(e) => refs.current[link.name] = e!}>
              {nested}
              <meshStandardMaterial color={color}/>
            </mesh>
          )
        }
      }
    }
    return null
  }
  const getMeshTree = (
    robot: URDFRobot,
    position: Vector3,
    rotation: Euler
  ): ReactElement | null => {
    if ( robot.children.length > 1 ) {
      const mesh = robot.children[0].children[0] as Mesh
      const joints = robot.children.slice(1) as URDFJoint[]
      const meshProps: MeshProps =
      {
        key: robot.name,
        geometry: mesh.geometry,
        material: mesh.material,
        position: position,
        rotation: rotation,
        castShadow: true,
        receiveShadow: true
      }
      // if ( robot.name == "" ) { // robot.name robot.robotName
      //   meshProps.scale = new Vector3(0.01, 0.01, 0.01)
      // }
      const meshes: ReactElement[] = []
      joints.forEach( joint => {
        const jointMesh = jointMeshTree( joint  )
        if ( jointMesh ) {
          meshes.push( jointMesh )
        }
      })
      return (
        <mesh {...meshProps}>
          {meshes}
          <meshStandardMaterial color={'red'}/>
        </mesh>
      )
    } else {
      const joints = robot.children.slice(0) as URDFJoint[]
      const meshProps: MeshProps =
      {
        key: robot.name,
        position: position,
        rotation: rotation
      }
      // if ( robot.robotName == "" ) { // robot.name robot.robotName
      //   meshProps.scale = new Vector3(0.01, 0.01, 0.01)
      // }
      const meshes: ReactElement[] = []
      joints.forEach( joint => {
        const jointMesh = jointMeshTree( joint  )
        if ( jointMesh ) {
          meshes.push( jointMesh )
        }
      })
      return (
        <mesh {...meshProps}>
          {meshes}
        </mesh>
      )
    }
  }
  // const getRobot = ( path: string, position: Vector3, rotation: Euler ) => {
  //   suspend(async () => {
  //     const URDFRobot: URDFRobot = useLoader(
  //       URDFLoaderShim,
  //       path
  //     )
  //     console.log(URDFRobot)
  //     const URDF = getMeshTree( URDFRobot, position, rotation )
  //     return (
  //       URDF
  //     )
  //   }, [path])
  // }
  // const URDF = getRobot(props.filepath, props.position, props.rotation)
  const URDF = getMeshTree( URDFRobot, props.position, props.rotation )
  // const URDF = useMemo(() => getMeshTree( URDFRobot, props.position, props.rotation ), [URDFRobot])
  // const calculateJointAngles = (
  //   meshProps: meshProps,
  //   elapsedTime: any
  // ): number => {
  //   return (
  //       (meshProps.startRotation + elapsedTime)
  //     % (meshProps.limit.upper - meshProps.limit.lower)
  //     + meshProps.limit.lower
  //   )
  // }
  // const updateJoint =
  // (
  //   mesh: Mesh,
  //   elapsedTime: any
  // ) => {
  //   if ( mesh ){
  //     const meshProps = mesh as unknown as meshProps
  //     if ( meshProps.axis.x ) {
  //       mesh.rotation.x = calculateJointAngles(meshProps, elapsedTime)
  //     } else if ( meshProps.axis.y ) {
  //       mesh.rotation.y = calculateJointAngles(meshProps, elapsedTime)
  //     } else if ( meshProps.axis.z ) {
  //       mesh.rotation.z = calculateJointAngles(meshProps, elapsedTime)
  //     }
  //   }
  // }
  // useFrame((state) => {
  //   const joints = refs.current
  //   for ( const joint in joints ) {
  //     updateJoint(joints[joint], state.clock.getElapsedTime())
  //   }
  //   // updateJoint(refs.current.Hip1, state.clock.getElapsedTime())
  //   // updateJoint(refs.current.Thigh2, state.clock.getElapsedTime())
  //   // updateJoint(refs.current.Knee3, state.clock.getElapsedTime())
  //   // updateJoint(refs.current.Shin4, state.clock.getElapsedTime())
  //   // updateJoint(refs.current.Ankle5, state.clock.getElapsedTime())
  //   // updateJoint(refs.current.Foot6, state.clock.getElapsedTime())
  // })
  return (
    <>
      {URDF}
    </>
  )
}
export function App() {
  /* SAMPLE
  const T12: urdfProps = {
    filepath: '../T12/urdf/T12.URDF',
    position: new Vector3(0, 0, 0),
    rotation: new Euler(Math.PI/2, 0, 0)
  }

  <URDF {...T12} />
  */
  const dataset = '../urdf_files_dataset/urdf_files'
  // Working examples
  const fanuc_lrmate200ib: urdfProps = {
    filepath: dataset + '/matlab/fanuc_lrmate200ib_support/urdf/fanucLRMate200ib.urdf',
    position: new Vector3(0.5, 0, -1),
    rotation: new Euler(-Math.PI/2, 0, -Math.PI/4)
  }
  const fanuc_m16ib: urdfProps = {
    filepath: dataset + '/matlab/fanuc_m16ib_support/urdf/fanucM16ib.urdf',
    position: new Vector3(1.5, 0, -1),
    rotation: new Euler(-Math.PI/2, 0, -Math.PI/4)
  }
  const motoman_mh5: urdfProps = {
    filepath: dataset + '/matlab/motoman_mh5_support/urdf/yaskawaMotomanMH5.urdf',
    position: new Vector3(-1, 0, 0),
    rotation: new Euler(-Math.PI/2, 0, -Math.PI/4)
  }
  const abb_irb1600: urdfProps = {
    filepath: dataset + '/matlab/abb_irb1600_support/urdf/abbIrb1600.urdf',
    position: new Vector3(0, 0, 0),
    rotation: new Euler(-Math.PI/2, 0, -Math.PI/4)
  }
  const abb_irb120: urdfProps = {
    filepath: dataset + '/matlab/abb_irb120_support/urdf/abbIrb120.urdf',
    position: new Vector3(1, 0, 0),
    rotation: new Euler(-Math.PI/2, 0, -Math.PI/4)
  }
  const kukaIiwa7: urdfProps = {
    filepath: dataset + '/matlab/iiwa_description/urdf/kukaIiwa7.urdf',
    position: new Vector3(-1.5, 0, -1),
    rotation: new Euler(-Math.PI/2, 0, 0)
  }
  const kukaIiwa14: urdfProps = {
    filepath: dataset + '/matlab/iiwa_description/urdf/kukaIiwa14.urdf',
    position: new Vector3(-0.5, 0, -1),
    rotation: new Euler(-Math.PI/2, 0, 0)
  }
  // TODO: Joints misaligned and broken materials, No error
  const abb_irb140: urdfProps = {
    filepath: dataset + '/robotics-toolbox/abb_irb140/urdf/irb140.urdf',
    position: new Vector3(0, 0, 0),
    rotation: new Euler(-Math.PI/2, 0, 0)
  }
  // TODO: Model is too big to load
  // [Error] RangeError: length too large
  const T12: urdfProps = {
    filepath: '../T12/urdf/T12.URDF',
    position: new Vector3(0, 0, 0),
    rotation: new Euler(Math.PI/2, 0, 0)
  }
  const jackal: urdfProps = {
    filepath: dataset + '/oems/xacro_generated/jackal_clearpath_robotics/jackal_description/urdf/jackal.urdf',
    position: new Vector3(0, 0, 0),
    rotation: new Euler(0, 0, 0)
  }
  // TODO: Collada
  // [Error] THREE.ColladaLoader: Failed to parse collada file.
  // [Error] TypeError: null is not an object (evaluating 'dae.scene') — URDFLoader.js:654
  const panda_arm: urdfProps = {
    filepath: '../panda_arm/meshes/panda_arm.urdf',
    position: new Vector3(0, 0, 0),
    rotation: new Euler(Math.PI/2, 0, 0)
  }
  const abb_irb5400: urdfProps = {
    filepath: dataset + '/ros-industrial/abb/abb_irb5400_support/urdf/irb5400.urdf',
    position: new Vector3(0, 0, 0),
    rotation: new Euler(0, 0, 0)
  }

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{
        position: [-0.5, 3, 2.5],
        near: 0.01,
        far: 200
      }}>
      <Suspense fallback={null}>
        <URDF {...fanuc_lrmate200ib} />
        <URDF {...fanuc_m16ib} />
        <URDF {...motoman_mh5} />
        <URDF {...abb_irb1600} />
        <URDF {...abb_irb120} />
        <URDF {...kukaIiwa7} />
        <URDF {...kukaIiwa14} />
        {/* <URDF {...abb_irb140} /> */}
        {/* <URDF {...T12} /> */}
        {/* <URDF {...jackal} /> */}
        {/* <URDF {...panda_arm} /> */}
        {/* <URDF {...abb_irb5400} /> */}
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
        enableZoom={ true }
        maxPolarAngle={Math.PI/2}
        enablePan={ true }
        target={ [0, 0, 0] }
      />
    </Canvas>
  )
}