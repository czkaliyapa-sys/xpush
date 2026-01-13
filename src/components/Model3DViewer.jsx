import React, { Suspense, useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { 
  OrbitControls, 
  useGLTF, 
  ContactShadows, 
  PresentationControls,
  Html,
  Center,
  useProgress,
  Environment,
  Lightformer
} from '@react-three/drei';
import { Box, IconButton, Tooltip, Alert, CircularProgress } from '@mui/material';
import { 
  ThreeDRotation,
  ViewInAr 
} from '@mui/icons-material';
import model3DService from '../services/model3DService';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// Safe Model Loader Component with enhanced error handling
const SafeModel3D = ({ modelPath, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], onLoad, onError, autoRotate = false }) => {
  const modelRef = useRef();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // useGLTF participates in Suspense; do not set state during render
  // Switch to GLTFLoader via useLoader to set crossOrigin explicitly
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
  const effectiveModelPath = useMemo(() => {
    // Load GLTF directly; we will proxy sub-assets via URLModifier
    return modelPath;
  }, [modelPath]);

  const gltfResult = useLoader(GLTFLoader, effectiveModelPath, (loader) => {
    loader.setCrossOrigin('anonymous');
    try {
      const u = new URL(effectiveModelPath);
      const isSparkleHost = /sparkle-pro\.co\.uk$/i.test(u.hostname);
      if (isSparkleHost) {
        const originalPath = new URL(modelPath, window.location.href);
        const originalDir = originalPath.pathname.replace(/[^/]+$/, ''); // keep trailing slash
        // Ensure GLTFLoader resolves relative resources against the original model directory
        loader.setResourcePath(`https://${u.host}${originalDir}`);
        loader.manager.setURLModifier((assetURL) => {
          try {
            if (assetURL.startsWith('data:') || assetURL.startsWith('blob:')) return assetURL;
            // Absolute URL handling
            if (/^https?:\/\//i.test(assetURL)) {
              const parsed = new URL(assetURL);
              const sameHost = parsed.host === u.host;
              if (sameHost) {
                // Already proxied: do not rewrite
                if (parsed.pathname === '/models-proxy' || parsed.pathname === '/api/models-proxy') {
                  return assetURL;
                }
                // Already under /api/models -> proxy directly via remote API
                if (parsed.pathname.startsWith('/api/models/')) {
                  const dec = decodeURIComponent(parsed.pathname);
                  const clean = dec.replace(/(\.gltf|\.glb|\.obj)\.+$/i, '$1');
                  return `https://${u.host}/api/models-proxy?url=${encodeURIComponent(clean)}`;
                }
                // Wrongly resolved under /api/ -> rewrite to originalDir
                if (parsed.pathname.startsWith('/api/')) {
                  const relative = parsed.pathname.replace(/^\/api\//, '');
                  const correctedPath = `${originalDir}${relative}`;
                  const dec = decodeURIComponent(correctedPath);
                  const clean = dec.replace(/(\.gltf|\.glb|\.obj)\.+$/i, '$1');
                  return `https://${u.host}/api/models-proxy?url=${encodeURIComponent(clean)}`;
                }
              }
              // Different host or non-/api path: leave as-is
              return assetURL;
            }
            // Relative or root-relative: resolve against originalDir and proxy via remote API
            const relative = assetURL.replace(/^\//, '');
            const correctedPath = `${originalDir}${relative}`;
            const dec = decodeURIComponent(correctedPath);
            const clean = dec.replace(/(\.gltf|\.glb|\.obj)\.+$/i, '$1');
            return `https://${u.host}/api/models-proxy?url=${encodeURIComponent(clean)}`;
          } catch (err) {
            return assetURL;
          }
        });
      }
    } catch (e) {
      // safe fallback if URL parsing fails
    }
  });
  
  useFrame((state) => {
    if (autoRotate && modelRef.current && !hasError) {
      // Subtle auto-rotation
      modelRef.current.rotation.y += 0.005;
    }
  });

  useEffect(() => {
    if (!gltfResult) return;

    if (gltfResult?.scene) {
      try {
        // Validate the scene structure
        if (!gltfResult.scene.children || gltfResult.scene.children.length === 0) {
          throw new Error('Model scene is empty or corrupted');
        }

        // Optimize the model
        gltfResult.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const m = child.material;
              // Lift overly dark PBR surfaces conservatively
              if (typeof m.envMapIntensity === 'number') {
                m.envMapIntensity = Math.max(1.2, m.envMapIntensity || 1.2);
              }
              if (typeof m.roughness === 'number') {
                m.roughness = Math.min(0.7, Math.max(0.2, m.roughness));
              }
              if (typeof m.metalness === 'number') {
                m.metalness = Math.min(0.5, Math.max(0.0, m.metalness));
              }
              if (typeof m.aoMapIntensity === 'number') {
                m.aoMapIntensity = Math.min(0.3, Math.max(0.0, m.aoMapIntensity));
              }
              if (typeof m.emissiveIntensity === 'number') {
                m.emissiveIntensity = Math.max(0.2, m.emissiveIntensity || 0.2);
              }
              child.material.needsUpdate = true;
            }
          }
        });
        
        onLoad && onLoad(gltfResult.scene);
        setHasError(false);
      } catch (error) {
        console.error('Error processing 3D model:', error);
        setErrorMessage(`Model processing failed: ${error.message}`);
        onError && onError(error);
        setHasError(true);
      }
    } else {
      // Model loaded but no scene found
      const error = new Error('Model loaded but contains no 3D scene data');
      console.error(error);
      setErrorMessage('Invalid model format - no 3D scene found');
      onError && onError(error);
      setHasError(true);
    }
  }, [gltfResult, gltfResult?.scene, modelPath]);

  // Handle errors and missing models
  if (hasError) {
    return (
      <Html center>
        <Alert severity="error" sx={{ minWidth: 250, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>3D Model Error</div>
          <div style={{ fontSize: '0.9em', marginBottom: '8px' }}>{errorMessage || 'Failed to load 3D model'}</div>
          {modelPath && (
            <div style={{ fontSize: '0.7em', color: '#666', wordBreak: 'break-all' }}>
              Path: {modelPath}
            </div>
          )}
          <div style={{ fontSize: '0.8em', marginTop: '8px', fontStyle: 'italic' }}>
            Switching to 2D view recommended
          </div>
        </Alert>
      </Html>
    );
  }

  // Loading is handled by Suspense fallback higher up

  try {
    return (
      <Center>
        <primitive 
          ref={modelRef}
          object={gltfResult.scene} 
          scale={scale} 
          position={position} 
          rotation={rotation}
        />
      </Center>
    );
  } catch (err) {
    console.error('Error rendering 3D model:', err);
    return (
      <Html center>
        <Alert severity="error" sx={{ minWidth: 200 }}>
          <div style={{ fontWeight: 'bold' }}>Rendering Error</div>
          <div style={{ fontSize: '0.9em', marginTop: '4px' }}>Failed to display 3D model</div>
        </Alert>
      </Html>
    );
  }
};

// Safe OBJ Model Loader Component
const SafeModelOBJ = ({ modelPath, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], onLoad, onError, autoRotate = false }) => {
  const modelRef = useRef();
  const objResult = useLoader(OBJLoader, modelPath);

  useFrame(() => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }
  });

  useEffect(() => {
    if (!objResult) return;
    try {
      const root = objResult;
      if (!root || !root.children || root.children.length === 0) {
        throw new Error('OBJ scene is empty or corrupted');
      }
      root.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.needsUpdate = true;
          }
        }
      });
      onLoad && onLoad(root);
    } catch (error) {
      console.error('Error processing OBJ model:', error);
      onError && onError(error);
    }
  }, [objResult, modelPath, onLoad, onError]);

  return (
    <Center>
      <primitive 
        ref={modelRef}
        object={objResult} 
        scale={scale} 
        position={position} 
        rotation={rotation}
      />
    </Center>
  );
};

// Wrapper component that handles path validation with enhanced checks
const Model3D = ({ modelPath, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], onLoad, onError, autoRotate = false }) => {
  // Enhanced path validation
  const isValidPath = modelPath && 
    typeof modelPath === 'string' && 
    modelPath.trim().length > 0 &&
    (modelPath.toLowerCase().endsWith('.gltf') || modelPath.toLowerCase().endsWith('.glb') || modelPath.toLowerCase().endsWith('.obj'));
  
  if (!isValidPath) {
    const errorMsg = !modelPath 
      ? 'No model path provided' 
      : !modelPath.trim() 
        ? 'Empty model path' 
        : 'Invalid model format (must be .gltf, .glb, or .obj)';
        
    return (
      <Html center>
        <Alert severity="warning" sx={{ minWidth: 250, textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Model Path Error</div>
          <div style={{ fontSize: '0.9em', marginBottom: '8px' }}>{errorMsg}</div>
          {modelPath && (
            <div style={{ fontSize: '0.7em', color: '#666', wordBreak: 'break-all' }}>
              Provided: {modelPath}
            </div>
          )}
          <div style={{ fontSize: '0.8em', marginTop: '8px', fontStyle: 'italic' }}>
            Please use 2D view instead
          </div>
        </Alert>
      </Html>
    );
  }
  
  // Choose loader based on file extension
  if (modelPath.toLowerCase().endsWith('.obj')) {
    return (
      <SafeModelOBJ 
        modelPath={modelPath}
        scale={scale}
        position={position}
        rotation={rotation}
        onLoad={onLoad}
        onError={onError}
        autoRotate={autoRotate}
      />
    );
  }

  return (
    <SafeModel3D 
      modelPath={modelPath}
      scale={scale}
      position={position}
      rotation={rotation}
      onLoad={onLoad}
      onError={onError}
      autoRotate={autoRotate}
    />
  );
};

// Fallback 3D placeholder
const Model3DPlaceholder = ({ gadgetName }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Center>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[2, 3, 0.2]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      <Html center>
        <div style={{ 
          color: 'white', 
          textAlign: 'center', 
          background: 'rgba(0,0,0,0.7)', 
          padding: '10px', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          3D model not present
        </div>
      </Html>
    </Center>
  );
};

// Loading component with percentage progress
const Model3DLoader = () => {
  const { active, progress, loaded, total, item } = useProgress();
  const pct = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;
  const showDeterminate = total > 0 && pct > 0;

  return (
    <Html center>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '20px',
        borderRadius: '8px',
        minWidth: 220
      }}>
        <CircularProgress 
          variant={showDeterminate ? 'determinate' : 'indeterminate'}
          value={showDeterminate ? pct : undefined}
          sx={{ color: 'white', mb: 1 }}
          thickness={4}
        />
        <div style={{ fontSize: '0.95em', marginBottom: 4 }}>Loading 3D Model…</div>
        {active && (
          <div style={{ fontSize: '0.85em', opacity: 0.9 }}>
            {Math.round(pct)}% • {loaded}/{Math.max(total, loaded)} assets
          </div>
        )}
        {item && (
          <div style={{ fontSize: '0.75em', opacity: 0.7, marginTop: 4, maxWidth: 280, textAlign: 'center', wordBreak: 'break-all' }}>
            {String(item).split('/').slice(-1)[0]}
          </div>
        )}
      </div>
    </Html>
  );
};

// Main 3D Viewer Component
const Model3DViewer = ({ 
  gadgetName, 
  gadgetBrand = '',
  gadgetModel = '',
  gadgetId = null, 
  modelPath = null, 
  fallbackImage, 
  className = "",
  height = "500px",
  showControls = true,
  onModelLoad = null,
  onModelError = null,
  enableControls = true,
  autoRotate = false
}) => {
  const [show3D, setShow3D] = useState(true);
  const [modelError, setModelError] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const canvasRef = useRef();

  // Detect touch-capable devices (mobile/tablet) for UX hints
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    try {
      const touch = typeof window !== 'undefined' && (
        'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0)
      );
      setIsTouchDevice(!!touch);
    } catch (_) {
      setIsTouchDevice(false);
    }
  }, []);

  // Compute dynamic zoom constraints based on model scale (phones vs laptops)
  const modelScale = modelInfo?.scale ?? 1;
  const isPhoneScale = modelScale <= 0.2;
  const minZoomDistance = isPhoneScale ? 0.1 : 0.4;
  const maxZoomDistance = isPhoneScale ? 12 : 30;

  // Load model info using the service
  useEffect(() => {
    const loadModelInfo = async () => {
      if (modelPath) {
        // Use provided model path
        setModelInfo({
          path: modelPath,
          config: { scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] }
        });
        setIsLoadingModel(false);
        return;
      }

      if (!gadgetName) {
        setModelError(true);
        setIsLoadingModel(false);
        return;
      }

      try {
        setIsLoadingModel(true);
        const info = await model3DService.getBestModelPath(gadgetName, gadgetBrand, gadgetModel);
        
        if (info) {
          setModelInfo(info);
          setModelError(false);
        } else {
          console.warn(`No 3D model found for: ${gadgetName}`);
          setModelError(true);
        }
      } catch (error) {
        console.error('Error loading model info:', error);
        setModelError(true);
        onModelError && onModelError(error);
      } finally {
        setIsLoadingModel(false);
      }
    };

    loadModelInfo();
  }, [gadgetName, gadgetBrand, gadgetModel, modelPath]);

  const toggle3DView = () => {
    setShow3D(!show3D);
  };

  const handleModelError = (error) => {
    console.error('Canvas error:', error);
    setModelError(true);
    onModelError && onModelError(error);
  };

  // If no 3D model available or error, show 2D fallback
  if (!show3D || (!isLoadingModel && (!modelInfo || !modelInfo.path)) || modelError) {
    return (
      <Box 
        className={className}
        sx={{ 
          height, 
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        }}
      >
        <img
          src={fallbackImage}
          alt={gadgetName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: 'transparent'
          }}
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
          }}
        />
        
        {showControls && (
          <Box sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            display: 'flex', 
            gap: 1,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 1,
            p: 0.5
          }}>
            {modelInfo?.path && (
              <Tooltip title="3D view">
                <IconButton 
                  size="small" 
                  onClick={toggle3DView}
                  sx={{ color: 'white' }}
                >
                  <ViewInAr />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
        
        {/* Bottom-left overlay */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 8, 
          left: 8, 
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '12px'
        }}>
          Standard view
        </Box>

        {/* Missing 3D model banner if no model path */}
        {(!isLoadingModel && (!modelInfo || !modelInfo.path)) && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: 8, 
            right: 8, 
            background: 'rgba(255,0,0,0.7)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '12px'
          }}>
            Model not present
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box 
      className={className}
      sx={{ 
        height: height,
        position: 'relative',
        width: '100%',
        maxWidth: '100%', // ensure full-width on mobile containers
        borderRadius: 2,
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0.2, 1.0], fov: 50, near: 0.01, far: 1000 }}
        shadows
        style={{ background: 'transparent', width: '100%', height: '100%' }}
        onError={handleModelError}
        gl={{ toneMappingExposure: 1.15 }}
      >
        {/* Global fill light */}
        <ambientLight intensity={0.8} />
        <spotLight 
          position={[10, 10, 10]} 
          angle={0.15} 
          penumbra={1} 
          intensity={1.2}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.7} />
        
        <Suspense fallback={<Model3DLoader />}>
          <PresentationControls
            global
            config={{ mass: 2, tension: 500 }}
            snap={{ mass: 4, tension: 1500 }}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 4, Math.PI / 4]}
            azimuth={[-Math.PI / 1.2, Math.PI / 1.2]}
          >
            {isLoadingModel ? (
              <Model3DLoader />
            ) : modelInfo && modelInfo.path ? (
              <Model3D 
                 modelPath={modelInfo.path} 
                 scale={modelInfo.scale || 1}
                 position={modelInfo.position || [0, 0, 0]}
                 rotation={modelInfo.rotation || [0, 0, 0]}
                 onLoad={onModelLoad}
                 onError={(error) => {
                   setModelError(true);
                   onModelError && onModelError(error);
                 }}
                 autoRotate={autoRotate}
               />
            ) : (
              <Model3DPlaceholder gadgetName={gadgetName} />
            )}
          </PresentationControls>
          
          <ContactShadows 
            position={[0, -0.25, 0]} 
            opacity={0.15} 
            scale={8} 
            blur={1.2} 
            far={3} 
          />
          
          {/* Soft studio-like environment using local lightformers (no external HDR fetch) */}
          <Environment resolution={512} frames={1}>
            <Lightformer form="ring" intensity={2.2} position={[0, 2, 5]} scale={3} color="#ffffff" />
            <Lightformer intensity={0.8} rotation-x={Math.PI / 2} position={[0, 6, 0]} scale={12} color="#ffffff" />
            {/* Back/side light softened to reduce bright rim */}
            <Lightformer intensity={0.2} position={[-6, 2, -4]} scale={8} color="#ffffff" />
          </Environment>
          <hemisphereLight skyColor={0xffffff} groundColor={0x666666} intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
          <ContactShadows position={[0, -0.5, 0]} opacity={0.3} scale={10} blur={2} far={4} />
        </Suspense>

        {enableControls && (
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            zoomSpeed={1.2}
            minDistance={minZoomDistance}
            maxDistance={maxZoomDistance}
            target={[0, 0, 0]}
          />
        )}
      </Canvas>

      {showControls && (
        <Box sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8, 
          display: 'flex', 
          gap: 1,
          background: 'rgba(0,0,0,0.7)',
          borderRadius: 1,
          p: 0.5
        }}>
          <Tooltip title="Standard view">
            <IconButton 
              size="small" 
              onClick={toggle3DView}
              sx={{ color: 'white' }}
            >
              <ThreeDRotation />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      
      <Box sx={{ 
        position: 'absolute', 
        bottom: 8, 
        left: 8, 
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        fontSize: '12px'
      }}>
        3D view
      </Box>
      
      <Box sx={{ 
        position: 'absolute', 
        bottom: 8, 
        right: 8, 
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        fontSize: '10px'
      }}>
        {isTouchDevice ? 'Use your finger to drag • Pinch to zoom' : 'Drag with mouse • Scroll to zoom'}
      </Box>
    </Box>
  );
};

export default Model3DViewer;