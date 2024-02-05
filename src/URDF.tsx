import { useState, useEffect, ReactElement, useRef, useCallback } from "react"
import { Euler, MeshProps, Vector3 } from "@react-three/fiber" // useFrame
import URDFLoader, { URDFRobot, URDFJoint, URDFLink, URDFVisual } from "urdf-loader"

import { URDFProps } from "./App"

interface limit {
  lower: number
  upper: number
}

type meshProps = MeshProps & {
  limit: limit
  startRotation: number
}

export const URDF = (
  props: URDFProps
) => {
  const [ URDFRobot, setURDFRobot ] = useState<URDFRobot>()
  const [ URDF, setURDF ] = useState<ReactElement>()
  const refs = useRef<Record<string, THREE.Mesh>>({})

  useEffect(()=>{
    if ( URDFRobot == null ) {
      const loader = new URDFLoader()
      loader.load( "../T12/urdf/T12.URDF", urdf => {
        setURDFRobot( urdf )
        console.log( "TEST1" )
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

  // TODO: Update for missing visuals
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
      return { element: null }
    }, []
  )

  const getMeshTree = useCallback(
    (
      robot: URDFRobot | undefined,
      position: Vector3,
      rotation: Euler
    ) => {
      if ( robot ) {
        const test = robot as URDFRobot
        if ( test.children ) {
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
            console.log( "TEST2" )
          }
        }
      }
    }, [jointMeshTree]
  )

  useEffect(()=>{
    if ( URDFRobot ) {
      getMeshTree( URDFRobot, props.position, props.rotation )
    }
  }, [URDFRobot, getMeshTree, props])

  // useEffect(()=>{
  //   if ( URDF ) {
  //     console.log( "TEST3" )
  //   }
  // }, [URDF])

  // useFrame((state) => {
    // // Move all named joints
    // for ( const key in refs.current ) {
    //   if ( key.startsWith("Hip") ) {
    //     const meshProps = refs.current[key] as unknown as meshProps
    //     refs.current[key].rotation.z = (( meshProps.startRotation + state.clock.getElapsedTime() ) % ( meshProps.limit.upper - meshProps.limit.lower )) + meshProps.limit.lower
    //   }
    //   if ( key.startsWith("Thigh") ) {
    //     const meshProps = refs.current[key] as unknown as meshProps
    //     refs.current[key].rotation.z = (( meshProps.startRotation + state.clock.getElapsedTime() ) % ( meshProps.limit.upper - meshProps.limit.lower )) + meshProps.limit.lower
    //   }
    //   if ( key.startsWith("Knee") ) {
    //     const meshProps = refs.current[key] as unknown as meshProps
    //     refs.current[key].rotation.z = (( meshProps.startRotation + state.clock.getElapsedTime() ) % ( meshProps.limit.upper - meshProps.limit.lower )) + meshProps.limit.lower
    //   }
    //   if ( key.startsWith("Shin") ) {
    //     const meshProps = refs.current[key] as unknown as meshProps
    //     refs.current[key].rotation.z = (( meshProps.startRotation + state.clock.getElapsedTime() ) % ( meshProps.limit.upper - meshProps.limit.lower )) + meshProps.limit.lower
    //   }
    //   if ( key.startsWith("Ankle") ) {
    //     const meshProps = refs.current[key] as unknown as meshProps
    //     refs.current[key].rotation.z = (( meshProps.startRotation + state.clock.getElapsedTime() ) % ( meshProps.limit.upper - meshProps.limit.lower )) + meshProps.limit.lower
    //   }
    //   if ( key.startsWith("Foot") ) {
    //     const meshProps = refs.current[key] as unknown as meshProps
    //     refs.current[key].rotation.z = (( meshProps.startRotation + state.clock.getElapsedTime() ) % ( meshProps.limit.upper - meshProps.limit.lower )) + meshProps.limit.lower
    //   }
    // }
    // Move named joint
  //   if ( refs.current.Thigh6 ){
  //     const meshProps = refs.current.Thigh6 as unknown as meshProps
  //     refs.current.Thigh6.rotation.z = (( meshProps.startRotation + state.clock.getElapsedTime() ) % ( meshProps.limit.upper - meshProps.limit.lower )) + meshProps.limit.lower
  //   }
  // })

  return (
    <>
      {URDF}
    </>
  )
}