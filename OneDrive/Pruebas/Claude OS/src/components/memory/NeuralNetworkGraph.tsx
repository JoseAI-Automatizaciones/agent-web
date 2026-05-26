"use client";

import { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Custom Glass Shader Material for nodes
const GlassNodeMaterial = ({ 
  color = "#06b6d4",
  glowColor = "#00ffff",
  innerColor = "#0044ff",
  haloColor = "#ffffff",
}: {
  color?: string;
  glowColor?: string;
  innerColor?: string;
  haloColor?: string;
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += 0.01;
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={{
        time: { value: 0 },
        color: { value: new THREE.Color(color) },
        glowColor: { value: new THREE.Color(glowColor) },
        innerColor: { value: new THREE.Color(innerColor) },
        haloColor: { value: new THREE.Color(haloColor) },
      }}
      vertexShader={`
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        uniform float time;
        uniform vec3 color;
        uniform vec3 glowColor;
        uniform vec3 innerColor;
        uniform vec3 haloColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // Glass sphere effect
          vec3 normal = normalize(vNormal);
          float fresnel = 1.0 - max(0.0, dot(normal, vec3(0.0, 0.0, 1.0)));
          fresnel = pow(fresnel, 3.0);
          
          // Inner gradient based on position
          float posFactor = abs(vPosition.y) / 1.0;
          vec3 baseColor = mix(innerColor, color, 0.7 + posFactor * 0.2);
          
          // Rim light
          vec3 rim = glowColor * fresnel * 2.0;
          
          // Halo effect
          float halo = smoothstep(0.0, 1.0, length(vPosition.xy) / 0.5);
          vec3 haloColorFinal = haloColor * (1.0 - halo) * 0.5;
          
          // Combine
          vec3 finalColor = baseColor + rim + haloColorFinal;
          
          // Add subtle animated noise for glass texture
          float noise = fract(sin(dot(vPosition, vec3(12.9898, 78.233, 151.718 + time))) * 43758.5453) * 0.1;
          finalColor += noise * 0.2;
          
          gl_FragColor = vec4(finalColor, 0.9);
        }
      `}
      transparent={true}
      depthWrite={false}
    />
  );
};

// Node types with AI model-specific colors
const NODE_COLORS: Record<string, { main: string; glow: string; inner: string; halo: string; label: string }> = {
  claude: { main: "#8B5CF6", glow: "#A78BFA", inner: "#7C3AED", halo: "#E9D5FF", label: "Claude" },
  codex: { main: "#10B981", glow: "#34D399", inner: "#059669", halo: "#D1FAE5", label: "Codex" },
  mistral: { main: "#EF4444", glow: "#F87171", inner: "#DC2626", halo: "#FEE2E2", label: "Mistral" },
  antigravity: { main: "#06B6D4", glow: "#22D3EE", inner: "#0891B2", halo: "#CCFBF1", label: "Antigravity" },
  core: { main: "#FFFFFF", glow: "#FFFFFF", inner: "#E0E0E0", halo: "#FFFFFF", label: "Core" },
  workspace: { main: "#10B981", glow: "#34D399", inner: "#059669", halo: "#D1FAE5", label: "Workspace" },
  file: { main: "#60A5FA", glow: "#93C5FD", inner: "#3B82F6", halo: "#DBEAFE", label: "File" },
  decision: { main: "#FBBF24", glow: "#FACC15", inner: "#EAB308", halo: "#FEF3C7", label: "Decision" },
  session: { main: "#22D3EE", glow: "#67E8F9", inner: "#06B6D4", halo: "#CCFBF1", label: "Session" },
  skill: { main: "#F472B6", glow: "#F9A8D4", inner: "#EC4899", halo: "#FCE7F3", label: "Skill" },
  stale: { main: "#F97316", glow: "#FB923C", inner: "#EA580C", halo: "#FED7AA", label: "Stale" },
  missing: { main: "#EF4444", glow: "#F87171", inner: "#DC2626", halo: "#FEE2E2", label: "Missing" },
};

// AI Model colors for quick identification
const AI_MODEL_COLORS: Record<string, string> = {
  claude: "#8B5CF6",
  codex: "#10B981",
  mistral: "#EF4444",
  antigravity: "#06B6D4",
};

// Connection colors
const CONNECTION_COLORS = {
  primary: "#00ffff",
  secondary: "#00bfff",
  accent: "#ff00ff",
  residual: "#9d4edd",
};

interface NeuralNode {
  id: string;
  type: string;
  position: THREE.Vector3;
  size: number;
  content: string;
  connections: string[];
}

interface NodePathInfo {
  node: NeuralNode;
  path: string[];
}

// Glow Line component using Tube geometry for better glow effect
function GlowLine({ 
  curve, 
  color = "#00ffff", 
  width = 0.02,
  glowIntensity = 1.5,
  opacity = 0.8,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  color?: string;
  width?: number;
  glowIntensity?: number;
  opacity?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);
  
  // Create tube geometry from curve
  const geometry = useMemo(() => {
    const points = curve.getPoints(100);
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      100,
      width,
      8,
      false
    );
  }, [curve, width]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value += 0.02;
    }
    if (glowMeshRef.current) {
      glowMeshRef.current.material.uniforms.time.value += 0.02;
    }
  });

  // Glow material using shader
  const GlowMaterial = ({ color }: { color: string }) => {
    return (
      <shaderMaterial
        uniforms={{
          time: { value: 0 },
          color: { value: new THREE.Color(color) },
          glowIntensity: { value: glowIntensity },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform vec3 color;
          uniform float glowIntensity;
          varying vec2 vUv;
          
          void main() {
            // Center glow
            float distFromCenter = abs(vUv.x - 0.5) * 2.0;
            float glow = exp(-distFromCenter * distFromCenter * 5.0);
            
            // Pulsing effect
            float pulse = sin(time * 2.0) * 0.3 + 0.7;
            
            vec3 glowColor = color * glow * pulse * glowIntensity;
            gl_FragColor = vec4(glowColor, 0.8);
          }
        `}
        transparent={true}
        depthWrite={false}
      />
    );
  };

  return (
    <group>
      {/* Glow tube - larger and more transparent */}
      <mesh ref={glowMeshRef} geometry={geometry}>
        <GlowMaterial color={color} />
      </mesh>
      
      {/* Main tube */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial 
          color={color} 
          transparent={true} 
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

// Neural Node component
function NeuralNodeComponent({
  node,
  onClick,
  isHighlighted,
  isFrozen,
  isHovered,
}: {
  node: NeuralNode;
  onClick: (node: NeuralNode) => void;
  isHighlighted: boolean;
  isFrozen: boolean;
  isHovered: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const colors = NODE_COLORS[node.type] || NODE_COLORS.core;
  const timeRef = useRef({ value: 0 });
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      timeRef.current.value += delta;
      
      // Node size with hover effect
      const baseSize = node.size;
      const hoverScale = isHovered ? 1.3 : 1.0;
      const pulseScale = !isFrozen ? (1 + Math.sin(timeRef.current.value * 2) * 0.02) : 1.0;
      const finalScale = baseSize * hoverScale * pulseScale;
      
      groupRef.current.scale.setScalar(finalScale);
    }
  });

  return (
    <group
      ref={groupRef}
      position={node.position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(node);
      }}
    >
      {/* Main sphere with glass effect */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[node.size, 32, 32]} />
        <GlassNodeMaterial 
          color={colors.main}
          glowColor={colors.glow}
          innerColor={colors.inner}
          haloColor={colors.halo}
        />
      </mesh>
      
      {/* Glow effect - stronger when hovered */}
      <pointLight 
        position={[0, 0, 0]} 
        color={colors.glow}
        intensity={isHovered ? 5 : isHighlighted ? 3 : 1.5}
        distance={node.size * (isHovered ? 20 : 15)}
        decay={2}
      />
      
      {/* Halo ring - animated and larger when hovered */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[node.size * (isHovered ? 2.5 : 1.5), node.size * (isHovered ? 3.5 : 2.5), 32]} />
        <meshBasicMaterial 
          color={colors.halo} 
          transparent 
          opacity={0.05 + (isHighlighted ? 0.15 : 0) + (isHovered ? 0.2 : 0) + Math.sin(timeRef.current.value * 3) * 0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Data pulse particles moving along connections
function DataPulseParticles({
  connections,
}: {
  connections: Array<{ from: string; to: string; curve: THREE.Curve<THREE.Vector3> }>;
}) {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  
  // Create particle data
  const particleCount = Math.min(connections.length * 3, 200); // Limit for performance
  const particleData = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      connectionIndex: i % connections.length,
      progress: Math.random(),
      speed: 0.005 + Math.random() * 0.01,
      size: 0.02 + Math.random() * 0.02,
    }));
  }, [connections.length]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    particleData.forEach((p, i) => {
      p.progress += p.speed * delta * 60;
      if (p.progress > 1) p.progress = 0;
      
      const conn = connections[p.connectionIndex];
      if (conn) {
        const point = conn.curve.getPoint(p.progress);
        const dummy = new THREE.Object3D();
        dummy.position.copy(point);
        dummy.scale.setScalar(p.size);
        dummy.updateMatrix();
        particlesRef.current!.setMatrixAt(i, dummy.matrix);
      }
    });
    
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[0.05, 4, 4]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
    </instancedMesh>
  );
}

// Floating particles in the background
function FloatingParticles() {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const count = 300; // Reduced from 500 for better performance

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 150
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.005,
        (Math.random() - 0.5) * 0.005,
        (Math.random() - 0.5) * 0.005
      ),
      size: 0.02 + Math.random() * 0.03,
      color: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.8, 0.5),
    }));
  }, []);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    particles.forEach((p, i) => {
      p.position.add(p.velocity.clone().multiplyScalar(delta * 60));
      
      // Soft wrap around - create galaxy effect
      if (p.position.x > 75) p.position.x = -75;
      if (p.position.x < -75) p.position.x = 75;
      if (p.position.y > 75) p.position.y = -75;
      if (p.position.y < -75) p.position.y = 75;
      if (p.position.z > 75) p.position.z = -75;
      if (p.position.z < -75) p.position.z = 75;

      const dummy = new THREE.Object3D();
      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      particlesRef.current!.setMatrixAt(i, dummy.matrix);
      particlesRef.current!.setColorAt(i, p.color);
    });

    particlesRef.current.instanceMatrix.needsUpdate = true;
    particlesRef.current.instanceColor!.needsUpdate = true;
  });

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.08, 4, 4]} />
      <meshBasicMaterial vertexColors={true} transparent opacity={0.5} />
    </instancedMesh>
  );
}

// Energy ribbons
function EnergyRibbons() {
  const ribbonRef1 = useRef<THREE.Mesh>(null);
  const ribbonRef2 = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ribbonRef1.current) {
      ribbonRef1.current.rotation.y += 0.0008;
      ribbonRef1.current.rotation.x += 0.0003;
    }
    if (ribbonRef2.current) {
      ribbonRef2.current.rotation.y += 0.0012;
      ribbonRef2.current.rotation.x += 0.0005;
      ribbonRef2.current.rotation.z += 0.0002;
    }
  });

  // Create wavy ribbon geometry
  const createRibbonGeometry = (offset: number = 0) => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const segments = 50;
    const width = 15;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * width * 2;
      const y = Math.sin(t * Math.PI * 4 + offset) * 3;
      const z = Math.cos(t * Math.PI * 2 + offset * 0.5) * 8;
      
      // Top edge
      vertices.push(x, y + 0.2, z);
      // Bottom edge
      vertices.push(x, y - 0.2, z);
      
      // Colors - gradient from cyan to magenta
      const colorT = t * 0.5 + offset * 0.1;
      colors.push(colorT, 0.7, 1 - colorT);
      colors.push(colorT, 0.7, 1 - colorT);
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    
    return geometry;
  };

  return (
    <>
      <mesh ref={ribbonRef1} geometry={createRibbonGeometry(0)} position={[0, 0, -5]}>
        <meshBasicMaterial vertexColors={true} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ribbonRef2} geometry={createRibbonGeometry(Math.PI)} position={[0, 0, 5]}>
        <meshBasicMaterial vertexColors={true} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

// HUD elements with animated grid
function HUDElements() {
  const timeRef = useRef({ value: 0 });
  
  useFrame((state, delta) => {
    timeRef.current.value += delta;
  });

  return (
    <group>
      {/* Subtle grid lines */}
      {[...Array(10)].map((_, i) => {
        const opacity = 0.03 + Math.sin(timeRef.current.value * 0.1 + i) * 0.01;
        return (
          <group key={i} position={[0, 0, (i - 5) * 5]}>
            <line>
              <bufferGeometry>
                <bufferAttribute 
                  attach="attributes-position" 
                  array={new Float32Array([-50, 0, 0, 50, 0, 0])} 
                  count={2} 
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color="#00ffff" 
                transparent 
                opacity={opacity}
              />
            </line>
            <line>
              <bufferGeometry>
                <bufferAttribute 
                  attach="attributes-position" 
                  array={new Float32Array([0, -50, 0, 0, 50, 0])} 
                  count={2} 
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color="#00ffff" 
                transparent 
                opacity={opacity}
              />
            </line>
          </group>
        );
      })}
    </group>
  );
}

// Background with nebula effect
function CyberpunkBackground() {
  const timeRef = useRef({ value: 0 });
  
  useFrame((state, delta) => {
    timeRef.current.value += delta * 0.5;
  });

  // Pre-generate nebula positions
  const nebulaData = useMemo(() => {
    return Array.from({ length: 5 }, () => ({
      offsetX: (Math.random() - 0.5) * 100,
      offsetY: (Math.random() - 0.5) * 100,
      offsetZ: (Math.random() - 0.5) * 100,
      size: 30 + Math.random() * 20,
      color: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.5, 0.5),
    }));
  }, []);

  return (
    <group>
      {/* Deep blue base */}
      <color attach="background" args={["#06060B"]} />
      
      {/* Radial gradient effect using multiple spheres */}
      <mesh position={[0, 0, -50]}>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial 
          color="#0a1a2a" 
          transparent 
          opacity={0.9}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Nebula haze - animated */}
      {nebulaData.map((n, i) => {
        const animatedOpacity = 0.05 + Math.sin(timeRef.current.value + i * 0.7) * 0.02;
        return (
          <mesh key={i} position={[n.offsetX, n.offsetY, n.offsetZ - 50]}>
            <sphereGeometry args={[n.size, 16, 16]} />
            <meshBasicMaterial 
              color={n.color}
              transparent 
              opacity={animatedOpacity}
              side={THREE.BackSide}
            />
          </mesh>
        );
      })}
      
      {/* Vignette effect - using a quad */}
      <mesh position={[0, 0, -1]} rotation={[0, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Raycaster for hover detection
const NodeRaycaster = ({ nodes, onHover, onUnhover }: { 
  nodes: NeuralNode[]; 
  onHover: (nodeId: string) => void; 
  onUnhover: () => void;
}) => {
  const { camera, raycaster, mouse, gl } = useThree();
  
  useFrame(() => {
    if (!gl.domElement) return;
    
    // Update raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Create a map of node meshes for raycasting
    const intersects: THREE.Intersection[] = [];
    
    nodes.forEach((node) => {
      const dummyMesh = new THREE.Mesh(
        new THREE.SphereGeometry(node.size, 32, 32),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.01 })
      );
      dummyMesh.position.copy(node.position);
      dummyMesh.updateMatrixWorld();
      
      const nodeIntersects = raycaster.intersectObject(dummyMesh);
      if (nodeIntersects.length > 0) {
        intersects.push({ ...nodeIntersects[0], object: { userData: { nodeId: node.id } } } as any);
      }
    });
    
    if (intersects.length > 0) {
      const closest = intersects[0];
      const nodeId = (closest.object as any)?.userData?.nodeId;
      if (nodeId) {
        onHover(nodeId);
      }
    } else {
      onUnhover();
    }
  });
  
  return null;
};

// Main graph component
function NeuralNetworkGraphInner({
  nodes: externalNodes,
  onNodeSelect,
}: {
  nodes?: NeuralNode[];
  onNodeSelect?: (node: NeuralNode, path: string[]) => void;
}) {
  const { camera, gl, scene } = useThree();
  const [selectedNode, setSelectedNode] = useState<NodePathInfo | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // Generate nodes if not provided - with AI model types
  const nodes = useMemo<NeuralNode[]>(() => {
    if (externalNodes && externalNodes.length > 0) return externalNodes;
    
    const layers = 5;
    const nodesPerLayer = [8, 12, 10, 14, 9];
    const layerSpacing = 15;
    const nodeSpacing = 4;
    
    // AI model types for nodes
    const aiModels = ["claude", "codex", "mistral", "antigravity"];
    const generatedNodes: NeuralNode[] = [];
    
    for (let layer = 0; layer < layers; layer++) {
      const layerX = (layer - Math.floor(layers / 2)) * layerSpacing;
      const count = nodesPerLayer[layer] || 10;
      
      for (let i = 0; i < count; i++) {
        const y = (i - count / 2) * nodeSpacing + (Math.random() - 0.5) * 2;
        const z = (Math.random() - 0.5) * 3;
        
        // Use AI model types for nodes
        const type = aiModels[Math.floor(Math.random() * aiModels.length)];
        generatedNodes.push({
          id: `node-${layer}-${i}`,
          type,
          position: new THREE.Vector3(layerX, y, z),
          size: 0.4 + Math.random() * 0.2,
          content: `AI Model: ${type.toUpperCase()}\nLayer ${layer + 1}, Node ${i + 1}\nStatus: Active\nConnections: ${Math.floor(Math.random() * 5) + 1}`,
          connections: [],
        });
      }
    }
    
    // Add connections
    for (let i = 0; i < generatedNodes.length; i++) {
      const node = generatedNodes[i];
      // Connect to nodes in adjacent layers
      for (let j = 0; j < generatedNodes.length; j++) {
        if (i !== j) {
          const other = generatedNodes[j];
          const layerDiff = Math.abs(
            parseInt(node.id.split("-")[1]) - parseInt(other.id.split("-")[1])
          );
          if (layerDiff <= 1) {
            node.connections.push(other.id);
          }
          // Add some skip connections
          if (layerDiff === 2 && Math.random() > 0.7) {
            node.connections.push(other.id);
          }
        }
      }
    }
    
    return generatedNodes;
  }, [externalNodes]);

  // Create connections with Bezier curves
  const connections = useMemo(() => {
    const result: Array<{ 
      from: string; 
      to: string; 
      curve: THREE.Curve<THREE.Vector3>;
      color: string;
      width: number;
    }> = [];
    
    const nodeMap: Record<string, NeuralNode> = {};
    nodes.forEach((n) => (nodeMap[n.id] = n));
    
    nodes.forEach((node) => {
      node.connections.forEach((connId) => {
        const target = nodeMap[connId];
        if (target && node.id < connId) { // Avoid duplicates
          const from = node.position.clone();
          const to = target.position.clone();
          
          // Create quadratic Bezier curve
          const mid = from.clone().lerp(to, 0.5);
          mid.y += (Math.random() - 0.5) * 5;
          mid.z += (Math.random() - 0.5) * 2;
          
          const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
          
          // Determine color based on connection type
          const layerDiff = Math.abs(
            parseInt(node.id.split("-")[1]) - parseInt(connId.split("-")[1])
          );
          
          let color: string;
          let width = 0.02;
          if (layerDiff === 0) {
            color = CONNECTION_COLORS.residual;
            width = 0.015;
          } else if (layerDiff === 1) {
            color = CONNECTION_COLORS.primary;
            width = 0.03;
          } else if (layerDiff === 2) {
            color = CONNECTION_COLORS.accent;
            width = 0.025;
          } else {
            color = CONNECTION_COLORS.secondary;
            width = 0.02;
          }
          
          result.push({ from: node.id, to: connId, curve, color, width });
        }
      });
    });
    
    return result;
  }, [nodes]);

  // Find path from selected node using efficient BFS
  const findPath = (nodeId: string): string[] => {
    const path: string[] = [nodeId];
    const visited = new Set<string>([nodeId]);
    const nodeMap: Record<string, NeuralNode> = {};
    nodes.forEach((n) => (nodeMap[n.id] = n));
    
    // BFS to find connected nodes
    let queueIndex = 0;
    const queue = [nodeId];
    
    while (queueIndex < queue.length && path.length < 10) {
      const currentId = queue[queueIndex++];
      const currentNode = nodeMap[currentId];
      if (currentNode) {
        currentNode.connections.forEach((connId) => {
          if (!visited.has(connId)) {
            visited.add(connId);
            path.push(connId);
            queue.push(connId);
          }
        });
      }
    }
    return path;
  };

  const handleNodeClick = (node: NeuralNode) => {
    const path = findPath(node.id);
    setSelectedNode({ node, path });
    setFrozen(true); // Freeze the network animation
    onNodeSelect?.(node, path);
  };

  const handleClose = () => {
    setSelectedNode(null);
    setFrozen(false); // Unfreeze when closed
  };

  // Camera movement - galaxy effect
  const cameraTimeRef = useRef({ value: 0 });
  useFrame((state, delta) => {
    if (!frozen) {
      cameraTimeRef.current.value += delta * 0.3;
      camera.position.x = Math.cos(cameraTimeRef.current.value) * 80;
      camera.position.y = Math.sin(cameraTimeRef.current.value * 0.8) * 30;
      camera.position.z = Math.sin(cameraTimeRef.current.value * 0.5) * 80 + 50;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      {/* Background */}
      <CyberpunkBackground />
      
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      <pointLight position={[50, 50, 50]} color="#00ffff" intensity={0.5} />
      <pointLight position={[-50, -50, -50]} color="#ff00ff" intensity={0.3} />
      <pointLight position={[0, 100, 0]} color="#ffffff" intensity={0.5} />
      
      {/* Energy ribbons */}
      <EnergyRibbons />
      
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* HUD elements */}
      <HUDElements />
      
      {/* Connections */}
      {connections.map((conn, i) => (
        <GlowLine 
          key={`${conn.from}-${conn.to}-${i}`} 
          curve={conn.curve} 
          color={conn.color} 
          width={conn.width}
          glowIntensity={1}
        />
      ))}
      
      {/* Data pulse particles */}
      <Suspense fallback={null}>
        <DataPulseParticles connections={connections} />
      </Suspense>
      
      {/* Raycaster for hover detection */}
      <NodeRaycaster 
        nodes={nodes} 
        onHover={setHoveredNodeId} 
        onUnhover={() => setHoveredNodeId(null)} 
      />
      
      {/* Nodes */}
      {nodes.map((node) => (
        <NeuralNodeComponent
          key={node.id}
          node={node}
          onClick={handleNodeClick}
          isHighlighted={selectedNode?.node.id === node.id || selectedNode?.path.includes(node.id)}
          isFrozen={frozen}
          isHovered={hoveredNodeId === node.id}
        />
      ))}
      
      {/* Selection indicator */}
      {selectedNode && (
        <group>
          {/* Highlight connections in path */}
          {connections.map((conn, i) => {
            const isInPath = selectedNode.path.includes(conn.from) && selectedNode.path.includes(conn.to);
            if (!isInPath) return null;
            
            return (
              <GlowLine 
                key={`highlight-${conn.from}-${conn.to}-${i}`} 
                curve={conn.curve} 
                color="#00ffff" 
                width={0.05}
                glowIntensity={3}
                opacity={0.9}
              />
            );
          })}
          
          {/* Path nodes glow */}
          {nodes.map((node) => {
            if (!selectedNode.path.includes(node.id)) return null;
            return (
              <mesh key={`glow-${node.id}`} position={node.position}>
                <sphereGeometry args={[node.size * 2, 16, 16]} />
                <meshBasicMaterial 
                  color="#00ffff" 
                  transparent 
                  opacity={0.1 + Math.sin(Date.now() * 0.001) * 0.05}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })}
        </group>
      )}
      
      {/* Info panel - render as HTML overlay */}
      {selectedNode && (
        <HtmlOverlay 
          position={selectedNode.node.position.clone().add(new THREE.Vector3(5, 5, 0))}
          onClose={handleClose}
          node={selectedNode.node}
          path={selectedNode.path}
        />
      )}
    </>
  );
}

// HTML Overlay component for node info
function HtmlOverlay({ 
  position, 
  onClose, 
  node, 
  path 
}: {
  position: THREE.Vector3;
  onClose: () => void;
  node: NeuralNode;
  path: string[];
}) {
  const { camera, gl } = useThree();
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  
  // Convert 3D position to 2D screen position
  useFrame(() => {
    if (gl.domElement) {
      const vector = position.clone();
      const widthHalf = gl.domElement.width / 2;
      const heightHalf = gl.domElement.height / 2;
      
      vector.project(camera);
      vector.x = (vector.x * widthHalf) + widthHalf;
      vector.y = -(vector.y * heightHalf) + heightHalf;
      
      // Check if on screen
      const onScreen = vector.x >= 0 && vector.x <= gl.domElement.width &&
                       vector.y >= 0 && vector.y <= gl.domElement.height;
      
      setScreenPosition({ x: vector.x, y: vector.y });
      setIsVisible(onScreen);
    }
  });

  if (!isVisible) return null;

  const getTypeColor = (type: string) => {
    const colors = NODE_COLORS[type] || NODE_COLORS.core;
    return colors.main;
  };

  const getTypeLabel = (type: string) => {
    const colors = NODE_COLORS[type] || NODE_COLORS.core;
    return colors.label || type;
  };

  // Get AI model icon/emoji
  const getModelIcon = (type: string) => {
    const icons: Record<string, string> = {
      claude: "🤖",
      codex: "🧠",
      mistral: "⚡",
      antigravity: "🚀",
    };
    return icons[type] || "🔗";
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${screenPosition.x}px`,
        top: `${screenPosition.y}px`,
        transform: "translate(-50%, -50%)",
        background: "rgba(10, 10, 20, 0.98)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${getTypeColor(node.type)}`,
        borderRadius: "16px",
        padding: "20px",
        maxWidth: "320px",
        color: "white",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        fontSize: "13px",
        zIndex: 1000,
        boxShadow: `0 0 40px ${getTypeColor(node.type)}40`,
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ marginBottom: "12px", fontWeight: "bold", fontSize: "16px", color: getTypeColor(node.type), display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "20px" }}>{getModelIcon(node.type)}</span>
        <span>{getTypeLabel(node.type).toUpperCase()}</span>
      </div>
      <div style={{ marginBottom: "8px", fontSize: "11px", color: "#6b7280", fontFamily: "monospace" }}>
        ID: {node.id}
      </div>
      <div style={{ marginBottom: "16px", color: "#d1d5db", fontSize: "14px", lineHeight: "1.5" }}>
        {node.content.split("\n").slice(0, 2).join("\n")}
      </div>
      
      <div style={{ marginBottom: "12px" }}>
        <div style={{ color: "#9ca3af", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          PATH ({path.length} nodes)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {path.slice(0, 5).map((id, i) => (
            <span
              key={id}
              style={{
                background: i === 0 ? "#00ffff" : "rgba(0, 255, 255, 0.15)",
                color: i === 0 ? "#000" : "#00ffff",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "10px",
                fontFamily: "monospace",
                border: i === 0 ? "none" : "1px solid rgba(0, 255, 255, 0.3)",
              }}
            >
              {id}
            </span>
          ))}
          {path.length > 5 && (
            <span style={{ color: "#6b7280", fontSize: "10px", fontFamily: "monospace" }}>
              +{path.length - 5}
            </span>
          )}
        </div>
      </div>
      
      <button
        onClick={() => {
          // Trigger content view - will be handled by parent
          onClose();
          // For demo, we'll just show alert, but in real app this would open a modal
          if (typeof window !== "undefined") {
            const contentLines = node.content.split("\n");
            alert(`Content:\n\n${contentLines.slice(0, 5).join("\n")}${contentLines.length > 5 ? "\n\n..." : ""}`);
          }
        }}
        style={{
          background: "linear-gradient(90deg, #00ffff 0%, #00bfff 100%)",
          border: "none",
          borderRadius: "6px",
          padding: "8px 12px",
          color: "#000",
          fontWeight: "bold",
          fontSize: "11px",
          cursor: "pointer",
          width: "100%",
          marginBottom: "8px",
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: "transform 0.1s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        VIEW CONTENT
      </button>
      
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "6px",
          padding: "6px 10px",
          color: "#9ca3af",
          fontSize: "11px",
          cursor: "pointer",
          width: "100%",
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: "all 0.1s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
      >
        CLOSE
      </button>
    </div>
  );
}

// Main component with Canvas
function NeuralNetworkGraphComponent({
  nodes: externalNodes,
  onNodeSelect,
}: {
  nodes?: NeuralNode[];
  onNodeSelect?: (node: NeuralNode, path: string[]) => void;
}) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas 
        camera={{ position: [0, 0, 50], fov: 60, near: 0.1, far: 1000 }} 
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => {}}
      >
        <Suspense fallback={null}>
          <NeuralNetworkGraphInner nodes={externalNodes} onNodeSelect={onNodeSelect} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Export types and main component
export type { NeuralNode, NodePathInfo };
export { NeuralNetworkGraphComponent as NeuralNetworkGraph };
export default NeuralNetworkGraphComponent;
